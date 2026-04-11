import { describe, expect, it } from 'vitest'
import { isTargetInSafetyZone, parseSafetyAngles } from './safetyAngles'

describe('parseSafetyAngles', () => {
  it('parses two-part format', () => {
    expect(parseSafetyAngles('90/45')).toEqual({ leftDeg: 90, rightDeg: 45 })
  })

  it('parses three-part (ignores third for 2D)', () => {
    expect(parseSafetyAngles(' 30 / 60 / 90 ')).toEqual({ leftDeg: 30, rightDeg: 60 })
  })

  it('returns null for invalid input', () => {
    expect(parseSafetyAngles('')).toBeNull()
    expect(parseSafetyAngles('90')).toBeNull()
    expect(parseSafetyAngles('a/b')).toBeNull()
    expect(parseSafetyAngles('0/90')).toBeNull()
    expect(parseSafetyAngles('-10/90')).toBeNull()
  })
})

describe('isTargetInSafetyZone', () => {
  const start = { x: 15, y: 5 }
  const angles = { leftDeg: 45, rightDeg: 45 }

  it('treats target on start as inside', () => {
    expect(isTargetInSafetyZone(start, start, angles)).toBe(true)
  })

  it('target straight downrange (+Y) is inside', () => {
    expect(isTargetInSafetyZone({ x: 15, y: 30 }, start, angles)).toBe(true)
  })

  it('target at left boundary of wedge is inside', () => {
    /* 45° left of +Y → atan2(dx,dy) = -45° at dy>0 */
    expect(isTargetInSafetyZone({ x: 15 - 10, y: 5 + 10 }, start, angles)).toBe(true)
  })

  it('target outside left wedge is false', () => {
    /* dx=-15, dy=25 → atan2 ≈ −31° < −30° */
    expect(isTargetInSafetyZone({ x: 0, y: 30 }, start, { leftDeg: 30, rightDeg: 30 })).toBe(false)
  })

  it('target with large dx and small dy can be outside', () => {
    expect(isTargetInSafetyZone({ x: 28, y: 6 }, start, { leftDeg: 45, rightDeg: 45 })).toBe(false)
  })
})
