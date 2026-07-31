import { canonicalDivisionId, canonicalShooterCategoryId } from '../portal/shooterProfileCatalog'

export type DivisionSummaryRow = {
  division: string
  confirmed: number
  pending: number
}

export type CategorySummaryRow = {
  category: string
  confirmed: number
  pending: number
}

export type MatchParticipantSummary = {
  discipline: string | null
  byDivision: DivisionSummaryRow[]
  byCategory: CategorySummaryRow[]
}

function readCount(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0
}

function parseDivisionRows(raw: unknown): DivisionSummaryRow[] {
  if (!Array.isArray(raw)) return []
  const rows: DivisionSummaryRow[] = []
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) continue
    const o = item as Record<string, unknown>
    const division = typeof o.division === 'string' ? o.division.trim() : ''
    if (!division) continue
    rows.push({
      division,
      confirmed: readCount(o.confirmed),
      pending: readCount(o.pending),
    })
  }
  return rows
}

function parseCategoryRows(raw: unknown): CategorySummaryRow[] {
  if (!Array.isArray(raw)) return []
  const rows: CategorySummaryRow[] = []
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) continue
    const o = item as Record<string, unknown>
    const category = typeof o.category === 'string' ? o.category.trim() : ''
    if (!category) continue
    rows.push({
      category,
      confirmed: readCount(o.confirmed),
      pending: readCount(o.pending),
    })
  }
  return rows
}

/** Merge duplicate division keys (legacy label vs id casing in registrations). */
export function mergeDivisionSummaryRows(
  discipline: string | null,
  rows: DivisionSummaryRow[],
): DivisionSummaryRow[] {
  const map = new Map<string, DivisionSummaryRow>()
  for (const row of rows) {
    const id = canonicalDivisionId(discipline, row.division)
    if (!id) continue
    const prev = map.get(id)
    if (!prev) {
      map.set(id, { division: id, confirmed: row.confirmed, pending: row.pending })
      continue
    }
    prev.confirmed += row.confirmed
    prev.pending += row.pending
  }
  return [...map.values()]
}

/** Merge duplicate category keys (legacy label vs id in JSONB). */
export function mergeCategorySummaryRows(rows: CategorySummaryRow[]): CategorySummaryRow[] {
  const map = new Map<string, CategorySummaryRow>()
  for (const row of rows) {
    const id = canonicalShooterCategoryId(row.category)
    if (!id) continue
    const prev = map.get(id)
    if (!prev) {
      map.set(id, { category: id, confirmed: row.confirmed, pending: row.pending })
      continue
    }
    prev.confirmed += row.confirmed
    prev.pending += row.pending
  }
  return [...map.values()]
}

export function parsePublicMatchParticipantSummary(raw: unknown): MatchParticipantSummary | null {
  if (raw == null) return null
  if (typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const discipline = typeof o.discipline === 'string' ? o.discipline.trim() : null
  const byDivision = mergeDivisionSummaryRows(discipline, parseDivisionRows(o.by_division))
  const byCategory = mergeCategorySummaryRows(parseCategoryRows(o.by_category))
  return { discipline, byDivision, byCategory }
}

export function summaryRowTotal(row: { confirmed: number; pending: number }): number {
  return row.confirmed + row.pending
}

export function summaryTotals(rows: { confirmed: number; pending: number }[]): {
  confirmed: number
  pending: number
  total: number
} {
  let confirmed = 0
  let pending = 0
  for (const r of rows) {
    confirmed += r.confirmed
    pending += r.pending
  }
  return { confirmed, pending, total: confirmed + pending }
}
