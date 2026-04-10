import { describe, expect, it } from 'vitest'
import { fieldResizeChangesEntities } from './fieldResizeImpact'
import type { Prop, Target } from './models'

function mkTarget(partial: Partial<Target> & Pick<Target, 'id'>): Target {
  return {
    type: 'paperIpsc',
    isNoShoot: false,
    position: { x: 0, y: 0 },
    rotationRad: 0,
    ...partial,
  }
}

function mkProp(partial: Partial<Prop> & Pick<Prop, 'id' | 'type'>): Prop {
  return {
    sizeM: { x: 1, y: 0.05 },
    position: { x: 5, y: 5 },
    rotationRad: 0,
    ...partial,
  }
}

describe('fieldResizeChangesEntities', () => {
  it('returns false when there are no targets or props', () => {
    expect(fieldResizeChangesEntities([], [], 20, 30)).toBe(false)
  })

  it('returns false when shrink keeps all positions inside margins', () => {
    const targets: Target[] = [
      mkTarget({ id: 'a', position: { x: 10, y: 10 } }),
    ]
    expect(fieldResizeChangesEntities(targets, [], 25, 35)).toBe(false)
  })

  it('returns true when a target must move after shrink', () => {
    const targets: Target[] = [
      mkTarget({ id: 'a', position: { x: 29, y: 39 } }),
    ]
    expect(fieldResizeChangesEntities(targets, [], 20, 30)).toBe(true)
  })

  it('returns true when a prop must move after shrink', () => {
    const props: Prop[] = [
      mkProp({ id: 'p1', type: 'shield', position: { x: 28, y: 38 } }),
    ]
    expect(fieldResizeChangesEntities([], props, 20, 30)).toBe(true)
  })
})
