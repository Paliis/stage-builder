import { afterEach, describe, expect, it, vi } from 'vitest'
import { resolvePublicOriginFromEnv } from './resolvePublicOriginFromEnv'

describe('resolvePublicOriginFromEnv', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('prefers VITE_SHARE_PUBLIC_ORIGIN', () => {
    vi.stubEnv('VITE_SHARE_PUBLIC_ORIGIN', 'https://example.com/')
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', 'other.vercel.app')
    vi.stubEnv('VERCEL_URL', 'preview-abc.vercel.app')
    expect(resolvePublicOriginFromEnv('https://fallback.test')).toBe('https://example.com')
  })

  it('uses VERCEL_PROJECT_PRODUCTION_URL without team slug when override unset', () => {
    vi.stubEnv('VITE_SHARE_PUBLIC_ORIGIN', '')
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', 'stage-builder.vercel.app')
    vi.stubEnv('VERCEL_URL', 'stage-builder-git-main-user-projects.vercel.app')
    expect(resolvePublicOriginFromEnv('')).toBe('https://stage-builder.vercel.app')
  })

  it('falls back to VERCEL_URL then request host', () => {
    vi.stubEnv('VITE_SHARE_PUBLIC_ORIGIN', '')
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', '')
    vi.stubEnv('VERCEL_URL', 'deploy-xyz.vercel.app')
    expect(resolvePublicOriginFromEnv('')).toBe('https://deploy-xyz.vercel.app')
  })

  it('uses request fallback when no Vercel env', () => {
    vi.stubEnv('VITE_SHARE_PUBLIC_ORIGIN', '')
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', '')
    vi.stubEnv('VERCEL_URL', '')
    expect(resolvePublicOriginFromEnv('http://localhost:5173')).toBe('http://localhost:5173')
  })
})
