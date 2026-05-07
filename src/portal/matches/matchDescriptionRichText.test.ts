import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MatchDescriptionRichText } from './matchDescriptionRichText'
import { matchDescriptionLooksLikeBbCode } from './matchDescriptionLooksLikeBbCode'

function renderDesc(source: string): string {
  return renderToStaticMarkup(createElement(MatchDescriptionRichText, { source }))
}

describe('matchDescriptionLooksLikeBbCode', () => {
  it('is true when a closing BBCode tag is present', () => {
    expect(matchDescriptionLooksLikeBbCode('[b]z[/b]')).toBe(true)
  })

  it('is true for [*] lists', () => {
    expect(matchDescriptionLooksLikeBbCode('[list][*]a[/list]')).toBe(true)
  })

  it('does not treat Markdown links [label](url) as BBCode just because label is quote', () => {
    expect(matchDescriptionLooksLikeBbCode('[quote](https://example.com)')).toBe(false)
  })
})

describe('MatchDescriptionRichText', () => {
  it('renders bbcode emphasis', () => {
    const h = renderDesc('[b]x[/b]')
    expect(h).toContain('<strong')
    expect(h).toContain('x')
  })

  it('does not nest anchor for [url]https://[/url]', () => {
    const h = renderDesc('[url]https://example.com/x[/url]')
    expect(h.match(/<a\b/g)?.length ?? 0).toBe(1)
    expect(h).toContain('https://example.com/x')
  })

  it('linkifies loose URLs when using BBCode path', () => {
    const src = `[b][/b]visit https://example.com/end`
    expect(matchDescriptionLooksLikeBbCode(src)).toBe(true)
    const h = renderDesc(src)
    expect(h).toContain('<a href="https://example.com/end"')
  })

  it('falls back to Markdown when no bbcode heuristic', () => {
    expect(matchDescriptionLooksLikeBbCode('**hi**')).toBe(false)
    const h = renderDesc('**bold**')
    expect(h).toContain('<strong')
  })

  it('linkifies bare URLs in Markdown path (GFM autolink)', () => {
    expect(matchDescriptionLooksLikeBbCode('see https://example.com/x')).toBe(false)
    const h = renderDesc('see https://example.com/x')
    expect(h).toContain('<a href="https://example.com/x"')
  })
})
