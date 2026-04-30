import { Helmet } from 'react-helmet-async'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n/useI18n'
import { swapLocaleInPortalPath } from '../i18n/portalLocalePath'
import { getPublicSiteOrigin } from '../seo/publicOriginClient'
import type { Locale } from '../i18n/messages'
import { SiteFooter } from './SiteFooter'
import { isRoHelperEnabled } from './featureFlags'
import { roHelperPath } from '../ro-helper/paths'
import './PortalShell.css'

/** Shared shell: header (title + language) + main + sitewide footer — for portal routes only. */
export function PortalShell() {
  const { locale, tree } = useI18n()
  const p = tree.portal
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const origin = getPublicSiteOrigin()
  const canonical = `${origin}${pathname}`
  const ukAlt = `${origin}${swapLocaleInPortalPath(pathname, 'uk')}`
  const enAlt = `${origin}${swapLocaleInPortalPath(pathname, 'en')}`

  const goLocale = (next: Locale) => {
    navigate(swapLocaleInPortalPath(pathname, next), { replace: true })
  }

  return (
    <div className="portal-shell">
      <Helmet>
        <link rel="canonical" href={canonical} />
        <link rel="alternate" hrefLang="uk" href={ukAlt} />
        <link rel="alternate" hrefLang="en" href={enAlt} />
        <link rel="alternate" hrefLang="x-default" href={ukAlt} />
      </Helmet>
      <header className="portal-shell__header">
        <div className="portal-shell__header-inner">
          <Link to={`/${locale}`} className="portal-shell__brand">
            {p.title}
          </Link>
          <nav className="portal-shell__nav" aria-label="Primary">
            <NavLink
              to="/stage-builder"
              className={({ isActive }) => (isActive ? 'is-active' : '')}
            >
              {p.navStageBuilder}
            </NavLink>
            <NavLink
              to={`/${locale}/hit-factor`}
              className={({ isActive }) => (isActive ? 'is-active' : '')}
            >
              {p.navHitFactor}
            </NavLink>
            <NavLink
              to={`/${locale}/matches`}
              className={({ isActive }) => (isActive ? 'is-active' : '')}
            >
              {p.navMatches}
            </NavLink>
            {isRoHelperEnabled() ? (
              <NavLink
                to={roHelperPath(locale)}
                className={({ isActive }) => (isActive ? 'is-active' : '')}
              >
                {p.navRoHelper}
              </NavLink>
            ) : null}
          </nav>
          <div className="portal-shell__lang" role="group" aria-label={tree.common.langSwitcher}>
            <button
              type="button"
              className={locale === 'uk' ? 'is-active' : ''}
              onClick={() => goLocale('uk')}
              lang="uk"
            >
              {tree.common.langUk}
            </button>
            <button
              type="button"
              className={locale === 'en' ? 'is-active' : ''}
              onClick={() => goLocale('en')}
              lang="en"
            >
              {tree.common.langEn}
            </button>
          </div>
        </div>
      </header>
      <main className="portal-shell__main">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  )
}
