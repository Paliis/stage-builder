import { describe, expect, it } from 'vitest'

import {
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
})
