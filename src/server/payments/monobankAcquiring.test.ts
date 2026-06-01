import { describe, expect, it } from 'vitest'
import { monoTokenHint } from './monobankAcquiring'

describe('monoTokenHint', () => {
  it('masks token leaving last 4 chars', () => {
    expect(monoTokenHint('abcdefghijklmnop')).toBe('••••mnop')
  })

  it('returns bullets for short tokens', () => {
    expect(monoTokenHint('ab')).toBe('••••')
  })
})
