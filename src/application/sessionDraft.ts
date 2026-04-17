import type { StageBriefing } from '../domain/stageBriefing'
import { DEFAULT_FIELD_HEIGHT_M, DEFAULT_FIELD_WIDTH_M } from '../domain/field'
import { DEFAULT_FIELD_GROUND_COVER_3D } from '../domain/fieldGround3d'
import { emptyPenaltyZoneSet } from '../domain/penaltyZones'
import { defaultStageBriefing } from '../domain/stageBriefing'
import {
  buildStageProjectFile,
  parseStageProjectJson,
  serializeStageProject,
  STAGE_PROJECT_FORMAT,
  STAGE_PROJECT_VERSION,
  suggestedStageProjectFileName,
  type StageProjectSnapshot,
} from '../domain/stageProjectFile'
import { useBriefingStore } from './briefingStore'
import { useStageStore } from './stageStore'

/** Чернетка сцени + брифінгу в localStorage (між візитами, той самий контракт що *.stage.json). */
export const SESSION_DRAFT_STORAGE_KEY = 'stage-builder-session-draft-v1'

const DEBOUNCE_MS = 450

export const SESSION_DRAFT_META_VERSION = 1 as const

/** Знімок чернетки в `localStorage` (без обгортки format/version файлу вправи). */
export type SessionDraftEnvelope = {
  draftMetaVersion: typeof SESSION_DRAFT_META_VERSION
  savedAt: number
  stage: StageProjectSnapshot
  briefing: StageBriefing
}

const DEFAULT_STAGE_NAME_UA = 'Нова вправа'

function briefingDiffersFromDefault(b: StageBriefing): boolean {
  const d = defaultStageBriefing()
  if (b.exerciseType !== d.exerciseType) return true
  const keys: (keyof StageBriefing)[] = [
    'documentTitle',
    'targetsDescription',
    'recommendedShots',
    'allowedAmmo',
    'maxPoints',
    'startSignal',
    'readyCondition',
    'startPosition',
    'procedure',
    'safetyAngles',
  ]
  for (const k of keys) {
    if ((b[k] ?? '').trim() !== (d[k] ?? '').trim()) return true
  }
  return false
}

/** Чи відрізняється збережена чернетка від «чистого» старту редактора (щоб не показувати діалог дарма). */
export function isSessionDraftMeaningful(envelope: SessionDraftEnvelope): boolean {
  const { stage, briefing } = envelope
  const pz = stage.penaltyZoneSet ?? emptyPenaltyZoneSet()
  if (
    stage.targets.length > 0 ||
    stage.props.length > 0 ||
    pz.polygons.length > 0 ||
    (stage.activations?.length ?? 0) > 0
  )
    return true
  if (stage.name.trim() !== DEFAULT_STAGE_NAME_UA) return true
  if (stage.fieldSizeM.x !== DEFAULT_FIELD_WIDTH_M || stage.fieldSizeM.y !== DEFAULT_FIELD_HEIGHT_M) return true
  if (stage.weaponClass !== 'handgun') return true
  if (stage.fieldGroundCover3d !== DEFAULT_FIELD_GROUND_COVER_3D) return true
  return briefingDiffersFromDefault(briefing)
}

/** Прочитати чернетку з `localStorage` без запису в стор (для BL-001 share flow). */
export function peekSessionDraftEnvelope(): SessionDraftEnvelope | null {
  let raw: string | null
  try {
    raw = localStorage.getItem(SESSION_DRAFT_STORAGE_KEY)
  } catch {
    return null
  }
  if (!raw) return null
  let envelope: unknown
  try {
    envelope = JSON.parse(raw) as unknown
  } catch {
    return null
  }
  if (typeof envelope !== 'object' || envelope === null) return null
  const o = envelope as Record<string, unknown>
  if (o.draftMetaVersion !== SESSION_DRAFT_META_VERSION) return null
  if (typeof o.stage !== 'object' || o.stage === null) return null
  if (typeof o.briefing !== 'object' || o.briefing === null) return null
  return envelope as SessionDraftEnvelope
}

/** Завантажити файл `*.stage.json` з вмісту чернетки (перед відкриттям посилання на вправу). */
export function downloadSessionDraftEnvelopeAsFile(envelope: SessionDraftEnvelope): void {
  const stage: StageProjectSnapshot = {
    ...envelope.stage,
    penaltyZoneSet: envelope.stage.penaltyZoneSet ?? emptyPenaltyZoneSet(),
  }
  const file = buildStageProjectFile({
    stage,
    briefing: { ...envelope.briefing },
  })
  const json = serializeStageProject(file)
  const fname = suggestedStageProjectFileName(stage.name, envelope.briefing.documentTitle)
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fname
  a.click()
  URL.revokeObjectURL(url)
}

function briefingSnapshot(): StageBriefing {
  const s = useBriefingStore.getState()
  return {
    documentTitle: s.documentTitle,
    exerciseType: s.exerciseType,
    targetsDescription: s.targetsDescription,
    recommendedShots: s.recommendedShots,
    allowedAmmo: s.allowedAmmo,
    maxPoints: s.maxPoints,
    startSignal: s.startSignal,
    readyCondition: s.readyCondition,
    startPosition: s.startPosition,
    procedure: s.procedure,
    safetyAngles: s.safetyAngles,
  }
}

function persistDraftNow(): void {
  const {
    name,
    weaponClass,
    fieldSizeM,
    fieldGroundCover3d,
    targets,
    props,
    penaltyZoneSet,
    activations,
  } = useStageStore.getState()
  const envelope: SessionDraftEnvelope = {
    draftMetaVersion: SESSION_DRAFT_META_VERSION,
    savedAt: Date.now(),
    stage: {
      name,
      weaponClass,
      fieldSizeM,
      fieldGroundCover3d,
      targets,
      props,
      penaltyZoneSet,
      activations,
    },
    briefing: briefingSnapshot(),
  }
  try {
    localStorage.setItem(SESSION_DRAFT_STORAGE_KEY, JSON.stringify(envelope))
  } catch {
    /* приватний режим / квота */
  }
}

/**
 * Синхронно відновлює чернетку до першого рендеру (без «блимання» порожньої сцени).
 * Історія undo очищається після успішного відновлення.
 */
export function hydrateSessionDraft(): void {
  let raw: string | null
  try {
    raw = localStorage.getItem(SESSION_DRAFT_STORAGE_KEY)
  } catch {
    return
  }
  if (!raw) return
  let envelope: unknown
  try {
    envelope = JSON.parse(raw) as unknown
  } catch {
    return
  }
  if (typeof envelope !== 'object' || envelope === null) return
  const o = envelope as Record<string, unknown>
  if (o.draftMetaVersion !== SESSION_DRAFT_META_VERSION) return
  const wrapped = JSON.stringify({
    format: STAGE_PROJECT_FORMAT,
    version: STAGE_PROJECT_VERSION,
    stage: o.stage,
    briefing: o.briefing ?? {},
  })
  const res = parseStageProjectJson(wrapped)
  if (!res.ok) {
    try {
      localStorage.removeItem(SESSION_DRAFT_STORAGE_KEY)
    } catch {
      /* ignore */
    }
    return
  }

  const temporal = useStageStore.temporal.getState()
  temporal.pause()
  useStageStore.getState().replaceStageState(res.data.stage)
  useBriefingStore.getState().setBriefing(res.data.briefing)
  temporal.clear()
  temporal.resume()
}

/** Підписка з debounce: викликати з useEffect у корені застосунку. */
export function clearSessionDraftStorage(): void {
  try {
    localStorage.removeItem(SESSION_DRAFT_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

export function subscribeSessionDraftPersist(): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined
  const schedule = () => {
    clearTimeout(timer)
    timer = setTimeout(() => persistDraftNow(), DEBOUNCE_MS)
  }
  const u1 = useStageStore.subscribe(schedule)
  const u2 = useBriefingStore.subscribe(schedule)
  return () => {
    clearTimeout(timer)
    u1()
    u2()
  }
}
