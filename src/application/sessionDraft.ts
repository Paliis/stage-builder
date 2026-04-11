import type { StageBriefing } from '../domain/stageBriefing'
import {
  parseStageProjectJson,
  STAGE_PROJECT_FORMAT,
  STAGE_PROJECT_VERSION,
  type StageProjectSnapshot,
} from '../domain/stageProjectFile'
import { useBriefingStore } from './briefingStore'
import { useStageStore } from './stageStore'

/** Чернетка сцени + брифінгу в localStorage (між візитами, той самий контракт що *.stage.json). */
export const SESSION_DRAFT_STORAGE_KEY = 'stage-builder-session-draft-v1'

const DEBOUNCE_MS = 450

export const SESSION_DRAFT_META_VERSION = 1 as const

type SessionDraftEnvelope = {
  draftMetaVersion: typeof SESSION_DRAFT_META_VERSION
  savedAt: number
  stage: StageProjectSnapshot
  briefing: StageBriefing
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
