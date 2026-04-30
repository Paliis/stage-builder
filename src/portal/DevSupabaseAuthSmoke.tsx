import { useState, type FormEvent } from 'react'
import { Helmet } from 'react-helmet-async'
import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient'
import { useSupabaseSession } from './useSupabaseSession'

/** Dev-only: показ уривка JSON сесії Supabase у localStorage */
function readAuthStoragePeek(): string {
  if (typeof window === 'undefined') return '—'
  try {
    const raw = window.localStorage.getItem('sb-stage-builder-auth')
    if (!raw) return 'нема запису для ключа sb-stage-builder-auth'
    const head = raw.slice(0, 120).replace(/\s+/g, ' ')
    return `${head}${raw.length > 120 ? '…' : ''} (${raw.length} символів)`
  } catch {
    return 'нема доступу до localStorage'
  }
}

/** Лише dev: перевірка A1 (persist, PKCE, storageKey). Маршрут не реєструється в production-білдах. */
export function DevSupabaseAuthSmoke() {
  const { loading, session, user } = useSupabaseSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const storagePeek = readAuthStoragePeek()

  const configured = isSupabaseConfigured()

  async function handleSignIn(e: FormEvent) {
    e.preventDefault()
    setMessage(null)
    setBusy(true)
    try {
      const sb = getSupabase()
      const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password })
      if (error) {
        setMessage(`${error.message} (${error.name})`)
        return
      }
      setMessage('Успішний вхід. Переглянь localStorage нижче і DevTools.')
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

  return (
    <article className="portal-home" style={{ maxWidth: '40rem', margin: '0 auto', padding: '1.5rem' }}>
      <Helmet title="DEV: Supabase auth smoke test" />

      <h1 className="portal-home__heading" style={{ fontSize: '1.35rem', marginBottom: '0.75rem' }}>
        DEV: перевірка Supabase Auth (A1)
      </h1>

      <p style={{ opacity: 0.9, fontSize: '0.92rem', lineHeight: 1.5 }}>
        Ця сторінка є лише при <strong>vite dev</strong> і має простий Email/Password sign-in через{' '}
        <code style={{ wordBreak: 'break-all' }}>signInWithPassword</code>, щоб переконатися, що сесія зберігається і
        хук <code>useSupabaseSession</code> оновлюється.
      </p>

      <ol style={{ margin: '1rem 0', paddingLeft: '1.25rem', fontSize: '0.9rem', lineHeight: 1.55 }}>
        <li>
          У Dashboard: <strong>Auth → Providers → Email</strong> увімкнено; створи користувача (
          <strong>Authentication → Users → Add user</strong>) із паролем або зайди знаючи email/пароль тестового
          запису.
        </li>
        <li>
          <strong>Auth → URL Configuration</strong>: Site URL = твій dev origin (напр.{' '}
          <code>http://localhost:5173</code>). У <strong>Redirect URLs</strong> додай{' '}
          <code>http://localhost:5173/**</code> і прод-хост із <code>/**</code> за потреби.
        </li>
        <li>
          Файл <code>.env.local</code>: <code>VITE_SUPABASE_URL</code>, <code>VITE_SUPABASE_ANON_KEY</code>; перезапуск{' '}
          <code>npm run dev</code>.
        </li>
        <li>
          Увійти формою нижче → DevTools → <strong>Application → Local Storage</strong> → має з’явитися ключ{' '}
          <code style={{ wordBreak: 'break-all' }}>sb-stage-builder-auth</code>.
        </li>
        <li>
          Перезавантаж сторінку (F5): якщо A1 ок, блок «Стан з хука» лишиться залогіненим без повторного вводу пароля (
          завантаження зі сховища + auto refresh).
        </li>
      </ol>

      {!configured ? (
        <p role="alert" style={{ color: '#c44', marginTop: '1rem', fontWeight: 600 }}>
          Supabase не сконфігурований: перевірте VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.
        </p>
      ) : null}

      <section
        style={{
          marginTop: '1.25rem',
          padding: '1rem',
          borderRadius: '8px',
          background: 'var(--portal-shell-surface-muted, rgba(128,128,128,0.08))',
        }}
      >
        <h2 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Стан з useSupabaseSession</h2>
        <ul style={{ margin: 0, paddingLeft: '1.25rem', fontFamily: 'ui-monospace, monospace', fontSize: '0.85rem' }}>
          <li>loading: {String(loading)}</li>
          <li>user id: {user?.id ?? '(нема)'}</li>
          <li>email: {user?.email ?? '(нема)'}</li>
          <li>expires_at (access): {session?.expires_at != null ? new Date(session.expires_at * 1000).toISOString() : '—'}</li>
        </ul>
      </section>

      <section style={{ marginTop: '1rem' }}>
        <h2 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>localStorage: sb-stage-builder-auth</h2>
        <pre
          style={{
            margin: 0,
            padding: '0.75rem',
            fontSize: '0.72rem',
            overflow: 'auto',
            maxHeight: '8rem',
            borderRadius: '6px',
            background: '#111',
            color: '#b8d48a',
          }}
        >
          {storagePeek}
        </pre>
      </section>

      <form onSubmit={handleSignIn} style={{ marginTop: '1.25rem', display: 'grid', gap: '0.6rem', maxWidth: '22rem' }}>
        <label style={{ display: 'grid', gap: '0.25rem', fontSize: '0.9rem' }}>
          Email
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            required
            disabled={busy || !configured}
          />
        </label>
        <label style={{ display: 'grid', gap: '0.25rem', fontSize: '0.9rem' }}>
          Password
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
            required
            disabled={busy || !configured}
          />
        </label>
        <button type="submit" disabled={busy || !configured}>
          {busy ? '…' : 'Увійти'}
        </button>
      </form>

      <p style={{ marginTop: '0.75rem' }}>
        <button type="button" onClick={() => void handleSignOut()} disabled={busy || !configured}>
          Вийти
        </button>
      </p>

      {message ? (
        <p role="status" style={{ marginTop: '1rem', color: '#ea4', whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
          {message}
        </p>
      ) : null}
    </article>
  )
}
