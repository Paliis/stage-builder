import { describe, expect, it } from 'vitest'
import {
  entryFeeKopForCategories,
  formatEntryFeeKopAsUah,
  parseEntryFeeUahToKop,
} from './matchEntryFee'

describe('parseEntryFeeUahToKop', () => {
  it('parses whole UAH to kopecks', () => {
    expect(parseEntryFeeUahToKop('1200')).toBe(120_000)
    expect(parseEntryFeeUahToKop('')).toBe(null)
    expect(parseEntryFeeUahToKop('12.5')).toBe(null)
  })
})

describe('entryFeeKopForCategories', () => {
  const fees = {
    standard: 100_000,
    military: 80_000,
    ladyJunior: 70_000,
  }

  it('uses standard for general only', () => {
    expect(entryFeeKopForCategories(fees, ['general'])).toBe(100_000)
  })

  it('picks lowest when military applies', () => {
    expect(entryFeeKopForCategories(fees, ['general', 'military'])).toBe(80_000)
  })

  it('picks lowest when lady junior applies', () => {
    expect(entryFeeKopForCategories(fees, ['lady'])).toBe(70_000)
  })
})

describe('formatEntryFeeKopAsUah', () => {
  it('formats kopecks as UAH string', () => {
    expect(formatEntryFeeKopAsUah(120_000)).toBe('1200')
    expect(formatEntryFeeKopAsUah(null)).toBe('')
  })
})
