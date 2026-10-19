import { describe, expect, it } from 'vitest'
import { centroidOfEntities, shiftClonesForPaste } from './planClipboard'
import type { Prop, Target } from './models'

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
})
