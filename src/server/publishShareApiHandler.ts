import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'
import { serializeStageProject } from '../domain/stageProjectFile'
import { resolvePublicOriginFromEnv } from '../lib/resolvePublicOriginFromEnv'
import {
  checkPublishRateLimit,
  MAX_PUBLISH_BODY_BYTES,
  newShareId,
  normalizePublishBody,
} from './sharePublish'

function resolvePublicOrigin(req: VercelRequest): string {
  const host = req.headers['x-forwarded-host'] ?? req.headers.host
  const proto = (req.headers['x-forwarded-proto'] as string) || 'https'
  const fallback = typeof host === 'string' ? `${proto}://${host}` : ''
  return resolvePublicOriginFromEnv(fallback)
}

function respondWithUrls(
  req: VercelRequest,
  res: VercelResponse,
  id: string,
  mode: 'view' | 'edit',
  locale: 'uk' | 'en' | null,
) {
  const origin = resolvePublicOrigin(req)
  const pathPrefix = mode === 'view' ? '/v/' : '/e/'
  const lang = locale ? `?lang=${locale}` : ''
  const path = `${pathPrefix}${id}`
  const url = origin ? `${origin}${path}${lang}` : `${path}${lang}`
  res.setHeader('Access-Control-Allow-Origin', '*')
  return res.status(200).json({
    id,
    mode,
    path: `${path}${lang}`,
    url,
  })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Idempotency-Key')
    return res.status(204).end()
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl?.trim() || !serviceKey?.trim()) {
    return res.status(503).json({ error: 'Publish API is not configured' })
  }

  const rawForSize = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {})
  if (Buffer.byteLength(rawForSize, 'utf8') > MAX_PUBLISH_BODY_BYTES) {
    return res.status(413).json({ error: 'Payload too large' })
  }

  let body: unknown
  try {
    body = typeof req.body === 'object' && req.body !== null ? req.body : JSON.parse(rawForSize)
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' })
  }

  const idemHeader = req.headers['idempotency-key']
  if (typeof idemHeader === 'string' && idemHeader.trim() && typeof body === 'object' && body !== null) {
    const o = body as Record<string, unknown>
    if (o.idempotencyKey === undefined) o.idempotencyKey = idemHeader.trim()
  }

  const normalized = normalizePublishBody(body)
  if (!normalized.ok) {
    return res.status(normalized.status).json({ error: normalized.error })
  }

  const ip =
    (typeof req.headers['x-forwarded-for'] === 'string'
      ? req.headers['x-forwarded-for'].split(',')[0]?.trim()
      : null) ||
    req.socket?.remoteAddress ||
    'unknown'

  if (!checkPublishRateLimit(ip)) {
    return res.status(429).json({ error: 'Too many publish requests today' })
  }

  const supabase = createClient(supabaseUrl.trim(), serviceKey.trim(), {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  if (normalized.idempotencyKey) {
    const { data: existing } = await supabase
      .from('shared_stages')
      .select('id, mode')
      .eq('idempotency_key', normalized.idempotencyKey)
      .maybeSingle()
    if (existing?.id) {
      return respondWithUrls(req, res, existing.id, existing.mode as 'view' | 'edit', normalized.locale)
    }
  }

  const serialized = serializeStageProject(normalized.file)
  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(serialized) as Record<string, unknown>
  } catch {
    return res.status(500).json({ error: 'Serialization failed' })
  }

  const title = String(normalized.file.stage.name || 'Stage').slice(0, 500)
  const expiresAt = new Date(Date.now() + 365 * 86400000).toISOString()
  const shareId = newShareId()

  const row = {
    id: shareId,
    mode: normalized.mode,
    payload,
    title,
    locale: normalized.locale,
    expires_at: expiresAt,
    idempotency_key: normalized.idempotencyKey,
    schema_version: 1,
  }

  const { data: inserted, error } = await supabase.from('shared_stages').insert(row).select('id, mode').single()

  if (error) {
    if (error.code === '23505' && normalized.idempotencyKey) {
      const { data: existing } = await supabase
        .from('shared_stages')
        .select('id, mode')
        .eq('idempotency_key', normalized.idempotencyKey)
        .maybeSingle()
      if (existing?.id) {
        return respondWithUrls(req, res, existing.id, existing.mode as 'view' | 'edit', normalized.locale)
      }
    }
    return res.status(500).json({ error: error.message })
  }

  if (!inserted?.id) {
    return res.status(500).json({ error: 'Insert returned no id' })
  }

  return respondWithUrls(req, res, inserted.id, inserted.mode as 'view' | 'edit', normalized.locale)
}
