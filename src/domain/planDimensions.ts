import type { PlanDimensionLine, StageEntityRef } from './models'
import { refKey } from './activations'

export function filterPlanDimensionsAfterRemoveTarget(
  dims: readonly PlanDimensionLine[],
  targetId: string,
): PlanDimensionLine[] {
  return dims.filter(
    (d) =>
      !(d.from.kind === 'target' && d.from.id === targetId) &&
      !(d.to.kind === 'target' && d.to.id === targetId),
  )
}

export function filterPlanDimensionsAfterRemoveProp(
  dims: readonly PlanDimensionLine[],
  propId: string,
): PlanDimensionLine[] {
  return dims.filter(
    (d) =>
      !(d.from.kind === 'prop' && d.from.id === propId) &&
      !(d.to.kind === 'prop' && d.to.id === propId),
  )
}

/** Ключ для виявлення дублікату лінії (A→B дорівнює B→A). */
export function planDimensionUnorderedPairKey(from: StageEntityRef, to: StageEntityRef): string {
  const k1 = refKey(from)
  const k2 = refKey(to)
  return k1 <= k2 ? `${k1}\0${k2}` : `${k2}\0${k1}`
}
