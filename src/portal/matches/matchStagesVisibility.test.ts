import { describe, expect, it } from 'vitest'
import {
  areMatchStagesPubliclyVisible,
  formatPortalDateShort,
  matchStagesAvailableFromUtcDate,
  parsePublicMatchProgrammeBundle,
} from './matchStagesVisibility'

describe('matchStagesAvailableFromUtcDate', () => {
  it('returns null for immediate or unset visibility', () => {
    expect(matchStagesAvailableFromUtcDate('2026-06-10T09:00:00.000Z', null)).toBeNull()
    expect(matchStagesAvailableFromUtcDate('2026-06-10T09:00:00.000Z', 0)).toBeNull()
  })

  it('subtracts whole UTC days before match start date', () => {
    const d = matchStagesAvailableFromUtcDate('2026-06-10T09:00:00.000Z', 6)
    expect(d?.toISOString()).toBe('2026-06-04T00:00:00.000Z')
  })
})

describe('areMatchStagesPubliclyVisible', () => {
  const starts = '2026-06-10T09:00:00.000Z'

  it('is hidden when days not configured', () => {
    expect(areMatchStagesPubliclyVisible(starts, null, new Date('2026-06-09T12:00:00.000Z'))).toBe(false)
  })

  it('is visible immediately when days is zero', () => {
    expect(areMatchStagesPubliclyVisible(starts, 0, new Date('2026-01-01T00:00:00.000Z'))).toBe(true)
  })

  it('opens on the configured UTC day', () => {
    expect(areMatchStagesPubliclyVisible(starts, 6, new Date('2026-06-03T23:59:59.000Z'))).toBe(false)
    expect(areMatchStagesPubliclyVisible(starts, 6, new Date('2026-06-04T00:00:00.000Z'))).toBe(true)
  })
})

describe('formatPortalDateShort', () => {
  it('formats UTC calendar date', () => {
    expect(formatPortalDateShort('2026-06-04T00:00:00.000Z', 'uk')).toMatch(/04\.06\.26/)
  })
})

describe('parsePublicMatchProgrammeBundle', () => {
  it('normalizes RPC payload', () => {
    const parsed = parsePublicMatchProgrammeBundle({
      has_stages: true,
      publicly_visible: false,
      available_from: '2026-06-04',
      stages: [{ sort_order: 1, share_stage_id: 's1', snapshot_meta: { title_snapshot: 'A' } }],
    })
    expect(parsed.has_stages).toBe(true)
    expect(parsed.publicly_visible).toBe(false)
    expect(parsed.available_from).toBe('2026-06-04')
    expect(parsed.stages).toHaveLength(1)
  })
})
