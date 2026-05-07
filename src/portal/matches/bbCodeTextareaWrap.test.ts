import { describe, expect, it } from 'vitest'
import { wrapBbCode } from './bbCodeTextareaWrap'

describe('wrapBbCode', () => {
  it('wraps selection and places caret after closing tag', () => {
    const got = wrapBbCode('hello world', 6, 11, '[b]', '[/b]', '')
    expect(got.text).toBe('hello [b]world[/b]')
    expect(got.selStart).toBe(got.text.length)
    expect(got.selEnd).toBe(got.text.length)
  })

  it('inserts placeholder when nothing selected and selects inner', () => {
    const got = wrapBbCode('ab', 1, 1, '[url]', '[/url]', 'https://')
    expect(got.text).toBe('a[url]https://[/url]b')
    expect(got.text.slice(got.selStart, got.selEnd)).toBe('https://')
  })

  it('handles reversed selection indices', () => {
    const got = wrapBbCode('abcd', 3, 1, '[i]', '[/i]', '')
    expect(got.text).toBe('a[i]bc[/i]d')
  })

  it('supports list opener with marker', () => {
    const got = wrapBbCode('', 0, 0, '[list][*]', '[/list]', 'x')
    expect(got.text).toBe('[list][*]x[/list]')
    expect(got.text.slice(got.selStart, got.selEnd)).toBe('x')
  })
})
