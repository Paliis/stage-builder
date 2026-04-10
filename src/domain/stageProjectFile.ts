import { normalizeFieldGroundCover3d, type FieldGroundCover3d } from './fieldGround3d'
import { clampFieldDimensions, FIELD_SIZE_LIMITS } from './field'
import type {
  MetalPlateRectSideCm,
  Prop,
  PropType,
  StageCategory,
  Target,
  TargetType,
  Vec2,
} from './models'
import type { StageBriefing } from './stageBriefing'
import { defaultStageBriefing } from './stageBriefing'
import type { WeaponClass } from './weaponClass'
import { isSquareSteelPlateTargetType } from './targetSpecs'
import { ALL_TARGET_TYPES } from './weaponClass'

export const STAGE_PROJECT_FORMAT = 'stage-builder' as const
export const STAGE_PROJECT_VERSION = 1
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

function parseTarget(raw: unknown, idx: number): Target | null {
  if (typeof raw !== 'object' || raw === null) return null
  const o = raw as Record<string, unknown>
  const id = typeof o.id === 'string' ? o.id : ''
  const type = o.type
  if (typeof type !== 'string' || !TARGET_TYPE_SET.has(type as TargetType)) return null
  const isNoShoot = Boolean(o.isNoShoot)
  if (!isVec2(o.position)) return null
  const rotationRad = o.rotationRad
  if (typeof rotationRad !== 'number' || !Number.isFinite(rotationRad)) return null
  const tt = type as TargetType
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
  if (version !== STAGE_PROJECT_VERSION) return { ok: false, errorKey: 'invalidVersion' }

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
