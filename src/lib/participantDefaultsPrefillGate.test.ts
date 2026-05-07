import { describe, expect, it } from 'vitest'
import { participantDefaultsCompleteForMatchPrefill } from './participantDefaultsPrefillGate'

describe('participantDefaultsCompleteForMatchPrefill', () => {
  const row = {
    first_name: 'Pat',
    last_name: 'Lee',
    phone: '+380501234567',
    weapon_class: 'shotgun',
  }

  it('returns true when profile matches match weapon class', () => {
    expect(participantDefaultsCompleteForMatchPrefill(row, 'shotgun')).toBe(true)
  })

  it('returns false when weapon class differs', () => {
    expect(participantDefaultsCompleteForMatchPrefill(row, 'handgun')).toBe(false)
  })

  it('returns false when names or phone missing or invalid', () => {
    expect(
      participantDefaultsCompleteForMatchPrefill({ ...row, first_name: '  ' }, 'shotgun'),
    ).toBe(false)
    expect(participantDefaultsCompleteForMatchPrefill({ ...row, phone: '123' }, 'shotgun')).toBe(
      false,
    )
  })
})
