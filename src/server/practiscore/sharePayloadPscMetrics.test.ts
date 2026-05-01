import { describe, expect, it } from 'vitest'

import { defaultStageBriefing } from '../../domain/stageBriefing'
import { emptyPenaltyZoneSet } from '../../domain/penaltyZones'
import { buildStageProjectFile, serializeStageProject } from '../../domain/stageProjectFile'
import { tryPscStageMetricsFromSharePayload } from './sharePayloadPscMetrics.ts'

describe('tryPscStageMetricsFromSharePayload', () => {
  it('counts paper targets on plan without briefing wording (stored share payload)', () => {
    const briefing = defaultStageBriefing()
    briefing.targetsDescription = ''
    briefing.maxPoints = ''
    const file = buildStageProjectFile({
      briefing,
      stage: {
        name: 'PlanPaper',
        weaponClass: 'shotgun',
        fieldSizeM: { x: 10, y: 5 },
        fieldGroundCover3d: 'grass',
        targets: [
          {
            id: 's1',
            type: 'metalPlate',
            isNoShoot: false,
            position: { x: 1, y: 4 },
            rotationRad: 0,
          },
          {
            id: 's2',
            type: 'metalPlate',
            isNoShoot: false,
            position: { x: 9, y: 4 },
            rotationRad: 0,
          },
          {
            id: 'p1',
            type: 'paperIpscTwoPostStand100',
            isNoShoot: false,
            position: { x: 3, y: 2 },
            rotationRad: 0,
          },
          {
            id: 'p2',
            type: 'paperIpscTwoPostStand100',
            isNoShoot: false,
            position: { x: 7, y: 2 },
            rotationRad: 0,
          },
        ],
        props: [],
        penaltyZoneSet: emptyPenaltyZoneSet(),
        activations: [],
        planDimensions: [],
      },
    })
    expect(tryPscStageMetricsFromSharePayload(serializeStageProject(file))).toEqual({
      stage_poppers: 2,
      stage_numtargs: 2,
      stage_noshoots: false,
      stage_tppoints: 30,
    })
  })

  it('uses max of scene paper count and briefing phrase when steel-only on plan', () => {
    const briefing = {
      ...defaultStageBriefing(),
      targetsDescription:
        '4 металеві тарілки + 1 Попер + 2 Паперові мішені\n\n(активації відсутні)',
    }
    const file = buildStageProjectFile({
      briefing,
      stage: {
        name: 'S3',
        weaponClass: 'shotgun',
        fieldSizeM: { x: 40, y: 45 },
        fieldGroundCover3d: 'grass',
        targets: [
          {
            id: 'm1',
            type: 'metalPlate',
            isNoShoot: false,
            position: { x: 1, y: 2 },
            rotationRad: 0,
          },
          {
            id: 'm2',
            type: 'metalPlate',
            isNoShoot: false,
            position: { x: 2, y: 2 },
            rotationRad: 0,
          },
          {
            id: 'm3',
            type: 'metalPlate',
            isNoShoot: false,
            position: { x: 3, y: 2 },
            rotationRad: 0,
          },
          {
            id: 'm4',
            type: 'metalPlate',
            isNoShoot: false,
            position: { x: 4, y: 2 },
            rotationRad: 0,
          },
          { id: 'p1', type: 'popper', isNoShoot: false, position: { x: 5, y: 2 }, rotationRad: 0 },
        ],
        props: [],
        penaltyZoneSet: emptyPenaltyZoneSet(),
        activations: [],
        planDimensions: [],
      },
    })
    const metrics = tryPscStageMetricsFromSharePayload(serializeStageProject(file))
    expect(metrics).toEqual({
      stage_poppers: 5,
      stage_numtargs: 2,
      stage_noshoots: false,
      stage_tppoints: 45,
    })
  })
})
