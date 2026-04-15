import { describe, expect, it } from 'vitest'
import { DEFAULT_FIELD_HEIGHT_M, DEFAULT_FIELD_WIDTH_M } from '../domain/field'
import { DEFAULT_FIELD_GROUND_COVER_3D } from '../domain/fieldGround3d'
import { emptyPenaltyZoneSet } from '../domain/penaltyZones'
import { defaultStageBriefing } from '../domain/stageBriefing'
import { isSessionDraftMeaningful, type SessionDraftEnvelope } from './sessionDraft'

function baseEnvelope(): SessionDraftEnvelope {
  return {
    draftMetaVersion: 1,
    savedAt: Date.now(),
    stage: {
      name: 'Нова вправа',
      weaponClass: 'handgun',
      fieldSizeM: { x: DEFAULT_FIELD_WIDTH_M, y: DEFAULT_FIELD_HEIGHT_M },
      fieldGroundCover3d: DEFAULT_FIELD_GROUND_COVER_3D,
      targets: [],
      props: [],
      penaltyZoneSet: emptyPenaltyZoneSet(),
    },
    briefing: defaultStageBriefing(),
  }
}

describe('isSessionDraftMeaningful', () => {
  it('is false for default-like draft', () => {
    expect(isSessionDraftMeaningful(baseEnvelope())).toBe(false)
  })

  it('is true when a target exists', () => {
    const e = baseEnvelope()
    e.stage.targets = [
      {
        id: 'a',
        type: 'paperIpscTwoPostStand100',
        isNoShoot: false,
        position: { x: 1, y: 2 },
        rotationRad: 0,
      },
    ]
    expect(isSessionDraftMeaningful(e)).toBe(true)
  })

  it('is true when stage name differs', () => {
    const e = baseEnvelope()
    e.stage.name = 'Custom'
    expect(isSessionDraftMeaningful(e)).toBe(true)
  })
})
