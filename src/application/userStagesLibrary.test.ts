import { describe, expect, it } from 'vitest'
import { DEFAULT_FIELD_HEIGHT_M, DEFAULT_FIELD_WIDTH_M } from '../domain/field'
import { DEFAULT_FIELD_GROUND_COVER_3D } from '../domain/fieldGround3d'
import { emptyPenaltyZoneSet } from '../domain/penaltyZones'
import { defaultStageBriefing } from '../domain/stageBriefing'
import { buildStageProjectFile } from '../domain/stageProjectFile'
import {
  normalizeUserStageTitle,
  parseUserStageRow,
  USER_STAGE_TITLE_MAX,
} from './userStagesLibrary'

function payload(): unknown {
  const file = buildStageProjectFile({
    stage: {
      name: 'Вправа 1',
      weaponClass: 'pcc',
      fieldSizeM: { x: DEFAULT_FIELD_WIDTH_M, y: DEFAULT_FIELD_HEIGHT_M },
      targets: [],
      props: [],
      fieldGroundCover3d: DEFAULT_FIELD_GROUND_COVER_3D,
      penaltyZoneSet: emptyPenaltyZoneSet(),
      activations: [],
      planDimensions: [],
      rangeDistanceSigns: [],
    },
    briefing: defaultStageBriefing(),
  })
  return JSON.parse(JSON.stringify(file)) as unknown
}

function row(over: Record<string, unknown> = {}) {
  return {
    id: 'row-1',
    title: 'Вправа 1',
    weapon_class: 'pcc',
    updated_at: '2026-08-01T10:00:00Z',
    payload: payload(),
    ...over,
  }
}

describe('normalizeUserStageTitle', () => {
  it('trims and collapses whitespace', () => {
    expect(normalizeUserStageTitle('  Стейдж   один \n')).toBe('Стейдж один')
  })

  it('caps length', () => {
    expect(normalizeUserStageTitle('a'.repeat(400))).toHaveLength(USER_STAGE_TITLE_MAX)
  })
})

describe('parseUserStageRow', () => {
  it('returns record for a valid row', () => {
    const record = parseUserStageRow(row())
    expect(record?.weaponClass).toBe('pcc')
    expect(record?.project.stage.name).toBe('Вправа 1')
  })

  it('rejects unknown weapon class', () => {
    expect(parseUserStageRow(row({ weapon_class: 'crossbow' }))).toBeNull()
  })

  it('rejects payload that is not a stage project file', () => {
    expect(parseUserStageRow(row({ payload: { format: 'other' } }))).toBeNull()
  })

  it('rejects missing payload', () => {
    expect(parseUserStageRow(row({ payload: null }))).toBeNull()
  })
})
