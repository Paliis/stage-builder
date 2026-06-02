import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

import { loadMatchProgrammeStats } from './loadMatchProgrammeStats.ts'

function readMatchId(req: VercelRequest): string | null {
  const q = req.query?.matchId
  if (typeof q === 'string' && q.trim()) return q.trim()
  if (Array.isArray(q) && typeof q[0] === 'string' && q[0].trim()) return q[0].trim()
  return null
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
    return res.status(503).json({ error: 'Programme stats API is not configured' })
  }

  const matchId = readMatchId(req)
  if (!matchId) {
    return res.status(400).json({ error: 'Missing matchId query parameter' })
  }

  const supabase = createClient(supabaseUrl.trim(), serviceKey.trim(), {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  try {
    const result = await loadMatchProgrammeStats(supabase, matchId)
    if (!result.ok) {
      if (result.reason === 'invalid') {
        return res.status(400).json({ error: 'Invalid matchId' })
      }
      return res.status(404).json({ error: 'Programme stats not available' })
    }
    return res.status(200).json(result.stats)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Internal error'
    return res.status(500).json({ error: message })
  }
}
