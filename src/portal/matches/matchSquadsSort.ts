export type SquadPrematchSortable = {
  squad_phase: string
  sort_order: number
}

/** Prematch squads first, then main; within each phase by `sort_order`. */
export function sortSquadsPrematchFirst<T extends SquadPrematchSortable>(list: T[]): T[] {
  return sortPrematchFirstByPhase(list, (x) => x.sort_order)
}

/** Same phase order when the sort key column has another name (e.g. RPC `squad_sort`). */
export function sortPrematchFirstByPhase<T extends { squad_phase?: string | null }>(
  list: T[],
  sortKey: (x: T) => number,
): T[] {
  return [...list].sort((a, b) => {
    const ap = a.squad_phase === 'prematch' ? 0 : 1
    const bp = b.squad_phase === 'prematch' ? 0 : 1
    if (ap !== bp) return ap - bp
    return sortKey(a) - sortKey(b)
  })
}
