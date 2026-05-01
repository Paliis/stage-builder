import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

import { buildPortalPractiscoreZip } from './practiscore/buildPortalPractiscoreZip.ts'

const MATCH_ID_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function readBearer(req: VercelRequest): string | null {
  const h = req.headers.authorization
  if (typeof h !== 'string' || !h.trim()) return null
  const m = /^Bearer\s+(.+)$/i.exec(h.trim())
  return m?.[1]?.trim() || null
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
    return res.status(503).json({ error: 'Export API is not configured' })
  }

  const token = readBearer(req)
  if (!token) {
    return res.status(401).json({ error: 'Missing Authorization bearer token' })
  }

  let body: unknown
  try {
    const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {})
    body = JSON.parse(raw)
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' })
  }

  if (typeof body !== 'object' || body === null) {
    return res.status(400).json({ error: 'Expected JSON object' })
  }

  const matchId = (body as { matchId?: unknown }).matchId
  if (typeof matchId !== 'string' || !MATCH_ID_UUID_RE.test(matchId)) {
    return res.status(400).json({ error: 'Invalid matchId' })
  }

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

  if (orgErr) {
    return res.status(500).json({ error: orgErr.message })
  }
  if (orgProfile?.organizer_status !== 'active') {
    return res.status(403).json({ error: 'Organizer not active' })
  }

  const { data: match, error: matchErr } = await supabase
    .from('matches')
    .select('id, organizer_id, title, starts_at, ps_match_type, ps_match_subtype')
    .eq('id', matchId)
    .maybeSingle()

  if (matchErr) {
    return res.status(500).json({ error: matchErr.message })
  }
  if (!match || match.organizer_id !== userId) {
    return res.status(403).json({ error: 'Match not found or access denied' })
  }

  const [{ data: squads, error: sqErr }, { data: regs, error: regErr }, { data: links, error: linkErr }] =
    await Promise.all([
      supabase.from('match_squads').select('id, sort_order').eq('match_id', matchId).order('sort_order'),
      supabase
        .from('match_registrations')
        .select(
          'squad_id, competitor_user_id, division, classification_grade, power_factor, created_at, status',
        )
        .eq('match_id', matchId)
        .eq('status', 'confirmed')
        .order('created_at', { ascending: true }),
      supabase.from('match_stage_links').select('sort_order, snapshot_meta').eq('match_id', matchId).order('sort_order'),
    ])

  if (sqErr) return res.status(500).json({ error: sqErr.message })
  if (regErr) return res.status(500).json({ error: regErr.message })
  if (linkErr) return res.status(500).json({ error: linkErr.message })

  const competitorIds = [...new Set((regs ?? []).map((r) => r.competitor_user_id))]
  const displayNameByUserId = new Map<string, string | null>()
  if (competitorIds.length > 0) {
    const { data: profiles, error: profErr } = await supabase
      .from('match_admin_profiles')
      .select('user_id, display_name')
      .in('user_id', competitorIds)

    if (profErr) return res.status(500).json({ error: profErr.message })
    for (const p of profiles ?? []) {
      displayNameByUserId.set(p.user_id, p.display_name)
    }
  }

  const stageRows = (links ?? []).map((row) => ({
    sort_order: row.sort_order,
    snapshot_meta:
      typeof row.snapshot_meta === 'object' && row.snapshot_meta !== null
        ? (row.snapshot_meta as Record<string, unknown>)
        : null,
  }))

  const built = buildPortalPractiscoreZip({
    match: {
      title: match.title,
      starts_at: match.starts_at,
      ps_match_type: match.ps_match_type,
      ps_match_subtype: match.ps_match_subtype,
    },
    squads: squads ?? [],
    registrations: (regs ?? []).map((r) => ({
      squad_id: r.squad_id,
      competitor_user_id: r.competitor_user_id,
      division: r.division,
      classification_grade: r.classification_grade,
      power_factor: r.power_factor,
      created_at: r.created_at,
    })),
    displayNameByUserId,
    stageLinks: stageRows,
  })

  if (!built.ok) {
    return res.status(422).json({ error: built.message, code: built.reason })
  }

  const safeSlug = String(match.title)
    .replace(/[^\w-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40)
  const fname = `${safeSlug || 'match'}_${matchId.slice(0, 8)}.psc`

  res.setHeader('Content-Type', 'application/zip')
  res.setHeader('Content-Disposition', `attachment; filename="${fname}"`)

  return res.status(200).send(Buffer.from(built.bytes))
}
