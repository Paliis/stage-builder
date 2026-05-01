/** squad_phase rows from portal `match_squads`. */
export type PortalSquadRowForPsc = { id: string; sort_order: number; squad_phase?: string | null }

/**
 * First PractiScore display squad number assigned to prematch squads (`sh_sqd = label - 1`).
 * Bump when there are many rows to avoid ambiguity with single-digit main squad labels.
 */
export function prematchSquadDisplayStart(totalSquadCount: number): number {
  return totalSquadCount > 10 ? 22 : 11
}

/** Main-day squads first (1-based display → `sh_sqd` 0..n-1), then prematch with high-number labels. */
export function buildSquadIdToPsShSqdMap(squads: readonly PortalSquadRowForPsc[]): Map<string, number> {
  const isPrem = (p: string | null | undefined) => (p ?? 'main').trim().toLowerCase() === 'prematch'
  const main = [...squads].filter((s) => !isPrem(s.squad_phase)).sort((a, b) => a.sort_order - b.sort_order)
  const prem = [...squads].filter((s) => isPrem(s.squad_phase)).sort((a, b) => a.sort_order - b.sort_order)
  const pmStartDisplay = prematchSquadDisplayStart(squads.length)
  const m = new Map<string, number>()
  main.forEach((s, i) => {
    m.set(s.id, i)
  })
  prem.forEach((s, j) => {
    m.set(s.id, pmStartDisplay + j - 1)
  })
  return m
}
