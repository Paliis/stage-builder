import { describe, expect, it } from 'vitest'

import { defaultStageBriefing } from './stageBriefing'
import { aggregateMatchProgrammeStats, matchStageStatRowFromProject } from './matchProgrammeStats'
import type { StageProjectFileV1 } from './stageProjectFile'

function project(
  targets: StageProjectFileV1['stage']['targets'],
  briefing: Partial<StageProjectFileV1['briefing']>,
): StageProjectFileV1 {
  return {
    format: 'stage-builder',
    version: 2,
    stage: {
      name: 'T',
      weaponClass: 'shotgun',
      fieldSizeM: { x: 20, y: 20 },
      targets,
      props: [],
    },
    briefing: { ...defaultStageBriefing(), ...briefing },
  }
}

describe('matchProgrammeStats', () => {
  it('aggregates points percent to 100', () => {
    const a = matchStageStatRowFromProject(
      1,
      project([], { exerciseType: 'short', maxPoints: '55', recommendedShots: '8' }),
    )
    const b = matchStageStatRowFromProject(
      2,
      project([], { exerciseType: 'long', maxPoints: '140', recommendedShots: '28' }),
    )
    const { rows, totals } = aggregateMatchProgrammeStats([a, b])
    expect(totals.points).toBe(195)
    expect(totals.shots).toBe(36)
    expect(rows[0]?.matchPercent).toBeCloseTo(28.2, 0)
    expect(rows[1]?.matchPercent).toBeCloseTo(71.8, 0)
  })

  it('matches staging sample totals (445 pts, percents sum to 100)', () => {
    const points = [40, 140, 40, 70, 45, 70, 40]
    const rows = points.map((pts, i) =>
      matchStageStatRowFromProject(
        i + 1,
        project([], { maxPoints: String(pts), recommendedShots: '1' }),
      ),
    )
    const { totals, rows: out } = aggregateMatchProgrammeStats(rows)
    expect(totals.points).toBe(445)
    expect(out.map((r) => r.matchPercent)).toEqual([9, 31.5, 9, 15.7, 10.1, 15.7, 9])
    const pctSum = out.reduce((s, r) => s + r.matchPercent, 0)
    expect(pctSum).toBe(100)
    expect(out[3]?.points).toBe(70)
    expect(out[3]?.matchPercent).toBe(15.7)
    expect(70 / 445).toBeCloseTo(0.1573, 3)
  })
})
