import type { Locale } from './messages'

const KEY = 'stage-builder-locale'

export function readStoredLocale(): Locale | null {
  try {
    const v = localStorage.getItem(KEY)
    if (v === 'uk' || v === 'en') return v
  } catch {
    /* ignore */
  }
  return null
}

export function writeStoredLocale(locale: Locale): void {
  try {
    localStorage.setItem(KEY, locale)
  } catch {
    /* ignore */
  }
}

export function detectBrowserLocale(): Locale {
  if (typeof navigator === 'undefined') return 'uk'
  const lang = navigator.language || (navigator.languages && navigator.languages[0]) || 'uk'
  return lang.toLowerCase().startsWith('en') ? 'en' : 'uk'
}

export function getInitialLocale(): Locale {
  return readStoredLocale() ?? detectBrowserLocale()
}
