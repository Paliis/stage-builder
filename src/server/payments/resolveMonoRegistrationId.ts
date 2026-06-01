import type { SupabaseClient } from '@supabase/supabase-js'

import type { MonobankWebhookPayload } from './monobankAcquiring.ts'

const REGISTRATION_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function uuidFromCompact(hex32: string): string | null {
  if (!/^[0-9a-f]{32}$/i.test(hex32)) return null
  const h = hex32.toLowerCase()
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

export function registrationIdFromMonoReference(reference: string): string | null {
  const ref = reference.trim()
  if (REGISTRATION_ID_RE.test(ref)) return ref
  return uuidFromCompact(ref.replace(/-/g, ''))
}

export async function resolveMonoRegistrationId(
  supabase: SupabaseClient,
  payload: MonobankWebhookPayload,
): Promise<string | null> {
  const fromRef =
    typeof payload.reference === 'string' ?
      registrationIdFromMonoReference(payload.reference)
    : null
  if (fromRef) return fromRef

  const invoiceId = typeof payload.invoiceId === 'string' ? payload.invoiceId.trim() : ''
  if (!invoiceId) return null

  const { data } = await supabase
    .from('match_mono_invoices')
    .select('registration_id')
    .eq('invoice_id', invoiceId)
    .maybeSingle()

  return typeof data?.registration_id === 'string' ? data.registration_id : null
}
