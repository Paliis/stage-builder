import { describe, expect, it } from 'vitest'
import { unzipSync, strFromU8 } from 'fflate'

import {
  buildPortalPractiscoreZip,
  normalizePowerFactor,
  paperTargetsForPractiscoreStage,
  snapshotTitle,
  splitDisplayName,
} from './buildPortalPractiscoreZip.ts'

describe('buildPortalPractiscoreZip', () => {
  it('rejects export when no stage links', () => {
    const r = buildPortalPractiscoreZip({
      match: { title: 'T', starts_at: new Date().toISOString(), ps_match_type: null, ps_match_subtype: null, ps_match_level: null },
      squads: [{ id: 'a', sort_order: 0 }],
      registrations: [],
      displayNameByUserId: new Map(),
      stageLinks: [],
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('no_stages')
  })

  it('builds ZIP with two JSON roots and honours stages/shooters', () => {
    const r = buildPortalPractiscoreZip({
      match: {
        title: 'Cup Test',
        starts_at: '2026-05-02T12:00:00.000Z',
        ps_match_type: null,
        ps_match_subtype: null,
        ps_match_level: null,
      },
      squads: [
        { id: 'sq1', sort_order: 0 },
        { id: 'sq2', sort_order: 1 },
      ],
      registrations: [
        {
          squad_id: 'sq2',
          competitor_user_id: 'u1',
          division: 'Standard',
          classification_grade: 'B',
          power_factor: 'major',
          created_at: '2026-04-01T00:00:00.000Z',
        },
      ],
      displayNameByUserId: new Map([['u1', 'Oleksandr Kovtun']]),
      stageLinks: [
        { sort_order: 1, snapshot_meta: { title_snapshot: '  Alpha stage  ' } },
        { sort_order: 0, snapshot_meta: {} },
      ],
    })

    expect(r.ok).toBe(true)
    if (!r.ok) throw new Error('expected ok')
    expect(r.manifest.stageCount).toBe(2)
    expect(r.manifest.shooterCount).toBe(1)

    const files = unzipSync(r.bytes)
    expect(Object.keys(files).sort()).toEqual(['match_def.json', 'match_scores.json'])

    const def = JSON.parse(strFromU8(files['match_def.json']!)) as {
      match_id: string
      match_name: string
      match_date: string
      match_stages: { stage_number: number; stage_name: string }[]
      match_shooters: { sh_fn: string; sh_ln: string; sh_sqd: number; sh_pf: string; sh_dvp: string }[]
    }

    expect(def.match_name).toBe('Cup Test')
    expect(def.match_date).toBe('2026-05-02')
    expect(def.match_stages.map((x) => x.stage_name)).toEqual(['Stage 1', 'Alpha stage'])
    expect(def.match_shooters.length).toBe(1)
    expect(def.match_shooters[0]!.sh_fn).toBe('Oleksandr')
    expect(def.match_shooters[0]!.sh_ln).toBe('Kovtun')
    expect(def.match_shooters[0]!.sh_sqd).toBe(1)
    expect(def.match_shooters[0]!.sh_pf).toBe('MAJOR')
    expect(def.match_shooters[0]!.sh_dvp).toBe('Standard')
    expect('match_level' in def).toBe(false)

    const scores = JSON.parse(strFromU8(files['match_scores.json']!)) as {
      match_id: string
      match_scores: unknown[]
    }
    expect(scores.match_id).toBe(def.match_id)
    expect(Array.isArray(scores.match_scores)).toBe(true)
    expect(scores.match_scores).toHaveLength(0)
  })

  it('overrides PSC popper/paper fields when psc_metrics is set per link', () => {
    const r = buildPortalPractiscoreZip({
      match: {
        title: 'Metrics',
        starts_at: '2026-05-02T12:00:00.000Z',
        ps_match_type: null,
        ps_match_subtype: null,
        ps_match_level: null,
      },
      squads: [{ id: 'a', sort_order: 0 }],
      registrations: [],
      displayNameByUserId: new Map(),
      stageLinks: [
        {
          sort_order: 0,
          snapshot_meta: null,
          psc_metrics: { stage_poppers: 4, stage_numtargs: 3, stage_noshoots: true },
        },
        { sort_order: 1, snapshot_meta: null },
      ],
    })
    expect(r.ok).toBe(true)
    if (!r.ok) throw new Error('expected ok')

    const def = JSON.parse(strFromU8(unzipSync(r.bytes)['match_def.json']!)) as {
      match_stages: {
        stage_poppers: number
        stage_numtargs: number
        stage_noshoots: boolean
        stage_poppers_maxnpms: number
        stage_targets?: { target_number: number; target_reqshots: number }[]
        stage_tppoints?: number
      }[]
    }

    expect(def.match_stages[0]).toMatchObject({
      stage_poppers: 4,
      stage_numtargs: 0,
      stage_noshoots: true,
    })
    expect(def.match_stages[0]!.stage_targets).toHaveLength(3)
    expect(def.match_stages[0]!.stage_targets![0]).toEqual({ target_number: 1, target_reqshots: 2 })
    expect(def.match_stages[0]!.stage_tppoints).toBe(50)
    expect(def.match_stages[0]!.stage_poppers_maxnpms).toBe(0)
    expect(def.match_stages[1]).toMatchObject({
      stage_poppers: 8,
      stage_numtargs: 0,
      stage_noshoots: true,
    })
    expect(def.match_stages[1]!.stage_targets).toBeUndefined()
    expect(def.match_stages[1]!.stage_poppers_maxnpms).toBe(0)
  })

  it('maps paper counts to PSC stage_targets (two hits per cardboard)', () => {
    expect(paperTargetsForPractiscoreStage(2)).toEqual([
      { target_number: 1, target_reqshots: 2 },
      { target_number: 2, target_reqshots: 2 },
    ])
    expect(paperTargetsForPractiscoreStage(12)).toHaveLength(12)
    expect(paperTargetsForPractiscoreStage(0)).toEqual([])
  })

  it('maps prematch squads to high PSC labels (≥11); main keeps 1..n', () => {
    const r = buildPortalPractiscoreZip({
      match: {
        title: 'M',
        starts_at: '2026-05-02T12:00:00.000Z',
        ps_match_type: null,
        ps_match_subtype: null,
        ps_match_level: null,
      },
      squads: [
        { id: 'pr0', sort_order: 0, squad_phase: 'prematch' },
        { id: 'ma0', sort_order: 0, squad_phase: 'main' },
        { id: 'ma1', sort_order: 1, squad_phase: 'main' },
      ],
      registrations: [
        {
          squad_id: 'ma1',
          competitor_user_id: 'mainU',
          division: 'Modified',
          classification_grade: 'U',
          power_factor: 'MINOR',
          created_at: '2026-04-03T12:00:00.000Z',
        },
        {
          squad_id: 'pr0',
          competitor_user_id: 'preU',
          division: 'Modified',
          classification_grade: 'U',
          power_factor: 'MINOR',
          created_at: '2026-04-02T12:00:00.000Z',
        },
        {
          squad_id: 'unknown-squad',
          competitor_user_id: 'fallbackU',
          division: 'Modified',
          classification_grade: 'U',
          power_factor: 'MINOR',
          created_at: '2026-04-04T12:00:00.000Z',
        },
      ],
      displayNameByUserId: new Map([
        ['mainU', 'Oleksandr Kovtun'],
        ['preU', 'Jane Smith'],
        ['fallbackU', 'Ann Core'],
      ]),
      stageLinks: [{ sort_order: 0, snapshot_meta: null }],
    })
    expect(r.ok).toBe(true)
    if (!r.ok) throw new Error('expected ok')
    const def = JSON.parse(strFromU8(unzipSync(r.bytes)['match_def.json']!)) as {
      match_shooters: { sh_fn: string; sh_sqd: number }[]
    }
    const byFn = Object.fromEntries(def.match_shooters.map((s) => [s.sh_fn, s.sh_sqd]))
    expect(byFn['Oleksandr']).toBe(1)
    expect(byFn['Jane']).toBe(11 - 1)
    expect(byFn['Ann']).toBe(11 - 1)
  })

  it('prefers pscShooterNameByUserId over display_name for sh_fn / sh_ln', () => {
    const uid = 'aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee'
    const r = buildPortalPractiscoreZip({
      match: {
        title: 'T',
        starts_at: '2026-01-01T12:00:00.000Z',
        ps_match_type: null,
        ps_match_subtype: null,
        ps_match_level: null,
      },
      squads: [{ id: 'sq', sort_order: 0 }],
      registrations: [
        {
          squad_id: 'sq',
          competitor_user_id: uid,
          division: 'Open',
          classification_grade: '',
          power_factor: null,
          created_at: '2026-01-01T12:00:00.000Z',
        },
      ],
      displayNameByUserId: new Map([[uid, 'Ignored Display']])),
      pscShooterNameByUserId: new Map([[uid, { firstName: 'Тарас', lastName: 'Іваненко' }]]),
      stageLinks: [{ sort_order: 0, snapshot_meta: { title_snapshot: 'S1' } }],
    })
    expect(r.ok).toBe(true)
    if (!r.ok) throw new Error('expected ok')
    const def = JSON.parse(strFromU8(unzipSync(r.bytes)['match_def.json']!)) as {
      match_shooters: { sh_fn: string; sh_ln: string }[]
    }
    expect(def.match_shooters[0].sh_fn).toBe('Тарас')
    expect(def.match_shooters[0].sh_ln).toBe('Іваненко')
  })

  it('writes match_def.match_level when ps_match_level is set (PractiScore L1–L5)', () => {
    const r = buildPortalPractiscoreZip({
      match: {
        title: 'Lvl',
        starts_at: '2026-05-02T12:00:00.000Z',
        ps_match_type: null,
        ps_match_subtype: null,
        ps_match_level: 'L3',
      },
      squads: [{ id: 'a', sort_order: 0 }],
      registrations: [],
      displayNameByUserId: new Map(),
      stageLinks: [{ sort_order: 0, snapshot_meta: { title_snapshot: 'S1' } }],
    })
    expect(r.ok).toBe(true)
    if (!r.ok) throw new Error('expected ok')
    const def = JSON.parse(strFromU8(unzipSync(r.bytes)['match_def.json']!)) as { match_level?: string }
    expect(def.match_level).toBe('L3')
  })
})

describe('helpers', () => {
  it('snapshotTitle falls back by index', () => {
    expect(snapshotTitle(null, 2)).toBe('Stage 3')
    expect(snapshotTitle({ title_snapshot: '' }, 0)).toBe('Stage 1')
  })

  it('splitDisplayName', () => {
    expect(splitDisplayName('A')).toEqual({ sh_fn: 'A', sh_ln: '' })
    expect(splitDisplayName('Ann B. Core')).toEqual({ sh_fn: 'Ann', sh_ln: 'B. Core' })
    expect(splitDisplayName('Oleksandr Kovtun')).toEqual({ sh_fn: 'Oleksandr', sh_ln: 'Kovtun' })
    expect(splitDisplayName('Іваненко Тарас')).toEqual({ sh_ln: 'Іваненко', sh_fn: 'Тарас' })
    expect(splitDisplayName('Іваненко, Тарас')).toEqual({ sh_ln: 'Іваненко', sh_fn: 'Тарас' })
    expect(splitDisplayName('Іваненко Тарас (Скв. 1 №1)')).toEqual({ sh_ln: 'Іваненко', sh_fn: 'Тарас' })
  })

  it('normalizePowerFactor', () => {
    expect(normalizePowerFactor('minor')).toBe('MINOR')
    expect(normalizePowerFactor(null)).toBe('MINOR')
  })
})
