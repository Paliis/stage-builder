import { describe, expect, it } from 'vitest'

import { defaultStageBriefing } from '../../domain/stageBriefing'
import { emptyPenaltyZoneSet } from '../../domain/penaltyZones'
import { buildStageProjectFile, serializeStageProject } from '../../domain/stageProjectFile'
import { tryPscStageMetricsFromSharePayload } from './sharePayloadPscMetrics.ts'

describe('tryPscStageMetricsFromSharePayload', () => {
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
    })
  })
})
