import type { Prop, Target } from './models'
import { reclampTargetsProps } from './fieldEntityReclamp'

const EPS = 1e-4

function posChanged(a: { x: number; y: number }, b: { x: number; y: number }): boolean {
  return Math.abs(a.x - b.x) > EPS || Math.abs(a.y - b.y) > EPS
}

/**
 * Чи зміна розміру поля (після reclamp) змістить хоча б один об’єкт або прибере реквізит (міграція).
 */
export function fieldResizeChangesEntities(
  targets: readonly Target[],
  props: readonly Prop[],
  newFw: number,
  newFh: number,
): boolean {
  if (targets.length === 0 && props.length === 0) return false

  const { targets: nt, props: np } = reclampTargetsProps(
    targets.map((t) => ({ ...t })),
    props.map((p) => ({ ...p })),
    newFw,
    newFh,
  )

  if (nt.length !== targets.length) return true
  if (np.length !== props.length) return true

  for (let i = 0; i < targets.length; i++) {
    if (posChanged(targets[i]!.position, nt[i]!.position)) return true
  }
  for (let i = 0; i < props.length; i++) {
    if (props[i]!.id !== np[i]!.id) return true
    if (posChanged(props[i]!.position, np[i]!.position)) return true
  }
  return false
}
