import { describe, expect, it } from 'vitest'
import { centroidOfEntities, planDimensionsForCopyZone, shiftClonesForPaste } from './planClipboard'
import type { PlanDimensionLine, Prop, Target } from './models'

function t(id: string, x: number, y: number): Target {
  return {
    id,
    type: 'popper',
    isNoShoot: false,
    position: { x, y },
    rotationRad: 0,
  }
}

function p(id: string, x: number, y: number): Prop {
  return {
    id,
    type: 'barrel',
    sizeM: { x: 0.62, y: 0.62 },
    position: { x, y },
    rotationRad: 0,
  }
}

describe('centroidOfEntities', () => {
  it('returns origin when empty', () => {
    expect(centroidOfEntities([], [])).toEqual({ x: 0, y: 0 })
  })

  it('averages all positions', () => {
    expect(centroidOfEntities([t('a', 0, 0), t('b', 10, 20)], [])).toEqual({ x: 5, y: 10 })
    expect(centroidOfEntities([t('a', 10, 10)], [p('b', 30, 30)])).toEqual({ x: 20, y: 20 })
  })
})

describe('shiftClonesForPaste', () => {
  it('shifts and snaps positions within field', () => {
    const { targets, props } = shiftClonesForPaste([t('a', 5, 5)], [], { x: 2, y: 3 }, 30, 40)
    expect(targets[0]!.position.x).toBeCloseTo(7, 1)
    expect(targets[0]!.position.y).toBeCloseTo(8, 1)
    expect(props).toHaveLength(0)
  })

  it('clamps paste near far edge', () => {
    const { targets } = shiftClonesForPaste([t('a', 28, 38)], [], { x: 5, y: 5 }, 30, 40)
    expect(targets[0]!.position.x).toBeLessThanOrEqual(29)
    expect(targets[0]!.position.y).toBeLessThanOrEqual(39)
  })

  it('shifts plan dimensions by the same delta', () => {
    const dims: PlanDimensionLine[] = [{ id: 'd', endA: { x: 1, y: 1 }, endB: { x: 2, y: 1 } }]
    const { planDimensions } = shiftClonesForPaste([], [], { x: 3, y: 4 }, 30, 40, dims)
    expect(planDimensions[0]).toEqual({ id: 'd', endA: { x: 4, y: 5 }, endB: { x: 5, y: 5 } })
  })
})

describe('planDimensionsForCopyZone', () => {
  it('includes a dimension between two selected targets', () => {
    const dims: PlanDimensionLine[] = [
      { id: 'between', endA: { x: 2, y: 2 }, endB: { x: 5, y: 2 } },
      { id: 'far', endA: { x: 20, y: 20 }, endB: { x: 22, y: 20 } },
    ]
    const picked = planDimensionsForCopyZone(dims, [t('a', 2, 2), t('b', 5, 2)], [])
    expect(picked.map((d) => d.id)).toEqual(['between'])
  })
})

