import { useCallback, useEffect, useState } from 'react'
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
    return <p className="portal-account__organizer-muted">{p.matchesLoadingDetail}</p>
  }

  const connected = status?.connected === true
  const verified = connected && Boolean(status?.verifiedAt)

  return (
    <div className="portal-account__mono-payment">
      <h4 className="portal-account__section-subtitle">{p.accountMonoPaymentHeading}</h4>
      <p className="portal-account__organizer-muted" style={{ marginBottom: '0.65rem' }}>
        {p.accountMonoPaymentIntro}
      </p>

      {connected ?
        <p className="portal-account__organizer-status-line" role="status">
          {p.accountMonoPaymentConnected.replace('{{hint}}', status?.tokenHint ?? '••••')}
          {verified ?
            ` · ${p.accountMonoPaymentVerifiedBadge}`
          : ` · ${p.accountMonoPaymentNotVerifiedBadge}`}
        </p>
      : null}

      <label className="portal-account__mono-payment-label" htmlFor="organizer-mono-x-token">
        {p.accountMonoPaymentTokenLabel}
      </label>
      <input
        id="organizer-mono-x-token"
        type="password"
        className="portal-account__mono-payment-input"
        value={tokenInput}
        autoComplete="off"
        placeholder={connected ? p.accountMonoPaymentTokenReplacePlaceholder : p.accountMonoPaymentTokenPlaceholder}
        onChange={(e) => setTokenInput(e.target.value)}
      />

      <div className="portal-account__mono-payment-actions">
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
        : null}
      </div>

      {feedback ?
        <p className="portal-account__mono-payment-feedback" role="status">
          {feedback}
        </p>
      : null}
    </div>
  )
}
