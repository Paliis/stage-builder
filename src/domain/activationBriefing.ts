import type { Locale } from '../i18n/messages'
import { messagesByLocale } from '../i18n/messages'
import { formatTemplate } from '../i18n/format'

/**
 * Formats sorted global object numbers for activation lines in briefing (BL-004).
 * Used to build `{{toList}}` in `activationOneToMany`.
 */
export function formatActivationNumberList(nums: readonly number[], locale: Locale): string {
  const sorted = [...nums].sort((a, b) => a - b)
  const m = messagesByLocale[locale].briefing
  if (sorted.length === 0) return ''
  if (sorted.length === 1) return String(sorted[0])
  if (sorted.length === 2) {
    return formatTemplate(m.activationNumberListTwo, { a: sorted[0], b: sorted[1] })
  }
  const last = sorted[sorted.length - 1]
  const init = sorted.slice(0, -1).join(', ')
  return formatTemplate(m.activationNumberListMany, { init, last })
}
