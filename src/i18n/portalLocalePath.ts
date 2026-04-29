import type { Locale } from './messages'

const PORTAL_PREFIX_RE = /^\/(uk|en)(?=\/|$)/

/** Swap first segment when it is `uk` or `en`; otherwise leave `pathname` unchanged. */
export function swapLocaleInPortalPath(pathname: string, next: Locale): string {
  if (!PORTAL_PREFIX_RE.test(pathname)) return pathname
  return pathname.replace(PORTAL_PREFIX_RE, `/${next}`)
}

export function isPortalLocaleParam(s: string | undefined): s is Locale {
  return s === 'uk' || s === 'en'
}
