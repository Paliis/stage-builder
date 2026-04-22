export const RO_HELPER_BASE = '/tools/ro-helper'

export function roHelperPath(...parts: string[]): string {
  const tail = parts.filter(Boolean).map((p) => p.replace(/^\/+|\/+$/g, ''))
  return [RO_HELPER_BASE, ...tail].join('/')
}

