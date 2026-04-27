import { describe, expect, it } from 'vitest'
import { normalizeQuery, scoreRoHelperEntry, searchRoHelper, type RoHelperSearchEntry } from './roHelperSearch'

const entries: RoHelperSearchEntry[] = [
  { discipline: 'handgun', category: 'safety', slug: 'break-180', title: 'Break the 180' },
  { discipline: 'handgun', category: 'safety', slug: 'dq-general', title: 'DQ — general grounds' },
  { discipline: 'handgun', category: 'penalties', slug: 'foot-fault', title: 'Foot fault' },
  { discipline: 'rifle', category: 'safety', slug: 'break-180', title: 'Break the 180' },
  { discipline: 'pcc', category: 'scoring', slug: 'paper-zones-major-minor', title: 'Paper zones — major / minor' },
  { discipline: 'shotgun', category: 'equipment', slug: 'open-shotgun-specs', title: 'Відкрита рушниця — специфікації' },
]

describe('normalizeQuery', () => {
  it('lowercases and strips em/en dashes and apostrophes', () => {
    expect(normalizeQuery("Shooter\u2019s \u2014 DQ")).toBe('shooters dq')
  })
  it('collapses separators', () => {
    expect(normalizeQuery('foot-fault_rule.10')).toBe('foot fault rule 10')
  })
  it('returns empty string for empty input', () => {
    expect(normalizeQuery('')).toBe('')
    expect(normalizeQuery('   ')).toBe('')
  })
})

describe('scoreRoHelperEntry', () => {
  it('exact title match scores highest', () => {
    expect(
      scoreRoHelperEntry('break the 180', entries[0]),
    ).toBe(100)
  })
  it('prefix on title beats substring', () => {
    const a = scoreRoHelperEntry('break', entries[0])
    const b = scoreRoHelperEntry('the', entries[0])
    expect(a).toBeGreaterThan(b)
  })
  it('substring fallback to slug works when title misses', () => {
    expect(scoreRoHelperEntry('zones', entries[4])).toBeGreaterThan(0)
  })
  it('returns 0 when nothing matches', () => {
    expect(scoreRoHelperEntry('helicopter', entries[2])).toBe(0)
  })
})

describe('searchRoHelper', () => {
  it('returns empty for empty query', () => {
    expect(searchRoHelper('', entries)).toEqual([])
    expect(searchRoHelper('   ', entries)).toEqual([])
  })
  it('finds break-180 across disciplines and ranks identical titles equally', () => {
    const hits = searchRoHelper('break', entries)
    expect(hits.length).toBe(2)
    expect(hits.every((h) => h.slug === 'break-180')).toBe(true)
  })
  it('matches Ukrainian title queries (lowercase, dash-insensitive)', () => {
    const hits = searchRoHelper('відкрита', entries)
    expect(hits[0]?.slug).toBe('open-shotgun-specs')
  })
  it('respects limit', () => {
    expect(searchRoHelper('e', entries, 2).length).toBeLessThanOrEqual(2)
  })
  it('matches by slug when title does not contain the query', () => {
    const hits = searchRoHelper('foot', entries)
    expect(hits[0]?.slug).toBe('foot-fault')
  })
})
