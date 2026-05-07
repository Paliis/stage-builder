import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { PlainTextAutolink } from './plainTextAutolink'
import { normalizeHref, plainTextToAutolinkNodes, stripHttpUrlsFromPlainText } from './plainTextAutolinkHelpers'

describe('plainTextAutolink', () => {
  it('normalizeHref adds https for www.', () => {
    expect(normalizeHref('www.example.com/x')).toBe('https://www.example.com/x')
  })

  it('plainTextToAutolinkNodes emits one anchor', () => {
    const nodes = plainTextToAutolinkNodes('На полігоні https://fancon.ua/')
    expect(nodes.some((n) => typeof n === 'object' && n !== null && 'type' in n && n.type === 'a')).toBe(true)
    const html = renderToStaticMarkup(createElement('span', null, nodes))
    expect(html).toContain('<a href="https://fancon.ua/"')
  })

  it('PlainTextAutolink wraps mixed text', () => {
    const html = renderToStaticMarkup(createElement(PlainTextAutolink, { text: 'See https://a.test' }))
    expect(html).toContain('<a href="https://a.test/')
  })

  it('stripHttpUrlsFromPlainText removes URLs, keeps venue text', () => {
    expect(stripHttpUrlsFromPlainText('Дніпро https://maps.app.goo.gl/abc')).toBe('Дніпро')
    expect(stripHttpUrlsFromPlainText('https://maps.app.goo.gl/abc')).toBe('')
    expect(stripHttpUrlsFromPlainText('www.example.com/x')).toBe('')
  })
})
