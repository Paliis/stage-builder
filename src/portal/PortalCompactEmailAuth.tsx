import { useId, useState, type FormEvent } from 'react'
import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient'
import type { MessageTree } from '../i18n/messages'
import './PortalCompactEmailAuth.css'
import './PortalMatchesUi.css'

type PortalMsgs = MessageTree['portal']

type Props = {
  p: PortalMsgs
  /** Path only, e.g. `/uk/matches/…` — used for email confirmation redirect */
  pathnameForRedirect: string
}

export function PortalCompactEmailAuth({ p, pathnameForRedirect }: Props) {
  const fieldId = useId()
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const configured = isSupabaseConfigured()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setMessage(null)
    setBusy(true)
    try {
      const sb = getSupabase()
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const redirectTo = origin ? `${origin}${pathnameForRedirect}` : undefined

      if (authMode === 'signin') {
        const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password })
        if (error) {
          setMessage(error.message)
          return
        }
        return
      }

      const { data, error } = await sb.auth.signUp({
        email: email.trim(),
        password,
        options: redirectTo ? { emailRedirectTo: redirectTo } : undefined,
      })
      if (error) {
        setMessage(error.message)
        return
      }
      if (data.session) {
        setMessage(p.portalCompactAuthSignupSession)
        return
      }
      setMessage(p.portalCompactAuthSignupConfirm)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  if (!configured) {
    return <p role="alert">{p.matchesSupabaseUnset}</p>
  }

  return (
    <div className="portal-compact-auth">
      <div className="portal-compact-auth__mode" role="group" aria-label={p.portalCompactAuthAria}>
        <button
          type="button"
          className="portal-compact-auth__mode-btn"
          aria-pressed={authMode === 'signin'}
          onClick={() => {
            setAuthMode('signin')
            setMessage(null)
          }}
          disabled={busy}
        >
          {p.portalCompactAuthSignIn}
        </button>
        <button
          type="button"
          className="portal-compact-auth__mode-btn"
          aria-pressed={authMode === 'signup'}
          onClick={() => {
            setAuthMode('signup')
            setMessage(null)
          }}
          disabled={busy}
        >
          {p.portalCompactAuthSignUp}
        </button>
      </div>

      <form key={authMode} className="portal-compact-auth__form" onSubmit={(ev) => void handleSubmit(ev)}>
        <div className="portal-compact-auth__field">
          <label className="portal-compact-auth__label" htmlFor={`${fieldId}-email`}>
            {p.portalCompactAuthEmail}
          </label>
          <input
            id={`${fieldId}-email`}
            className="portal-compact-auth__input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            required
            disabled={busy}
          />
        </div>
        <div className="portal-compact-auth__field">
          <label className="portal-compact-auth__label" htmlFor={`${fieldId}-password`}>
            {p.portalCompactAuthPassword}
          </label>
          <input
            id={`${fieldId}-password`}
            className="portal-compact-auth__input"
            type="password"
            autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
            required
            minLength={6}
            disabled={busy}
          />
        </div>
        <div className="portal-compact-auth__submit-wrap">
          <button type="submit" className="portal-btn portal-btn--primary portal-btn--block" disabled={busy}>
            {busy ? '…' : authMode === 'signin' ? p.portalCompactAuthSubmitSignIn : p.portalCompactAuthSubmitSignUp}
          </button>
        </div>
      </form>

      {message ? (
        <p role="status" className="portal-compact-auth__message">
          {message}
        </p>
      ) : null}
    </div>
  )
}
