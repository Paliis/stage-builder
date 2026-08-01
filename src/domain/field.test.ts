import { describe, expect, it } from 'vitest'
import {
  clampFieldDimensions,
  clampVec2ToField,
  clampVec2ToFieldBox,
  FIELD_SIZE_LIMITS,
  rotatedHalfExtentM,
  snapMeters,
  snapVec2,
} from './field'

describe('clampFieldDimensions', () => {
  it('clamps width and height to limits and rounds to 0.1 m', () => {
    expect(clampFieldDimensions(3, 9)).toEqual({ x: FIELD_SIZE_LIMITS.minM, y: 9 })
    expect(clampFieldDimensions(60, 120)).toEqual({
      x: FIELD_SIZE_LIMITS.maxWidthM,
      y: FIELD_SIZE_LIMITS.maxHeightM,
    })
  })

  it('rounds to one decimal', () => {
    expect(clampFieldDimensions(30.04, 40.06)).toEqual({ x: 30, y: 40.1 })
  })
})

describe('snapMeters', () => {
  it('snaps to default grid 0.5 m', () => {
    expect(snapMeters(10.12)).toBe(10)
    expect(snapMeters(10.37)).toBe(10.5)
  })
})

describe('snapVec2', () => {
  it('snaps both axes', () => {
    expect(snapVec2({ x: 1.24, y: 3.7 })).toEqual({ x: 1, y: 3.5 })
  })
})

describe('clampVec2ToField', () => {
  it('keeps point inside margins', () => {
    expect(clampVec2ToField({ x: 100, y: 100 }, 1, 30, 40)).toEqual({ x: 29, y: 39 })
    expect(clampVec2ToField({ x: 0, y: 0 }, 1, 30, 40)).toEqual({ x: 1, y: 1 })
  })
})

describe('rotatedHalfExtentM', () => {
  it('keeps the axes of an unrotated rectangle', () => {
    expect(rotatedHalfExtentM({ x: 20, y: 0.1 }, 0)).toEqual({ x: 10, y: 0.05 })
  })

  it('swaps the axes at a quarter turn', () => {
    const half = rotatedHalfExtentM({ x: 20, y: 0.1 }, Math.PI / 2)
    expect(half.x).toBeCloseTo(0.05, 6)
    expect(half.y).toBeCloseTo(10, 6)
  })
})

describe('clampVec2ToFieldBox', () => {
  it('lets a long fault line reach the bottom edge across its own axis', () => {
    const half = rotatedHalfExtentM({ x: 20, y: 0.1 }, 0)
    expect(clampVec2ToFieldBox({ x: 15, y: 0 }, half, 30, 40)).toEqual({ x: 15, y: 0.05 })
  })

  it('centres a box wider than the field', () => {
    expect(clampVec2ToFieldBox({ x: 2, y: 5 }, { x: 40, y: 0.05 }, 30, 40)).toEqual({ x: 15, y: 5 })
  })
})
