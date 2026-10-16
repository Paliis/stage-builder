import {
  clampVec2ToField,
  clampVec2ToFieldBox,
  propFieldHalfExtentM,
  PROP_PLACEMENT_SNAP_M,
  TARGET_PLACEMENT_SNAP_M,
  snapVec2,
} from './field'
import type { PlanDimensionLine, Prop, Target, Vec2 } from './models'
import {
  PLAN_DIMENSION_TARGET_ATTACH_M,
  selectPlanDimensionsMajorityInAabb,
  worldAabbFromPoints,
} from './planDimensions'

/** Знімок виділення для Ctrl+C / вставки. */
export type PlanClipboardSnapshot = {
  targets: Target[]
  props: Prop[]
  planDimensions: PlanDimensionLine[]
}

/** Центр мас усіх позицій (для вирівнювання вставки). */
export function centroidOfEntities(targets: readonly Target[], props: readonly Prop[]): Vec2 {
  const pts: Vec2[] = [...targets.map((t) => t.position), ...props.map((p) => p.position)]
  if (pts.length === 0) return { x: 0, y: 0 }
  let sx = 0
  let sy = 0
  for (const p of pts) {
    sx += p.x
    sy += p.y
  }
  const n = pts.length
  return { x: sx / n, y: sy / n }
}

/**
 * Зона копіювання = AABB центрів виділених сутностей + pad під кінці розмірів біля мішеней.
 * Розмір потрапляє в буфер, якщо більше половини довжини лінії лежить у цій зоні.
 */
export function planDimensionsForCopyZone(
  dims: readonly PlanDimensionLine[],
  targets: readonly Target[],
  props: readonly Prop[],
): PlanDimensionLine[] {
  const pts = [...targets.map((t) => t.position), ...props.map((p) => p.position)]
  const box = worldAabbFromPoints(pts, PLAN_DIMENSION_TARGET_ATTACH_M)
  if (!box) return []
  return selectPlanDimensionsMajorityInAabb(dims, box).map((d) => structuredClone(d))
}

/** Копії зі зміщенням; clamp + snap як при ручному перетягуванні. */
export function shiftClonesForPaste(
  targets: readonly Target[],
  props: readonly Prop[],
  delta: Vec2,
  fieldWidthM: number,
  fieldHeightM: number,
  planDimensions: readonly PlanDimensionLine[] = [],
): { targets: Target[]; props: Prop[]; planDimensions: PlanDimensionLine[] } {
  const nextTargets: Target[] = targets.map((t) => {
    const raw = { x: t.position.x + delta.x, y: t.position.y + delta.y }
    const c = clampVec2ToField(snapVec2(raw, TARGET_PLACEMENT_SNAP_M), 1, fieldWidthM, fieldHeightM)
    return { ...t, position: c }
  })
  const nextProps: Prop[] = props.map((p) => {
    const raw = { x: p.position.x + delta.x, y: p.position.y + delta.y }
    const c = clampVec2ToFieldBox(
      snapVec2(raw, PROP_PLACEMENT_SNAP_M),
      propFieldHalfExtentM(p.sizeM, p.rotationRad),
      fieldWidthM,
      fieldHeightM,
    )
    return { ...p, position: c }
  })
  const nextDims: PlanDimensionLine[] = planDimensions.map((d) => ({
    ...d,
    endA: clampVec2ToField(
      { x: d.endA.x + delta.x, y: d.endA.y + delta.y },
      0,
      fieldWidthM,
      fieldHeightM,
    ),
    endB: clampVec2ToField(
      { x: d.endB.x + delta.x, y: d.endB.y + delta.y },
      0,
      fieldWidthM,
      fieldHeightM,
    ),
  }))
  return { targets: nextTargets, props: nextProps, planDimensions: nextDims }
}

export const PLAN_CLIPBOARD_MIME = 'application/x-stage-builder-entities+json'
