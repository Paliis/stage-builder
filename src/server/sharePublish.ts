import { randomBytes } from 'node:crypto'
import {
  buildStageProjectFile,
  parseStageProjectJson,
  type StageProjectFileV1,
} from '../domain/stageProjectFile'

/** Slightly above DB constraint (524288) to allow JSON wrapper. */
export const MAX_PUBLISH_BODY_BYTES = 600_000

/** Product target from BL-001 — best-effort per warm instance (serverless). */
export const PUBLISHES_PER_DAY_PER_IP = 50

type RateBucket = { day: string; count: number }

const rateBuckets = new Map<string, RateBucket>()

export function resetPublishRateLimitForTests(): void {
  rateBuckets.clear()
}

export function checkPublishRateLimit(ip: string): boolean {
  const day = new Date().toISOString().slice(0, 10)
  const b = rateBuckets.get(ip)
  if (!b || b.day !== day) {
    rateBuckets.set(ip, { day, count: 1 })
    return true
  }
  if (b.count >= PUBLISHES_PER_DAY_PER_IP) return false
  b.count += 1
  return true
}

/** URL-safe public id (prefix `s` + alphanumeric). */
export function newShareId(): string {
  const b = randomBytes(18)
  const s = b.toString('base64url').replace(/[^a-zA-Z0-9]/g, '')
  return `s${s.slice(0, 24)}`
}

const UUID_V4_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/** Optional body field: reuse this logical group for the new `shared_stages` row (Phase C / match refresh). */
export function parseOptionalShareGroupId(raw: unknown): string | null {
  if (raw === undefined || raw === null) return null
  if (typeof raw !== 'string') return '__invalid__'
  const t = raw.trim()
  if (t === '') return null
  return UUID_V4_RE.test(t) ? t.toLowerCase() : '__invalid__'
}

export type NormalizePublishResult =
  | {
      ok: true
      file: StageProjectFileV1
      mode: 'view' | 'edit'
      locale: 'uk' | 'en' | null
      idempotencyKey: string | null
      /** When null, publish API assigns a new UUID for `shared_stages.share_group_id`. */
      shareGroupId: string | null
    }
  | { ok: false; error: string; status: number }

export function normalizePublishBody(body: unknown): NormalizePublishResult {
  if (typeof body !== 'object' || body === null) {
    return { ok: false, error: 'Invalid JSON body', status: 400 }
  }
  const o = body as Record<string, unknown>
  const mode = o.mode
  if (mode !== 'view' && mode !== 'edit') {
    return { ok: false, error: 'mode must be "view" or "edit"', status: 400 }
  }

  const loc = o.locale
  let locale: 'uk' | 'en' | null = null
  if (loc !== undefined && loc !== null) {
    if (loc !== 'uk' && loc !== 'en') {
      return { ok: false, error: 'locale must be uk, en, or omitted', status: 400 }
    }
    locale = loc
  }

  let idempotencyKey: string | null = null
  const rawIdem = o.idempotencyKey
  if (rawIdem !== undefined && rawIdem !== null) {
    if (typeof rawIdem !== 'string' || rawIdem.length > 200) {
      return { ok: false, error: 'Invalid idempotencyKey', status: 400 }
    }
    const t = rawIdem.trim()
    idempotencyKey = t.length > 0 ? t : null
  }

  const shareGroupParsed = parseOptionalShareGroupId(o.shareGroupId)
  if (shareGroupParsed === '__invalid__') {
    return { ok: false, error: 'shareGroupId must be a UUID v4 when provided', status: 400 }
  }

  const rest = { ...o }
  delete rest.mode
  delete rest.locale
  delete rest.idempotencyKey
  delete rest.shareGroupId
  const text = JSON.stringify(rest)
  const parsed = parseStageProjectJson(text)
  if (!parsed.ok) {
    return { ok: false, error: 'Invalid stage project JSON', status: 400 }
  }

  const file = buildStageProjectFile({
    stage: parsed.data.stage,
    briefing: parsed.data.briefing,
  })

  return {
    ok: true,
    file,
    mode,
    locale,
    idempotencyKey,
    shareGroupId: shareGroupParsed,
  }
}
