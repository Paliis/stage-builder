import { Fragment, createElement, type ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import { matchDescriptionLooksLikeBbCode } from './matchDescriptionLooksLikeBbCode'

const SUPPORTED = new Set(['b', 'i', 'u', 'url', 'quote', 'code', 'list'])

/** Stops URLs at delimiter chars; literals `[`/`]` matched without needless escapes per eslint. */
const URL_RE = /https?:\/\/[^\s<>[\]"']+|www\.[^\s<>[\]"']+/gi

function normalizeHref(raw: string): string | null {
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

let keySeq = 0
function nextKey(prefix: string): string {
  return `${prefix}-${keySeq++}`
}

function linkifyPlainText(text: string): ReactNode[] {
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
            key: nextKey('a'),
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

function findBalancedEnd(src: string, start: number, rawTagName: string): number {
  const tag = rawTagName.toLowerCase()
  let depth = 1
  let pos = start

  while (pos < src.length) {
    const idx = src.indexOf('[', pos)
    if (idx === -1) return -1
    const close = src.indexOf(']', idx)
    if (close === -1) return -1
    const inner = src.slice(idx + 1, close)
    const low = inner.toLowerCase().trim()

    if (low === `/${tag}`) {
      depth--
      if (depth === 0) return idx
      pos = close + 1
      continue
    }

    const eq = low.indexOf('=')
    const name = (eq === -1 ? low : low.slice(0, eq)).trim()
    if (name === tag && !low.startsWith('/')) {
      depth++
    }
    pos = close + 1
  }
  return -1
}

function parseListItems(inner: string): ReactNode[] {
  const segments = inner.split(/\[\*\]/gi)
  const items: ReactNode[] = []
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    if (!seg.trim() && i === 0) continue
    items.push(createElement('li', { key: nextKey('li') }, ...parseBbCodeNodes(seg)))
  }
  return items
}

function parseBbCodeNodes(src: string): ReactNode[] {
  const out: ReactNode[] = []
  let i = 0

  while (i < src.length) {
    if (src[i] !== '[') {
      const next = src.indexOf('[', i)
      const end = next === -1 ? src.length : next
      const chunk = src.slice(i, end)
      if (chunk) {
        out.push(...linkifyPlainText(chunk))
      }
      i = end
      continue
    }

    const close = src.indexOf(']', i)
    if (close === -1) {
      out.push(...linkifyPlainText(src.slice(i)))
      break
    }

    const tagFull = src.slice(i + 1, close)
    i = close + 1

    if (tagFull.startsWith('/')) {
      out.push(...linkifyPlainText(`[${tagFull}]`))
      continue
    }

    const eq = tagFull.indexOf('=')
    const tagNameRaw = (eq === -1 ? tagFull : tagFull.slice(0, eq)).trim()
    const tagName = tagNameRaw.toLowerCase()
    const attr = eq === -1 ? undefined : tagFull.slice(eq + 1).trim()

    if (!SUPPORTED.has(tagName)) {
      out.push(...linkifyPlainText(`[${tagFull}]`))
      continue
    }

    const endOpen = findBalancedEnd(src, i, tagName)
    if (endOpen === -1) {
      out.push(...linkifyPlainText(`[${tagFull}]`))
      continue
    }

    const inner = src.slice(i, endOpen)
    const closeToken = `[/${tagName}]`
    i = endOpen + closeToken.length

    switch (tagName) {
      case 'b':
        out.push(createElement('strong', { key: nextKey('b') }, ...parseBbCodeNodes(inner)))
        break
      case 'i':
        out.push(createElement('em', { key: nextKey('i') }, ...parseBbCodeNodes(inner)))
        break
      case 'u':
        out.push(
          createElement(
            'span',
            { key: nextKey('u'), style: { textDecoration: 'underline' } },
            ...parseBbCodeNodes(inner),
          ),
        )
        break
      case 'url': {
        const trimmed = inner.trim()
        const href =
          attr !== undefined ? normalizeHref(attr) : normalizeHref(trimmed)

        if (!href) {
          out.push(...parseBbCodeNodes(inner))
          break
        }

        const children: ReactNode[] =
          attr !== undefined ?
            parseBbCodeNodes(inner)
          : /\[/.test(inner) ?
            parseBbCodeNodes(inner)
          : [trimmed]

        out.push(
          createElement(
            'a',
            {
              key: nextKey('url'),
              href,
              target: '_blank',
              rel: 'noopener noreferrer',
            },
            ...(children.length > 0 ? children : [href]),
          ),
        )
        break
      }
      case 'quote':
        out.push(
          createElement(
            'blockquote',
            { key: nextKey('q') },
            ...parseBbCodeNodes(inner),
          ),
        )
        break
      case 'code':
        out.push(
          createElement(
            'code',
            { key: nextKey('c'), className: 'portal-match-description__code' },
            inner,
          ),
        )
        break
      case 'list':
        out.push(
          createElement(
            'ul',
            { key: nextKey('ul'), className: 'portal-match-description__bbcode-list' },
            ...parseListItems(inner),
          ),
        )
        break
    }
  }

  return out
}

/** Renders organizer «description» field: Markdown by default; BBCode when tags are present. */
export function MatchDescriptionRichText({ source }: { source: string }) {
  keySeq = 0
  if (matchDescriptionLooksLikeBbCode(source)) {
    return createElement(
      Fragment,
      null,
      ...parseBbCodeNodes(source),
    )
  }
  return createElement(ReactMarkdown, null, source)
}
