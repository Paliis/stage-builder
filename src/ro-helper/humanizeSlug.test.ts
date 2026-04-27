import { describe, expect, it } from 'vitest'
import { humanizeRoHelperSlug } from './humanizeSlug'

describe('humanizeRoHelperSlug', () => {
  it('returns empty input as-is', () => {
    expect(humanizeRoHelperSlug('')).toBe('')
  })

  it('humanizes simple kebab-case', () => {
    expect(humanizeRoHelperSlug('range-safety-briefing')).toBe('Range safety briefing')
  })

  it('uppercases known acronyms anywhere', () => {
    expect(humanizeRoHelperSlug('dq-180-rule')).toBe('DQ 180 rule')
    expect(humanizeRoHelperSlug('ro-procedures')).toBe('RO procedures')
    expect(humanizeRoHelperSlug('check-with-cro')).toBe('Check with CRO')
  })

  it('normalizes underscores and dots as separators', () => {
    expect(humanizeRoHelperSlug('match_admin.docs')).toBe('Match admin docs')
  })

  it('keeps numeric tokens intact', () => {
    expect(humanizeRoHelperSlug('rule-10-5')).toBe('Rule 10 5')
  })

  it('does not crash on a single token', () => {
    expect(humanizeRoHelperSlug('handgun')).toBe('Handgun')
    expect(humanizeRoHelperSlug('dq')).toBe('DQ')
  })

  it('collapses repeated separators', () => {
    expect(humanizeRoHelperSlug('safety--first')).toBe('Safety first')
  })
})
