import { describe, expect, it } from 'vitest'
import { reclampTargetsProps } from './fieldEntityReclamp'
import type { Prop, Target } from './models'

function mkTarget(id: string, x: number, y: number): Target {
  return {
    id,
    type: 'paperIpscTwoPostStand100',
    isNoShoot: false,
    position: { x, y },
    rotationRad: 0,
  }
}

function mkShield(id: string, x: number, y: number): Prop {
  return {
    id,
    type: 'shield',
    sizeM: { x: 1, y: 0.05 },
    position: { x, y },
    rotationRad: 0,
  }
}

describe('reclampTargetsProps', () => {
  it('clamps target center into field with 1 m margin', () => {
    const { targets } = reclampTargetsProps([mkTarget('t', 100, 100)], [], 30, 40)
    expect(targets[0]!.position).toEqual({ x: 29, y: 39 })
  })

  it('clamps prop with size-based margin', () => {
    const { props } = reclampTargetsProps([], [mkShield('s', 29, 38)], 20, 30)
    const p = props[0]!
    expect(p.position.x).toBeLessThanOrEqual(20 - 0.66)
    expect(p.position.y).toBeLessThanOrEqual(30 - 0.66)
  })

  it('removes legacy wall prop', () => {
    const legacy = {
      id: 'w',
      type: 'wall',
      sizeM: { x: 2, y: 0.2 },
      position: { x: 10, y: 10 },
      rotationRad: 0,
    } as Prop
    const { props } = reclampTargetsProps([], [legacy], 30, 40)
    expect(props).toHaveLength(0)
  })
})
