import type { Locale } from '../i18n/messages'

const RO_HELPER_SEGMENT = 'tools/ro-helper'

/** Unprefixed path kept for bookmarks and static hosting; SPA redirects to `/:locale/tools/ro-helper`. */
export const RO_HELPER_LEGACY_BASE = `/${RO_HELPER_SEGMENT}`

export function roHelperPath(locale: Locale, ...parts: string[]): string {
  const base = `/${locale}/${RO_HELPER_SEGMENT}`
  const tail = parts
    .filter(Boolean)
    .map((p) => p.replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
  if (!tail.length) return base
  return `${base}/${tail.join('/')}`
}
