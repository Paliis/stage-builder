import type { Locale } from '../../i18n/messages'

export function formatPortalDate(isoUtc: string, locale: Locale): string {
  const d = new Date(isoUtc)
  const loc = locale === 'uk' ? 'uk-UA' : 'en-GB'
  return new Intl.DateTimeFormat(loc, { dateStyle: 'medium', timeStyle: 'short' }).format(d)
}
