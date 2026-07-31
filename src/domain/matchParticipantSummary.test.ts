import { describe, expect, it } from 'vitest'

import {
  SHOOTER_CATEGORIES,
  WEAPON_CLASS_META,
  WEAPON_CLASS_ORDER,
  type WeaponClassId,
} from '../portal/shooterProfileCatalog'
import {
  mergeCategorySummaryRows,
  mergeDivisionSummaryRows,
  parsePublicMatchParticipantSummary,
  summaryRowTotal,
  summaryTotals,
} from './matchParticipantSummary'

describe('matchParticipantSummary', () => {
  it('parses RPC JSON', () => {
    const parsed = parsePublicMatchParticipantSummary({
      discipline: 'shotgun',
      by_division: [
        { division: 'open', confirmed: 2, pending: 1 },
        { division: 'standard', confirmed: 5, pending: 0 },
      ],
      by_category: [
        { category: 'lady', confirmed: 1, pending: 0 },
        { category: 'general', confirmed: 6, pending: 1 },
      ],
    })
    expect(parsed?.byDivision).toHaveLength(2)
    expect(parsed?.byCategory).toHaveLength(2)
    expect(summaryRowTotal(parsed!.byDivision[1]!)).toBe(5)
    expect(summaryTotals(parsed!.byDivision).total).toBe(8)
  })

  it('returns null for hidden match', () => {
    expect(parsePublicMatchParticipantSummary(null)).toBeNull()
  })

  it('merges duplicate division keys differing only by case', () => {
    const merged = mergeDivisionSummaryRows('shotgun', [
      { division: 'Modified', confirmed: 2, pending: 0 },
      { division: 'modified', confirmed: 0, pending: 1 },
    ])
    expect(merged).toHaveLength(1)
    expect(merged[0]).toEqual({ division: 'modified', confirmed: 2, pending: 1 })
  })

  it('merges duplicate category keys (Lady vs lady)', () => {
    const merged = mergeCategorySummaryRows([
      { category: 'Lady', confirmed: 2, pending: 0 },
      { category: 'lady', confirmed: 0, pending: 1 },
    ])
    expect(merged).toHaveLength(1)
    expect(merged[0]).toEqual({ category: 'lady', confirmed: 2, pending: 1 })
  })
})

describe('matchParticipantSummary catalog aliases', () => {
  for (const weapon of WEAPON_CLASS_ORDER) {
    const divisions = WEAPON_CLASS_META[weapon as WeaponClassId].divisions
    for (const d of divisions) {
      it(`division ${weapon}/${d.id}: merges id and English label`, () => {
        const merged = mergeDivisionSummaryRows(weapon, [
          { division: d.id, confirmed: 1, pending: 0 },
          { division: d.labelEn, confirmed: 2, pending: 1 },
        ])
        expect(merged).toHaveLength(1)
        expect(merged[0]!.division).toBe(d.id)
        expect(merged[0]!.confirmed).toBe(3)
        expect(merged[0]!.pending).toBe(1)
      })
    }
  }

  for (const c of SHOOTER_CATEGORIES) {
    it(`category ${c.id}: merges id and English label`, () => {
      const merged = mergeCategorySummaryRows([
        { category: c.id, confirmed: 1, pending: 0 },
        { category: c.labelEn, confirmed: 0, pending: 2 },
      ])
      expect(merged).toHaveLength(1)
      expect(merged[0]!.category).toBe(c.id)
      expect(summaryRowTotal(merged[0]!)).toBe(3)
    })
  }
})
