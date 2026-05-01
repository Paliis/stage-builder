import { describe, expect, it } from 'vitest'

import type { Target } from './models'
import { computePscStageMetrics } from './pscStageMetrics'

function t(p: Partial<Target>): Target {
  return {
    id: 'x',
    position: { x: 0, y: 0 },
    rotationRad: 0,
    type: 'popper',
    isNoShoot: false,
    ...p,
  }
}

describe('computePscStageMetrics', () => {
  it('counts poppers and miniPopper; ignores NS popper for count', () => {
    expect(
      computePscStageMetrics([
        t({ type: 'popper' }),
        t({ type: 'miniPopper' }),
        t({ type: 'popper', isNoShoot: true }),
      ]),
    ).toEqual({ stage_poppers: 2, stage_numtargs: 0, stage_noshoots: true })
  })

  it('counts paper and double swinger paper as two units', () => {
    expect(
      computePscStageMetrics([
        t({ type: 'paperIpscTwoPostStand100' }),
        t({ type: 'swingerDoublePaper' }),
      ]),
    ).toEqual({ stage_poppers: 0, stage_numtargs: 3, stage_noshoots: false })
  })

  it('counts metal, ceramic plates, and ceramic swingers as poppers-like (steel slots in PS)', () => {
    expect(
      computePscStageMetrics([
        t({ type: 'metalPlate' }),
        t({ type: 'ceramicPlate' }),
        t({ id: 's', type: 'swingerDoubleCeramic' }),
      ]),
    ).toEqual({ stage_poppers: 4, stage_numtargs: 0, stage_noshoots: false })
  })

  it('does not count no-shoot paper toward stage_numtargs (aligned with briefing / Min Rounds)', () => {
    expect(
      computePscStageMetrics([
        ...Array.from({ length: 12 }, (_, i) =>
          t({
            id: `p${i}`,
            type: 'paperIpscTwoPostStand50',
            isNoShoot: false,
          }),
        ),
        ...Array.from({ length: 12 }, (_, i) =>
          t({
            id: `pn${i}`,
            type: 'paperMiniIpscTwoPostStand100',
            isNoShoot: true,
          }),
        ),
      ]),
    ).toEqual({ stage_poppers: 0, stage_numtargs: 12, stage_noshoots: true })
  })

  it('does not count no-shoot paper swinger faces toward stage_numtargs', () => {
    expect(
      computePscStageMetrics([
        t({ id: 'a', type: 'swingerDoublePaper', isNoShoot: false }),
        t({ id: 'b', type: 'swingerDoublePaper', isNoShoot: true }),
      ]),
    ).toEqual({ stage_poppers: 0, stage_numtargs: 2, stage_noshoots: true })
  })
})
