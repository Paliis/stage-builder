import { describe, expect, it } from 'vitest'
import { isSafePortalReturnPath } from './safePortalReturnPath'

describe('isSafePortalReturnPath', () => {
  it('allows match detail under uk', () => {
    expect(isSafePortalReturnPath('/uk/matches/c8a34294-461f-4932-a544-3021ecacb10e', 'uk')).toBe(true)
  })

  it('allows en prefix only for en locale', () => {
    expect(isSafePortalReturnPath('/en/matches/foo', 'en')).toBe(true)
    expect(isSafePortalReturnPath('/uk/matches/foo', 'en')).toBe(false)
  })

  it('rejects urls with protocols', () => {
    expect(isSafePortalReturnPath('https://evil.com/phish', 'uk')).toBe(false)
    expect(isSafePortalReturnPath('/uk/evil/https://evil.com', 'uk')).toBe(false)
  })

  it('rejects segment tricks', () => {
    expect(isSafePortalReturnPath('/uk/../en/matches/foo', 'uk')).toBe(false)
  })

  it('blocks auth internals', () => {
    expect(isSafePortalReturnPath('/uk/auth/email-callback?x=1', 'uk')).toBe(false)
  })

  it('rejects whitespace and slashes abuse', () => {
    expect(isSafePortalReturnPath('/uk/foo bar', 'uk')).toBe(false)
    expect(isSafePortalReturnPath('', 'uk')).toBe(false)
    expect(isSafePortalReturnPath('//uk/foo', 'uk')).toBe(false)
  })
})
