import { describe, expect, it } from 'vitest'
import { getMatchEventKindProfile } from './matchEventKindProfile'

describe('getMatchEventKindProfile', () => {
  it('seminar: minimal registration, no PS/discipline on card, programme toggle off by default', () => {
    const p = getMatchEventKindProfile('seminar')
    expect(p.registrationMode).toBe('seminar_minimal')
    expect(p.showPsLevelField).toBe(false)
    expect(p.showDisciplineOnCard).toBe(false)
    expect(p.showProgrammeStagesToggle).toBe(true)
    expect(p.defaultProgrammeStagesEnabled).toBe(false)
  })

  it('training: full registration, programme toggle on by default', () => {
    const p = getMatchEventKindProfile('training')
    expect(p.registrationMode).toBe('full')
    expect(p.showPsLevelField).toBe(false)
    expect(p.showProgrammeStagesToggle).toBe(true)
    expect(p.defaultProgrammeStagesEnabled).toBe(true)
  })

  it('match and classification share competition profile', () => {
    for (const kind of ['match', 'classification'] as const) {
      const p = getMatchEventKindProfile(kind)
      expect(p.showPsLevelField).toBe(true)
      expect(p.showProgrammeStagesToggle).toBe(false)
      expect(p.registrationMode).toBe('full')
    }
  })
})
