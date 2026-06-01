import type { Locale } from '../../i18n/messages'

/** UTC calendar date when programme becomes public; null when immediate or not scheduled. */
export function matchStagesAvailableFromUtcDate(
  startsAtIso: string,
  daysBefore: number | null | undefined,
): Date | null {
  if (daysBefore == null || daysBefore <= 0) return null
  const start = new Date(startsAtIso)
  if (!Number.isFinite(start.getTime())) return null
  const y = start.getUTCFullYear()
  const mo = start.getUTCMonth()
  const d = start.getUTCDate()
  return new Date(Date.UTC(y, mo, d - daysBefore))
}

export function areMatchStagesPubliclyVisible(
  startsAtIso: string,
  daysBefore: number | null | undefined,
  now: Date = new Date(),
): boolean {
  if (daysBefore == null) return false
  if (daysBefore <= 0) return true
  const availableFrom = matchStagesAvailableFromUtcDate(startsAtIso, daysBefore)
  if (!availableFrom) return true
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  return todayUtc >= availableFrom.getTime()
}

/** Short date for public card copy (DD.MM.YY). */
export function formatPortalDateShort(isoOrDate: string | Date, locale: Locale): string {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate
  const loc = locale === 'uk' ? 'uk-UA' : 'en-GB'
  return new Intl.DateTimeFormat(loc, {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    timeZone: 'UTC',
  }).format(d)
}

export type PublicMatchProgrammeBundle = {
  has_stages: boolean
  publicly_visible: boolean
  available_from: string | null
  stages: {
    sort_order: number
    share_stage_id: string | null
    snapshot_meta: Record<string, unknown> | null
  }[]
}

export function parsePublicMatchProgrammeBundle(raw: unknown): PublicMatchProgrammeBundle {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const stagesRaw = Array.isArray(o.stages) ? o.stages : []
  return {
    has_stages: o.has_stages === true,
    publicly_visible: o.publicly_visible === true,
    available_from: typeof o.available_from === 'string' ? o.available_from : null,
    stages: stagesRaw.map((row) => {
      const r = row && typeof row === 'object' ? (row as Record<string, unknown>) : {}
      return {
        sort_order: typeof r.sort_order === 'number' ? r.sort_order : 0,
        share_stage_id: typeof r.share_stage_id === 'string' ? r.share_stage_id : null,
        snapshot_meta:
          typeof r.snapshot_meta === 'object' && r.snapshot_meta !== null ?
            (r.snapshot_meta as Record<string, unknown>)
          : null,
      }
    }),
  }
}
