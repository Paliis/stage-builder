import { describe, expect, it } from 'vitest'
import { isValidParticipantPhone } from './isValidParticipantPhone'

describe('isValidParticipantPhone', () => {
  it('accepts typical UA formats', () => {
    expect(isValidParticipantPhone('+380501234567')).toBe(true)
    expect(isValidParticipantPhone('+38 (050) 123-45-67')).toBe(true)
    expect(isValidParticipantPhone('050 123 4567')).toBe(true)
  })

  it('rejects empty', () => {
    expect(isValidParticipantPhone('')).toBe(false)
    expect(isValidParticipantPhone('   ')).toBe(false)
  })

  it('rejects too few or too many digits', () => {
    expect(isValidParticipantPhone('+123456')).toBe(false)
    expect(isValidParticipantPhone('+380505050505545454545')).toBe(false)
  })

  it('rejects letters and misplaced plus', () => {
    expect(isValidParticipantPhone('+380 abc')).toBe(false)
    expect(isValidParticipantPhone('38+0501234567')).toBe(false)
    expect(isValidParticipantPhone('++380501234567')).toBe(false)
  })
})
