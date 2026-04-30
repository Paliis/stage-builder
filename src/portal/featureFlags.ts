/**
 * RO Helper has been live in production since the v0 launch, so it is enabled
 * by default. The env var remains as an explicit kill-switch — set
 * `VITE_ENABLE_RO_HELPER=0` (or `false`) at build time to hide its routes,
 * nav link, and home card without having to revert any code.
 */
export function isRoHelperEnabled(): boolean {
  const v = import.meta.env.VITE_ENABLE_RO_HELPER
  if (v === '0' || v === 'false') return false
  return true
}

/**
 * Match module (routes under `/:locale/matches/*`, future organizer dashboard).
 * **Production builds:** enable with **`VITE_ENABLE_MATCH_PORTAL=1`** or **`true`** at build time; otherwise routes are not registered (use a staging/service deployment with the flag on).
 * **`vite dev`:** enabled by default; disable with **`VITE_ENABLE_MATCH_PORTAL=0`**. Rollout policy: `docs/MATCH_REGISTRATION_AND_PSC_PLAN.md`.
 */
export function isMatchPortalEnabled(): boolean {
  if (import.meta.env.DEV) {
    const v = import.meta.env.VITE_ENABLE_MATCH_PORTAL
    if (v === '0' || v === 'false') return false
    return true
  }
  const v = import.meta.env.VITE_ENABLE_MATCH_PORTAL
  return v === '1' || v === 'true'
}

