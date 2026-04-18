import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/useI18n'
import './PortalHome.css'

/** Launcher at `/` — entry to Stage Builder and future portal modules. */
export function PortalHome() {
  const { locale, setLocale, tree } = useI18n()
  const p = tree.portal

  return (
    <div className="portal-home">
      <header className="portal-home__header">
        <h1 className="portal-home__title">{p.title}</h1>
        <div className="portal-home__lang" role="group" aria-label={tree.common.langSwitcher}>
          <button
            type="button"
            className={locale === 'uk' ? 'is-active' : ''}
            onClick={() => setLocale('uk')}
            lang="uk"
          >
            {tree.common.langUk}
          </button>
          <button
            type="button"
            className={locale === 'en' ? 'is-active' : ''}
            onClick={() => setLocale('en')}
            lang="en"
          >
            {tree.common.langEn}
          </button>
        </div>
      </header>
      <p className="portal-home__lead">{p.lead}</p>
      <Link to="/stage-builder" className="portal-home__card">
        <h2 className="portal-home__card-title">{p.stageBuilderTitle}</h2>
        <p className="portal-home__card-desc">{p.stageBuilderDesc}</p>
        <p className="portal-home__card-cta">{p.openStageBuilder} →</p>
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
