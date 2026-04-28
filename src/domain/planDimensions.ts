import type { PlanDimensionLine, Vec2 } from './models'
import { clampVec2ToField } from './field'

const POINT_DEDUP_M = 0.03

export function reclampPlanDimensionsToField(
  dims: readonly PlanDimensionLine[],
  widthM: number,
  heightM: number,
): PlanDimensionLine[] {
  return dims.map((d) => ({
    ...d,
    endA: clampVec2ToField(d.endA, 0, widthM, heightM),
    endB: clampVec2ToField(d.endB, 0, widthM, heightM),
  }))
}

/** Дублікат тієї ж лінії (кінці збігаються з урахуванням порядку). */
export function planDimensionsDuplicateUnordered(
  d: PlanDimensionLine,
  endA: Vec2,
  endB: Vec2,
): boolean {
  const ap = pointApproxEqual(d.endA, endA) && pointApproxEqual(d.endB, endB)
  const swapped = pointApproxEqual(d.endA, endB) && pointApproxEqual(d.endB, endA)
  return ap || swapped
}

function pointApproxEqual(a: Vec2, b: Vec2): boolean {
  return Math.hypot(a.x - b.x, a.y - b.y) <= POINT_DEDUP_M
}
