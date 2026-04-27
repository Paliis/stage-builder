/**
 * Convert an article slug like `dq-180-rule` into a readable fallback title
 * (`DQ 180 rule`). Used when the markdown frontmatter has no explicit `title`.
 *
 * Rules:
 * - Replace `-`, `_`, `.` with spaces.
 * - Uppercase known acronyms (DQ, RO, RM, CRO, COF, WSB, IPSC, PCC, PDF, FPSU, USPSA, FAQ).
 * - Capitalize the first character of the first word; keep other words lowercase
 *   so the result reads as a sentence ("Range safety briefing", not "Range Safety Briefing").
 * - Preserve numeric tokens as-is (`180-rule` -> `180 rule`).
 */
const ALL_CAPS_TOKENS = new Set<string>([
  'dq',
  'ro',
  'rm',
  'cro',
  'cof',
  'wsb',
  'ipsc',
  'pcc',
  'pdf',
  'fpsu',
  'uspsa',
  'faq',
])

export function humanizeRoHelperSlug(slug: string): string {
  if (!slug) return slug
  const tokens = slug
    .replace(/[-_.]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (tokens.length === 0) return slug
  return tokens
    .map((tok, i) => {
      const lower = tok.toLowerCase()
      if (ALL_CAPS_TOKENS.has(lower)) return lower.toUpperCase()
      if (/^\d+$/.test(tok)) return tok
      if (i === 0) return lower.charAt(0).toUpperCase() + lower.slice(1)
      return lower
    })
    .join(' ')
}
