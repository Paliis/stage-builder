/**
 * Extract BL-001 view share id from pasted URL `/v/id` or from raw short id (`s…`).
 */
export function extractShareViewId(paste: string): string | null {
  const t = paste.trim()
  if (!t) return null
  const fromUrl = /\/v\/([^/?#]+)/i.exec(t)
  if (fromUrl?.[1]) return decodeURIComponent(fromUrl[1].trim())
  const raw = /^s[a-zA-Z0-9]+$/.exec(t)?.[0]
  return raw ?? null
}
