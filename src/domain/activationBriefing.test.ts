import { describe, expect, it } from 'vitest'
import { formatActivationNumberList } from './activationBriefing'

describe('formatActivationNumberList', () => {
  it('formats Ukrainian lists', () => {
    expect(formatActivationNumberList([3, 1, 2], 'uk')).toBe('1, 2 та 3')
    expect(formatActivationNumberList([2, 1], 'uk')).toBe('1 та 2')
    expect(formatActivationNumberList([7], 'uk')).toBe('7')
    expect(formatActivationNumberList([], 'uk')).toBe('')
  })

  it('formats English lists with Oxford-style last join', () => {
    expect(formatActivationNumberList([3, 1, 2], 'en')).toBe('1, 2, and 3')
    expect(formatActivationNumberList([2, 1], 'en')).toBe('1 and 2')
    expect(formatActivationNumberList([7], 'en')).toBe('7')
  })
})
