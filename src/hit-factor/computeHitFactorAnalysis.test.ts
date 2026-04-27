import { describe, expect, it } from 'vitest'
import { computeHitFactorAnalysis } from './computeHitFactorAnalysis'

describe('computeHitFactorAnalysis', () => {
  it('computes max points and max HF for all-alpha baseline', () => {
    const r = computeHitFactorAnalysis({
      requiredHits: 20,
      timeBaseSec: 10,
      timeActualSec: 10,
      powerFactor: 'minor',
      deltaCharlie: 0,
      deltaDelta: 0,
      deltaMiss: 0,
      deltaNoShoot: 0,
      deltaProcedural: 0,
    })

    expect(r.maxPoints).toBe(100)
    expect(r.actualPoints).toBe(100)
    expect(r.hfMax).toBeCloseTo(10, 6)
    expect(r.hfActual).toBeCloseTo(10, 6)
    expect(r.hfLossPct).toBeCloseTo(0, 6)
  })

  it('treats a miss as -15 by default (penalty + lost alpha)', () => {
    const r = computeHitFactorAnalysis({
      requiredHits: 20,
      timeBaseSec: 10,
      timeActualSec: 10,
      powerFactor: 'minor',
      deltaCharlie: 0,
      deltaDelta: 0,
      deltaMiss: 1,
      deltaNoShoot: 0,
      deltaProcedural: 0,
    })
    expect(r.pointsDelta).toBe(-15)
    expect(r.actualPoints).toBe(85)
    expect(r.hfActual).toBeCloseTo(8.5, 6)
  })

  it('uses PF-specific deltas for C/D', () => {
    const minor = computeHitFactorAnalysis({
      requiredHits: 10,
      timeBaseSec: 5,
      timeActualSec: 5,
      powerFactor: 'minor',
      deltaCharlie: 1,
      deltaDelta: 1,
      deltaMiss: 0,
      deltaNoShoot: 0,
      deltaProcedural: 0,
    })
    expect(minor.perError.charlie.points).toBe(-2)
    expect(minor.perError.delta.points).toBe(-4)

    const major = computeHitFactorAnalysis({
      requiredHits: 10,
      timeBaseSec: 5,
      timeActualSec: 5,
      powerFactor: 'major',
      deltaCharlie: 1,
      deltaDelta: 1,
      deltaMiss: 0,
      deltaNoShoot: 0,
      deltaProcedural: 0,
    })
    expect(major.perError.charlie.points).toBe(-1)
    expect(major.perError.delta.points).toBe(-3)
  })
})

