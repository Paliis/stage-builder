/** Validate `next` from `/auth/email-callback?next=` — same-origin path only, must match locale. */
export function safeAuthEmailNextPath(raw: string | null, locale: string): string {
  if (!raw || typeof raw !== 'string') return `/${locale}/account`
  let decoded = raw
  try {
    decoded = decodeURIComponent(raw)
  } catch {
    return `/${locale}/account`
  }
  if (!decoded.startsWith('/') || decoded.startsWith('//') || decoded.includes('://')) {
    return `/${locale}/account`
  }
  if (decoded !== `/${locale}` && !decoded.startsWith(`/${locale}/`)) {
    return `/${locale}/account`
  }
  return decoded
}

/** Parse `#error=…&error_description=…` after OAuth-style redirects (some auth flows). */
export function parseAuthFragmentError(): string | null {
  if (typeof window === 'undefined') return null
  const h = window.location.hash.replace(/^#/, '')
  if (!h) return null
  const p = new URLSearchParams(h)
  const desc = p.get('error_description')
  const code = p.get('error_code') || p.get('error')
  if (desc && desc.trim()) return desc.trim()
  if (code && code.trim()) return code.trim()
  return null
}
