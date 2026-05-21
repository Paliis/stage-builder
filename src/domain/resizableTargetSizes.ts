import type { GongSizeCm, MetalPlateRectSideCm, Target, TargetType } from './models'
import { isGongTargetType } from './gongSpec'
import { isSquareSteelPlateTargetType } from './targetSpecs'

export const METAL_PLATE_SIDE_CM_OPTIONS: readonly MetalPlateRectSideCm[] = [15, 20, 30]
export const GONG_SIZE_CM_OPTIONS: readonly GongSizeCm[] = [30, 40, 50]

export const TOOLBAR_SQUARE_STEEL_TYPES: readonly TargetType[] = [
  'metalPlate',
  'metalPlateStand50',
  'metalPlateStand100',
]

export const TOOLBAR_GONG_TYPES: readonly TargetType[] = ['gongSquare', 'gongRound']

export const TOOLBAR_POPPER_TYPES: readonly TargetType[] = ['popper', 'miniPopper']

export function nextMetalPlateSideCm(cur: MetalPlateRectSideCm, dir: 1 | -1): MetalPlateRectSideCm {
  const idx = METAL_PLATE_SIDE_CM_OPTIONS.indexOf(cur)
  const i = idx >= 0 ? idx : 0
  const next =
    dir === 1
      ? METAL_PLATE_SIDE_CM_OPTIONS[(i + 1) % METAL_PLATE_SIDE_CM_OPTIONS.length]!
      : METAL_PLATE_SIDE_CM_OPTIONS[
          (i + METAL_PLATE_SIDE_CM_OPTIONS.length - 1) % METAL_PLATE_SIDE_CM_OPTIONS.length
        ]!
  return next
}

export function nextGongSizeCm(cur: GongSizeCm, dir: 1 | -1): GongSizeCm {
  const idx = GONG_SIZE_CM_OPTIONS.indexOf(cur)
  const i = idx >= 0 ? idx : 0
  const next =
    dir === 1
      ? GONG_SIZE_CM_OPTIONS[(i + 1) % GONG_SIZE_CM_OPTIONS.length]!
      : GONG_SIZE_CM_OPTIONS[(i + GONG_SIZE_CM_OPTIONS.length - 1) % GONG_SIZE_CM_OPTIONS.length]!
  return next
}

export function targetUsesMetalPlateSize(type: TargetType): boolean {
  return isSquareSteelPlateTargetType(type)
}

export function targetUsesGongSize(type: TargetType): boolean {
  return isGongTargetType(type)
}

/** Чи можна замінити тип уже виділеної мішені кнопкою палітри (та сама NS-група). */
export function canRetargetSelectedToType(
  current: Target,
  nextType: TargetType,
  isNoShoot: boolean,
): boolean {
  if (current.isNoShoot !== isNoShoot) return false
  if (isSquareSteelPlateTargetType(current.type) && isSquareSteelPlateTargetType(nextType)) return true
  if (isGongTargetType(current.type) && isGongTargetType(nextType)) return true
  return false
}
