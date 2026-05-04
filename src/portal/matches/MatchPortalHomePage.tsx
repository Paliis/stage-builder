import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n/useI18n'
import { PortalPublishedMatchesSection } from '../PortalPublishedMatchesSection'
import { useSupabaseSession } from '../useSupabaseSession'
import { useOrganizerSelfServiceProfile } from '../useOrganizerSelfServiceProfile'
import '../PortalHome.css'
import '../PortalMatchesUi.css'

/** Published match catalog hub at `/:locale/matches`. */
export function MatchPortalHomePage() {
  const { locale, tree } = useI18n()
  const p = tree.portal
  const { loading: sessionLoading, user } = useSupabaseSession()
  const { loading: organizerProfileLoading, profile: organizerProfile } = useOrganizerSelfServiceProfile(user?.id)

  const footerOrganizerSlot =
    sessionLoading || (user && organizerProfileLoading) ? null
    : !user ? (
      <Link className="portal-btn portal-btn--primary" to={`/${locale}/account`}>
        {p.matchesPortalFooterOrganizerSignIn}
      </Link>
    ) : organizerProfile === 'active' ? (
      <Link className="portal-btn portal-btn--primary portal-btn--block-xs" to={`/${locale}/matches/my`}>
        {p.matchesPortalOrganizerLink}
      </Link>
    ) : (
      <Link className="portal-btn portal-btn--secondary portal-btn--block-xs" to={`/${locale}/account`}>
        {p.matchesPortalFooterOrganizerViaAccount}
      </Link>
    )

  return (
    <div className="portal-home">
      <Helmet>
        <title>{p.matchesPageHelmetTitle}</title>
      </Helmet>

      <nav className="portal-matches-page__nav">
        <Link className="portal-btn portal-btn--ghost portal-btn--compact" to={`/${locale}`}>
          ← {p.myMatchesBackHome}
        </Link>
      </nav>

      <PortalPublishedMatchesSection />

      {footerOrganizerSlot ?
        <div
          style={{
            marginTop: '1.5rem',
            paddingTop: '1.35rem',
            borderTop: '1px solid var(--border)',
            maxWidth: '52rem',
          }}
        >
          {footerOrganizerSlot}
        </div>
      : null}
    </div>
  )
}
