import type { Locale } from '../i18n/messages'

const MAX_NEXT_LEN = 400

/** Path only; prevents open redirects (stay under `/locale/`, no protocols). */
export function isSafePortalReturnPath(path: string, locale: Locale): boolean {
  const p = path.trim()
  if (p.length < 4 || p.length > MAX_NEXT_LEN) return false
  if (
    !p.startsWith('/') ||
    p.includes('//') ||
    p.includes(':') ||
    /[\s\\]/.test(p) ||
    p.includes('..')
  )
    return false
  const pref = `/${locale}/`
  if (!p.startsWith(pref)) return false
  if (p.startsWith(`/${locale}/auth/`)) return false
  return true
}
