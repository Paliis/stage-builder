import { useEffect } from 'react'

/**
 * Loads GA4 only when `VITE_GA_MEASUREMENT_ID` is set (e.g. in Vercel env) and not in dev.
 * SPA uses manual router-based `page_view` events (see `RoutePageViewAnalytics`).
 */
export function GoogleAnalytics() {
  useEffect(() => {
    const id = import.meta.env.VITE_GA_MEASUREMENT_ID
    if (!id || import.meta.env.DEV) return
    if (document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${id}"]`)) return

    const ext = document.createElement('script')
    ext.async = true
    ext.src = `https://www.googletagmanager.com/gtag/js?id=${id}`
    document.head.appendChild(ext)

    const inline = document.createElement('script')
    inline.textContent = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${id}', { send_page_view: false });
    `
    document.head.appendChild(inline)
  }, [])

  return null
}
