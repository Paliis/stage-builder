import type { Locale } from '../i18n/messages'
import { messagesByLocale } from '../i18n/messages'
import { formatTemplate } from '../i18n/format'
import {
  dedupeActivationEdges,
  filterActivationsValid,
  globalActivationNumberMap,
  refKey,
} from './activations'
import type { ActivationEdge, Prop, Target } from './models'

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

/**
 * Текст блоку активацій для `targetsDescription` (без складу мішеней).
 * Порожній рядок, якщо немає валідних ребер.
 */
export function buildActivationBriefingBlock(
  edges: readonly ActivationEdge[],
  targets: readonly Target[],
  props: readonly Prop[],
  locale: Locale,
): string {
  const valid = dedupeActivationEdges(filterActivationsValid(edges, targets, props))
  if (valid.length === 0) return ''
  const numMap = globalActivationNumberMap(valid)
  const sorted = [...valid].sort((a, b) => {
    const fa = numMap.get(refKey(a.from)) ?? 0
    const fb = numMap.get(refKey(b.from)) ?? 0
    if (fa !== fb) return fa - fb
    const ta = numMap.get(refKey(a.to)) ?? 0
    const tb = numMap.get(refKey(b.to)) ?? 0
    return ta - tb
  })

  const m = messagesByLocale[locale].briefing
  const lines: string[] = []
  let i = 0
  while (i < sorted.length) {
    const fk = refKey(sorted[i]!.from)
    const fromNum = numMap.get(fk)
    if (fromNum === undefined) {
      i++
      continue
    }
    const toNums: number[] = []
    while (i < sorted.length && refKey(sorted[i]!.from) === fk) {
      const tn = numMap.get(refKey(sorted[i]!.to))
      if (tn !== undefined) toNums.push(tn)
      i++
    }
    const uniq = [...new Set(toNums)].sort((a, b) => a - b)
    if (uniq.length === 0) continue
    if (uniq.length === 1) {
      lines.push(
        formatTemplate(m.activationOneToOne, { from: fromNum, to: uniq[0] }),
      )
    } else {
      lines.push(
        formatTemplate(m.activationOneToMany, {
          from: fromNum,
          toList: formatActivationNumberList(uniq, locale),
        }),
      )
    }
  }

  return `${m.activationHeading}\n${lines.join('\n')}`
}
