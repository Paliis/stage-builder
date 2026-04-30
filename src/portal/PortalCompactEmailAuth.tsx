import { useState, type FormEvent } from 'react'
import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient'
import type { MessageTree } from '../i18n/messages'

type PortalMsgs = MessageTree['portal']

type Props = {
  p: PortalMsgs
  /** Path only, e.g. `/uk/matches/…` — used for email confirmation redirect */
  pathnameForRedirect: string
}

export function PortalCompactEmailAuth({ p, pathnameForRedirect }: Props) {
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

  async function handleSignOut() {
    setMessage(null)
    setBusy(true)
    try {
      const sb = getSupabase()
      const { error } = await sb.auth.signOut()
      if (error) setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }

  if (!configured) {
    return <p role="alert">{p.matchesSupabaseUnset}</p>
  }

  return (
    <div
      style={{
        padding: '0.85rem',
        borderRadius: '8px',
        border: '1px solid var(--border)',
        maxWidth: '22rem',
        fontSize: '0.92rem',
      }}
    >
      <div role="group" aria-label={p.portalCompactAuthAria} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button type="button" aria-pressed={authMode === 'signin'} onClick={() => { setAuthMode('signin'); setMessage(null) }} disabled={busy}>
          {p.portalCompactAuthSignIn}
        </button>
        <button type="button" aria-pressed={authMode === 'signup'} onClick={() => { setAuthMode('signup'); setMessage(null) }} disabled={busy}>
          {p.portalCompactAuthSignUp}
        </button>
      </div>

      <form key={authMode} onSubmit={(ev) => void handleSubmit(ev)} style={{ marginTop: '0.65rem', display: 'grid', gap: '0.5rem' }}>
        <label style={{ display: 'grid', gap: '0.2rem' }}>
          {p.portalCompactAuthEmail}
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            required
            disabled={busy}
          />
        </label>
        <label style={{ display: 'grid', gap: '0.2rem' }}>
          {p.portalCompactAuthPassword}
          <input
            type="password"
            autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
            required
            minLength={6}
            disabled={busy}
          />
        </label>
        <button type="submit" disabled={busy}>
          {busy ? '…' : authMode === 'signin' ? p.portalCompactAuthSubmitSignIn : p.portalCompactAuthSubmitSignUp}
        </button>
      </form>

      <p style={{ margin: '0.6rem 0 0' }}>
        <button type="button" onClick={() => void handleSignOut()} disabled={busy}>
          {p.portalCompactAuthSignOut}
        </button>
      </p>

      {message ? (
        <p role="status" style={{ margin: '0.65rem 0 0', fontSize: '0.88rem', whiteSpace: 'pre-wrap', opacity: 0.92 }}>
          {message}
        </p>
      ) : null}
    </div>
  )
}
