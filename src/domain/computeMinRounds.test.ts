import { describe, expect, it } from 'vitest'
import { computeMinRounds, countStageTargetUnits } from './computeMinRounds'
import type { Target } from './models'

function t(partial: Omit<Target, 'id' | 'position' | 'rotationRad'> & Partial<Target>): Target {
  return {
    id: partial.id ?? '1',
    type: partial.type,
    isNoShoot: partial.isNoShoot ?? false,
    position: partial.position ?? { x: 0, y: 0 },
    rotationRad: partial.rotationRad ?? 0,
  }
}

describe('computeMinRounds', () => {
  it('counts cardboard as 2 and steel as 1', () => {
    expect(
      computeMinRounds([
        t({ type: 'paperIpscTwoPostStand100' }),
        t({ type: 'paperA4TwoPostStand100' }),
        t({ type: 'popper' }),
        t({ type: 'metalPlate' }),
      ]),
    ).toBe(2 + 2 + 1 + 1)
  })

  it('ignores no-shoot for minimum', () => {
    expect(
      computeMinRounds([
        t({ type: 'paperIpscTwoPostStand100', isNoShoot: true }),
        t({ type: 'popper' }),
      ]),
    ).toBe(1)
  })

  it('counts double swinger as two paper or two steel', () => {
    expect(computeMinRounds([t({ type: 'swingerDoublePaper' })])).toBe(4)
    expect(computeMinRounds([t({ type: 'swingerDoubleCeramic' })])).toBe(2)
    expect(computeMinRounds([t({ type: 'swingerSinglePaper' })])).toBe(2)
    expect(computeMinRounds([t({ type: 'swingerSingleCeramic' })])).toBe(1)
  })

  it('countStageTargetUnits: double swinger is 2 units, others 1 per object', () => {
    expect(countStageTargetUnits([t({ type: 'swingerDoubleCeramic' })])).toBe(2)
    expect(countStageTargetUnits([t({ type: 'swingerSingleCeramic' })])).toBe(1)
    expect(
      countStageTargetUnits([
        t({ id: 'a', type: 'swingerDoublePaper' }),
        t({ id: 'b', type: 'popper' }),
      ]),
    ).toBe(3)
  })
})
