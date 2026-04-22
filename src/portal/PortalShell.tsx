import { Link, NavLink, Outlet } from 'react-router-dom'
import { useI18n } from '../i18n/useI18n'
import { SiteFooter } from './SiteFooter'
import { isRoHelperEnabled } from './featureFlags'
import { roHelperPath } from '../ro-helper/paths'
import './PortalShell.css'

/** Shared shell: header (title + language) + main + sitewide footer — for portal routes only. */
export function PortalShell() {
  const { locale, setLocale, tree } = useI18n()
  const p = tree.portal

  return (
    <div className="portal-shell">
      <header className="portal-shell__header">
        <Link to="/" className="portal-shell__brand">
          {p.title}
        </Link>
        <nav className="portal-shell__nav" aria-label="Primary">
          <NavLink to="/stage-builder" className={({ isActive }) => (isActive ? 'is-active' : '')}>
            {p.navStageBuilder}
          </NavLink>
          <NavLink to="/hit-factor" className={({ isActive }) => (isActive ? 'is-active' : '')}>
            {p.navHitFactor}
          </NavLink>
          {isRoHelperEnabled() ? (
            <NavLink to={roHelperPath()} className={({ isActive }) => (isActive ? 'is-active' : '')}>
              {p.navRoHelper}
            </NavLink>
          ) : null}
        </nav>
        <div className="portal-shell__lang" role="group" aria-label={tree.common.langSwitcher}>
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
      <main className="portal-shell__main">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  )
}
