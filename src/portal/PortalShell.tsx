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
import { isStageBuilderPath, stageBuilderPath } from './stageBuilderPath'
import { roHelperPath } from '../ro-helper/paths'
import './PortalShell.css'
import './portal-layout.css'

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
  const isPortalHome = /^\/(uk|en)\/?$/.test(pathname)

  const [mqCompact, setMqCompact] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(HEADER_COMPACT_MQ).matches : false,
  )
  const [layoutCompact, setLayoutCompact] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const compactHeader = mqCompact || layoutCompact
  /** Editor route: product links collapse into a catalog drawer so the strip stays slim above the canvas. */
  const appMode = isStageBuilderPath(pathname)
  const navDrawer = appMode || compactHeader

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
    if (!navDrawer) queueMicrotask(() => setNavOpen(false))
  }, [navDrawer])

  useEffect(() => {
    if (!navDrawer || !navOpen) return
    document.documentElement.classList.add('portal-shell__nav-drawer-lock')
    return () => document.documentElement.classList.remove('portal-shell__nav-drawer-lock')
  }, [navDrawer, navOpen])

  useEffect(() => {
    if (!navOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNavOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navOpen])

  const toolbarClassName =
    appMode ?
      `portal-shell__header-toolbar portal-shell__header-toolbar--compact portal-shell__header-toolbar--nav-only${navOpen ? ' is-open' : ''}`
    : compactHeader ?
      `portal-shell__header-toolbar portal-shell__header-toolbar--compact${navOpen ? ' is-open' : ''}`
    : 'portal-shell__header-toolbar'

  const toolbarEnd = (
    <div className="portal-shell__toolbar-end">
      <PortalHeaderAccount
        locale={locale}
        p={p}
        onAfterSignOut={navDrawer ? () => setNavOpen(false) : undefined}
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
  )

  return (
<div
      className={`portal-shell${compactHeader && !appMode ? ' portal-shell--nav-compact' : ''}${appMode ? ' portal-shell--app' : ''}${isPortalHome ? ' portal-shell--home' : ''}`}
    >
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
              <img
                className="portal-shell__brand-mark"
                src="/icon-192.png"
                alt=""
                width={40}
                height={40}
                decoding="async"
              />
              <span className="portal-shell__brand-text">{p.title}</span>
            </Link>
            <button
              type="button"
              className="portal-shell__menu-toggle"
              aria-expanded={navDrawer ? navOpen : undefined}
              aria-controls={navDrawer ? panelId : undefined}
              aria-hidden={navDrawer ? undefined : true}
              aria-label={
                navDrawer ? (navOpen ? p.portalShellMenuCloseAria : p.portalShellMenuOpenAria) : undefined
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
                {isMatchPortalEnabled() ?
                  <NavLink
                    to={`/${locale}/matches`}
                    className={({ isActive }) => (isActive ? 'is-active' : '')}
                  >
                    {p.navMatches}
                  </NavLink>
                : null}
                <NavLink
                  to={stageBuilderPath(locale)}
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
                {isRoHelperEnabled() ?
                  <NavLink
                    to={roHelperPath(locale)}
                    className={({ isActive }) => (isActive ? 'is-active' : '')}
                  >
                    {p.navRoHelper}
                  </NavLink>
                : null}
              </nav>
              {appMode ? null : toolbarEnd}
            </div>
            {appMode ? toolbarEnd : null}
          </div>
        </div>
        {navDrawer && navOpen ?
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
