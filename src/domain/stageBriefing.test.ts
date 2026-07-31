import { describe, expect, it } from 'vitest'
import type { StageCategory } from './models'
import {
  briefingTableRows,
  briefingUsesScoringShots,
  defaultStageBriefing,
  type BriefingPdfLabels,
} from './stageBriefing'
import { WEAPON_CLASS_VALUES } from './weaponClass'

const LABELS: BriefingPdfLabels = {
  exerciseTypeAndShots: 'type-recommended',
  exerciseTypeAndScoringShots: 'type-scoring',
  exerciseType: 'type',
  targets: 'targets',
  recommendedShots: 'recommended',
  scoringShots: 'scoring',
  allowedAmmo: 'ammo',
  maxPoints: 'points',
  startSignal: 'signal',
  readyCondition: 'ready',
  startPosition: 'start',
  procedure: 'procedure',
  safetyAngles: 'angles',
}

const categoryLabel = (c: StageCategory) => c

function firstRow(weaponClass: (typeof WEAPON_CLASS_VALUES)[number], shots: string) {
  const briefing = { ...defaultStageBriefing(), recommendedShots: shots }
  return briefingTableRows(briefing, LABELS, categoryLabel, '—', weaponClass)[0]
}

describe('briefingUsesScoringShots', () => {
  it('handgun briefings state rounds to be scored (ФПСУ V §2)', () => {
    expect(briefingUsesScoringShots('handgun')).toBe(true)
  })

  it('rifle and shotgun briefings keep the indicative minimum', () => {
    expect(briefingUsesScoringShots('rifle')).toBe(false)
    expect(briefingUsesScoringShots('shotgun')).toBe(false)
  })
})

describe('briefingTableRows shots label', () => {
  it('uses the scoring variant for handgun', () => {
    expect(firstRow('handgun', '12').label).toBe('type-scoring')
  })

  it('uses the recommended variant for every other class', () => {
    expect(firstRow('rifle', '12').label).toBe('type-recommended')
    expect(firstRow('shotgun', '12').label).toBe('type-recommended')
  })

  it('keeps the value independent of the weapon class', () => {
    for (const wc of WEAPON_CLASS_VALUES) {
      expect(firstRow(wc, '12').value).toBe('short · 12')
    }
  })

  it('omits the separator when the shot count is empty', () => {
    for (const wc of WEAPON_CLASS_VALUES) {
      expect(firstRow(wc, '  ').value).toBe('short')
    }
  })
})
