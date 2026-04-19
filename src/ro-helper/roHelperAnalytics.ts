declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

/** RO Helper GA4 events (names per docs/RO_HELPER_V0.md §12) — no-op if gtag missing. */
export function trackRoHelperEvent(name: 'module_open' | 'article_view', params: Record<string, string>): void {
  if (import.meta.env.DEV) return
  const id = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined
  if (!id || typeof window.gtag !== 'function') return
  window.gtag('event', name, params)
}
