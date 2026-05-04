import { useEffect, useId, useRef, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n/useI18n'
import { swapLocaleInPortalPath } from '../i18n/portalLocalePath'
import { getPublicSiteOrigin } from '../seo/publicOriginClient'
import type { Locale } from '../i18n/messages'
import { SiteFooter } from './SiteFooter'
import { isMatchPortalEnabled, isRoHelperEnabled } from './featureFlags'
import { PortalHeaderAccount } from './PortalHeaderAccount'
import { roHelperPath } from '../ro-helper/paths'
import './PortalShell.css'

const HEADER_COMPACT_MQ = '(max-width: 959px)' as const
/** Same cutoff as mq: Cursor / split preview iframes can be narrower than outer window → matchContent with ResizeObserver. */
const HEADER_COMPACT_MAX_CONTENT_PX = 959

/** Shared shell: responsive header → hamburger drawer on narrow screens. */
export function PortalShell() {
  const headerInnerRef = useRef<HTMLDivElement>(null)
  const panelId = useId()
  const { locale, tree } = useI18n()
  const p = tree.portal
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const origin = getPublicSiteOrigin()
  const canonical = `${origin}${pathname}`
  const ukAlt = `${origin}${swapLocaleInPortalPath(pathname, 'uk')}`
  const enAlt = `${origin}${swapLocaleInPortalPath(pathname, 'en')}`

  const [mqCompact, setMqCompact] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(HEADER_COMPACT_MQ).matches : false,
  )
  const [layoutCompact, setLayoutCompact] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const compactHeader = mqCompact || layoutCompact

  const goLocale = (next: Locale) => {
    navigate(swapLocaleInPortalPath(pathname, next), { replace: true })
  }

  useEffect(() => {
    const mq = window.matchMedia(HEADER_COMPACT_MQ)
    const sync = () => setMqCompact(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    const el = headerInnerRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect
      const w = cr?.width ?? 0
      setLayoutCompact(w > 0 && w <= HEADER_COMPACT_MAX_CONTENT_PX)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    queueMicrotask(() => setNavOpen(false))
  }, [pathname])

  useEffect(() => {
    if (!compactHeader) queueMicrotask(() => setNavOpen(false))
  }, [compactHeader])

  useEffect(() => {
    if (!compactHeader || !navOpen) return
    document.documentElement.classList.add('portal-shell__nav-drawer-lock')
    return () => document.documentElement.classList.remove('portal-shell__nav-drawer-lock')
  }, [compactHeader, navOpen])

  useEffect(() => {
    if (!navOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNavOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navOpen])

  const toolbarClassName = compactHeader ?
    `portal-shell__header-toolbar portal-shell__header-toolbar--compact${navOpen ? ' is-open' : ''}`
  : 'portal-shell__header-toolbar'

  return (
<div className={`portal-shell${compactHeader ? ' portal-shell--nav-compact' : ''}`}>
      <Helmet>
        <link rel="canonical" href={canonical} />
        <link rel="alternate" hrefLang="uk" href={ukAlt} />
        <link rel="alternate" hrefLang="en" href={enAlt} />
        <link rel="alternate" hrefLang="x-default" href={ukAlt} />
      </Helmet>
      <header className="portal-shell__header">
        <div className="portal-shell__header-strip">
          <div className="portal-shell__header-inner" ref={headerInnerRef}>
            <Link to={`/${locale}`} className="portal-shell__brand">
              {p.title}
            </Link>
            <button
              type="button"
              className="portal-shell__menu-toggle"
              aria-expanded={compactHeader ? navOpen : undefined}
              aria-controls={compactHeader ? panelId : undefined}
              aria-hidden={compactHeader ? undefined : true}
              aria-label={
                compactHeader ? (navOpen ? p.portalShellMenuCloseAria : p.portalShellMenuOpenAria) : undefined
              }
              onClick={() => setNavOpen((v) => !v)}
            >
              <span className={`portal-shell__menu-burger ${navOpen ? 'is-open' : ''}`} aria-hidden>
                <span />
                <span />
                <span />
              </span>
            </button>
            <div id={panelId} className={toolbarClassName} aria-label={p.portalShellNavDrawerAria}>
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
                {isMatchPortalEnabled() ?
                  <NavLink
                    to={`/${locale}/matches`}
                    className={({ isActive }) => (isActive ? 'is-active' : '')}
                  >
                    {p.navMatches}
                  </NavLink>
                : null}
                {isRoHelperEnabled() ?
                  <NavLink
                    to={roHelperPath(locale)}
                    className={({ isActive }) => (isActive ? 'is-active' : '')}
                  >
                    {p.navRoHelper}
                  </NavLink>
                : null}
              </nav>
              <PortalHeaderAccount
                locale={locale}
                p={p}
                onAfterSignOut={compactHeader ? () => setNavOpen(false) : undefined}
                suppressGuestSignInLink={pathname === `/${locale}/account`}
              />
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
          </div>
        </div>
        {compactHeader && navOpen ?
          <div
            className="portal-shell__nav-backdrop"
            aria-hidden
            role="presentation"
            onClick={() => setNavOpen(false)}
          />
        : null}
      </header>
      <main className="portal-shell__main">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  )
}
