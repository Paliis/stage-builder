import { useEffect, useMemo, useRef, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useI18n } from '../i18n/useI18n'
import { isSupabaseConfigured } from '../lib/supabaseClient'
import { useSupabaseSession } from './useSupabaseSession'
import { parseAuthFragmentError, safeAuthEmailNextPath } from './authEmailCallbackPaths'
import './PortalHome.css'
import './PortalMatchesUi.css'

/**
 * Landing page after email confirmation (PKCE `?code=` exchange). Friendly copy + `next` redirect.
 * Raw JSON on `*.supabase.co` happens before redirect — cannot skin that; this route fixes our domain.
 */
export function AuthEmailCallbackPage() {
  const { locale, tree } = useI18n()
  const p = tree.portal
  const { locale: localeParam } = useParams<{ locale: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { loading, user } = useSupabaseSession()

  const effectiveLocale = localeParam ?? locale
  const nextPath = useMemo(
    () => safeAuthEmailNextPath(searchParams.get('next'), effectiveLocale),
    [searchParams, effectiveLocale],
  )

  const [fragmentError] = useState(() => parseAuthFragmentError())
  const cleanedUrlRef = useRef(false)

  /** Strip `code` / tokens from address bar after session is established. */
  useEffect(() => {
    if (!user || cleanedUrlRef.current) return
    cleanedUrlRef.current = true
    const q = new URLSearchParams()
    q.set('next', nextPath)
    navigate(`/${effectiveLocale}/auth/email-callback?${q.toString()}`, { replace: true })
  }, [user, navigate, effectiveLocale, nextPath])

  const [showSlowHint, setShowSlowHint] = useState(false)
  useEffect(() => {
    if (loading || user || fragmentError) return
    const t = window.setTimeout(() => setShowSlowHint(true), 2200)
    return () => window.clearTimeout(t)
  }, [loading, user, fragmentError])

  if (!isSupabaseConfigured()) {
    return (
      <div className="portal-home">
        <Helmet>
          <title>{p.authEmailCallbackHelmet}</title>
        </Helmet>
        <p>{p.matchesSupabaseUnset}</p>
        <nav className="portal-page-context portal-page-context--solo-link" aria-label={p.portalBreadcrumbAria}>
          <Link to={`/${effectiveLocale}`}>{p.myMatchesBackHome}</Link>
        </nav>
      </div>
    )
  }

  if (fragmentError) {
    return (
      <div className="portal-home">
        <Helmet>
          <title>{p.authEmailCallbackHelmet}</title>
        </Helmet>
        <header className="portal-home__hero portal-home__hero--spaced">
          <h1 className="portal-home__hero-title">{p.authEmailCallbackFailedTitle}</h1>
        </header>
        <p style={{ maxWidth: '40rem', lineHeight: 1.55 }}>{p.authEmailCallbackFailedBody}</p>
        <p
          role="alert"
          style={{
            maxWidth: '40rem',
            marginTop: '0.75rem',
            padding: '0.65rem 0.85rem',
            borderRadius: '8px',
            background: 'var(--surface-muted, rgba(0,0,0,0.06))',
            fontSize: '0.9rem',
            wordBreak: 'break-word',
          }}
        >
          {fragmentError}
        </p>
        <p style={{ marginTop: '1.25rem' }}>
          <Link className="portal-btn portal-btn--primary" to={`/${effectiveLocale}/account`}>
            {p.authEmailCallbackAccountCta}
          </Link>
        </p>
      </div>
    )
  }

  if (loading || (!user && !showSlowHint)) {
    return (
      <div className="portal-home">
        <Helmet>
          <title>{p.authEmailCallbackHelmet}</title>
        </Helmet>
        <p className="portal-account__loading">{p.authEmailCallbackLoading}</p>
      </div>
    )
  }

  if (user) {
    return (
      <div className="portal-home">
        <Helmet>
          <title>{p.authEmailCallbackHelmet}</title>
        </Helmet>
        <header className="portal-home__hero portal-home__hero--spaced">
          <h1 className="portal-home__hero-title">{p.authEmailCallbackSuccessTitle}</h1>
        </header>
        <p style={{ maxWidth: '36rem', lineHeight: 1.55 }}>{p.authEmailCallbackSuccessBody}</p>
        <div style={{ marginTop: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
          <Link className="portal-btn portal-btn--primary" to={nextPath}>
            {p.authEmailCallbackContinue}
          </Link>
          <Link className="portal-btn portal-btn--secondary" to={`/${effectiveLocale}`}>
            {p.authEmailCallbackToHome}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="portal-home">
      <Helmet>
        <title>{p.authEmailCallbackHelmet}</title>
      </Helmet>
      <header className="portal-home__hero portal-home__hero--spaced">
        <h1 className="portal-home__hero-title">{p.authEmailCallbackFailedTitle}</h1>
      </header>
      <p style={{ maxWidth: '40rem', lineHeight: 1.55 }}>{p.authEmailCallbackFailedBody}</p>
      <p style={{ marginTop: '1.25rem' }}>
        <Link className="portal-btn portal-btn--primary" to={`/${effectiveLocale}/account`}>
          {p.authEmailCallbackAccountCta}
        </Link>
      </p>
    </div>
  )
}
