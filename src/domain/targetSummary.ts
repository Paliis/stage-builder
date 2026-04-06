import type { Locale } from '../i18n/messages'
import type { Target } from './models'
import { swingerIsPaperLoad, swingerTargetFaceCount } from './swingerGeometry'
import { isCeramicTargetType, isPaperTargetType } from './targetSpecs'

export function summarizeTargets(targets: readonly Target[], locale: Locale): string {
  let metal = 0
  let ceramic = 0
  let cardboard = 0
  let penalty = 0
  for (const t of targets) {
    if (t.isNoShoot) {
      penalty++
      continue
    }
    const faces = swingerTargetFaceCount(t.type)
    if (faces > 0) {
      if (swingerIsPaperLoad(t.type)) cardboard += faces
      else if (isCeramicTargetType(t.type)) ceramic += faces
      else metal += faces
      continue
    }
    if (isPaperTargetType(t.type)) cardboard++
    else if (isCeramicTargetType(t.type)) ceramic++
    else metal++
  }

  if (locale === 'en') {
    const parts: string[] = []
    if (metal === 1) parts.push('1 steel target')
    else if (metal) parts.push(`${metal} steel targets`)
    if (ceramic === 1) parts.push('1 ceramic target')
    else if (ceramic) parts.push(`${ceramic} ceramic targets`)
    if (cardboard === 1) parts.push('1 paper target')
    else if (cardboard) parts.push(`${cardboard} paper targets`)
    if (penalty === 1) parts.push('1 no-shoot')
    else if (penalty) parts.push(`${penalty} no-shoots`)
    return parts.length > 0 ? parts.join(' + ') : '—'
  }

  const parts: string[] = []
  if (metal) {
    parts.push(metal === 1 ? '1 металева мішень' : `${metal} металевих мішеней`)
  }
  if (ceramic) {
    parts.push(ceramic === 1 ? '1 керамічна мішень' : `${ceramic} керамічних мішеней`)
  }
  if (cardboard) {
    parts.push(
      cardboard === 1 ? '1 паперова мішень' : `${cardboard} паперових мішеней`,
    )
  }
  if (penalty) {
    parts.push(penalty === 1 ? '1 no-shoot' : `${penalty} no-shoot`)
  }
  return parts.length > 0 ? parts.join(' + ') : '—'
}
