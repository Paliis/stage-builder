/** Category ids that map to the «Леді / Юніори» fee tier (product §9). */
export const LADY_JUNIOR_FEE_CATEGORY_IDS = ['lady', 'junior', 'lady_junior'] as const

export const MILITARY_FEE_CATEGORY_ID = 'military' as const

export type MatchEntryFeesKop = {
  standard: number | null
  military: number | null
  ladyJunior: number | null
}

export function formatEntryFeeKopAsUah(kop: number | null | undefined): string {
  if (kop == null || !Number.isFinite(kop) || kop <= 0) return ''
  return String(Math.round(kop / 100))
}

/** Whole UAH digits only; empty → null; invalid → null. */
export function parseEntryFeeUahToKop(raw: string): number | null {
  const t = raw.trim().replace(/\s/g, '')
  if (!t) return null
  if (!/^\d+$/.test(t)) return null
  const uah = Number(t)
  if (!Number.isFinite(uah) || uah < 0 || uah > 999_999) return null
  return uah * 100
}

/**
 * Fee for a registration from match tiers and shooter categories.
 * If several tiers apply, the lowest amount wins.
 */
export function entryFeeKopForCategories(
  fees: MatchEntryFeesKop,
  categoryIds: string[],
): number | null {
  const set = new Set(categoryIds)
  const options: number[] = []

  const push = (kop: number | null | undefined) => {
    if (kop != null && kop > 0) options.push(kop)
  }

  push(fees.standard)
  if (set.has(MILITARY_FEE_CATEGORY_ID)) push(fees.military)
  if (LADY_JUNIOR_FEE_CATEGORY_IDS.some((id) => set.has(id))) push(fees.ladyJunior)

  if (options.length === 0) return null
  return Math.min(...options)
}
