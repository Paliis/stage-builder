import type { RoHelperCategory, RoHelperDiscipline } from './constants'

export type RoHelperSearchEntry = {
  discipline: RoHelperDiscipline
  category: RoHelperCategory
  slug: string
  title: string
}

export type RoHelperSearchHit = RoHelperSearchEntry & { score: number }

/** Lower-case + strip diacritics + collapse whitespace; safe for UA/EN. */
export function normalizeQuery(input: string): string {
  if (!input) return ''
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u02bc\u2019']/g, '')
    .replace(/[-_./\u2013\u2014]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function startsAtWordBoundary(haystack: string, needle: string): boolean {
  if (haystack.startsWith(needle)) return true
  return haystack.includes(` ${needle}`)
}

/**
 * Score a single entry against a normalized query.
 * Returns 0 when the entry should be hidden.
 *
 * Tiers:
 *   100 — title equals query
 *    90 — title starts with query
 *    70 — query matches the start of any word in the title
 *    40 — query is a substring of the title
 *    25 — query is a substring of the slug (after normalization)
 *    10 — query is a substring of the discipline / category label key
 */
export function scoreRoHelperEntry(query: string, entry: RoHelperSearchEntry): number {
  if (!query) return 0
  const titleN = normalizeQuery(entry.title)
  if (!titleN) return entry.slug.includes(query) ? 25 : 0
  if (titleN === query) return 100
  if (titleN.startsWith(query)) return 90
  if (startsAtWordBoundary(titleN, query)) return 70
  if (titleN.includes(query)) return 40
  const slugN = normalizeQuery(entry.slug)
  if (slugN.includes(query)) return 25
  const ctxN = normalizeQuery(`${entry.discipline} ${entry.category}`)
  if (ctxN.includes(query)) return 10
  return 0
}

export function searchRoHelper(
  rawQuery: string,
  entries: readonly RoHelperSearchEntry[],
  limit = 10,
): RoHelperSearchHit[] {
  const q = normalizeQuery(rawQuery)
  if (!q) return []
  const hits: RoHelperSearchHit[] = []
  for (const e of entries) {
    const score = scoreRoHelperEntry(q, e)
    if (score > 0) hits.push({ ...e, score })
  }
  hits.sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score
    return a.title.localeCompare(b.title)
  })
  return hits.slice(0, limit)
}
