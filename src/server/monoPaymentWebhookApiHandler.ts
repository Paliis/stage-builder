import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

import { applyMatchMonoPaymentSuccess } from './payments/applyMatchMonoPayment.ts'
import {
  fetchMonobankMerchantPubkey,
  isMonobankInvoicePaid,
  verifyMonobankWebhookSignature,
  type MonobankWebhookPayload,
} from './payments/monobankAcquiring.ts'
import { resolveMonoRegistrationId } from './payments/resolveMonoRegistrationId.ts'
import { readVercelRawBody } from './vercelRawBody.ts'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end()
  }

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const platformToken = process.env.MONO_WEBHOOK_VERIFY_TOKEN?.trim()

  if (!supabaseUrl?.trim() || !serviceKey?.trim()) {
    return res.status(503).end()
  }

  const bodyBuf = await readVercelRawBody(req)
  let payload: MonobankWebhookPayload
  try {
    payload = JSON.parse(bodyBuf.toString('utf8')) as MonobankWebhookPayload
  } catch {
    return res.status(400).end()
  }

  const xSign = req.headers['x-sign'] ?? req.headers['X-Sign']
  const xSignStr = typeof xSign === 'string' ? xSign : Array.isArray(xSign) ? xSign[0] : ''

  const supabase = createClient(supabaseUrl.trim(), serviceKey.trim(), {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const reference = await resolveMonoRegistrationId(supabase, payload)
  if (!reference) {
    return res.status(200).end()
  }

  const { data: reg, error: regErr } = await supabase
    .from('match_registrations')
    .select('id, match_id, payment_received, matches!inner(organizer_id)')
    .eq('id', reference)
    .maybeSingle()

  if (regErr || !reg) return res.status(200).end()

  const matchJoined = reg.matches as unknown
  const match = (Array.isArray(matchJoined) ? matchJoined[0] : matchJoined) as { organizer_id: string }
  const { data: provider } = await supabase
    .from('organizer_payment_providers')
    .select('mono_x_token')
    .eq('organizer_id', match.organizer_id)
    .eq('provider', 'mono')
    .maybeSingle()

  const xToken = provider?.mono_x_token ?? platformToken
  if (!xToken || !xSignStr) {
    return res.status(401).end()
  }

  try {
    const { key } = await fetchMonobankMerchantPubkey(xToken)
    if (!key || !verifyMonobankWebhookSignature(key, bodyBuf, xSignStr)) {
      return res.status(401).end()
    }
  } catch {
    return res.status(401).end()
  }

  const invoiceId = typeof payload.invoiceId === 'string' ? payload.invoiceId : ''
  const modifiedDate = typeof payload.modifiedDate === 'string' ? payload.modifiedDate : null

  if (isMonobankInvoicePaid(payload.status)) {
    await applyMatchMonoPaymentSuccess(
      supabase,
      reference,
      invoiceId,
      modifiedDate,
      match.organizer_id,
    )
  } else if (invoiceId) {
    await supabase.from('match_mono_invoices').upsert(
      {
        registration_id: reference,
        invoice_id: invoiceId,
        amount_kop: typeof payload.finalAmount === 'number' ? payload.finalAmount : payload.amount ?? 0,
        status: payload.status ?? 'unknown',
        modified_date: modifiedDate,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'registration_id' },
    )
  }

  return res.status(200).end()
}
