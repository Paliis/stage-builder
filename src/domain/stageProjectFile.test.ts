import { describe, expect, it } from 'vitest'
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
    expect(parsed.data.briefing.documentTitle).toBe(briefing.documentTitle)
  })

  it('rejects invalid JSON', () => {
    expect(parseStageProjectJson('not json').ok).toBe(false)
  })
})
