import { describe, expect, it } from 'vitest'
import type { Target } from './models'
import { summarizeTargets } from './targetSummary'

function baseTarget(over: Partial<Target> & Pick<Target, 'type'>): Target {
  return {
    id: 't1',
    x: 0,
    y: 0,
    rot: 0,
    isNoShoot: false,
    ...over,
  }
}

describe('summarizeTargets', () => {
  it('counts ceramic plates separately from steel (UK)', () => {
    const s = summarizeTargets(
      [
        baseTarget({ id: 'a', type: 'metalPlate' }),
        baseTarget({ id: 'b', type: 'ceramicPlate' }),
        baseTarget({ id: 'c', type: 'ceramicPlate' }),
        baseTarget({ id: 'd', type: 'paperIpsc' }),
      ],
      'uk',
    )
    expect(s).toContain('1 металева мішень')
    expect(s).toContain('2 керамічних мішеней')
    expect(s).toContain('1 паперова мішень')
    expect(s).not.toMatch(/3 металевих/)
  })

  it('counts ceramic swingers as ceramic faces (UK)', () => {
    expect(summarizeTargets([baseTarget({ type: 'swingerDoubleCeramic' })], 'uk')).toBe(
      '2 керамічних мішеней',
    )
    expect(summarizeTargets([baseTarget({ type: 'swingerSingleCeramic' })], 'uk')).toBe(
      '1 керамічна мішень',
    )
  })

  it('uses ceramic wording in EN', () => {
    expect(summarizeTargets([baseTarget({ type: 'ceramicPlate' }), baseTarget({ id: '2', type: 'metalPlate' })], 'en')).toBe(
      '1 steel target + 1 ceramic target',
    )
  })
})
