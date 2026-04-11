import { describe, expect, it } from 'vitest'
import { emptyPenaltyZoneSet } from './penaltyZones'
import {
  buildStageProjectFile,
  parseStageProjectJson,
  serializeStageProject,
  STAGE_PROJECT_FORMAT,
  STAGE_PROJECT_VERSION,
} from './stageProjectFile'
import { defaultStageBriefing } from './stageBriefing'

describe('stageProjectFile', () => {
  it('roundtrips JSON', () => {
    const briefing = defaultStageBriefing()
    const file = buildStageProjectFile({
      stage: {
        name: 'Test',
        weaponClass: 'handgun',
        fieldSizeM: { x: 30, y: 40 },
        fieldGroundCover3d: 'grass',
        targets: [
          {
            id: 'a',
            type: 'paperIpsc',
            isNoShoot: false,
            position: { x: 5, y: 10 },
            rotationRad: 0,
          },
        ],
        props: [],
        penaltyZoneSet: emptyPenaltyZoneSet(),
      },
      briefing,
    })
    const text = serializeStageProject(file)
    const parsed = parseStageProjectJson(text)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.data.format).toBe(STAGE_PROJECT_FORMAT)
    expect(parsed.data.version).toBe(STAGE_PROJECT_VERSION)
    expect(parsed.data.stage.name).toBe('Test')
    expect(parsed.data.stage.targets).toHaveLength(1)
    expect(parsed.data.stage.targets[0]!.id).toBe('a')
    expect(parsed.data.stage.targets[0]!.type).toBe('paperIpscTwoPostStand100')
    expect(parsed.data.briefing.documentTitle).toBe(briefing.documentTitle)
  })

  it('rejects invalid JSON', () => {
    expect(parseStageProjectJson('not json').ok).toBe(false)
  })

  it('migrates legacy paperIpscTwoPost to paperIpscTwoPostStand100', () => {
    const raw = {
      format: STAGE_PROJECT_FORMAT,
      version: STAGE_PROJECT_VERSION,
      stage: {
        name: 'T',
        weaponClass: 'handgun',
        fieldSizeM: { x: 30, y: 40 },
        fieldGroundCover3d: 'grass',
        targets: [
          {
            id: 'x',
            type: 'paperIpscTwoPost',
            isNoShoot: false,
            position: { x: 1, y: 2 },
            rotationRad: 0,
          },
        ],
        props: [],
      },
      briefing: defaultStageBriefing(),
    }
    const parsed = parseStageProjectJson(JSON.stringify(raw))
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.data.stage.targets[0]!.type).toBe('paperIpscTwoPostStand100')
  })

  it('migrates legacy single-post paper types to Stand100', () => {
    const briefing = defaultStageBriefing()
    const raw = {
      format: STAGE_PROJECT_FORMAT,
      version: STAGE_PROJECT_VERSION,
      stage: {
        name: 'T',
        weaponClass: 'handgun',
        fieldSizeM: { x: 30, y: 40 },
        fieldGroundCover3d: 'grass',
        targets: [
          { id: 'a', type: 'paperA4', isNoShoot: false, position: { x: 0, y: 0 }, rotationRad: 0 },
          { id: 'b', type: 'paperMiniIpsc', isNoShoot: false, position: { x: 1, y: 0 }, rotationRad: 0 },
        ],
        props: [],
      },
      briefing,
    }
    const parsed = parseStageProjectJson(JSON.stringify(raw))
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.data.stage.targets[0]!.type).toBe('paperA4TwoPostStand100')
    expect(parsed.data.stage.targets[1]!.type).toBe('paperMiniIpscTwoPostStand100')
  })

  it('version 1 files parse with empty penaltyZoneSet', () => {
    const raw = {
      format: STAGE_PROJECT_FORMAT,
      version: 1,
      stage: {
        name: 'Legacy',
        weaponClass: 'handgun',
        fieldSizeM: { x: 20, y: 30 },
        fieldGroundCover3d: 'grass',
        targets: [],
        props: [],
      },
      briefing: defaultStageBriefing(),
    }
    const parsed = parseStageProjectJson(JSON.stringify(raw))
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.data.stage.penaltyZoneSet.polygons).toHaveLength(0)
  })
})
