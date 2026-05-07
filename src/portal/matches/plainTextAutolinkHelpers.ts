import { createElement, type ReactNode } from 'react'

/** Stops URLs at delimiter chars; literals `[`/`]` matched without needless escapes per eslint. */
const URL_RE = /https?:\/\/[^\s<>[\]"']+|www\.[^\s<>[\]"']+/gi

export function normalizeHref(raw: string): string | null {
  const t = raw.trim()
  if (!t) return null
  const withProto =
    t.startsWith('http://') || t.startsWith('https://') ? t : `https://${t}`
  try {
    const u = new URL(withProto)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
    return u.href
  } catch {
    return null
  }
}

/**
 * Splits plain text into mixed string / anchor nodes. Keys use match index so repeated calls
 * (e.g. inside BBCode parsing) never reuse React keys.
 */
export function plainTextToAutolinkNodes(text: string): ReactNode[] {
  if (!text) return []
  const parts: ReactNode[] = []
  let last = 0
  const re = new RegExp(URL_RE.source, URL_RE.flags)
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      parts.push(text.slice(last, m.index))
    }
    const raw = m[0]
    const href = normalizeHref(raw)
    if (href) {
      parts.push(
        createElement(
          'a',
          {
            key: `autolink-${m.index}-${raw.length}`,
            href,
            target: '_blank',
            rel: 'noopener noreferrer',
          },
          raw,
        ),
      )
    } else {
      parts.push(raw)
    }
    last = m.index + raw.length
  }
  if (last < text.length) {
    parts.push(text.slice(last))
  }
  return parts
}

/**
 * Removes URL-shaped tokens (`http(s)://…`, `www.…`). Used e.g. for match hub list cards where
 * location should show venue text only, not links.
 */
export function stripHttpUrlsFromPlainText(text: string): string {
  if (!text) return ''
  const re = new RegExp(URL_RE.source, URL_RE.flags)
  return text.replace(re, ' ').replace(/\s+/g, ' ').trim()
}
