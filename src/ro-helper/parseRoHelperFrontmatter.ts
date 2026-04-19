/**
 * Scalar YAML keys at column 0 (RO Helper articles).
 * Used to slice list blocks: next section starts at `\n{key}:`.
 */
const TOP_LEVEL_KEYS = [
  'title',
  'card_id',
  'slug',
  'category',
  'locale',
  'discipline',
  'control_values',
  'ipsc_edition',
  'ipsc_refs',
  'primary_url',
  'fpsu_refs',
  'fpsu_delta_verified',
  'reviewer',
  'review_date',
  'draft_source',
  'status',
] as const

function blockUntilNextTopKey(raw: string, fieldName: string): string {
  const start = raw.indexOf(`${fieldName}:`)
  if (start === -1) return ''
  let end = raw.length
  for (const k of TOP_LEVEL_KEYS) {
    if (k === fieldName) continue
    const p = raw.indexOf(`\n${k}:`, start + 1)
    if (p !== -1 && p < end) end = p
  }
  return raw.slice(start, end)
}

function parseScalarLines(metaBlock: string): Record<string, string> {
  const scalar: Record<string, string> = {}
  for (const line of metaBlock.split(/\r?\n/)) {
    const sm = line.match(/^([a-zA-Z0-9_]+):\s*(.*)$/)
    if (!sm) continue
    scalar[sm[1]] = sm[2].replace(/^["']|["']$/g, '').trim()
  }
  return scalar
}

function collectRules(block: string): string[] {
  const rules: string[] = []
  const re = /rule:\s*["']([^"']+)["']/g
  let m: RegExpExecArray | null
  while ((m = re.exec(block)) !== null) {
    rules.push(m[1])
  }
  return rules
}

function collectUrls(block: string): string[] {
  const urls: string[] = []
  const re = /url:\s*["']([^"']+)["']/g
  let m: RegExpExecArray | null
  while ((m = re.exec(block)) !== null) {
    urls.push(m[1])
  }
  return urls
}

export type RoHelperArticleFrontmatter = {
  title: string | null
  primaryUrl: string | null
  ipscEdition: string | null
  ipscRules: string[]
  fpsuUrls: string[]
}

/** Parses RO Helper YAML frontmatter block (between `---` lines) for cite + SEO helpers. */
export function parseRoHelperArticleFrontmatter(metaBlock: string): RoHelperArticleFrontmatter {
  const scalar = parseScalarLines(metaBlock)
  const ipscBlock = blockUntilNextTopKey(metaBlock, 'ipsc_refs')
  const fpsuBlock = blockUntilNextTopKey(metaBlock, 'fpsu_refs')
  return {
    title: scalar.title || null,
    primaryUrl: scalar.primary_url || null,
    ipscEdition: scalar.ipsc_edition || null,
    ipscRules: collectRules(ipscBlock),
    fpsuUrls: collectUrls(fpsuBlock),
  }
}
