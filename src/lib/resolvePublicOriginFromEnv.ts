/**
 * Canonical HTTPS origin for share URLs and Open Graph asset base.
 *
 * Order:
 * 1. `VITE_SHARE_PUBLIC_ORIGIN` — explicit override (any host).
 * 2. `VERCEL_PROJECT_PRODUCTION_URL` — Vercel system env: production hostname without preview team slug.
 * 3. `VERCEL_URL` — current deployment (preview URLs include account slug).
 * 4. Fallback — e.g. request host (server) or `window.location.origin` (client).
 */
export function resolvePublicOriginFromEnv(requestFallback: string): string {
  const env = process.env.VITE_SHARE_PUBLIC_ORIGIN?.replace(/\/$/, '')
  if (env) return env
  const prod = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
  if (prod) {
    const host = prod.replace(/^https?:\/\//, '').replace(/\/$/, '')
    return `https://${host}`
  }
  const vu = process.env.VERCEL_URL
  if (vu) return `https://${vu.replace(/^https?:\/\//, '')}`
  return requestFallback.replace(/\/$/, '')
}
