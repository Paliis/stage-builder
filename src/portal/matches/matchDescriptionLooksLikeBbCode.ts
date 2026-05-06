/**
 * Prefer Markdown unless this looks like BBCode — avoids `[label](url)` wrongly
 * activating on `[quote]`/`[list]`-style Markdown labels alone.
 */
export function matchDescriptionLooksLikeBbCode(raw: string): boolean {
  if (/\[\*\]/i.test(raw)) return true
  if (/\[\s*url\s*=/i.test(raw)) return true
  if (/\[\s*\/(?:b|i|u|url|list|quote|code)\s*\]/i.test(raw)) return true
  const openSansUrl = /\[(?:b|i|u|list|quote|code)(?:\s*[=\]])/i
  const closeNamed = /\[\s*\/(?:b|i|u|list|quote|code)\s*\]/i
  if (openSansUrl.test(raw) && closeNamed.test(raw)) return true
  const openUrl = /\[\s*url\s*\]/i
  if (openUrl.test(raw) && /\[\s*\/\s*url\s*\]/i.test(raw)) return true
  return false
}
