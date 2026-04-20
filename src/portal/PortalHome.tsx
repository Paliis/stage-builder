import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/useI18n'
import './PortalHome.css'

/** Launcher at `/` — entry to Stage Builder and future portal modules. */
export function PortalHome() {
  const { tree } = useI18n()
  const p = tree.portal

  return (
    <div className="portal-home">
      <Helmet>
        <title>{p.helmetTitle}</title>
        <meta name="description" content={p.metaDescription} />
      </Helmet>
      <h1 className="portal-home__sr-only">{p.title}</h1>
      <p className="portal-home__lead">{p.lead}</p>
      <Link to="/stage-builder" className="portal-home__card">
        <h2 className="portal-home__card-title">{p.stageBuilderTitle}</h2>
        <p className="portal-home__card-desc">{p.stageBuilderDesc}</p>
        <p className="portal-home__card-cta">{p.openStageBuilder} →</p>
      </Link>
      <Link to="/hit-factor" className="portal-home__card portal-home__card--secondary">
        <h2 className="portal-home__card-title">{p.hitFactorTitle}</h2>
        <p className="portal-home__card-desc">{p.hitFactorDesc}</p>
        <p className="portal-home__card-cta">{p.openHitFactor} →</p>
      </Link>
      <Link to="/ro-helper" className="portal-home__card portal-home__card--secondary">
        <h2 className="portal-home__card-title">{p.roHelperTitle}</h2>
        <p className="portal-home__card-desc">{p.roHelperDesc}</p>
        <p className="portal-home__card-cta">{p.openRoHelper} →</p>
      </Link>
      <div className="portal-home__demo">
        <Link to="/ro-helper/demo" className="portal-home__demo-link">
          {p.roHelperDemoCta} →
        </Link>
        <p className="portal-home__demo-desc">{p.roHelperDemoLead}</p>
      </div>
    </div>
  )
}
