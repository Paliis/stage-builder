import { useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import type { MessageTree } from '../i18n/messages'
import { useI18n } from '../i18n/useI18n'
import { RO_HELPER_DISCIPLINES, type RoHelperCategory } from './constants'
import { disciplineLabel } from './labels'
import { roHelperPath } from './paths'
import { trackRoHelperEvent } from './roHelperAnalytics'
import './RoHelperHome.css'

const GA_SESSION_MODULE_KEY = 'st_ga_rh_module_open'

const SOS: { category: RoHelperCategory; tone: string }[] = [
  { category: 'safety', tone: 'safety' },
  { category: 'penalties', tone: 'penalties' },
  { category: 'scoring', tone: 'scoring' },
  { category: 'equipment', tone: 'equipment' },
  { category: 'match-admin', tone: 'match-admin' },
]

function sosTitle(cat: RoHelperCategory, rh: MessageTree['roHelper']): string {
  switch (cat) {
    case 'safety':
      return rh.sosSafety
    case 'penalties':
      return rh.sosPenalties
    case 'scoring':
      return rh.sosScoring
    case 'equipment':
      return rh.sosEquipment
    case 'match-admin':
      return rh.sosMatchAdmin
    default:
      return cat
  }
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
      <h1 className="ro-helper-home__title">{rh.moduleTitle}</h1>
      <p className="ro-helper-home__lead">{rh.lead}</p>

      <section className="ro-helper-home__sos" aria-labelledby="ro-helper-sos-h">
        <h2 id="ro-helper-sos-h" className="ro-helper-home__sos-heading">
          {rh.sosHeading}
        </h2>
        <ul className="ro-helper-home__sos-grid">
          {SOS.map(({ category, tone }) => (
            <li key={category}>
              <Link
                className={`ro-helper-sos-tile ro-helper-sos-tile--${tone}`}
                to={roHelperPath('topics', category)}
              >
                <span className="ro-helper-sos-tile__name">{sosTitle(category, rh)}</span>
                <span className="ro-helper-sos-tile__cta">→</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="ro-helper-home__disc" aria-labelledby="ro-helper-disc-h">
        <h2 id="ro-helper-disc-h" className="ro-helper-home__disc-heading">
          {rh.disciplineTitle}
        </h2>
        <ul className="ro-helper-home__disc-list">
          {RO_HELPER_DISCIPLINES.map((d) => (
            <li key={d}>
              <Link className="ro-helper-home__disc-link" to={roHelperPath(d)}>
                {disciplineLabel(d, rh)}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <p className="ro-helper-home__demo">
        <Link to={roHelperPath('demo')}>{rh.demoLink} →</Link>
      </p>
    </div>
  )
}
