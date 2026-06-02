import type { SupabaseClient } from '@supabase/supabase-js'

import {
  aggregateMatchProgrammeStats,
  matchStageStatRowFromProject,
  type MatchProgrammeStatsBundle,
} from '../domain/matchProgrammeStats.ts'
import { parseStageProjectJson } from '../domain/stageProjectFile.ts'
import { payloadToProjectText } from '../share/payloadToProjectText.ts'

const MATCH_ID_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export type PublicMatchProgrammeStatsPayload = MatchProgrammeStatsBundle & {
  updatedAt: string | null
}

export async function loadMatchProgrammeStats(
  supabase: SupabaseClient,
  matchId: string,
): Promise<
  { ok: true; stats: PublicMatchProgrammeStatsPayload } | { ok: false; reason: 'invalid' | 'hidden' | 'empty' }
> {
  if (!MATCH_ID_UUID_RE.test(matchId)) {
    return { ok: false, reason: 'invalid' }
  }

  const { data: programmeRaw, error: progErr } = await supabase.rpc('fetch_public_match_programme', {
    p_match_id: matchId,
  })
  if (progErr) throw new Error(progErr.message)

  const programme = programmeRaw as {
    has_stages?: boolean
    publicly_visible?: boolean
    stages?: { sort_order?: number; share_stage_id?: string | null }[]
  }

  if (!programme?.publicly_visible || !programme?.has_stages) {
    return { ok: false, reason: 'hidden' }
  }

  const stages = Array.isArray(programme.stages) ? programme.stages : []
  if (stages.length === 0) {
    return { ok: false, reason: 'empty' }
  }

  const shareIds = stages
    .map((s) => (typeof s.share_stage_id === 'string' ? s.share_stage_id.trim() : ''))
    .filter(Boolean)

  if (shareIds.length === 0) {
    return { ok: false, reason: 'empty' }
  }

  const { data: shareRows, error: shareErr } = await supabase
    .from('shared_stages')
    .select('id, payload, created_at')
    .in('id', shareIds)

  if (shareErr) throw new Error(shareErr.message)

  const payloadById = new Map<string, unknown>()
  let latestUpdated: string | null = null
  for (const row of shareRows ?? []) {
    if (typeof row.id === 'string') payloadById.set(row.id, row.payload)
    if (typeof row.created_at === 'string') {
      if (!latestUpdated || row.created_at > latestUpdated) latestUpdated = row.created_at
    }
  }

  const partialRows = stages
    .map((s) => {
      const sortOrder = typeof s.sort_order === 'number' ? s.sort_order : 0
      const sid = typeof s.share_stage_id === 'string' ? s.share_stage_id.trim() : ''
      if (!sid) return null
      const text = payloadToProjectText(payloadById.get(sid))
      if (!text) return null
      const parsed = parseStageProjectJson(text)
      if (!parsed.ok) return null
      return matchStageStatRowFromProject(sortOrder, parsed.data)
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => a.sortOrder - b.sortOrder)

  if (partialRows.length === 0) {
    return { ok: false, reason: 'empty' }
  }

  const stats = aggregateMatchProgrammeStats(partialRows)
  return {
    ok: true,
    stats: { ...stats, updatedAt: latestUpdated },
  }
}
