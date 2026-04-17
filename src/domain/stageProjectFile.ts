import { normalizeFieldGroundCover3d, type FieldGroundCover3d } from './fieldGround3d'
import { clampFieldDimensions, FIELD_SIZE_LIMITS } from './field'
import type {
  ActivationEdge,
  MetalPlateRectSideCm,
  Prop,
  PropType,
  StageCategory,
  StageEntityKind,
  Target,
  TargetType,
  Vec2,
} from './models'
import type { StageBriefing } from './stageBriefing'
import { defaultStageBriefing } from './stageBriefing'
import type { WeaponClass } from './weaponClass'
import { isSquareSteelPlateTargetType } from './targetSpecs'
import { ALL_TARGET_TYPES } from './weaponClass'
import {
  emptyPenaltyZoneSet,
  type PenaltyPolygonData,
  type PenaltyRingData,
  type PenaltyZoneSet,
} from './penaltyZones'

export const STAGE_PROJECT_FORMAT = 'stage-builder' as const
/** 1 — початковий формат; 2 — `penaltyZoneSet`; 3 — `activations` (BL-004). */
export const STAGE_PROJECT_VERSION = 3
/** Старі файли залишаються валідними при парсингу. */
export const STAGE_PROJECT_VERSION_MIN = 1
export const STAGE_PROJECT_FILE_EXTENSION = '.stage.json'

const WEAPON_CLASSES = new Set<WeaponClass>(['handgun', 'rifle', 'shotgun'])
const TARGET_TYPE_SET = new Set<TargetType>(ALL_TARGET_TYPES)
const PROP_TYPES: PropType[] = [
  'door',
  'faultLine',
  'shield',
  'shieldDouble',
  'shieldWithPort',
  'shieldPortLow',
  'shieldPortHigh',
  'shieldPortSlanted',
  'shieldWithPortDoor',
  'barrel',
  'tireStack',
  'woodTable',
  'woodChair',
  'weaponRackPyramid',
  'seesaw',
  'movingPlatform',
  'cooperTunnel',
  'startPosition',
]
const PROP_TYPE_SET = new Set(PROP_TYPES)
const STAGE_CATEGORIES = new Set<StageCategory>(['short', 'medium', 'long'])

function newEntityId(): string {
  if (globalThis.isSecureContext && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `sb-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`
}

function isVec2(v: unknown): v is Vec2 {
  if (typeof v !== 'object' || v === null) return false
  const o = v as Vec2
  return (
    typeof o.x === 'number' &&
    Number.isFinite(o.x) &&
    typeof o.y === 'number' &&
    Number.isFinite(o.y)
  )
}

function ensureUniqueTargetIds(targets: Target[]): Target[] {
  const seen = new Set<string>()
  return targets.map((t) => {
    let id = typeof t.id === 'string' && t.id ? t.id : newEntityId()
    while (seen.has(id)) id = newEntityId()
    seen.add(id)
    return { ...t, id }
  })
}

function ensureUniquePropIds(props: Prop[]): Prop[] {
  const seen = new Set<string>()
  return props.map((p) => {
    let id = typeof p.id === 'string' && p.id ? p.id : newEntityId()
    while (seen.has(id)) id = newEntityId()
    seen.add(id)
    return { ...p, id }
  })
}

export type StageProjectSnapshot = {
  name: string
  weaponClass: WeaponClass
  fieldSizeM: Vec2
  targets: Target[]
  props: Prop[]
  /** Покриття площадки в 3D; для старих файлів — дефолт при парсингу. */
  fieldGroundCover3d: FieldGroundCover3d
  /**
   * Замкнені контури штрафних зон (BL-019). Для `version === 1` у файлі відсутнє — при парсингу `emptyPenaltyZoneSet()`.
   */
  penaltyZoneSet: PenaltyZoneSet
  /** Зв’язки активації (BL-004). Для `version < 3` при парсингу — `[]`. */
  activations: ActivationEdge[]
}

export type StageProjectFileV1 = {
  format: typeof STAGE_PROJECT_FORMAT
  version: number
  stage: StageProjectSnapshot
  briefing: StageBriefing
}

function parseMetalRectSideCm(raw: unknown): MetalPlateRectSideCm | undefined {
  if (raw === 15 || raw === 20 || raw === 30) return raw
  return undefined
}

/** Старий ідентифікатор до розділення на три висоти; файли з ним відкриваються як «низ 1 м». */
const LEGACY_PAPER_IPSC_TWO_POST = 'paperIpscTwoPost'

/** Колись існували одностійкові паперові типи — мапимо на відповідний варіант з низом лиця ~1 м. */
function migrateLegacySinglePostPaperType(type: string): TargetType | undefined {
  if (type === 'paperIpsc') return 'paperIpscTwoPostStand100'
  if (type === 'paperA4') return 'paperA4TwoPostStand100'
  if (type === 'paperMiniIpsc') return 'paperMiniIpscTwoPostStand100'
  return undefined
}

function parseTarget(raw: unknown, idx: number): Target | null {
  if (typeof raw !== 'object' || raw === null) return null
  const o = raw as Record<string, unknown>
  const id = typeof o.id === 'string' ? o.id : ''
  const type = o.type
  if (typeof type !== 'string') return null
  const migrated = migrateLegacySinglePostPaperType(type)
  const normalizedType = (
    type === LEGACY_PAPER_IPSC_TWO_POST
      ? ('paperIpscTwoPostStand100' as const)
      : migrated ?? (type as TargetType)
  ) as TargetType
  if (!TARGET_TYPE_SET.has(normalizedType)) return null
  const isNoShoot = Boolean(o.isNoShoot)
  if (!isVec2(o.position)) return null
  const rotationRad = o.rotationRad
  if (typeof rotationRad !== 'number' || !Number.isFinite(rotationRad)) return null
  const tt = normalizedType
  const metalRectSideCm = isSquareSteelPlateTargetType(tt)
    ? parseMetalRectSideCm(o.metalRectSideCm)
    : undefined
  return {
    id: id || `t-${idx}`,
    type: tt,
    isNoShoot,
    position: o.position,
    rotationRad,
    ...(metalRectSideCm !== undefined ? { metalRectSideCm } : {}),
  }
}

function parsePenaltyRing(raw: unknown, idx: string): PenaltyRingData | null {
  if (typeof raw !== 'object' || raw === null) return null
  const o = raw as Record<string, unknown>
  const id = typeof o.id === 'string' && o.id ? o.id : `ring-${idx}`
  const closed = Boolean(o.closed)
  if (!closed) return null
  const verts = o.vertices
  if (!Array.isArray(verts)) return null
  const vertices: Vec2[] = []
  for (let i = 0; i < verts.length; i++) {
    if (!isVec2(verts[i])) return null
    vertices.push(verts[i] as Vec2)
  }
  if (vertices.length < 3) return null
  return { id, vertices, closed: true }
}

function parsePenaltyPolygon(raw: unknown, idx: number): PenaltyPolygonData | null {
  if (typeof raw !== 'object' || raw === null) return null
  const o = raw as Record<string, unknown>
  const id = typeof o.id === 'string' && o.id ? o.id : `pz-${idx}`
  const outerRaw = o.outer
  const outer = parsePenaltyRing(outerRaw, `o-${idx}`)
  if (!outer || !outer.closed) return null
  const holesRaw = o.holes
  const holes: PenaltyRingData[] = []
  if (holesRaw !== undefined) {
    if (!Array.isArray(holesRaw)) return null
    for (let h = 0; h < holesRaw.length; h++) {
      const ring = parsePenaltyRing(holesRaw[h], `h-${idx}-${h}`)
      if (!ring || !ring.closed) return null
      holes.push(ring)
    }
  }
  return { id, outer, holes }
}

function parsePenaltyZoneSet(raw: unknown): PenaltyZoneSet | null {
  if (raw === undefined || raw === null) return emptyPenaltyZoneSet()
  if (typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const polys = o.polygons
  if (!Array.isArray(polys)) return null
  const polygons: PenaltyPolygonData[] = []
  for (let i = 0; i < polys.length; i++) {
    const p = parsePenaltyPolygon(polys[i], i)
    if (!p) return null
    polygons.push(p)
  }
  return { polygons }
}

function parseProp(raw: unknown, idx: number): Prop | null {
  if (typeof raw !== 'object' || raw === null) return null
  const o = raw as Record<string, unknown>
  const id = typeof o.id === 'string' ? o.id : ''
  const type = o.type
  if (typeof type !== 'string' || !PROP_TYPE_SET.has(type as PropType)) return null
  if (!isVec2(o.position) || !isVec2(o.sizeM)) return null
  const rotationRad = o.rotationRad
  if (typeof rotationRad !== 'number' || !Number.isFinite(rotationRad)) return null
  return {
    id: id || `p-${idx}`,
    type: type as PropType,
    sizeM: o.sizeM,
    position: o.position,
    rotationRad,
  }
}

function parseStageEntityRef(raw: unknown): { kind: StageEntityKind; id: string } | null {
  if (typeof raw !== 'object' || raw === null) return null
  const o = raw as Record<string, unknown>
  const kind = o.kind
  const id = o.id
  if (kind !== 'target' && kind !== 'prop') return null
  if (typeof id !== 'string' || !id) return null
  return { kind, id }
}

function ensureUniqueActivationIds(edges: ActivationEdge[]): ActivationEdge[] {
  const seen = new Set<string>()
  return edges.map((e) => {
    let id = e.id
    if (!id || seen.has(id)) id = newEntityId()
    while (seen.has(id)) id = newEntityId()
    seen.add(id)
    return { ...e, id }
  })
}

function parseActivationEdge(raw: unknown, idx: number): ActivationEdge | null {
  if (typeof raw !== 'object' || raw === null) return null
  const o = raw as Record<string, unknown>
  const from = parseStageEntityRef(o.from)
  const to = parseStageEntityRef(o.to)
  if (!from || !to) return null
  const id = typeof o.id === 'string' && o.id ? o.id : `act-${idx}`
  return { id, from, to }
}

function parseActivations(raw: unknown): ActivationEdge[] {
  if (raw === undefined || raw === null) return []
  if (!Array.isArray(raw)) return []
  const out: ActivationEdge[] = []
  for (let i = 0; i < raw.length; i++) {
    const e = parseActivationEdge(raw[i], i)
    if (e) out.push(e)
  }
  return ensureUniqueActivationIds(out)
}

function parseBriefing(raw: unknown): StageBriefing {
  const d = defaultStageBriefing()
  if (typeof raw !== 'object' || raw === null) return d
  const o = raw as Record<string, unknown>
  const exerciseType = o.exerciseType
  const ex: StageCategory =
    typeof exerciseType === 'string' && STAGE_CATEGORIES.has(exerciseType as StageCategory)
      ? (exerciseType as StageCategory)
      : d.exerciseType
  const str = (k: keyof StageBriefing): string =>
    typeof o[k] === 'string' ? (o[k] as string) : d[k]
  return {
    documentTitle: str('documentTitle'),
    exerciseType: ex,
    targetsDescription: str('targetsDescription'),
    recommendedShots: str('recommendedShots'),
    allowedAmmo: str('allowedAmmo'),
    maxPoints: str('maxPoints'),
    startSignal: str('startSignal'),
    readyCondition: str('readyCondition'),
    startPosition: str('startPosition'),
    procedure: str('procedure'),
    safetyAngles: str('safetyAngles'),
  }
}

function clonePenaltyZoneSet(pz: PenaltyZoneSet): PenaltyZoneSet {
  return {
    polygons: pz.polygons.map((poly) => ({
      id: poly.id,
      outer: {
        id: poly.outer.id,
        closed: poly.outer.closed,
        vertices: poly.outer.vertices.map((v) => ({ ...v })),
      },
      holes: poly.holes.map((h) => ({
        id: h.id,
        closed: h.closed,
        vertices: h.vertices.map((v) => ({ ...v })),
      })),
    })),
  }
}

export function buildStageProjectFile(snapshot: {
  stage: StageProjectSnapshot
  briefing: StageBriefing
}): StageProjectFileV1 {
  return {
    format: STAGE_PROJECT_FORMAT,
    version: STAGE_PROJECT_VERSION,
    stage: {
      name: snapshot.stage.name,
      weaponClass: snapshot.stage.weaponClass,
      fieldSizeM: { ...snapshot.stage.fieldSizeM },
      targets: snapshot.stage.targets.map((t) => ({ ...t })),
      props: snapshot.stage.props.map((p) => ({ ...p })),
      fieldGroundCover3d: snapshot.stage.fieldGroundCover3d,
      penaltyZoneSet: clonePenaltyZoneSet(snapshot.stage.penaltyZoneSet),
      activations: snapshot.stage.activations.map((e) => ({
        id: e.id,
        from: { ...e.from },
        to: { ...e.to },
      })),
    },
    briefing: { ...snapshot.briefing },
  }
}

export type ParseStageProjectResult =
  | { ok: true; data: StageProjectFileV1 }
  | { ok: false; errorKey: 'invalidJson' | 'invalidShape' | 'invalidVersion' }

export function parseStageProjectJson(text: string): ParseStageProjectResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(text) as unknown
  } catch {
    return { ok: false, errorKey: 'invalidJson' }
  }
  if (typeof parsed !== 'object' || parsed === null) return { ok: false, errorKey: 'invalidShape' }
  const root = parsed as Record<string, unknown>
  if (root.format !== STAGE_PROJECT_FORMAT) return { ok: false, errorKey: 'invalidShape' }
  const version = root.version
  if (
    typeof version !== 'number' ||
    version < STAGE_PROJECT_VERSION_MIN ||
    version > STAGE_PROJECT_VERSION
  ) {
    return { ok: false, errorKey: 'invalidVersion' }
  }

  const st = root.stage
  if (typeof st !== 'object' || st === null) return { ok: false, errorKey: 'invalidShape' }
  const stageObj = st as Record<string, unknown>

  const name = typeof stageObj.name === 'string' ? stageObj.name.slice(0, 200) : ''
  const wc = stageObj.weaponClass
  if (typeof wc !== 'string' || !WEAPON_CLASSES.has(wc as WeaponClass))
    return { ok: false, errorKey: 'invalidShape' }
  if (!isVec2(stageObj.fieldSizeM)) return { ok: false, errorKey: 'invalidShape' }

  const rawTargets = stageObj.targets
  if (!Array.isArray(rawTargets)) return { ok: false, errorKey: 'invalidShape' }
  const targets: Target[] = []
  for (let i = 0; i < rawTargets.length; i++) {
    const t = parseTarget(rawTargets[i], i)
    if (!t) return { ok: false, errorKey: 'invalidShape' }
    targets.push(t)
  }

  const rawProps = stageObj.props
  if (!Array.isArray(rawProps)) return { ok: false, errorKey: 'invalidShape' }
  const props: Prop[] = []
  for (let i = 0; i < rawProps.length; i++) {
    const p = parseProp(rawProps[i], i)
    if (!p) return { ok: false, errorKey: 'invalidShape' }
    props.push(p)
  }

  const fw = clampFieldDimensions(stageObj.fieldSizeM.x, stageObj.fieldSizeM.y)
  if (
    fw.x < FIELD_SIZE_LIMITS.minM ||
    fw.x > FIELD_SIZE_LIMITS.maxWidthM ||
    fw.y < FIELD_SIZE_LIMITS.minM ||
    fw.y > FIELD_SIZE_LIMITS.maxHeightM
  ) {
    return { ok: false, errorKey: 'invalidShape' }
  }

  const fieldGroundCover3d = normalizeFieldGroundCover3d(stageObj.fieldGroundCover3d)

  let penaltyZoneSet: PenaltyZoneSet = emptyPenaltyZoneSet()
  if (version >= 2) {
    const pz = parsePenaltyZoneSet(stageObj.penaltyZoneSet)
    if (pz === null) return { ok: false, errorKey: 'invalidShape' }
    penaltyZoneSet = pz
  }

  let activations: ActivationEdge[] = []
  if (version >= 3) {
    activations = parseActivations(stageObj.activations)
  }

  const data: StageProjectFileV1 = {
    format: STAGE_PROJECT_FORMAT,
    version: STAGE_PROJECT_VERSION,
    stage: {
      name: name || 'Нова вправа',
      weaponClass: wc as WeaponClass,
      fieldSizeM: fw,
      targets: ensureUniqueTargetIds(targets),
      props: ensureUniquePropIds(props),
      fieldGroundCover3d,
      penaltyZoneSet,
      activations,
    },
    briefing: parseBriefing(root.briefing),
  }
  return { ok: true, data }
}

export function serializeStageProject(file: StageProjectFileV1): string {
  return `${JSON.stringify(file, null, 2)}\n`
}

/** Ім’я файла без заборонених символів. */
export function suggestedStageProjectFileName(stageName: string, documentTitle: string): string {
  const base = (stageName.trim() || documentTitle.trim() || 'stage')
    .replace(/[\\/:*?"<>|]/g, '')
    .slice(0, 80)
  return `${base || 'stage'}${STAGE_PROJECT_FILE_EXTENSION}`
}
