import { describe, expect, it } from 'vitest'

import { FAULT_LINE_SECTION_M, START_POSITION_DEFAULT_SIZE_M } from './propGeometry'
import type { Prop, Target } from './models'
import { computeShooterViewpoints } from './shooterViewpoint'

function start(id: string, x: number, y: number, rotationRad = 0): Prop {
  return {
    id,
    type: 'startPosition',
    position: { x, y },
    rotationRad,
    sizeM: { ...START_POSITION_DEFAULT_SIZE_M },
  }
}

function faultLine(id: string, cx: number, cy: number, len: number, rotationRad = 0): Prop {
  return {
    id,
    type: 'faultLine',
    position: { x: cx, y: cy },
    rotationRad,
    sizeM: { x: len, y: FAULT_LINE_SECTION_M },
  }
}

function target(id: string, x: number, y: number): Target {
  return {
    id,
    type: 'paperIpscTwoPostGround',
    isNoShoot: false,
    position: { x, y },
    rotationRad: 0,
  }
}

describe('computeShooterViewpoints', () => {
  it('returns one viewpoint per start marker, closest to the bottom first', () => {
    const vps = computeShooterViewpoints([start('a', 5, 12), start('b', 5, 3)], [], 30, 40)
    expect(vps.map((v) => v.id)).toEqual(['b', 'a'])
    expect(vps.every((v) => v.kind === 'start')).toBe(true)
    expect(vps[0]!.position).toEqual({ x: 5, y: 3 })
  })

  it('looks along the marker rotation, toward the targets side', () => {
    const [ahead] = computeShooterViewpoints([start('a', 15, 5)], [target('t', 15, 25)], 30, 40)
    expect(ahead!.lookAt.y).toBeGreaterThan(ahead!.position.y)
    expect(ahead!.lookAt.x).toBeCloseTo(15, 6)

    const [behind] = computeShooterViewpoints([start('a', 15, 25)], [target('t', 15, 5)], 30, 40)
    expect(behind!.lookAt.y).toBeLessThan(behind!.position.y)
  })

  it('keeps the viewpoint inside the field even for a marker on the edge', () => {
    const [vp] = computeShooterViewpoints([start('a', 0, 0)], [], 15, 20)
    expect(vp!.position.x).toBeGreaterThanOrEqual(0)
    expect(vp!.position.y).toBeGreaterThanOrEqual(0)
    expect(vp!.position.x).toBeLessThanOrEqual(15)
    expect(vp!.position.y).toBeLessThanOrEqual(20)
  })

  it('falls back to the centre of the fault lines box', () => {
    const props = [faultLine('f1', 10, 6, 8), faultLine('f2', 10, 18, 8)]
    const [vp] = computeShooterViewpoints(props, [target('t', 10, 30)], 30, 40)
    expect(vp!.kind).toBe('faultLines')
    expect(vp!.position.x).toBeCloseTo(10, 6)
    expect(vp!.position.y).toBeCloseTo(12, 6)
    expect(vp!.lookAt.y).toBeGreaterThan(vp!.position.y)
  })

  it('falls back to the field itself and stays inside a small field', () => {
    const [vp] = computeShooterViewpoints([], [], 15, 20)
    expect(vp!.kind).toBe('field')
    expect(vp!.position.x).toBeCloseTo(7.5, 6)
    expect(vp!.position.y).toBeGreaterThan(0)
    expect(vp!.position.y).toBeLessThan(20)
    expect(vp!.lookAt.y).toBeGreaterThan(vp!.position.y)
  })
})
