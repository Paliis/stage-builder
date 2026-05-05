import { sortPrematchFirstByPhase } from './matchSquadsSort'

/** Row shape from `fetch_public_match_registration_metrics`. */
export type RegistrationMetricRow = {
  squad_id: string
  squad_label: string
  squad_sort: number
  capacity: number
  squad_taken: number | string
  match_total_registered: number | string
  match_competitor_limit: number
  squad_phase?: string | null
}

export function registrationMetricNum(v: number | string | undefined): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string') {
    const n = Number(v)
    if (Number.isFinite(n)) return n
  }
  return 0
}

/** Sort RPC rows prematch-first, then by squad index. */
export function normalizeRegistrationMetricRows(raw: unknown): RegistrationMetricRow[] {
  const rows = (raw ?? []) as RegistrationMetricRow[]
  return sortPrematchFirstByPhase<RegistrationMetricRow>(rows, (m) => registrationMetricNum(m.squad_sort))
}

/** Sum capacities and uncapped free seats across all squads. */
export function sumSquadSeatsTotals(rows: RegistrationMetricRow[]): { totalCap: number; totalFree: number } {
  let totalCap = 0
  let totalFree = 0
  for (const row of rows) {
    const cap = Number(row.capacity)
    const tk = registrationMetricNum(row.squad_taken)
    totalCap += cap
    totalFree += Math.max(0, cap - tk)
  }
  return { totalCap, totalFree }
}
