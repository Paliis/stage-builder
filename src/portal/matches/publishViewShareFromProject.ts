import type { StageProjectFileV1 } from '../../domain/stageProjectFile'
import { resolveSharePublishedTitle } from '../../domain/sharePublishedTitle'

export type PublishViewShareOk = {
  ok: true
  id: string
  url: string
  shareGroupId: string | null
}

export type PublishViewShareErr = {
  ok: false
  error: 'rateLimited' | 'tooLarge' | 'notConfigured' | 'network' | 'generic'
  detail?: string
}

export type PublishViewShareResult = PublishViewShareOk | PublishViewShareErr

type PublishJson = {
  error?: string
  id?: string
  url?: string
  path?: string
  shareGroupId?: string
}

function looksLikeHtmlResponse(text: string): boolean {
  const t = text.trim()
  return /^<!DOCTYPE/i.test(t) || /<html[\s>]/i.test(t)
}

function parsePublishJson(text: string): { data: PublishJson; ok: boolean } {
  if (!text.trim()) return { data: {}, ok: true }
  try {
    return { data: JSON.parse(text) as PublishJson, ok: true }
  } catch {
    return { data: {}, ok: false }
  }
}

const UUID_RE = /^[0-9a-f-]{36}$/i

/**
 * Publishes a view share for a library stage so it can be linked into `match_stage_links`.
 * Same `/api/publish-share` path as the editor dialog; no consent UI (match programme is intentional).
 */
export async function publishViewShareFromProject(
  project: StageProjectFileV1,
  locale: 'uk' | 'en',
  fetchImpl: typeof fetch = fetch,
): Promise<PublishViewShareResult> {
  const idempotencyKey = crypto.randomUUID()
  const body = {
    ...project,
    mode: 'view' as const,
    locale,
    idempotencyKey,
  }

  let res: Response
  let text: string
  try {
    res = await fetchImpl('/api/publish-share', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(body),
    })
    text = await res.text()
  } catch {
    return { ok: false, error: 'network' }
  }

  const { data, ok: jsonOk } = parsePublishJson(text)
  const serverMessage =
    typeof data.error === 'string' && data.error.trim() ? data.error.trim() : undefined

  if (!res.ok) {
    let error: PublishViewShareErr['error'] = 'generic'
    if (res.status === 429) error = 'rateLimited'
    else if (res.status === 413) error = 'tooLarge'
    else if (res.status === 503) error = 'notConfigured'
    const detail =
      serverMessage ??
      (!jsonOk || looksLikeHtmlResponse(text) ?
        'HTML response from publish API'
      : text.trim() ?
        `HTTP ${res.status}: ${text.trim().slice(0, 200)}`
      : `HTTP ${res.status}`)
    return { ok: false, error, detail }
  }

  const id = typeof data.id === 'string' && data.id.trim() ? data.id.trim() : null
  const url = typeof data.url === 'string' && data.url.trim() ? data.url.trim() : null
  if (!id || !url) {
    return {
      ok: false,
      error: 'generic',
      detail: serverMessage ?? 'Publish response missing id/url',
    }
  }

  const shareGroupId =
    typeof data.shareGroupId === 'string' && UUID_RE.test(data.shareGroupId) ?
      data.shareGroupId
    : null

  return { ok: true, id, url, shareGroupId }
}

export function nextMatchStageSortOrder(rows: { sort_order: number }[]): number {
  if (rows.length === 0) return 0
  return Math.max(...rows.map((x) => x.sort_order)) + 1
}

export function isShareAlreadyLinked(
  rows: { share_stage_id: string }[],
  shareId: string,
): boolean {
  return rows.some((x) => x.share_stage_id === shareId)
}

export function buildLibraryLinkSnapshotMeta(input: {
  title: string
  userStageId: string
  nowIso?: string
}): Record<string, unknown> {
  return {
    title_snapshot: input.title,
    linked_at: input.nowIso ?? new Date().toISOString(),
    source: 'user_library',
    user_stage_id: input.userStageId,
  }
}

/** Programme label for a library pick: library title first, then briefing/stage name. */
export function resolveLibraryLinkTitle(input: {
  libraryTitle: string
  stageName: string
  briefingDocumentTitle: string
}): string {
  const library = input.libraryTitle.trim()
  if (library) return library.slice(0, 500)
  return resolveSharePublishedTitle(
    { name: input.stageName },
    { documentTitle: input.briefingDocumentTitle },
  )
}
