/** URL / content segments — keep in sync with `content/ro-helper/` tree and matrix. */
export const RO_HELPER_DISCIPLINES = ['handgun', 'pcc', 'rifle', 'mini_rifle', 'shotgun'] as const
export type RoHelperDiscipline = (typeof RO_HELPER_DISCIPLINES)[number]

export const RO_HELPER_CATEGORIES = [
  'safety',
  'penalties',
  'scoring',
  'equipment',
  'match-admin',
] as const
export type RoHelperCategory = (typeof RO_HELPER_CATEGORIES)[number]

export const RESERVED_RO_HELPER_SEGMENTS = new Set(['demo', 'topics'])

export function isRoHelperDiscipline(s: string): s is RoHelperDiscipline {
  return (RO_HELPER_DISCIPLINES as readonly string[]).includes(s)
}

export function isRoHelperCategory(s: string): s is RoHelperCategory {
  return (RO_HELPER_CATEGORIES as readonly string[]).includes(s)
}
