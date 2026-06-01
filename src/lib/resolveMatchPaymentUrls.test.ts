import { describe, expect, it } from 'vitest'

import { isLocalDevHost, resolveMatchPaymentUrls } from './resolveMatchPaymentUrls'

describe('resolveMatchPaymentUrls', () => {
  it('detects local hosts', () => {
    expect(isLocalDevHost('localhost:5173')).toBe(true)
    expect(isLocalDevHost('127.0.0.1')).toBe(true)
    expect(isLocalDevHost('stage-builder-staging.vercel.app')).toBe(false)
  })

  it('uses http for localhost redirect', () => {
    const prev = process.env.VITE_SHARE_PUBLIC_ORIGIN
    delete process.env.MATCH_PAYMENT_WEBHOOK_ORIGIN
    delete process.env.VITE_SHARE_PUBLIC_ORIGIN
    const r = resolveMatchPaymentUrls({ host: 'localhost:5173' })
    expect(r.redirectOrigin).toBe('http://localhost:5173')
    expect(r.localWebhookMissing).toBe(true)
    if (prev) process.env.VITE_SHARE_PUBLIC_ORIGIN = prev
  })

  it('uses staging origin for webhook when set on local', () => {
    process.env.VITE_SHARE_PUBLIC_ORIGIN = 'https://stage-builder-staging.vercel.app'
    const r = resolveMatchPaymentUrls({ host: 'localhost:5173' })
    expect(r.webHookOrigin).toBe('https://stage-builder-staging.vercel.app')
    expect(r.localWebhookMissing).toBe(false)
    delete process.env.VITE_SHARE_PUBLIC_ORIGIN
  })
})
