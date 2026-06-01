import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

import { entryFeeKopForCategories, type MatchEntryFeesKop } from '../domain/matchEntryFee'
import { resolveMatchPaymentUrls } from '../lib/resolveMatchPaymentUrls'
import { createMonobankInvoice } from './payments/monobankAcquiring.ts'

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
  const localeRaw = (body as { locale?: unknown }).locale
  const locale = localeRaw === 'en' ? 'en' : 'uk'

  if (typeof registrationId !== 'string' || !REGISTRATION_ID_RE.test(registrationId)) {
    return res.status(400).json({ error: 'Invalid registrationId' })
  }

  const supabase = createClient(supabaseUrl.trim(), serviceKey.trim(), {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: userData, error: userErr } = await supabase.auth.getUser(token)
  if (userErr || !userData.user) {
    return res.status(401).json({ error: 'Invalid or expired session' })
  }
  const userId = userData.user.id

  const { data: reg, error: regErr } = await supabase
    .from('match_registrations')
    .select(
      'id, match_id, competitor_user_id, status, payment_received, categories, matches!inner(id, title, status, organizer_id, entry_fee_standard_kop, entry_fee_military_kop, entry_fee_lady_junior_kop)',
    )
    .eq('id', registrationId)
    .eq('competitor_user_id', userId)
    .maybeSingle()

  if (regErr) return res.status(500).json({ error: regErr.message })
  if (!reg) return res.status(404).json({ error: 'Registration not found' })

  if (reg.payment_received) {
    return res.status(409).json({ error: 'Already paid' })
  }

  if (reg.status === 'cancelled') {
    return res.status(400).json({ error: 'Registration cancelled' })
  }

  const matchJoined = reg.matches as unknown
  const match = (Array.isArray(matchJoined) ? matchJoined[0] : matchJoined) as {
    id: string
    title: string
    status: string
    organizer_id: string
    entry_fee_standard_kop: number | null
    entry_fee_military_kop: number | null
    entry_fee_lady_junior_kop: number | null
  }

  if (match.status !== 'published') {
    return res.status(400).json({ error: 'Match not open for payment' })
  }

  const categories = Array.isArray(reg.categories) ?
      reg.categories.filter((x): x is string => typeof x === 'string')
    : []

  const fees: MatchEntryFeesKop = {
    standard: match.entry_fee_standard_kop,
    military: match.entry_fee_military_kop,
    ladyJunior: match.entry_fee_lady_junior_kop,
  }

  const amountKop = entryFeeKopForCategories(fees, categories)
  if (amountKop == null || amountKop < 100) {
    return res.status(400).json({ error: 'Entry fee not configured' })
  }

  const { data: provider, error: provErr } = await supabase
    .from('organizer_payment_providers')
    .select('mono_x_token, verified_at')
    .eq('organizer_id', match.organizer_id)
    .eq('provider', 'mono')
    .maybeSingle()

  if (provErr) return res.status(500).json({ error: provErr.message })
  if (!provider?.mono_x_token || !provider.verified_at) {
    return res.status(400).json({ error: 'Organizer payment not configured' })
  }

  const { redirectOrigin, webHookOrigin, localWebhookMissing } = resolveMatchPaymentUrls(req.headers)

  if (localWebhookMissing) {
    return res.status(503).json({
      error:
        'Local dev: add VITE_SHARE_PUBLIC_ORIGIN=https://your-staging.vercel.app to .env.local (Mono webhook must be public HTTPS)',
    })
  }

  const redirectUrl = `${redirectOrigin}/${locale}/matches/${match.id}?payment=return`
  const webHookUrl = `${webHookOrigin}/api/payments/webhook/mono`

  try {
    const invoice = await createMonobankInvoice(provider.mono_x_token, {
      amountKop,
      reference: registrationId,
      destination: `Внесок: ${match.title}`.slice(0, 280),
      redirectUrl,
      webHookUrl,
    })

    await supabase.from('match_mono_invoices').upsert(
      {
        registration_id: registrationId,
        invoice_id: invoice.invoiceId!,
        amount_kop: amountKop,
        status: 'created',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'registration_id' },
    )

    return res.status(200).json({ pageUrl: invoice.pageUrl, amountKop })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'mono_create_failed'
    return res.status(502).json({ error: msg })
  }
}
