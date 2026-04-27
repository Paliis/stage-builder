import { useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/useI18n'
import { RO_HELPER_DISCIPLINES, type RoHelperDiscipline } from './constants'
import { disciplineLabel } from './labels'
import { roHelperPath } from './paths'
import { trackRoHelperEvent } from './roHelperAnalytics'
import './RoHelperHome.css'

const GA_SESSION_MODULE_KEY = 'st_ga_rh_module_open'

const DISCIPLINE_TONE: Record<RoHelperDiscipline, string> = {
  handgun: 'handgun',
  pcc: 'pcc',
  rifle: 'rifle',
  mini_rifle: 'mini-rifle',
  shotgun: 'shotgun',
}

export function RoHelperHome() {
  const { tree } = useI18n()
  const rh = tree.roHelper

  useEffect(() => {
    try {
      if (sessionStorage.getItem(GA_SESSION_MODULE_KEY)) return
      sessionStorage.setItem(GA_SESSION_MODULE_KEY, '1')
    } catch {
      /* ignore */
    }
    trackRoHelperEvent('module_open', { module: 'ro-helper' })
  }, [])

  const helmetTitle = `${rh.moduleTitle} — ${tree.portal.title}`

  return (
    <div className="ro-helper-home">
      <Helmet>
        <title>{helmetTitle}</title>
        <meta name="description" content={rh.seoModuleDescription} />
      </Helmet>

      <header className="ro-helper-home__hero">
        <h1 className="ro-helper-home__title">{rh.moduleTitle}</h1>
        <p className="ro-helper-home__lead">{rh.lead}</p>
        <p className="ro-helper-home__sub">{rh.disciplineLead}</p>
      </header>

      <section className="ro-helper-home__disc" aria-labelledby="ro-helper-disc-h">
        <h2 id="ro-helper-disc-h" className="ro-helper-home__disc-heading">
          {rh.disciplineTitle}
        </h2>
        <ul className="ro-helper-home__disc-grid">
          {RO_HELPER_DISCIPLINES.map((d) => (
            <li key={d} className="ro-helper-home__disc-item">
              <Link
                className={`ro-helper-disc-card ro-helper-disc-card--${DISCIPLINE_TONE[d]}`}
                to={roHelperPath(d)}
              >
                <span className="ro-helper-disc-card__accent" aria-hidden="true" />
                <span className="ro-helper-disc-card__body">
                  <span className="ro-helper-disc-card__name">{disciplineLabel(d, rh)}</span>
                  <span className="ro-helper-disc-card__sub">{rh.disciplineCardSubtitle}</span>
                </span>
                <span className="ro-helper-disc-card__cta" aria-hidden="true">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
