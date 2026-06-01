import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

import { applyMatchMonoPaymentSuccess } from './payments/applyMatchMonoPayment.ts'
import { fetchMonobankInvoiceStatus, isMonobankInvoicePaid } from './payments/monobankAcquiring.ts'

const REGISTRATION_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function readBearer(req: VercelRequest): string | null {
  const h = req.headers.authorization
  if (typeof h !== 'string' || !h.trim()) return null
  const m = /^Bearer\s+(.+)$/i.exec(h.trim())
  return m?.[1]?.trim() || null
}

function parseJsonBody(req: VercelRequest): unknown {
  const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {})
  return JSON.parse(raw) as unknown
}

/** POST — after Mono redirect, confirm invoice status when webhook was missed. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return res.status(204).end()
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl?.trim() || !serviceKey?.trim()) {
    return res.status(503).json({ error: 'Payment API is not configured' })
  }

  const token = readBearer(req)
  if (!token) return res.status(401).json({ error: 'Missing Authorization bearer token' })

  let body: unknown
  try {
    body = parseJsonBody(req)
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' })
  }

  const registrationId = (body as { registrationId?: unknown }).registrationId
  if (typeof registrationId !== 'string' || !REGISTRATION_ID_RE.test(registrationId.trim())) {
    return res.status(400).json({ error: 'Invalid registrationId' })
  }

  const supabase = createClient(supabaseUrl.trim(), serviceKey.trim(), {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: userData, error: userErr } = await supabase.auth.getUser(token)
  if (userErr || !userData.user?.id) {
    return res.status(401).json({ error: 'Invalid session' })
  }

  const { data: reg, error: regErr } = await supabase
    .from('match_registrations')
    .select('id, payment_received, competitor_user_id, matches!inner(organizer_id)')
    .eq('id', registrationId.trim())
    .maybeSingle()

  if (regErr || !reg) return res.status(404).json({ error: 'Registration not found' })
  if (reg.competitor_user_id !== userData.user.id) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  if (reg.payment_received) {
    return res.status(200).json({ ok: true, paid: true, alreadyPaid: true })
  }

  const { data: invoiceRow } = await supabase
    .from('match_mono_invoices')
    .select('invoice_id')
    .eq('registration_id', registrationId.trim())
    .maybeSingle()

  const invoiceId = invoiceRow?.invoice_id
  if (!invoiceId || typeof invoiceId !== 'string') {
    return res.status(404).json({ error: 'No invoice for this registration' })
  }

  const matchJoined = reg.matches as unknown
  const match = (Array.isArray(matchJoined) ? matchJoined[0] : matchJoined) as { organizer_id: string }

  const { data: provider } = await supabase
    .from('organizer_payment_providers')
    .select('mono_x_token')
    .eq('organizer_id', match.organizer_id)
    .eq('provider', 'mono')
    .maybeSingle()

  if (!provider?.mono_x_token) {
    return res.status(400).json({ error: 'Organizer payment not configured' })
  }

  try {
    const statusPayload = await fetchMonobankInvoiceStatus(provider.mono_x_token, invoiceId)
    if (!isMonobankInvoicePaid(statusPayload.status)) {
      return res.status(200).json({ ok: true, paid: false, status: statusPayload.status ?? 'unknown' })
    }

    const modifiedDate =
      typeof statusPayload.modifiedDate === 'string' ? statusPayload.modifiedDate : null
    const result = await applyMatchMonoPaymentSuccess(
      supabase,
      registrationId.trim(),
      invoiceId,
      modifiedDate,
      match.organizer_id,
    )

    return res.status(200).json({
      ok: result.ok,
      paid: result.ok,
      alreadyPaid: result.alreadyPaid,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'mono_reconcile_failed'
    return res.status(502).json({ error: msg })
  }
}
