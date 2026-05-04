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

/** Client minimum; align with Supabase Dashboard → Auth password policy if you change it. */
const MIN_PASSWORD_LEN = 8

/** Eye when password is masked (action: show); eye-off when plain (action: hide). */
function PasswordVisibilityIcon({ passwordVisible }: { passwordVisible: boolean }) {
  if (passwordVisible) {
    return (
      <svg width={20} height={20} viewBox="0 0 24 24" aria-hidden>
        <path
          fill="currentColor"
          d="M3.27 2.22 2 3.5l2.05 2.05C3.23 6.46 2.05 8.11 1 10c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l2.42 2.42 1.27-1.27L3.27 2.22zM12 6.5c.78 0 1.51.1 2.2.28l1.62 1.62c-.67.36-1.3.8-1.88 1.31L14.8 9.19c.43-.51.2-1.19-.48-1.19h-.02c-.54 0-.99.45-.99.99v.05l-3.65-3.64c.32-.05.65-.08.99-.08zm7.45 4.5c-.58 1.47-1.56 2.77-2.83 3.78l1.42 1.42C19.98 14.04 21 12.1 21 10c-1.73-4.39-6-7.5-11-7.5-1.43 0-2.8.24-4.07.68l1.49 1.49C7.31 4.85 9.6 6.5 12 6.5c2.97 0 5.67 1.18 7.45 3.5z"
        />
      </svg>
    )
  }
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M12 6.5c-4.42 0-7.99 3.17-9.53 7.5 1.54 4.33 5.11 7.5 9.53 7.5s7.99-3.17 9.53-7.5c-1.54-4.33-5.11-7.5-9.53-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
      />
    </svg>
  )
}

export function PortalCompactEmailAuth({ p, pathnameForRedirect }: Props) {
  const fieldId = useId()
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const configured = isSupabaseConfigured()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setMessage(null)
    setBusy(true)
    try {
      if (password.length < MIN_PASSWORD_LEN) {
        setMessage(p.portalCompactAuthPasswordTooShort)
        return
      }

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
            setShowPassword(false)
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
            setShowPassword(false)
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
          <div className="portal-compact-auth__password-wrap">
            <input
              id={`${fieldId}-password`}
              className="portal-compact-auth__input portal-compact-auth__input--password-toggle"
              type={showPassword ? 'text' : 'password'}
              autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              required
              minLength={MIN_PASSWORD_LEN}
              maxLength={128}
              disabled={busy}
            />
            <button
              type="button"
              className="portal-compact-auth__pw-toggle"
              onClick={() => setShowPassword((v) => !v)}
              disabled={busy}
              aria-pressed={showPassword}
              aria-label={showPassword ? p.portalCompactAuthHidePassword : p.portalCompactAuthShowPassword}
            >
              <PasswordVisibilityIcon passwordVisible={showPassword} />
            </button>
          </div>
          <p className="portal-compact-auth__field-hint">{p.portalCompactAuthPasswordHint}</p>
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
