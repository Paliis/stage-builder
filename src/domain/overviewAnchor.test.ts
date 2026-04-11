import { describe, expect, it } from 'vitest'
import type { Prop } from './models'
import { FAULT_LINE_SECTION_M, START_POSITION_DEFAULT_SIZE_M } from './propGeometry'
import { computeOverviewAnchorWorld2d } from './overviewAnchor'

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

  it('returns null when no start and no fault line', () => {
    expect(computeOverviewAnchorWorld2d([])).toBeNull()
  })
})
