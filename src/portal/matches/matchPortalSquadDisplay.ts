/**
 * Display squad as the trailing number when the label follows common patterns
 * ("Main 3", "Prematch 2", "Матч 1") — organizers often keep a digit at the end.
 * Unknown/custom labels are returned unchanged (except trim).
 */
export function formatSquadLabelNumberOnly(label: string | null | undefined): string {
  const t = (label ?? '').trim()
  if (!t) return '—'
  const m = t.match(/(\d+)\s*$/)
  if (m) return m[1]
  return t
}
