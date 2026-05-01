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
    ).toEqual({ stage_poppers: 2, stage_numtargs: 0, stage_noshoots: true, stage_poppers_maxnpms: 0 })
  })

  it('counts paper and double swinger paper as two units', () => {
    expect(
      computePscStageMetrics([
        t({ type: 'paperIpscTwoPostStand100' }),
        t({ type: 'swingerDoublePaper' }),
      ]),
    ).toEqual({ stage_poppers: 0, stage_numtargs: 3, stage_noshoots: false, stage_poppers_maxnpms: 0 })
  })

  it('counts metal/ceramic plates into stage_poppers_maxnpms and ceramic swingers', () => {
    expect(
      computePscStageMetrics([
        t({ type: 'metalPlate' }),
        t({ type: 'ceramicPlate' }),
        t({ id: 's', type: 'swingerDoubleCeramic' }),
      ]),
    ).toEqual({ stage_poppers: 0, stage_numtargs: 0, stage_noshoots: false, stage_poppers_maxnpms: 4 })
  })
})
