import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

import {
  matchBriefingsPdfContentDisposition,
  matchBriefingsPdfFileName,
  type MatchBriefingsPdfDisposition,
} from '../domain/matchBriefingsExport.ts'
import { buildMatchBriefingsPdf } from './matchBriefingsPdf/buildMatchBriefingsPdf.ts'
import type { MatchBriefingsPdfLocale } from './matchBriefingsPdf/matchBriefingsPdfLabels.ts'
import { loadMatchBriefingsExportData } from './loadMatchBriefingsExportData.ts'

const MATCH_ID_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function readMatchId(req: VercelRequest): string | null {
  const q = req.query?.matchId
  if (typeof q === 'string' && q.trim()) return q.trim()
  if (Array.isArray(q) && typeof q[0] === 'string' && q[0].trim()) return q[0].trim()
  return null
}

function readLocale(req: VercelRequest): MatchBriefingsPdfLocale {
  const q = req.query?.lang ?? req.query?.locale
  const raw = typeof q === 'string' ? q : Array.isArray(q) ? q[0] : ''
  return raw === 'en' ? 'en' : 'uk'
}

function readDisposition(req: VercelRequest): MatchBriefingsPdfDisposition {
  const q = req.query?.disposition
  const raw = typeof q === 'string' ? q : Array.isArray(q) ? q[0] : ''
  return raw === 'attachment' ? 'attachment' : 'inline'
}

function resolveSiteOrigin(req: VercelRequest): string {
  const fromEnv =
    process.env.VITE_PUBLIC_SITE_ORIGIN?.trim() ||
    process.env.VITE_SHARE_PUBLIC_ORIGIN?.trim() ||
    process.env.VITE_BUILD_PRODUCTION_ORIGIN?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, '')

  const proto = (req.headers['x-forwarded-proto'] as string | undefined)?.split(',')[0]?.trim() || 'https'
  const host = (req.headers['x-forwarded-host'] as string | undefined)?.split(',')[0]?.trim()
  if (host) return `${proto}://${host}`.replace(/\/$/, '')

  return 'https://shooters-tools.com'
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    return res.status(204).end()
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl?.trim() || !serviceKey?.trim()) {
    return res.status(503).json({ error: 'Briefings export API is not configured' })
  }

  const matchId = readMatchId(req)
  if (!matchId || !MATCH_ID_UUID_RE.test(matchId)) {
    return res.status(400).json({ error: 'Invalid or missing matchId' })
  }

  const locale = readLocale(req)
  const siteOrigin = resolveSiteOrigin(req)

  const supabase = createClient(supabaseUrl.trim(), serviceKey.trim(), {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  try {
    const loaded = await loadMatchBriefingsExportData(supabase, matchId, siteOrigin, locale)
    if (!loaded.ok) {
      if (loaded.reason === 'invalid') {
        return res.status(400).json({ error: 'Invalid matchId' })
      }
      return res.status(404).json({ error: 'Briefings export not available' })
    }

    const pdf = await buildMatchBriefingsPdf(loaded.data, locale)
    const fileName = matchBriefingsPdfFileName(loaded.data.match.title)
    const disposition = readDisposition(req)

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader(
      'Content-Disposition',
      matchBriefingsPdfContentDisposition(fileName, disposition),
    )
    res.setHeader('Cache-Control', 'private, no-store')
    const body = Buffer.from(pdf.buffer, pdf.byteOffset, pdf.byteLength)
    return res.status(200).send(body)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Internal error'
    return res.status(500).json({ error: message })
  }
}
