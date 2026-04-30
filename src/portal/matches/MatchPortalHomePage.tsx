import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n/useI18n'
import { PortalPublishedMatchesSection } from '../PortalPublishedMatchesSection'
import { useSupabaseSession } from '../useSupabaseSession'
import { useOrganizerSelfServiceProfile } from '../useOrganizerSelfServiceProfile'
import '../PortalHome.css'

/** Published match catalog hub at `/:locale/matches`. */
export function MatchPortalHomePage() {
  const { locale, tree } = useI18n()
  const p = tree.portal
  const { loading: sessionLoading, user } = useSupabaseSession()
  const { loading: organizerProfileLoading, profile: organizerProfile } = useOrganizerSelfServiceProfile(user?.id)

  const footerOrganizerSlot =
    sessionLoading || (user && organizerProfileLoading) ? null
    : !user ? (
      <Link to={`/${locale}/account`}>{p.matchesPortalFooterOrganizerSignIn}</Link>
    ) : organizerProfile === 'active' ? (
      <Link to={`/${locale}/matches/my`}>{p.matchesPortalOrganizerLink}</Link>
    ) : (
      <Link to={`/${locale}/account`}>{p.matchesPortalFooterOrganizerViaAccount}</Link>
    )

  return (
    <div className="portal-home">
      <Helmet>
        <title>{p.matchesPageHelmetTitle}</title>
      </Helmet>

      <p style={{ margin: '0 0 1rem' }}>
        <Link to={`/${locale}`}>{p.myMatchesBackHome}</Link>
      </p>

      <PortalPublishedMatchesSection />

      {footerOrganizerSlot ?
        <p style={{ margin: '1rem 0 0', fontSize: '0.94rem', lineHeight: 1.5 }}>{footerOrganizerSlot}</p>
      : null}
    </div>
  )
}
