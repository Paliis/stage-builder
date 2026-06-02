import type { CategorySummaryRow, DivisionSummaryRow, MatchParticipantSummary } from '../../domain/matchParticipantSummary'
import {
  DEFAULT_SHOOTER_CATEGORY_ID,
  SHOOTER_CATEGORIES,
  divisionsForWeapon,
  isWeaponClassId,
} from '../shooterProfileCatalog'

const CATEGORY_ORDER = new Map(SHOOTER_CATEGORIES.map((c, i) => [c.id, i]))

function divisionSortIndex(discipline: string | null, divisionId: string): number {
  if (!discipline || !isWeaponClassId(discipline)) return 999
  const list = divisionsForWeapon(discipline)
  const idx = list.findIndex((d) => d.id === divisionId)
  return idx >= 0 ? idx : 999
}

function sortDivisionRows(discipline: string | null, rows: DivisionSummaryRow[]): DivisionSummaryRow[] {
  return [...rows].sort(
    (a, b) =>
      divisionSortIndex(discipline, a.division) - divisionSortIndex(discipline, b.division) ||
      a.division.localeCompare(b.division),
  )
}

function sortCategoryRows(rows: CategorySummaryRow[]): CategorySummaryRow[] {
  return [...rows].sort((a, b) => {
    const ai = CATEGORY_ORDER.get(a.category) ?? CATEGORY_ORDER.get(DEFAULT_SHOOTER_CATEGORY_ID) ?? 999
    const bi = CATEGORY_ORDER.get(b.category) ?? CATEGORY_ORDER.get(DEFAULT_SHOOTER_CATEGORY_ID) ?? 999
    return ai - bi || a.category.localeCompare(b.category)
  })
}

export function sortMatchParticipantSummary(summary: MatchParticipantSummary): MatchParticipantSummary {
  return {
    ...summary,
    byDivision: sortDivisionRows(summary.discipline, summary.byDivision),
    byCategory: sortCategoryRows(summary.byCategory),
  }
}
