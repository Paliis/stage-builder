import { describe, expect, it } from 'vitest'

import { isMatchEventKind, isPsMatchLevel } from './matchTaxonomy'

describe('matchTaxonomy', () => {
  it('validates event kind', () => {
    expect(isMatchEventKind('training')).toBe(true)
    expect(isMatchEventKind('match')).toBe(true)
    expect(isMatchEventKind('classification')).toBe(true)
    expect(isMatchEventKind('seminar')).toBe(true)
    expect(isMatchEventKind('')).toBe(false)
    expect(isMatchEventKind('cup')).toBe(false)
  })

  it('validates PS level', () => {
    expect(isPsMatchLevel('L1')).toBe(true)
    expect(isPsMatchLevel('L5')).toBe(true)
    expect(isPsMatchLevel('')).toBe(false)
    expect(isPsMatchLevel('Level I')).toBe(false)
  })
})
