/** Portal taxonomy (V1): event kind for humans + PractiScore match_level for .psc. */

export const MATCH_EVENT_KIND_VALUES = ['training', 'match', 'classification'] as const
export type MatchEventKind = (typeof MATCH_EVENT_KIND_VALUES)[number]

export const PS_MATCH_LEVEL_VALUES = ['L1', 'L2', 'L3', 'L4', 'L5'] as const
export type PsMatchLevel = (typeof PS_MATCH_LEVEL_VALUES)[number]

export function isMatchEventKind(v: string | null | undefined): v is MatchEventKind {
  return MATCH_EVENT_KIND_VALUES.includes(v as MatchEventKind)
}

export function isPsMatchLevel(v: string | null | undefined): v is PsMatchLevel {
  return PS_MATCH_LEVEL_VALUES.includes(v as PsMatchLevel)
}
