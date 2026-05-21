import type { RangeDistanceSign } from './models'

/** Підпис на табличці: лише цілі метри, максимум три цифри. */
export const RANGE_DISTANCE_SIGN_LABEL_MIN = 1
export const RANGE_DISTANCE_SIGN_LABEL_MAX = 999

/** Центр таблички по осі X на 2D-плані (ліворуч від поля), м. */
export const RANGE_DISTANCE_SIGN_PLAN_CENTER_X_M = -0.14

export function clampRangeDistanceSignLabelM(labelM: number): number {
  const n = Math.round(labelM)
  if (!Number.isFinite(n)) return RANGE_DISTANCE_SIGN_LABEL_MIN
  return Math.min(RANGE_DISTANCE_SIGN_LABEL_MAX, Math.max(RANGE_DISTANCE_SIGN_LABEL_MIN, n))
}

/**
 * У 3D табличку ставимо від лівого краю поля всередину (вісь X плану),
 * щоб вона не «висіла» на межі стейджа / периметра.
 */
export const RANGE_DISTANCE_SIGN_3D_PLAN_X_M = 1

/** Розмір видимої грані таблички в 3D (квадрат), м. */
export const RANGE_DISTANCE_SIGN_3D_FACE_M = 2.2

export function reclampRangeDistanceSignsToField(
  signs: readonly RangeDistanceSign[],
  fieldHeightM: number,
): RangeDistanceSign[] {
  const fh = Math.max(fieldHeightM, 0)
  return signs.map((s) => ({
    ...s,
    edgePositionYM: Math.min(Math.max(s.edgePositionYM, 0), fh),
    labelM: clampRangeDistanceSignLabelM(s.labelM),
  }))
}
