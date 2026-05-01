/**
 * Builds a PractiScore-compatible .psc ZIP (match_def.json + match_scores.json)
 * from portal match data using a verified shotgun round-trip JSON skeleton.
 */

import { randomBytes, randomUUID } from 'node:crypto'
import { strToU8, zipSync } from 'fflate'

import type { PscStageMetrics } from '../../domain/pscStageMetrics'
import {
  buildSquadIdToPsShSqdMap,
  prematchSquadDisplayStart,
  type PortalSquadRowForPsc,
} from '../../domain/pscSquadNumbers'
import matchDefRoundtripTemplate from './matchDefRoundtripTemplate.json' with { type: 'json' }
import matchScoresRoundtripTemplate from './matchScoresRoundtripTemplate.json' with { type: 'json' }

export type { PortalSquadRowForPsc }

function isPrematchPhase(row: PortalSquadRowForPsc): boolean {
  return (row.squad_phase ?? 'main').trim().toLowerCase() === 'prematch'
}

export type PortalRegistrationRow = {
  squad_id: string
  competitor_user_id: string
  division: string
  classification_grade: string
  power_factor: string | null
  created_at: string
}

export type PortalStageLinkRow = {
  sort_order: number
  snapshot_meta: Record<string, unknown> | null
  /** Parsed from share payload; if missing, PSC stage keeps counts from round-trip template. */
  psc_metrics?: PscStageMetrics | null
}

export type PortalMatchPsFields = {
  title: string
  starts_at: string
  ps_match_type: string | null
  ps_match_subtype: string | null
}

type JsonObject = Record<string, unknown>

function deepCloneJson<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T
}

function isoToPsDate(iso: string): string {
  const d = Date.parse(iso)
  if (!Number.isFinite(d)) return new Date().toISOString().slice(0, 10)
  return new Date(d).toISOString().slice(0, 10)
}

function nowPsTimestamp(): string {
  const d = new Date()
  const p = (n: number, w = 2) => String(n).padStart(w, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}.${p(d.getMilliseconds(), 3)}`
}

export function snapshotTitle(meta: Record<string, unknown> | null, fallbackSort: number): string {
  const t = meta && typeof meta.title_snapshot === 'string' ? meta.title_snapshot.trim() : ''
  if (t) return t.slice(0, 280)
  return `Stage ${fallbackSort + 1}`
}

/** Strips trailing "(Скв. 2 №3)" style hints sometimes stored in portal display_name (not real PSC fields). */
const PORTAL_SQUAD_HINT_PAREN_TAIL =
  /\s*\(\s*[СCcс][кКk]?[ВBbв]?\.?\s*\d+[\s\S]*?[№#]\s*\d+[\s\S]*?\)\s*$/iu

function stripPortalSquadHintSuffix(raw: string): string {
  let s = raw.trim()
  while (PORTAL_SQUAD_HINT_PAREN_TAIL.test(s)) {
    s = s.replace(PORTAL_SQUAD_HINT_PAREN_TAIL, '').trim()
  }
  return s
}

function tokenLooksCyrillic(t: string): boolean {
  return /[\u0400-\u04FF]/.test(t)
}

/**
 * PSC uses `sh_ln` = family name, `sh_fn` = given name (`matchDefRoundtripTemplate.json`).
 * Portal profiles often store "Прізвище Ім'я"; optional Western "Given Family" also appears.
 */
export function splitDisplayName(displayName: string | null | undefined): { sh_fn: string; sh_ln: string } {
  const cleaned = stripPortalSquadHintSuffix(typeof displayName === 'string' ? displayName : '')
  if (!cleaned) return { sh_fn: 'Shooter', sh_ln: '' }

  const comma = cleaned.indexOf(',')
  if (comma > 0) {
    const sh_ln = cleaned.slice(0, comma).trim()
    const sh_fn = cleaned.slice(comma + 1).trim()
    if (sh_ln && sh_fn) return { sh_fn, sh_ln }
  }

  const parts = cleaned.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return { sh_fn: parts[0]!, sh_ln: '' }

  const allCyrillic = parts.every(tokenLooksCyrillic)
  if (allCyrillic) {
    return { sh_ln: parts[0]!, sh_fn: parts.slice(1).join(' ') }
  }

  return { sh_fn: parts[0]!, sh_ln: parts.slice(1).join(' ') }
}

export function normalizePowerFactor(v: string | null | undefined): string {
  const u = typeof v === 'string' ? v.trim().toUpperCase() : ''
  if (u === 'MAJOR' || u === 'MINOR') return u
  return 'MINOR'
}

function randomSignedInt32(): number {
  const b = randomBytes(4)
  const n = b.readUInt32BE(0)
  return (n | 0) === 0 ? -1 : (n | 0)
}

export type BuildPortalPractiscoreZipResult =
  | { ok: true; bytes: Uint8Array; manifest: { psMatchId: string; stageCount: number; shooterCount: number } }
  | { ok: false; reason: 'no_stages'; message: string }

export function buildPortalPractiscoreZip(params: {
  match: PortalMatchPsFields
  squads: PortalSquadRowForPsc[]
  registrations: PortalRegistrationRow[]
  displayNameByUserId: ReadonlyMap<string, string | null | undefined>
  stageLinks: PortalStageLinkRow[]
}): BuildPortalPractiscoreZipResult {
  const orderedLinks = [...params.stageLinks].sort((a, b) => a.sort_order - b.sort_order)
  if (orderedLinks.length === 0) {
    return { ok: false, reason: 'no_stages', message: 'Add at least one stage (share link) before export.' }
  }

  const squadIdToPsSh = buildSquadIdToPsShSqdMap(params.squads)
  const prematchSquadSlots = params.squads.filter(isPrematchPhase).length
  const pmDisplayStart = prematchSquadDisplayStart(params.squads.length)
  let synthPremSlot = 0
  const fallbackPrematchSh = (): number => {
    const j = synthPremSlot % Math.max(prematchSquadSlots, 1)
    synthPremSlot += 1
    return pmDisplayStart + j - 1
  }

  const defTpl = deepCloneJson(matchDefRoundtripTemplate) as JsonObject & {
    match_stages?: JsonObject[]
    match_shooters?: JsonObject[]
  }
  const stagesTpl = Array.isArray(defTpl.match_stages) ? defTpl.match_stages : []
  const stage0 = stagesTpl[0]
  if (!stage0 || typeof stage0 !== 'object') {
    throw new Error('matchDefRoundtripTemplate: missing match_stages[0]')
  }

  const shootersTpl = Array.isArray(defTpl.match_shooters) ? defTpl.match_shooters : []
  const shooter0 = shootersTpl[0]
  if (!shooter0 || typeof shooter0 !== 'object') {
    throw new Error('matchDefRoundtripTemplate: missing match_shooters[0]')
  }

  const psMatchId = randomUUID()

  const matchStages = orderedLinks.map((link, idx) => {
    const merged: JsonObject = { ...stage0 }
    merged.stage_number = idx + 1
    merged.stage_name = snapshotTitle(link.snapshot_meta, idx)
    merged.stage_uuid = randomUUID()
    if (link.psc_metrics) {
      merged.stage_poppers = link.psc_metrics.stage_poppers
      merged.stage_numtargs = link.psc_metrics.stage_numtargs
      merged.stage_noshoots = link.psc_metrics.stage_noshoots
    }
    // Round-trip template clones `stage_poppers_maxnpms: 2` from stage[0] for every stage;
    // PractiScore shows it as «Steel NPMs» and it is not our plate count — clear for portal export.
    merged.stage_poppers_maxnpms = 0
    return merged
  })

  const regs = [...params.registrations].sort(
    (a, b) => Date.parse(a.created_at) - Date.parse(b.created_at),
  )

  const matchShooters = regs.map((r, idx) => {
    const dn = params.displayNameByUserId.get(r.competitor_user_id)
    const names = splitDisplayName(dn)
    const mappedSh = squadIdToPsSh.get(r.squad_id)
    const shSqd =
      typeof mappedSh === 'number'
        ? mappedSh
        : prematchSquadSlots > 0
          ? fallbackPrematchSh()
          : 0
    const merged: JsonObject = { ...shooter0 }
    merged.sh_uuid = randomUUID()
    merged.sh_uid = merged.sh_uuid
    merged.sh_ln = names.sh_ln
    merged.sh_fn = names.sh_fn || 'Shooter'
    merged.sh_num = idx + 1
    merged.sh_random = randomSignedInt32()
    merged.sh_sqd = shSqd
    merged.sh_dvp = typeof r.division === 'string' && r.division.trim() ? r.division.trim() : 'Modified'
    merged.sh_pf = normalizePowerFactor(r.power_factor)
    merged.sh_grd =
      typeof r.classification_grade === 'string' && r.classification_grade.trim()
        ? r.classification_grade.trim().slice(0, 8)
        : 'U'
    merged.sh_del = false
    merged.sh_dq = false
    return merged
  })

  defTpl.match_id = psMatchId
  defTpl.match_name = params.match.title.trim() || 'Match'
  defTpl.match_date = isoToPsDate(params.match.starts_at)
  defTpl.match_stages = matchStages
  defTpl.match_shooters = matchShooters
  defTpl.device_arch = 'server'
  defTpl.device_model = 'shooters-tools/match-export-psc'
  defTpl.app_version = 'shooters-tools'
  defTpl.match_creationdate = nowPsTimestamp()
  defTpl.match_modifieddate = nowPsTimestamp()

  if (typeof params.match.ps_match_type === 'string' && params.match.ps_match_type.trim()) {
    defTpl.match_type = params.match.ps_match_type.trim()
  }
  if (typeof params.match.ps_match_subtype === 'string' && params.match.ps_match_subtype.trim()) {
    defTpl.match_subtype = params.match.ps_match_subtype.trim()
  }

  const scores = deepCloneJson(matchScoresRoundtripTemplate) as JsonObject
  scores.match_id = psMatchId
  scores.match_scores = []
  scores.match_scores_history = {}

  const zipped = zipSync(
    {
      'match_def.json': strToU8(JSON.stringify(defTpl, null, 2)),
      'match_scores.json': strToU8(JSON.stringify(scores, null, 2)),
    },
    { level: 6 },
  )

  return {
    ok: true,
    bytes: zipped,
    manifest: {
      psMatchId,
      stageCount: matchStages.length,
      shooterCount: matchShooters.length,
    },
  }
}
