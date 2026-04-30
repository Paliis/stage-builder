import { useCallback } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { getSupabase, isSupabaseConfigured } from '../../lib/supabaseClient'
import { useI18n } from '../../i18n/useI18n'
import { PortalCompactEmailAuth } from '../PortalCompactEmailAuth'
import { useOrganizerPortalStatus } from '../useOrganizerPortalStatus'
import { useSupabaseSession } from '../useSupabaseSession'
import { isMatchPortalEnabled } from '../featureFlags'

export function PortalAccountPage() {
  const { locale, tree } = useI18n()
  const p = tree.portal
  const { loading: sessionLoading, user } = useSupabaseSession()
  const organizer = useOrganizerPortalStatus(user?.id)
  const pathnameRedirect = `/${locale}/account`

  const onSignOut = useCallback(async () => {
    if (!isSupabaseConfigured()) return
    await getSupabase().auth.signOut()
  }, [])

  if (!isSupabaseConfigured()) {
    return (
      <div className="portal-home">
        <Helmet>
          <title>{p.accountPageHelmet}</title>
        </Helmet>
        <p>{p.matchesSupabaseUnset}</p>
        <Link to={`/${locale}`}>{p.myMatchesBackHome}</Link>
      </div>
    )
  }

  return (
    <div className="portal-home">
      <Helmet>
        <title>{p.accountPageHelmet}</title>
      </Helmet>
      <header className="portal-home__hero" style={{ marginBottom: '1rem' }}>
        <h1 className="portal-home__hero-title">{p.accountPageTitle}</h1>
      </header>

      <p style={{ margin: '0 0 1rem' }}>
        <Link to={`/${locale}`}>{p.myMatchesBackHome}</Link>
      </p>

      {sessionLoading ?
        <p>{p.matchesLoadingDetail}</p>
      : user ?
        <section aria-labelledby="account-summary-heading">
          <h2
            id="account-summary-heading"
            className="portal-home__hero-title"
            style={{ fontSize: '1.1rem', margin: '0 0 0.65rem', letterSpacing: '-0.02em' }}
          >
            {p.accountSummaryHeading}
          </h2>
          <p style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', wordBreak: 'break-word' }}>
            <strong>{p.accountSummaryLogin}</strong>{' '}
            {user.email ?? user.id}
          </p>

          <div className="portal-shell__badges" style={{ marginBottom: '0.85rem' }}>
            <span className="portal-shell__badge portal-shell__badge--participant">{p.accountBadgeParticipant}</span>
            {organizer === 'loading' ?
              <span className="portal-shell__badge portal-shell__badge--muted">{p.accountBadgeLoading}</span>
            : organizer === 'active' ?
              <span className="portal-shell__badge portal-shell__badge--organizer">{p.accountBadgeOrganizerActive}</span>
            : organizer === 'blocked' ?
              <span className="portal-shell__badge portal-shell__badge--blocked">{p.accountBadgeOrganizerBlocked}</span>
            : null}
          </div>

          <p style={{ margin: '0 0 1rem', fontSize: '0.95rem', lineHeight: 1.55 }}>{p.accountPageIntroParticipant}</p>

          <ul style={{ margin: '0 0 1.25rem', paddingLeft: '1.25rem', fontSize: '0.95rem', lineHeight: 1.55 }}>
            {isMatchPortalEnabled() ?
              <>
                <li>
                  <Link to={`/${locale}/matches/my`}>{p.accountPageGoOrganizer}</Link>
                  {' — '}
                  <span>{p.accountPageOrganizerExplain}</span>
                </li>
                <li>{p.accountPageShooterSoon}</li>
              </>
            : (
              <li>{p.accountPageShooterSoon}</li>
            )}
          </ul>

          <button type="button" className="portal-shell__account-sign-out portal-shell__account-sign-out--block" onClick={() => void onSignOut()}>
            {p.portalCompactAuthSignOut}
          </button>
        </section>
      :
        <section aria-labelledby="account-auth-heading">
          <h2
            id="account-auth-heading"
            className="portal-home__hero-title"
            style={{ fontSize: '1.1rem', margin: '0 0 0.65rem', letterSpacing: '-0.02em' }}
          >
            {p.accountAuthHeading}
          </h2>
          <PortalCompactEmailAuth p={p} pathnameForRedirect={pathnameRedirect} />
        </section>
      }
    </div>
  )
}
