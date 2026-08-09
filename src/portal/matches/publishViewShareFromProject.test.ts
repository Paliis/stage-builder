import { describe, expect, it, vi } from 'vitest'
import { emptyPenaltyZoneSet } from '../../domain/penaltyZones'
import { defaultStageBriefing } from '../../domain/stageBriefing'
import { buildStageProjectFile } from '../../domain/stageProjectFile'
import {
  buildLibraryLinkSnapshotMeta,
  isShareAlreadyLinked,
  nextMatchStageSortOrder,
  publishViewShareFromProject,
} from './publishViewShareFromProject'

describe('nextMatchStageSortOrder', () => {
  it('starts at 0 for an empty list', () => {
    expect(nextMatchStageSortOrder([])).toBe(0)
  })

  it('continues after the highest sort_order', () => {
    expect(nextMatchStageSortOrder([{ sort_order: 0 }, { sort_order: 2 }])).toBe(3)
  })
})

describe('isShareAlreadyLinked', () => {
  it('detects an existing share id', () => {
    expect(isShareAlreadyLinked([{ share_stage_id: 'sAbc' }], 'sAbc')).toBe(true)
    expect(isShareAlreadyLinked([{ share_stage_id: 'sAbc' }], 'sOther')).toBe(false)
  })
})

describe('buildLibraryLinkSnapshotMeta', () => {
  it('tags the link as coming from the user library', () => {
    expect(
      buildLibraryLinkSnapshotMeta({
        title: 'Alpha',
        userStageId: '11111111-1111-4111-8111-111111111111',
        nowIso: '2026-08-09T12:00:00.000Z',
      }),
    ).toEqual({
      title_snapshot: 'Alpha',
      linked_at: '2026-08-09T12:00:00.000Z',
      source: 'user_library',
      user_stage_id: '11111111-1111-4111-8111-111111111111',
    })
  })
})

describe('publishViewShareFromProject', () => {
  const project = buildStageProjectFile({
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
      rangeDistanceSigns: [],
    },
    briefing: defaultStageBriefing(),
  })

  it('returns id, url and shareGroupId on success', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          id: 'sTestShareId0000000001',
          url: 'https://example.com/v/sTestShareId0000000001',
          shareGroupId: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    )

    const res = await publishViewShareFromProject(project, 'uk', fetchImpl as typeof fetch)
    expect(res).toEqual({
      ok: true,
      id: 'sTestShareId0000000001',
      url: 'https://example.com/v/sTestShareId0000000001',
      shareGroupId: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
    })
    expect(fetchImpl).toHaveBeenCalledOnce()
    const init = fetchImpl.mock.calls[0]![1] as RequestInit
    const body = JSON.parse(String(init.body)) as Record<string, unknown>
    expect(body.mode).toBe('view')
    expect(body.locale).toBe('uk')
    expect(typeof body.idempotencyKey).toBe('string')
  })

  it('maps 429 to rateLimited', async () => {
    const fetchImpl = vi.fn(
      async () => new Response(JSON.stringify({ error: 'Too many' }), { status: 429 }),
    )
    const res = await publishViewShareFromProject(project, 'en', fetchImpl as typeof fetch)
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.error).toBe('rateLimited')
  })
})
