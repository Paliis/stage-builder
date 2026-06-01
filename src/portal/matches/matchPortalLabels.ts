import type { MessageTree } from '../../i18n/messages'
import { isMatchEventKind, isPsMatchLevel } from '../../domain/matchTaxonomy'

/** Label for `matches.match_event_kind` on portal UI (empty if unknown/null). */
export function portalLabelMatchEventKind(
  kind: string | null,
  p: MessageTree['portal'],
): string {
  if (!kind || !isMatchEventKind(kind)) return ''
  if (kind === 'training') return p.matchEventKindTraining
  if (kind === 'match') return p.matchEventKindMatch
  if (kind === 'classification') return p.matchEventKindClassification
  return p.matchEventKindSeminar
}

/** Label for `matches.ps_match_level` — Level I … V (empty if unknown/null). */
export function portalLabelPsMatchLevel(level: string | null, p: MessageTree['portal']): string {
  if (!level || !isPsMatchLevel(level)) return ''
  const m: Record<string, string> = {
    L1: p.matchPsLevelL1,
    L2: p.matchPsLevelL2,
    L3: p.matchPsLevelL3,
    L4: p.matchPsLevelL4,
    L5: p.matchPsLevelL5,
  }
  return m[level] ?? level
}
