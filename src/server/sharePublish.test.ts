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
  parseOptionalShareGroupId,
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
        activations: [],
        planDimensions: [],
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
      expect(r.shareGroupId).toBeNull()
    }
  })

  it('rejects invalid shareGroupId', () => {
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
        activations: [],
        planDimensions: [],
      },
      briefing,
    })
    const raw = JSON.parse(serializeStageProject(file)) as Record<string, unknown>
    const body = { mode: 'view' as const, shareGroupId: 'not-a-uuid', ...raw }
    const r = normalizePublishBody(body)
    expect(r.ok).toBe(false)
  })

  it('accepts optional shareGroupId and strips it from stage parse', () => {
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
        activations: [],
        planDimensions: [],
      },
      briefing,
    })
    const raw = JSON.parse(serializeStageProject(file)) as Record<string, unknown>
    const gid = '550e8400-e29b-41d4-a716-446655440000'
    const r = normalizePublishBody({ mode: 'view', shareGroupId: gid, ...raw })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.shareGroupId).toBe(gid)
    }
  })
})

describe('parseOptionalShareGroupId', () => {
  it('returns null for absent or blank', () => {
    expect(parseOptionalShareGroupId(undefined)).toBeNull()
    expect(parseOptionalShareGroupId('  ')).toBeNull()
  })
  it('returns lowercased uuid', () => {
    expect(parseOptionalShareGroupId('550E8400-E29B-41D4-A716-446655440000')).toBe(
      '550e8400-e29b-41d4-a716-446655440000',
    )
  })
  it('returns marker for invalid', () => {
    expect(parseOptionalShareGroupId('xyz')).toBe('__invalid__')
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
