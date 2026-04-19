/** First non-heading text line from markdown body (for meta description). */
export function plainSummaryFromMd(markdown: string, maxLen = 158): string {
  const lines = markdown.split(/\r?\n/)
  for (const raw of lines) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const stripped = line
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
      .replace(/\s+/g, ' ')
      .trim()
    if (!stripped) continue
    return stripped.length <= maxLen ? stripped : `${stripped.slice(0, maxLen - 1)}…`
  }
  return ''
}
