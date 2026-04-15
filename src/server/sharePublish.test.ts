import { describe, expect, it } from 'vitest'
import { emptyPenaltyZoneSet } from '../domain/penaltyZones'
import { defaultStageBriefing } from '../domain/stageBriefing'
import {
  buildStageProjectFile,
  serializeStageProject,
  STAGE_PROJECT_FORMAT,
  STAGE_PROJECT_VERSION,
} from '../domain/stageProjectFile'
import {
  checkPublishRateLimit,
  normalizePublishBody,
  resetPublishRateLimitForTests,
} from './sharePublish'

describe('normalizePublishBody', () => {
  it('accepts valid view payload', () => {
    const briefing = defaultStageBriefing()
    const file = buildStageProjectFile({
      stage: {
        name: 'T',
        weaponClass: 'handgun',
        fieldSizeM: { x: 30, y: 40 },
        fieldGroundCover3d: 'grass',
        targets: [],
        props: [],
        penaltyZoneSet: emptyPenaltyZoneSet(),
      },
      briefing,
    })
    const raw = JSON.parse(serializeStageProject(file)) as Record<string, unknown>
    const body = { mode: 'view' as const, ...raw }
    const r = normalizePublishBody(body)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.mode).toBe('view')
      expect(r.file.version).toBe(STAGE_PROJECT_VERSION)
      expect(r.file.format).toBe(STAGE_PROJECT_FORMAT)
    }
  })

  it('rejects missing mode', () => {
    const r = normalizePublishBody({ format: STAGE_PROJECT_FORMAT, version: STAGE_PROJECT_VERSION })
    expect(r.ok).toBe(false)
  })
})

describe('checkPublishRateLimit', () => {
  it('allows then blocks after threshold', () => {
    resetPublishRateLimitForTests()
    const ip = '10.0.0.1'
    for (let i = 0; i < 50; i++) {
      expect(checkPublishRateLimit(ip)).toBe(true)
    }
    expect(checkPublishRateLimit(ip)).toBe(false)
  })
})
