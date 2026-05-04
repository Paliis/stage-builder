import type { MatchEventKind, PsMatchLevel } from '../../domain/matchTaxonomy'

export type PubMatchRow = {
  id: string
  title: string
  starts_at: string
  /** Same ids as shooter catalog (`shotgun`, `handgun`, …). */
  discipline?: string | null
  location_label?: string | null
  match_event_kind?: string | null
  ps_match_level?: string | null
  /** Public URL for hub card thumbnail (optional). */
  cover_image_url?: string | null
  /** Cached from match_admin_profiles.display_name for anonymous hub. */
  portal_organizer_display_name?: string | null
}

/** Local calendar YYYY-MM-DD from a Date in the user's timezone. */
export function localDateKeyFromDate(d: Date): string {
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Local calendar YYYY-MM-DD for an instant (`starts_at` ISO). */
export function localDateKeyFromIso(iso: string): string {
  return localDateKeyFromDate(new Date(iso))
}

export function normalizeSearchQuery(raw: string): string {
  return raw.trim().toLowerCase()
}

/** Client-side substring match on title + location (after optional server `.ilike`). */
export function matchSearchQuery(row: PubMatchRow, queryNorm: string): boolean {
  if (!queryNorm) return true
  const blob =
    `${row.title ?? ''}\u001f${row.location_label ?? ''}\u001f${row.portal_organizer_display_name ?? ''}`.toLowerCase()
  return blob.includes(queryNorm)
}

export function rowInLocalDateInclusiveRange(row: PubMatchRow, dateFrom: string | null, dateTo: string | null): boolean {
  const key = localDateKeyFromIso(row.starts_at)
  if (!key) return false
  if (dateFrom && key < dateFrom) return false
  if (dateTo && key > dateTo) return false
  return true
}

/** Full pipeline: optional search norm, optional from/to inclusive, optional single selected calendar day (YYYY-MM-DD), optional event kind / PS level. */
export function filterPublishedMatchesForHub(
  rows: PubMatchRow[],
  filters: {
    queryNorm: string
    dateFrom: string | null
    dateTo: string | null
    selectedDay: string | null
    eventKind?: 'all' | MatchEventKind
    psLevel?: 'all' | PsMatchLevel
    /** Weapon class id — same as `matches.discipline`. */
    weaponClass?: 'all' | string
  },
): PubMatchRow[] {
  const eventKind = filters.eventKind ?? 'all'
  const psLevel = filters.psLevel ?? 'all'
  const weaponClass = filters.weaponClass ?? 'all'
  let out = rows.filter((r) => matchSearchQuery(r, filters.queryNorm))
  if (filters.dateFrom || filters.dateTo) {
    out = out.filter((r) => rowInLocalDateInclusiveRange(r, filters.dateFrom, filters.dateTo))
  }
  if (filters.selectedDay) {
    out = out.filter((r) => localDateKeyFromIso(r.starts_at) === filters.selectedDay)
  }
  if (eventKind !== 'all') {
    out = out.filter((r) => r.match_event_kind === eventKind)
  }
  if (psLevel !== 'all') {
    out = out.filter((r) => r.ps_match_level === psLevel)
  }
  if (weaponClass !== 'all') {
    out = out.filter((r) => (r.discipline ?? 'shotgun') === weaponClass)
  }
  return out
}

export function buildCountsByLocalDay(rows: PubMatchRow[]): Record<string, number> {
  const m: Record<string, number> = {}
  for (const r of rows) {
    const k = localDateKeyFromIso(r.starts_at)
    if (!k) continue
    m[k] = (m[k] ?? 0) + 1
  }
  return m
}

/** Monday-first weekday index 0–6 (Mon = 0, Sun = 6). */
export function mondayFirstWeekdayIndex(d: Date): number {
  return (d.getDay() + 6) % 7
}

export type CalendarCell =
  | { kind: 'empty' }
  | { kind: 'day'; day: number; dateKey: string; inMonth: boolean }

/** Month grid placeholders + day cells with `dateKey` (local). */
export function buildCalendarCells(year: number, monthIndex: number): CalendarCell[] {
  const first = new Date(year, monthIndex, 1)
  const pad = mondayFirstWeekdayIndex(first)
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const cells: CalendarCell[] = []
  for (let i = 0; i < pad; i++) cells.push({ kind: 'empty' })
  for (let day = 1; day <= daysInMonth; day++) {
    const y = String(year).padStart(4, '0')
    const m = String(monthIndex + 1).padStart(2, '0')
    const dk = `${y}-${m}-${String(day).padStart(2, '0')}`
    cells.push({ kind: 'day', day, dateKey: dk, inMonth: true })
  }
  while (cells.length % 7 !== 0) cells.push({ kind: 'empty' })
  return cells
}
