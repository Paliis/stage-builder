import type { SupabaseClient } from '@supabase/supabase-js'

import type { MatchParticipantSummary } from '../domain/matchParticipantSummary.ts'
import { parsePublicMatchParticipantSummary } from '../domain/matchParticipantSummary.ts'
import type { StageProjectFileV1 } from '../domain/stageProjectFile.ts'
import { parseStageProjectJson } from '../domain/stageProjectFile.ts'
import {
  programmeListDisplayTitles,
  programmeSnapshotTitleRaw,
  type ProgrammeSnapshotRow,
} from '../portal/matches/matchPortalProgrammeDisplay.ts'
import { sortMatchParticipantSummary } from '../portal/matches/matchParticipantSummarySort.ts'
import { payloadToProjectText } from '../share/payloadToProjectText.ts'
import { loadMatchProgrammeStats, type PublicMatchProgrammeStatsPayload } from './loadMatchProgrammeStats.ts'

const MATCH_ID_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export type MatchBriefingsStageExport = {
  sortOrder: number
  shareStageId: string
  displayTitle: string
  project: StageProjectFileV1
  viewUrl: string
}

export type MatchBriefingsExportBundle = {
  match: {
    id: string
    title: string
    startsAt: string
    locationLabel: string | null
  }
  stats: PublicMatchProgrammeStatsPayload
  participantSummary: MatchParticipantSummary | null
  stages: MatchBriefingsStageExport[]
}

export async function loadMatchBriefingsExportData(
  supabase: SupabaseClient,
  matchId: string,
  siteOrigin: string,
  locale: 'uk' | 'en',
): Promise<
  { ok: true; data: MatchBriefingsExportBundle } | { ok: false; reason: 'invalid' | 'hidden' | 'empty' }
> {
  if (!MATCH_ID_UUID_RE.test(matchId)) {
    return { ok: false, reason: 'invalid' }
  }

  const statsResult = await loadMatchProgrammeStats(supabase, matchId)
  if (!statsResult.ok) return statsResult

  const { data: match, error: matchErr } = await supabase
    .from('matches')
    .select('id, title, starts_at, location_label, participant_list_visibility')
    .eq('id', matchId)
    .eq('status', 'published')
    .maybeSingle()

  if (matchErr) throw new Error(matchErr.message)
  if (!match) return { ok: false, reason: 'hidden' }

  const { data: programmeRaw, error: progErr } = await supabase.rpc('fetch_public_match_programme', {
    p_match_id: matchId,
  })
  if (progErr) throw new Error(progErr.message)

  const programme = programmeRaw as {
    publicly_visible?: boolean
    stages?: {
      sort_order?: number
      share_stage_id?: string | null
      snapshot_meta?: Record<string, unknown> | null
    }[]
  }

  if (!programme?.publicly_visible) {
    return { ok: false, reason: 'hidden' }
  }

  const linkRows = Array.isArray(programme.stages) ? programme.stages : []
  const shareIds = linkRows
    .map((s) => (typeof s.share_stage_id === 'string' ? s.share_stage_id.trim() : ''))
    .filter(Boolean)

  if (shareIds.length === 0) {
    return { ok: false, reason: 'empty' }
  }

  const { data: shareRows, error: shareErr } = await supabase
    .from('shared_stages')
    .select('id, payload')
    .in('id', shareIds)

  if (shareErr) throw new Error(shareErr.message)

  const payloadById = new Map<string, unknown>()
  for (const row of shareRows ?? []) {
    if (typeof row.id === 'string') payloadById.set(row.id, row.payload)
  }

  const snapshotRows: ProgrammeSnapshotRow[] = linkRows.map((s) => ({
    share_stage_id: typeof s.share_stage_id === 'string' ? s.share_stage_id : null,
    snapshot_meta:
      typeof s.snapshot_meta === 'object' && s.snapshot_meta !== null ?
        s.snapshot_meta
      : null,
  }))

  const ordinalFallback =
    locale === 'en' ? 'Exercise {{n}}: {{title}}' : 'Вправа №{{n}}: {{title}}'
  const displayTitles = programmeListDisplayTitles(snapshotRows, {
    matchDetailProgrammeDuplicateOrdinalFallback: ordinalFallback,
  })

  const origin = siteOrigin.replace(/\/$/, '')
  const lang = locale === 'en' ? 'en' : 'uk'

  const stages: MatchBriefingsStageExport[] = []
  linkRows.forEach((lnk, idx) => {
    const sortOrder = typeof lnk.sort_order === 'number' ? lnk.sort_order : idx + 1
    const sid = typeof lnk.share_stage_id === 'string' ? lnk.share_stage_id.trim() : ''
    if (!sid) return
    const text = payloadToProjectText(payloadById.get(sid))
    if (!text) return
    const parsed = parseStageProjectJson(text)
    if (!parsed.ok) return
    stages.push({
      sortOrder,
      shareStageId: sid,
      displayTitle: displayTitles[idx] ?? programmeSnapshotTitleRaw(snapshotRows[idx]!),
      project: parsed.data,
      viewUrl: `${origin}/v/${encodeURIComponent(sid)}?lang=${lang}`,
    })
  })

  stages.sort((a, b) => a.sortOrder - b.sortOrder)
  if (stages.length === 0) {
    return { ok: false, reason: 'empty' }
  }

  let participantSummary: MatchParticipantSummary | null = null
  if (match.participant_list_visibility === 'open') {
    const { data: summaryRaw, error: sumErr } = await supabase.rpc(
      'fetch_public_match_participant_summary',
      { p_match_id: matchId },
    )
    if (sumErr) throw new Error(sumErr.message)
    const parsed = parsePublicMatchParticipantSummary(summaryRaw)
    if (parsed) participantSummary = sortMatchParticipantSummary(parsed)
  }

  return {
    ok: true,
    data: {
      match: {
        id: match.id,
        title: match.title,
        startsAt: match.starts_at,
        locationLabel: match.location_label,
      },
      stats: statsResult.stats,
      participantSummary,
      stages,
    },
  }
}
