import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n/useI18n'
import { PortalPublishedMatchesSection } from '../PortalPublishedMatchesSection'
import '../PortalHome.css'

/** Published match catalog hub at `/:locale/matches`. */
export function MatchPortalHomePage() {
  const { locale, tree } = useI18n()
  const p = tree.portal

  return (
    <div className="portal-home">
      <Helmet>
        <title>{p.matchesPageHelmetTitle}</title>
      </Helmet>

      <p style={{ margin: '0 0 1rem' }}>
        <Link to={`/${locale}`}>{p.myMatchesBackHome}</Link>
      </p>

      <PortalPublishedMatchesSection />

      <p style={{ margin: '1rem 0 0', fontSize: '0.94rem', lineHeight: 1.5 }}>
        <Link to={`/${locale}/matches/my`}>{p.matchesPortalOrganizerLink}</Link>
      </p>
    </div>
  )
}
