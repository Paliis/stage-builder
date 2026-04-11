import { describe, expect, it } from 'vitest'
import type { Prop } from './models'
import { FAULT_LINE_SECTION_M, START_POSITION_DEFAULT_SIZE_M } from './propGeometry'
import { computeOverviewAnchorWorld2d, overviewAnchorRelevantSignature } from './overviewAnchor'

function sp(id: string, x: number, y: number): Prop {
  return {
    id,
    type: 'startPosition',
    position: { x, y },
    rotationRad: 0,
    sizeM: { ...START_POSITION_DEFAULT_SIZE_M },
  }
}

function fl(id: string, cx: number, cy: number, len: number, rot: number): Prop {
  return {
    id,
    type: 'faultLine',
    position: { x: cx, y: cy },
    rotationRad: rot,
    sizeM: { x: len, y: FAULT_LINE_SECTION_M },
  }
}

describe('computeOverviewAnchorWorld2d', () => {
  it('prefers start with smallest y', () => {
    const props = [sp('a', 5, 10), sp('b', 5, 4)] as Prop[]
    const a = computeOverviewAnchorWorld2d(props)
    expect(a).toEqual({ x: 5, y: 4 })
  })

  it('on tie by y picks rightmost x', () => {
    const props = [sp('a', 3, 8), sp('b', 9, 8)] as Prop[]
    const a = computeOverviewAnchorWorld2d(props)
    expect(a).toEqual({ x: 9, y: 8 })
  })

  it('uses fault line endpoints when no start', () => {
    /* Horizontal line along x at y=6, from x=2 to x=8 — ends (2,6) and (8,6): same y → (8,6). */
    const props = [fl('f', 5, 6, 6, 0)] as Prop[]
    const a = computeOverviewAnchorWorld2d(props)
    expect(a).toEqual({ x: 8, y: 6 })
  })

  it('picks lower y on vertical fault line (rotation π/2)', () => {
    /* Center (10,12), length 4, rot 90°: along +Y from (10,10) to (10,14) — min y is 10. */
    const props = [fl('v', 10, 12, 4, Math.PI / 2)] as Prop[]
    const a = computeOverviewAnchorWorld2d(props)
    expect(a).toEqual({ x: 10, y: 10 })
  })

  it('returns null when no start and no fault line', () => {
    expect(computeOverviewAnchorWorld2d([])).toBeNull()
  })

  it('picks globally lowest-y endpoint across several fault lines', () => {
    const props = [fl('low', 10, 3, 4, 0), fl('high', 5, 12, 6, 0)] as Prop[]
    const a = computeOverviewAnchorWorld2d(props)
    /* low line endpoints (8,3)/(12,3); high (2,12)/(8,12) → min y=3, then max x → (12,3). */
    expect(a).toEqual({ x: 12, y: 3 })
  })
})

describe('overviewAnchorRelevantSignature', () => {
  it('changes when fault line length (sizeM.x) changes', () => {
    const a = [fl('f', 5, 6, 6, 0)] as Prop[]
    const b = [fl('f', 5, 6, 10, 0)] as Prop[]
    expect(overviewAnchorRelevantSignature(a)).not.toBe(overviewAnchorRelevantSignature(b))
  })

  it('is order-independent for multiple props (sorted by prefix)', () => {
    const p1 = [sp('s1', 1, 1), fl('f1', 2, 2, 3, 0)] as Prop[]
    const p2 = [fl('f1', 2, 2, 3, 0), sp('s1', 1, 1)] as Prop[]
    expect(overviewAnchorRelevantSignature(p1)).toBe(overviewAnchorRelevantSignature(p2))
  })
})
