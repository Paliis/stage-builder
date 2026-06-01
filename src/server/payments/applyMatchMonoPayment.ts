import type { SupabaseClient } from '@supabase/supabase-js'

export async function applyMatchMonoPaymentSuccess(
  supabase: SupabaseClient,
  registrationId: string,
  invoiceId: string,
  modifiedDate: string | null,
  organizerId: string,
): Promise<{ ok: boolean; alreadyPaid: boolean }> {
  const { data: reg, error: loadErr } = await supabase
    .from('match_registrations')
    .select('id, payment_received')
    .eq('id', registrationId)
    .maybeSingle()

  if (loadErr || !reg) return { ok: false, alreadyPaid: false }
  if (reg.payment_received) return { ok: true, alreadyPaid: true }

  const now = new Date().toISOString()
  const { error: upErr } = await supabase
    .from('match_registrations')
    .update({
      payment_received: true,
      paid_at: now,
      payment_provider: 'mono',
      external_payment_id: invoiceId,
      status: 'confirmed',
      confirmed_at: now,
      confirmed_by: organizerId,
    })
    .eq('id', registrationId)

  if (upErr) return { ok: false, alreadyPaid: false }

  await supabase.from('match_mono_invoices').upsert(
    {
      registration_id: registrationId,
      invoice_id: invoiceId,
      status: 'success',
      modified_date: modifiedDate,
      updated_at: now,
    },
    { onConflict: 'registration_id' },
  )

  return { ok: true, alreadyPaid: false }
}
