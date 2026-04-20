import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useI18n } from '../../i18n/useI18n'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

/**
 * Sends GA4 `page_view` events on SPA navigation.
 * Requires `GoogleAnalytics` to load gtag and set `send_page_view: false`.
 */
export function RoutePageViewAnalytics() {
  const loc = useLocation()
  const { locale } = useI18n()
  const lastKey = useRef<string | null>(null)

  useEffect(() => {
    if (import.meta.env.DEV) return
    const id = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined
    if (!id || typeof window.gtag !== 'function') return

    const pagePath = `${loc.pathname}${loc.search}`
    const key = `${locale}:${pagePath}`
    if (lastKey.current === key) return
    lastKey.current = key

    const t = window.setTimeout(() => {
      window.gtag?.('event', 'page_view', {
        page_location: window.location.href,
        page_title: document.title,
      })
    }, 0)
    return () => window.clearTimeout(t)
  }, [loc.pathname, loc.search, locale])

  return null
}

