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

  /** Guests: no organizer footer CTA (copy targets signed-in flows). Signed-in: hub → list or account. */
  const footerOrganizerSlot =
    sessionLoading || !user ? null
    : organizerProfileLoading ? null
    : organizerProfile === 'active' ? (
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

      <PortalPublishedMatchesSection />

      {footerOrganizerSlot ?
        <div className="portal-home__footer-cta">{footerOrganizerSlot}</div>
      : null}
    </div>
  )
}
