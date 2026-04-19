/**
 * Minimal frontmatter handling for RO Helper markdown (body + title).
 * Full YAML (nested lists) is not parsed — we only split `---` blocks and read `title:`.
 */
export function splitFrontmatter(raw: string): { metaBlock: string; body: string } {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\s*\r?\n([\s\S]*)$/)
  if (!m) return { metaBlock: '', body: raw.trim() }
  return { metaBlock: m[1], body: m[2].trimStart() }
}

export function extractTitleFromMeta(metaBlock: string): string | null {
  const line = metaBlock.split(/\r?\n/).find((l) => /^title:\s*/.test(l))
  if (!line) return null
  const rest = line.replace(/^title:\s*/, '').trim()
  if (rest.startsWith('"')) {
    const end = rest.indexOf('"', 1)
    if (end > 0) return rest.slice(1, end)
  }
  if (rest.startsWith("'")) {
    const end = rest.indexOf("'", 1)
    if (end > 0) return rest.slice(1, end)
  }
  return rest.replace(/^["']|["']$/g, '') || null
}
