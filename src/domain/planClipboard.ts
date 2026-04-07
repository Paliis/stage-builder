import {
  clampVec2ToField,
  PROP_PLACEMENT_SNAP_M,
  TARGET_PLACEMENT_SNAP_M,
  snapVec2,
} from './field'
import type { Prop, Target, Vec2 } from './models'

function propPasteMarginM(p: Prop): number {
  return Math.max(p.sizeM.x, p.sizeM.y) / 2 + 0.16
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

/** Копії зі зміщенням; clamp + snap як при ручному перетягуванні. */
export function shiftClonesForPaste(
  targets: readonly Target[],
  props: readonly Prop[],
  delta: Vec2,
  fieldWidthM: number,
  fieldHeightM: number,
): { targets: Target[]; props: Prop[] } {
  const nextTargets: Target[] = targets.map((t) => {
    const raw = { x: t.position.x + delta.x, y: t.position.y + delta.y }
    const c = clampVec2ToField(snapVec2(raw, TARGET_PLACEMENT_SNAP_M), 1, fieldWidthM, fieldHeightM)
    return { ...t, position: c }
  })
  const nextProps: Prop[] = props.map((p) => {
    const raw = { x: p.position.x + delta.x, y: p.position.y + delta.y }
    const m = propPasteMarginM(p)
    const c = clampVec2ToField(snapVec2(raw, PROP_PLACEMENT_SNAP_M), m, fieldWidthM, fieldHeightM)
    return { ...p, position: c }
  })
  return { targets: nextTargets, props: nextProps }
}

export const PLAN_CLIPBOARD_MIME = 'application/x-stage-builder-entities+json'
