import { CANONICAL_PRODUCTION_ORIGIN } from './canonicalProductionOrigin'

/** Public site origin for client-side canonical/hreflang (matches build-time SEO defaults). */
export function getPublicSiteOrigin(): string {
  const env = import.meta.env.VITE_SHARE_PUBLIC_ORIGIN?.trim().replace(/\/$/, '')
  if (env) return env
  if (import.meta.env.DEV && typeof window !== 'undefined') return window.location.origin
  return CANONICAL_PRODUCTION_ORIGIN
}
