import { describe, expect, it } from 'vitest'
import {
  PLAN_DIMENSION_TARGET_ATTACH_M,
  segmentLengthFractionInsideAabb,
  selectPlanDimensionsMajorityInAabb,
  shiftPlanDimensionsForTargetMoves,
  worldAabbFromPoints,
} from './planDimensions'

describe('shiftPlanDimensionsForTargetMoves', () => {
  const dim = {
    id: 'd1',
    endA: { x: 2, y: 2 },
    endB: { x: 2.5, y: 2 },
  }

  it('moves both ends when both targets move by the same delta', () => {
    const next = shiftPlanDimensionsForTargetMoves(
      [dim],
      [
        { from: { x: 2, y: 2 }, delta: { x: 1, y: 0.5 } },
        { from: { x: 2.5, y: 2 }, delta: { x: 1, y: 0.5 } },
      ],
      30,
      40,
    )
    expect(next[0]).toEqual({
      id: 'd1',
      endA: { x: 3, y: 2.5 },
      endB: { x: 3.5, y: 2.5 },
    })
  })

  it('moves only the end attached to the moved target', () => {
    const long = { id: 'd1', endA: { x: 2, y: 2 }, endB: { x: 5, y: 2 } }
    const next = shiftPlanDimensionsForTargetMoves(
      [long],
      [{ from: { x: 2, y: 2 }, delta: { x: 0, y: 1 } }],
      30,
      40,
    )
    expect(next[0]).toEqual({
      id: 'd1',
      endA: { x: 2, y: 3 },
      endB: { x: 5, y: 2 },
    })
  })

  it('leaves dimensions that are far from moved targets', () => {
    const next = shiftPlanDimensionsForTargetMoves(
      [dim],
      [{ from: { x: 20, y: 20 }, delta: { x: 1, y: 1 } }],
      30,
      40,
    )
    expect(next[0]).toBe(dim)
  })

  it('ignores zero deltas and empty moves', () => {
    expect(shiftPlanDimensionsForTargetMoves([dim], [], 30, 40)[0]).toBe(dim)
    expect(
      shiftPlanDimensionsForTargetMoves(
        [dim],
        [{ from: { x: 2, y: 2 }, delta: { x: 0, y: 0 } }],
        30,
        40,
      )[0],
    ).toBe(dim)
  })

  it('attaches within default tolerance', () => {
    const offset = PLAN_DIMENSION_TARGET_ATTACH_M * 0.5
    const loose = {
      id: 'd2',
      endA: { x: 5 + offset, y: 5 },
      endB: { x: 8, y: 5 },
    }
    const next = shiftPlanDimensionsForTargetMoves(
      [loose],
      [{ from: { x: 5, y: 5 }, delta: { x: 2, y: 0 } }],
      30,
      40,
    )
    expect(next[0]!.endA).toEqual({ x: 5 + offset + 2, y: 5 })
    expect(next[0]!.endB).toEqual({ x: 8, y: 5 })
  })
})

describe('segmentLengthFractionInsideAabb / majority select', () => {
  it('returns 1 for a segment fully inside the box', () => {
    const box = worldAabbFromPoints([
      { x: 0, y: 0 },
      { x: 10, y: 10 },
    ])!
    expect(segmentLengthFractionInsideAabb({ x: 1, y: 1 }, { x: 2, y: 1 }, box)).toBeCloseTo(1, 6)
  })

  it('returns ~0.5 when half the segment is clipped', () => {
    const box = { minX: 0, maxX: 5, minY: -1, maxY: 1 }
    expect(segmentLengthFractionInsideAabb({ x: 0, y: 0 }, { x: 10, y: 0 }, box)).toBeCloseTo(0.5, 6)
  })

  it('selects only dimensions with majority inside the zone', () => {
    const box = { minX: 0, maxX: 5, minY: -1, maxY: 1 }
    const inside = { id: 'in', endA: { x: 0, y: 0 }, endB: { x: 4, y: 0 } }
    const half = { id: 'half', endA: { x: 0, y: 0 }, endB: { x: 10, y: 0 } }
    const outside = { id: 'out', endA: { x: 6, y: 0 }, endB: { x: 9, y: 0 } }
    const picked = selectPlanDimensionsMajorityInAabb([inside, half, outside], box)
    expect(picked.map((d) => d.id)).toEqual(['in'])
  })
})

