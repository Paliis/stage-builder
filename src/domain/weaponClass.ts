import type { Target, TargetType } from './models'

/**
 * Клас дисципліни IPSC для підбору мішеней у редакторі.
 * Набори спрощені (без жорсткої валідації правил змагання).
 */
export type WeaponClass = 'shotgun' | 'handgun' | 'rifle' | 'pcc' | 'mini_rifle'

/**
 * Порядок для селекторів у UI; ідентифікатори збігаються з `WEAPON_CLASS_ORDER`
 * портального каталогу та дисциплінами RO Helper.
 */
export const WEAPON_CLASS_VALUES: readonly WeaponClass[] = [
  'shotgun',
  'handgun',
  'rifle',
  'pcc',
  'mini_rifle',
]

/** Один набір для всіх класів зброї. */
export const ALL_TARGET_TYPES: readonly TargetType[] = [
  'paperIpscTwoPostGround',
  'paperIpscTwoPostStand50',
  'paperIpscTwoPostStand100',
  'paperA4TwoPostGround',
  'paperA4TwoPostStand50',
  'paperA4TwoPostStand100',
  'paperMiniIpscTwoPostGround',
  'paperMiniIpscTwoPostStand50',
  'paperMiniIpscTwoPostStand100',
  'metalPlate',
  'metalPlateStand50',
  'metalPlateStand100',
  'popper',
  'miniPopper',
  'gongSquare',
  'gongRound',
  'ceramicPlate',
  'swingerSinglePaper',
  'swingerDoublePaper',
  'swingerSingleCeramic',
  'swingerDoubleCeramic',
] as const

const BY_CLASS: Record<WeaponClass, readonly TargetType[]> = {
  shotgun: ALL_TARGET_TYPES,
  handgun: ALL_TARGET_TYPES,
  rifle: ALL_TARGET_TYPES,
  pcc: ALL_TARGET_TYPES,
  mini_rifle: ALL_TARGET_TYPES,
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
