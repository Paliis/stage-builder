import { useCallback, useEffect, useRef, useState } from 'react'
import { getSupabase, isSupabaseConfigured } from '../../lib/supabaseClient'
import type { MessageTree } from '../../i18n/messages'

type MonoStatus = {
  connected: boolean
  tokenHint?: string
  verifiedAt?: string | null
}

type Props = {
  p: MessageTree['portal']
  userId: string
}

/** Official Mono KB (онлайн-еквайринг, API-токен) — оновлено 2026-03. */
export const MONO_ACQUIRING_TOKEN_HELP_URL =
  'https://monobank.ua/knowledge-base/acquiring/online/website/api/token'

async function organizerPaymentFetch(
  path: string,
  method: 'POST' | 'DELETE',
  accessToken: string,
  body?: { xToken: string },
): Promise<{ ok: boolean; status: number; data: unknown }> {
  const res = await fetch(path, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  let data: unknown = null
  try {
    data = await res.json()
  } catch {
    data = null
  }
  return { ok: res.ok, status: res.status, data }
}

export function OrganizerMonoPaymentSection({ p, userId }: Props) {
  const sb = getSupabase()
  const [status, setStatus] = useState<MonoStatus | null>(null)
  const [loadBusy, setLoadBusy] = useState(true)
  const [tokenInput, setTokenInput] = useState('')
  const [saveBusy, setSaveBusy] = useState(false)
  const [verifyBusy, setVerifyBusy] = useState(false)
  const [disconnectBusy, setDisconnectBusy] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const tokenHelpDialogRef = useRef<HTMLDialogElement>(null)

  const loadStatus = useCallback(async () => {
    if (!isSupabaseConfigured()) return
    setLoadBusy(true)
    const { data, error } = await sb.rpc('get_own_organizer_mono_payment_status')
    setLoadBusy(false)
    if (error) {
      setStatus({ connected: false })
      setFeedback(`${p.accountMonoPaymentLoadError}: ${error.message}`)
      return
    }
    const row = data as { connected?: boolean; tokenHint?: string; verifiedAt?: string | null }
    setStatus({
      connected: row?.connected === true,
      tokenHint: typeof row?.tokenHint === 'string' ? row.tokenHint : undefined,
      verifiedAt: row?.verifiedAt ?? null,
    })
    setFeedback(null)
  }, [sb, p.accountMonoPaymentLoadError])

  useEffect(() => {
    queueMicrotask(() => void loadStatus())
  }, [loadStatus, userId])

  const withSession = useCallback(async () => {
    const { data } = await sb.auth.getSession()
    const accessToken = data.session?.access_token
    if (!accessToken) {
      setFeedback(p.accountMonoPaymentSessionRequired)
      return null
    }
    return accessToken
  }, [sb, p.accountMonoPaymentSessionRequired])

  const onSave = useCallback(async () => {
    const xToken = tokenInput.trim()
    if (xToken.length < 8) {
      setFeedback(p.accountMonoPaymentTokenInvalid)
      return
    }
    const accessToken = await withSession()
    if (!accessToken) return
    setSaveBusy(true)
    setFeedback(null)
    const { ok, data } = await organizerPaymentFetch(
      '/api/organizer-mono-payment',
      'POST',
      accessToken,
      { xToken },
    )
    setSaveBusy(false)
    if (!ok) {
      const err =
        typeof data === 'object' && data !== null && 'error' in data ?
          String((data as { error: unknown }).error)
        : p.accountMonoPaymentSaveError
      setFeedback(err)
      return
    }
    setTokenInput('')
    await loadStatus()
    setFeedback(p.accountMonoPaymentSaved)
  }, [tokenInput, withSession, loadStatus, p])

  const onVerify = useCallback(async () => {
    const accessToken = await withSession()
    if (!accessToken) return
    setVerifyBusy(true)
    setFeedback(null)
    const { ok, data } = await organizerPaymentFetch(
      '/api/organizer-mono-payment/verify',
      'POST',
      accessToken,
    )
    setVerifyBusy(false)
    if (!ok) {
      const err =
        typeof data === 'object' && data !== null && 'error' in data ?
          String((data as { error: unknown }).error)
        : p.accountMonoPaymentVerifyError
      setFeedback(err)
      return
    }
    await loadStatus()
    setFeedback(p.accountMonoPaymentVerified)
  }, [withSession, loadStatus, p])

  const onDisconnect = useCallback(async () => {
    const accessToken = await withSession()
    if (!accessToken) return
    setDisconnectBusy(true)
    setFeedback(null)
    const { ok } = await organizerPaymentFetch('/api/organizer-mono-payment', 'DELETE', accessToken)
    setDisconnectBusy(false)
    if (!ok) {
      setFeedback(p.accountMonoPaymentDisconnectError)
      return
    }
    setTokenInput('')
    await loadStatus()
    setFeedback(p.accountMonoPaymentDisconnected)
  }, [withSession, loadStatus, p])

  if (loadBusy && status === null) {
    return <p className="portal-matches-organizer__hint">{p.matchesLoadingDetail}</p>
  }

  const connected = status?.connected === true
  const verified = connected && Boolean(status?.verifiedAt)

  return (
    <section
      className="portal-matches-organizer__panel portal-matches-organizer__mono-payment"
      aria-labelledby="organizer-mono-payment-heading"
    >
      <h2 id="organizer-mono-payment-heading" className="portal-matches-organizer__mono-title">
        {p.accountMonoPaymentHeading}
      </h2>
      <p className="portal-matches-organizer__hint portal-matches-organizer__mono-intro">
        {p.accountMonoPaymentIntro}
      </p>

      {connected ?
        <p className="portal-matches-organizer__mono-status" role="status">
          {p.accountMonoPaymentConnected.replace('{{hint}}', status?.tokenHint ?? '••••')}
          {verified ?
            ` · ${p.accountMonoPaymentVerifiedBadge}`
          : ` · ${p.accountMonoPaymentNotVerifiedBadge}`}
        </p>
      : null}

      <div className="portal-matches-organizer__mono-label-row">
        <label className="portal-matches-organizer__mono-label" htmlFor="organizer-mono-x-token">
          {p.accountMonoPaymentTokenLabel}
        </label>
        <button
          type="button"
          className="portal-matches-organizer__mono-help-link"
          onClick={() => tokenHelpDialogRef.current?.showModal()}
        >
          {p.accountMonoPaymentTokenHelpLink}
        </button>
      </div>
      <input
        id="organizer-mono-x-token"
        type="password"
        className="portal-matches-organizer__mono-input"
        value={tokenInput}
        autoComplete="off"
        placeholder={connected ? p.accountMonoPaymentTokenReplacePlaceholder : p.accountMonoPaymentTokenPlaceholder}
        onChange={(e) => setTokenInput(e.target.value)}
      />

      <div className="portal-matches-organizer__mono-actions">
        <button
          type="button"
          className="portal-btn portal-btn--primary portal-btn--block-xs"
          disabled={saveBusy || verifyBusy || disconnectBusy}
          onClick={() => void onSave()}
        >
          {saveBusy ? p.accountMonoPaymentSaving : p.accountMonoPaymentSave}
        </button>
        {connected ?
          <>
            <button
              type="button"
              className="portal-btn portal-btn--secondary portal-btn--block-xs"
              disabled={saveBusy || verifyBusy || disconnectBusy}
              onClick={() => void onVerify()}
            >
              {verifyBusy ? p.accountMonoPaymentVerifying : p.accountMonoPaymentVerify}
            </button>
            <button
              type="button"
              className="portal-btn portal-btn--secondary portal-btn--block-xs"
              disabled={saveBusy || verifyBusy || disconnectBusy}
              onClick={() => void onDisconnect()}
            >
              {disconnectBusy ? p.accountMonoPaymentDisconnecting : p.accountMonoPaymentDisconnect}
            </button>
          </>
        : (
          <p className="portal-matches-organizer__hint portal-matches-organizer__mono-verify-hint">
            {p.accountMonoPaymentVerifyAfterSave}
          </p>
        )}
      </div>

      {feedback ?
        <p className="portal-matches-organizer__mono-feedback" role="status">
          {feedback}
        </p>
      : null}

      <dialog
        ref={tokenHelpDialogRef}
        className="portal-reg-modal portal-matches-organizer__mono-help-dialog"
        aria-labelledby="organizer-mono-token-help-title"
        onCancel={() => tokenHelpDialogRef.current?.close()}
      >
        <div className="portal-reg-modal__panel">
          <h3 id="organizer-mono-token-help-title" className="portal-reg-modal__title">
            {p.accountMonoPaymentTokenModalTitle}
          </h3>
          <ol className="portal-matches-organizer__mono-help-steps">
            <li>{p.accountMonoPaymentTokenModalStep1}</li>
            <li>{p.accountMonoPaymentTokenModalStep2}</li>
            <li>{p.accountMonoPaymentTokenModalStep3}</li>
            <li>{p.accountMonoPaymentTokenModalStep4}</li>
          </ol>
          <p className="portal-matches-organizer__mono-help-official">
            <a href={MONO_ACQUIRING_TOKEN_HELP_URL} target="_blank" rel="noopener noreferrer">
              {p.accountMonoPaymentTokenModalOfficialLink}
            </a>
          </p>
          <div className="portal-reg-modal__actions">
            <button
              type="button"
              className="portal-btn portal-btn--secondary"
              onClick={() => tokenHelpDialogRef.current?.close()}
            >
              {p.accountMonoPaymentTokenModalClose}
            </button>
          </div>
        </div>
      </dialog>
    </section>
  )
}
