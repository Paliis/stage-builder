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

export type NormalizePublishResult =
  | {
      ok: true
      file: StageProjectFileV1
      mode: 'view' | 'edit'
      locale: 'uk' | 'en' | null
      idempotencyKey: string | null
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

  const rest = { ...o }
  delete rest.mode
  delete rest.locale
  delete rest.idempotencyKey
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
  }
}
