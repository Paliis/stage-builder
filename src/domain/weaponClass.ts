import type { Target, TargetType } from './models'

/**
 * Клас дисципліни IPSC для підбору мішеней у редакторі.
 * Набори спрощені (без жорсткої валідації правил змагання).
 */
export type WeaponClass = 'handgun' | 'rifle' | 'shotgun'

/** Один набір для всіх класів зброї. */
export const ALL_TARGET_TYPES: readonly TargetType[] = [
  'paperIpsc',
  'paperA4',
  'paperMiniIpsc',
  'metalPlate',
  'metalPlateStand50',
  'metalPlateStand100',
  'popper',
  'miniPopper',
  'ceramicPlate',
  'swingerSinglePaper',
  'swingerDoublePaper',
  'swingerSingleCeramic',
  'swingerDoubleCeramic',
] as const

const BY_CLASS: Record<WeaponClass, readonly TargetType[]> = {
  handgun: ALL_TARGET_TYPES,
  rifle: ALL_TARGET_TYPES,
  shotgun: ALL_TARGET_TYPES,
}

export function targetTypesForWeaponClass(wc: WeaponClass): readonly TargetType[] {
  return BY_CLASS[wc]
}

export function isTargetTypeForWeaponClass(type: TargetType, wc: WeaponClass): boolean {
  return BY_CLASS[wc].includes(type)
}

export function countTargetsOutsideWeaponClass(
  targets: readonly Target[],
  wc: WeaponClass,
): number {
  const allowed = new Set<TargetType>(BY_CLASS[wc])
  let n = 0
  for (const t of targets) {
    if (!allowed.has(t.type)) n++
  }
  return n
}
