import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient'
import {
  buildStageProjectFile,
  parseStageProjectJson,
  serializeStageProject,
  STAGE_PROJECT_VERSION,
  type StageProjectFileV1,
  type StageProjectSnapshot,
} from '../domain/stageProjectFile'
import type { StageBriefing } from '../domain/stageBriefing'
import { WEAPON_CLASS_VALUES, type WeaponClass } from '../domain/weaponClass'

const TABLE = 'user_stages'
export const USER_STAGE_TITLE_MAX = 200
/** Скільки записів тягнемо в список бібліотеки за раз. */
export const USER_STAGES_PAGE_SIZE = 200

const WEAPON_CLASSES = new Set<WeaponClass>(WEAPON_CLASS_VALUES)

export type UserStageSummary = {
  id: string
  title: string
  weaponClass: WeaponClass
  updatedAt: string
}

export type UserStageRecord = UserStageSummary & {
  project: StageProjectFileV1
}

export type UserStageErrorKey =
  | 'notConfigured'
  | 'notSignedIn'
  | 'invalidTitle'
  | 'invalidPayload'
  | 'notFound'
  | 'network'

export type UserStageResult<T> =
  | { ok: true; data: T }
  | { ok: false; errorKey: UserStageErrorKey }

type UserStageRow = {
  id: string
  title: string
  weapon_class: string
  updated_at: string
  payload?: unknown
}

const SUMMARY_COLUMNS = 'id, title, weapon_class, updated_at'
const RECORD_COLUMNS = `${SUMMARY_COLUMNS}, payload`

export function normalizeUserStageTitle(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ').slice(0, USER_STAGE_TITLE_MAX)
}

function parseSummary(row: UserStageRow): UserStageSummary | null {
  if (typeof row.id !== 'string' || !row.id) return null
  if (!WEAPON_CLASSES.has(row.weapon_class as WeaponClass)) return null
  return {
    id: row.id,
    title: typeof row.title === 'string' ? row.title : '',
    weaponClass: row.weapon_class as WeaponClass,
    updatedAt: typeof row.updated_at === 'string' ? row.updated_at : '',
  }
}

/**
 * Payload у базі — той самий конверт, що й `.stage.json`, тому валідацію й міграцію
 * старих версій робить наявний парсер файлу.
 */
export function parseUserStageRow(row: UserStageRow): UserStageRecord | null {
  const summary = parseSummary(row)
  if (!summary) return null
  if (typeof row.payload !== 'object' || row.payload === null) return null
  let text: string
  try {
    text = JSON.stringify(row.payload)
  } catch {
    return null
  }
  const parsed = parseStageProjectJson(text)
  if (!parsed.ok) return null
  return { ...summary, project: parsed.data }
}

async function currentUserId(): Promise<string | null> {
  const { data } = await getSupabase().auth.getSession()
  return data.session?.user.id ?? null
}

export async function listUserStages(): Promise<UserStageResult<UserStageSummary[]>> {
  if (!isSupabaseConfigured()) return { ok: false, errorKey: 'notConfigured' }
  if (!(await currentUserId())) return { ok: false, errorKey: 'notSignedIn' }
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select(SUMMARY_COLUMNS)
    .order('updated_at', { ascending: false })
    .limit(USER_STAGES_PAGE_SIZE)
  if (error) return { ok: false, errorKey: 'network' }
  const rows = (data ?? []) as UserStageRow[]
  const out: UserStageSummary[] = []
  for (const row of rows) {
    const s = parseSummary(row)
    if (s) out.push(s)
  }
  return { ok: true, data: out }
}

export async function loadUserStage(id: string): Promise<UserStageResult<UserStageRecord>> {
  if (!isSupabaseConfigured()) return { ok: false, errorKey: 'notConfigured' }
  if (!(await currentUserId())) return { ok: false, errorKey: 'notSignedIn' }
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select(RECORD_COLUMNS)
    .eq('id', id)
    .maybeSingle()
  if (error) return { ok: false, errorKey: 'network' }
  if (!data) return { ok: false, errorKey: 'notFound' }
  const record = parseUserStageRow(data as UserStageRow)
  if (!record) return { ok: false, errorKey: 'invalidPayload' }
  return { ok: true, data: record }
}

export type SaveUserStageInput = {
  /** Порожній `id` — новий запис у бібліотеці. */
  id?: string | null
  title: string
  stage: StageProjectSnapshot
  briefing: StageBriefing
}

function buildPayload(input: SaveUserStageInput): StageProjectFileV1 {
  return buildStageProjectFile({ stage: input.stage, briefing: input.briefing })
}

/** Payload у колонці `jsonb` — прогін через серіалізатор гарантує ті самі дані, що й у файлі. */
function payloadJson(file: StageProjectFileV1): unknown {
  return JSON.parse(serializeStageProject(file)) as unknown
}

export async function saveUserStage(
  input: SaveUserStageInput,
): Promise<UserStageResult<UserStageSummary>> {
  if (!isSupabaseConfigured()) return { ok: false, errorKey: 'notConfigured' }
  const ownerId = await currentUserId()
  if (!ownerId) return { ok: false, errorKey: 'notSignedIn' }
  const title = normalizeUserStageTitle(input.title)
  if (!title) return { ok: false, errorKey: 'invalidTitle' }

  const file = buildPayload(input)
  const values = {
    title,
    weapon_class: input.stage.weaponClass,
    schema_version: STAGE_PROJECT_VERSION,
    payload: payloadJson(file),
  }

  const sb = getSupabase()
  const query = input.id
    ? sb.from(TABLE).update(values).eq('id', input.id)
    : sb.from(TABLE).insert({ ...values, owner_id: ownerId })
  const { data, error } = await query.select(SUMMARY_COLUMNS).maybeSingle()
  if (error) return { ok: false, errorKey: 'network' }
  if (!data) return { ok: false, errorKey: input.id ? 'notFound' : 'network' }
  const summary = parseSummary(data as UserStageRow)
  if (!summary) return { ok: false, errorKey: 'network' }
  return { ok: true, data: summary }
}

export async function renameUserStage(
  id: string,
  title: string,
): Promise<UserStageResult<UserStageSummary>> {
  if (!isSupabaseConfigured()) return { ok: false, errorKey: 'notConfigured' }
  if (!(await currentUserId())) return { ok: false, errorKey: 'notSignedIn' }
  const next = normalizeUserStageTitle(title)
  if (!next) return { ok: false, errorKey: 'invalidTitle' }
  const { data, error } = await getSupabase()
    .from(TABLE)
    .update({ title: next })
    .eq('id', id)
    .select(SUMMARY_COLUMNS)
    .maybeSingle()
  if (error) return { ok: false, errorKey: 'network' }
  if (!data) return { ok: false, errorKey: 'notFound' }
  const summary = parseSummary(data as UserStageRow)
  if (!summary) return { ok: false, errorKey: 'network' }
  return { ok: true, data: summary }
}

export async function deleteUserStage(id: string): Promise<UserStageResult<null>> {
  if (!isSupabaseConfigured()) return { ok: false, errorKey: 'notConfigured' }
  if (!(await currentUserId())) return { ok: false, errorKey: 'notSignedIn' }
  const { error } = await getSupabase().from(TABLE).delete().eq('id', id)
  if (error) return { ok: false, errorKey: 'network' }
  return { ok: true, data: null }
}
