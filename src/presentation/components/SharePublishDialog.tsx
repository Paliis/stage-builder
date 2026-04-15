import { useCallback, useEffect, useId, useRef, useState, type MouseEvent } from 'react'
import type { StageProjectFileV1 } from '../../domain/stageProjectFile'
import type { Locale } from '../../i18n/messages'
import type { MessageTree } from '../../i18n/messages'

function looksLikeHtmlResponse(text: string): boolean {
  const t = text.trim()
  return /^<!DOCTYPE/i.test(t) || /<html[\s>]/i.test(t)
}

function parsePublishJson(text: string): { data: { error?: string; url?: string }; ok: boolean } {
  if (!text.trim()) return { data: {}, ok: true }
  try {
    return { data: JSON.parse(text) as { error?: string; url?: string }, ok: true }
  } catch {
    return { data: {}, ok: false }
  }
}

/** In-repo policy (GitHub); opens in a new tab. */
export const PUBLISH_POLICY_HREF =
  'https://github.com/Paliis/stage-builder/blob/main/docs/PUBLISH_POLICY.md'

export type SharePublishDialogProps = {
  open: boolean
  onClose: () => void
  tree: MessageTree
  locale: Locale
  projectRoot: StageProjectFileV1
}

type PublishErr =
  | 'rateLimited'
  | 'tooLarge'
  | 'notConfigured'
  | 'needConsent'
  | 'network'
  | 'generic'

export function SharePublishDialog({
  open,
  onClose,
  tree,
  locale,
  projectRoot,
}: SharePublishDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const consentId = useId()
  const sp = tree.share
  const [consent, setConsent] = useState(false)
  const [viewUrl, setViewUrl] = useState('')
  const [editUrl, setEditUrl] = useState('')
  const [busyMode, setBusyMode] = useState<'view' | 'edit' | null>(null)
  const [errorKey, setErrorKey] = useState<PublishErr | null>(null)
  const [errorDetail, setErrorDetail] = useState<string | null>(null)

  useEffect(() => {
    const d = dialogRef.current
    if (!d) return
    if (open) {
      setConsent(false)
      setViewUrl('')
      setEditUrl('')
      setErrorKey(null)
      setErrorDetail(null)
      setBusyMode(null)
      d.showModal()
    } else {
      d.close()
    }
  }, [open])

  const publish = useCallback(
    async (mode: 'view' | 'edit') => {
      if (!consent) {
        setErrorKey('needConsent')
        setErrorDetail(null)
        return
      }
      setErrorKey(null)
      setErrorDetail(null)
      setBusyMode(mode)
      const idempotencyKey = crypto.randomUUID()
      const body = {
        ...projectRoot,
        mode,
        locale,
        idempotencyKey,
      }
      try {
        const res = await fetch('/api/publish-share', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify(body),
        })
        const text = await res.text()
        const { data, ok: jsonOk } = parsePublishJson(text)

        const serverMessage = typeof data.error === 'string' && data.error.trim() ? data.error.trim() : null

        if (!res.ok) {
          let k: PublishErr = 'generic'
          if (res.status === 429) k = 'rateLimited'
          else if (res.status === 413) k = 'tooLarge'
          else if (res.status === 503) k = 'notConfigured'

          let detail: string | null = serverMessage
          if (!detail) {
            if (!jsonOk || looksLikeHtmlResponse(text)) {
              detail = sp.publishErrorHtmlResponse
            } else if (text.trim()) {
              detail = `HTTP ${res.status}: ${text.trim().slice(0, 200)}`
            } else {
              detail = `HTTP ${res.status}`
            }
          }

          setErrorKey(k)
          setErrorDetail(detail)
          return
        }
        if (typeof data.url !== 'string' || !data.url) {
          setErrorKey('generic')
          setErrorDetail(
            !jsonOk || looksLikeHtmlResponse(text)
              ? sp.publishErrorHtmlResponse
              : serverMessage ?? `HTTP ${res.status} (missing url in response)`,
          )
          return
        }
        if (mode === 'view') setViewUrl(data.url)
        else setEditUrl(data.url)
      } catch {
        setErrorKey('network')
        setErrorDetail(null)
      } finally {
        setBusyMode(null)
      }
    },
    [consent, locale, projectRoot, sp.publishErrorHtmlResponse],
  )

  const copyToClipboard = useCallback(async (url: string, ev: MouseEvent<HTMLButtonElement>) => {
    ev.preventDefault()
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      window.prompt(sp.publishCopyFallback, url)
    }
  }, [sp.publishCopyFallback])

  const errorText =
    errorKey === null
      ? null
      : errorKey === 'needConsent'
        ? sp.publishNeedConsent
        : errorKey === 'rateLimited'
          ? sp.publishRateLimited
          : errorKey === 'tooLarge'
            ? sp.publishTooLarge
            : errorKey === 'notConfigured'
              ? sp.publishNotConfigured
              : errorKey === 'network'
                ? sp.publishNetworkError
                : errorDetail
                  ? `${sp.publishError}: ${errorDetail}`
                  : sp.publishError

  return (
    <dialog
      ref={dialogRef}
      className="app__onboarding-dialog app__share-publish-dialog"
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
    >
      <button type="button" className="app__onboarding-close" onClick={onClose} aria-label={sp.publishClose}>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M4 4l10 10M14 4L4 14" />
        </svg>
      </button>
      <h2 className="app__onboarding-title">{sp.publishTitle}</h2>
      <p className="app__share-publish-intro">{sp.publishIntro}</p>

      <label className="app__share-publish-consent" htmlFor={consentId}>
        <input
          id={consentId}
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
        />
        <span>
          {sp.publishConsentBefore}{' '}
          <a href={PUBLISH_POLICY_HREF} target="_blank" rel="noopener noreferrer">
            {sp.publishConsentLinkText}
          </a>
          {sp.publishConsentAfter}
        </span>
      </label>

      {errorText ? (
        <p className="app__share-publish-error" role="alert">
          {errorText}
        </p>
      ) : null}

      <div className="app__share-publish-actions">
        <button
          type="button"
          className="app__btn-secondary"
          disabled={!consent || busyMode !== null}
          onClick={() => void publish('view')}
        >
          {busyMode === 'view' ? sp.publishBusy : sp.publishGetView}
        </button>
        <button
          type="button"
          className="app__btn-secondary"
          disabled={!consent || busyMode !== null}
          onClick={() => void publish('edit')}
        >
          {busyMode === 'edit' ? sp.publishBusy : sp.publishGetEdit}
        </button>
      </div>

      {viewUrl ? (
        <div className="app__share-publish-result">
          <span className="app__share-publish-result-label">{sp.publishViewLabel}</span>
          <div className="app__share-publish-url-row">
            <input type="text" readOnly className="app__share-publish-url" value={viewUrl} aria-label={sp.publishViewLabel} />
            <button type="button" className="app__btn-secondary" onClick={(e) => void copyToClipboard(viewUrl, e)}>
              {sp.publishCopy}
            </button>
          </div>
        </div>
      ) : null}

      {editUrl ? (
        <div className="app__share-publish-result">
          <span className="app__share-publish-result-label">{sp.publishEditLabel}</span>
          <div className="app__share-publish-url-row">
            <input type="text" readOnly className="app__share-publish-url" value={editUrl} aria-label={sp.publishEditLabel} />
            <button type="button" className="app__btn-secondary" onClick={(e) => void copyToClipboard(editUrl, e)}>
              {sp.publishCopy}
            </button>
          </div>
        </div>
      ) : null}

      <div className="app__share-publish-footer">
        <button type="button" className="app__onboarding-cta" onClick={onClose}>
          {sp.publishClose}
        </button>
      </div>
    </dialog>
  )
}
