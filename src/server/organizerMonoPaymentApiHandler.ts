import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

import { fetchMonobankMerchantPubkey, monoTokenHint } from './payments/monobankAcquiring.ts'

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
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return res.status(204).end()
  }

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl?.trim() || !serviceKey?.trim()) {
    return res.status(503).json({ error: 'Payment API is not configured' })
  }

  const token = readBearer(req)
  if (!token) return res.status(401).json({ error: 'Missing Authorization bearer token' })

  const supabase = createClient(supabaseUrl.trim(), serviceKey.trim(), {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: userData, error: userErr } = await supabase.auth.getUser(token)
  if (userErr || !userData.user) {
    return res.status(401).json({ error: 'Invalid or expired session' })
  }
  const userId = userData.user.id

  const { data: orgProfile, error: orgErr } = await supabase
    .from('match_admin_profiles')
    .select('organizer_status')
    .eq('user_id', userId)
    .maybeSingle()

  if (orgErr) return res.status(500).json({ error: orgErr.message })
  if (orgProfile?.organizer_status !== 'active') {
    return res.status(403).json({ error: 'Organizer not active' })
  }

  const path = typeof req.url === 'string' ? new URL(req.url, 'http://local').pathname : ''
  const isVerify = path.endsWith('/verify')

  if (req.method === 'DELETE') {
    const { error } = await supabase
      .from('organizer_payment_providers')
      .delete()
      .eq('organizer_id', userId)
      .eq('provider', 'mono')
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ connected: false })
  }

  if (req.method === 'POST' && isVerify) {
    const { data: row, error } = await supabase
      .from('organizer_payment_providers')
      .select('mono_x_token')
      .eq('organizer_id', userId)
      .eq('provider', 'mono')
      .maybeSingle()

    if (error) return res.status(500).json({ error: error.message })
    const stored = row?.mono_x_token
    if (typeof stored !== 'string' || !stored.trim()) {
      return res.status(400).json({ error: 'No Mono token saved' })
    }

    try {
      await fetchMonobankMerchantPubkey(stored)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'verify_failed'
      return res.status(400).json({ error: msg })
    }

    const verifiedAt = new Date().toISOString()
    const { error: upErr } = await supabase
      .from('organizer_payment_providers')
      .update({ verified_at: verifiedAt, updated_at: verifiedAt })
      .eq('organizer_id', userId)
      .eq('provider', 'mono')

    if (upErr) return res.status(500).json({ error: upErr.message })
    return res.status(200).json({ ok: true, verifiedAt })
  }

  if (req.method === 'POST') {
    let body: unknown
    try {
      body = parseJsonBody(req)
    } catch {
      return res.status(400).json({ error: 'Invalid JSON body' })
    }
    const xToken =
      typeof body === 'object' && body !== null && 'xToken' in body ?
        String((body as { xToken: unknown }).xToken ?? '').trim()
      : ''
    if (xToken.length < 8) {
      return res.status(400).json({ error: 'Invalid X-Token' })
    }

    const now = new Date().toISOString()
    const { error } = await supabase.from('organizer_payment_providers').upsert(
      {
        organizer_id: userId,
        provider: 'mono',
        mono_x_token: xToken,
        token_hint: monoTokenHint(xToken),
        verified_at: null,
        updated_at: now,
      },
      { onConflict: 'organizer_id' },
    )

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({
      connected: true,
      tokenHint: monoTokenHint(xToken),
      verifiedAt: null,
    })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
