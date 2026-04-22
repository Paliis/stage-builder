export function isRoHelperEnabled(): boolean {
  // Explicit override via env. In prod we default to OFF.
  const v = (import.meta as any).env?.VITE_ENABLE_RO_HELPER
  if (v === '1' || v === 'true') return true
  if (v === '0' || v === 'false') return false
  return (import.meta as any).env?.MODE !== 'production'
}

