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

