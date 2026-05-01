import { describe, expect, it } from 'vitest'

import { inferPaperTargetsFromBriefing } from './briefingPaperTargetHint'

describe('inferPaperTargetsFromBriefing', () => {
  it('returns 0 when empty', () => {
    expect(inferPaperTargetsFromBriefing('')).toBe(0)
    expect(inferPaperTargetsFromBriefing('   ')).toBe(0)
  })

  it('reads nom. plural UA (user/PDF style «2 Паперові мішені»)', () => {
    expect(inferPaperTargetsFromBriefing('4 металеві тарілки + 1 Попер + 2 Паперові мішені')).toBe(2)
  })

  it('reads genitive plural from summarizeTargets UA', () => {
    expect(inferPaperTargetsFromBriefing('5 сталевих + 3 паперових мішеней')).toBe(3)
  })

  it('reads singular UA', () => {
    expect(inferPaperTargetsFromBriefing('1 паперова мішень')).toBe(1)
  })

  it('reads EN paper targets', () => {
    expect(inferPaperTargetsFromBriefing('2 steel + 1 paper target')).toBe(1)
    expect(inferPaperTargetsFromBriefing('6 paper targets')).toBe(6)
  })

  it('takes max across multiple paper phrases', () => {
    expect(inferPaperTargetsFromBriefing('1 паперова мішень та 4 паперові мішені')).toBe(4)
  })
})
