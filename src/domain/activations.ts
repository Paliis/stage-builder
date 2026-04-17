import type { ActivationEdge, Prop, StageEntityRef, Target, Vec2 } from './models'
import { propHeightM, propOutlineWorld } from './propGeometry'
import {
  targetActivationLabelWorldYM,
  targetFootprintWorld,
} from './targetSpecs'

export function refKey(r: StageEntityRef): string {
  return `${r.kind}:${r.id}`
}

export function refsEqual(a: StageEntityRef, b: StageEntityRef): boolean {
  return a.kind === b.kind && a.id === b.id
}

function sortRefsForNumbering(refs: StageEntityRef[]): StageEntityRef[] {
  const targets = refs
    .filter((r) => r.kind === 'target')
    .sort((a, b) => a.id.localeCompare(b.id))
  const props = refs
    .filter((r) => r.kind === 'prop')
    .sort((a, b) => a.id.localeCompare(b.id))
  return [...targets, ...props]
}

/** Унікальні учасники ребер; порядок нумерації — усі мішені за id, потім увесь реквізит за id. */
export function collectParticipantRefs(edges: readonly ActivationEdge[]): StageEntityRef[] {
  const m = new Map<string, StageEntityRef>()
  for (const e of edges) {
    m.set(refKey(e.from), e.from)
    m.set(refKey(e.to), e.to)
  }
  return sortRefsForNumbering([...m.values()])
}

/** Ключ `refKey` → глобальний номер 1…N. */
export function globalActivationNumberMap(edges: readonly ActivationEdge[]): Map<string, number> {
  const ordered = collectParticipantRefs(edges)
  const map = new Map<string, number>()
  ordered.forEach((r, i) => map.set(refKey(r), i + 1))
  return map
}

export function resolveEntityRef(
  ref: StageEntityRef,
  targets: readonly Target[],
  props: readonly Prop[],
): Target | Prop | null {
  if (ref.kind === 'target') return targets.find((t) => t.id === ref.id) ?? null
  return props.find((p) => p.id === ref.id) ?? null
}

/** Центр підпису на плані: позиція сутності (як у 2D). */
export function planAnchorWorld(
  ref: StageEntityRef,
  targets: readonly Target[],
  props: readonly Prop[],
): Vec2 | null {
  const e = resolveEntityRef(ref, targets, props)
  if (!e) return null
  return e.position
}

function normalize2(v: Vec2): Vec2 {
  const l = Math.hypot(v.x, v.y) || 1
  return { x: v.x / l, y: v.y / l }
}

function polygonSupportRadiusM(poly: Vec2[], center: Vec2, dir: Vec2): number {
  let max = 0
  for (const p of poly) {
    const dx = p.x - center.x
    const dy = p.y - center.y
    max = Math.max(max, dx * dir.x + dy * dir.y)
  }
  return Math.max(max, 1e-4)
}

/**
 * Промінь з центру сутності в напрямку `dir` (одиничний) — перетин з контуром «підошви» на плані.
 * Точка на межі об’єкта, найближча до напрямку на іншого учасника (вихід у бік «іншого»).
 */
function planFootprintExitTowardDir(
  ref: StageEntityRef,
  dir: Vec2,
  targets: readonly Target[],
  props: readonly Prop[],
): Vec2 | null {
  const e = resolveEntityRef(ref, targets, props)
  if (!e) return null
  const center = e.position
  const poly =
    ref.kind === 'target'
      ? targetFootprintWorld(e as Target).poly
      : propOutlineWorld(e as Prop)
  if (poly.length < 2) return null
  const du = normalize2(dir)
  let bestT = Infinity
  const n = poly.length
  for (let i = 0; i < n; i++) {
    const a = poly[i]!
    const b = poly[(i + 1) % n]!
    const t = raySegmentForwardParam(center, du, a, b)
    if (t !== null && t > 1e-5 && t < bestT) bestT = t
  }
  if (bestT !== Infinity) {
    return { x: center.x + du.x * bestT, y: center.y + du.y * bestT }
  }
  const r = polygonSupportRadiusM(poly, center, du)
  return { x: center.x + du.x * r, y: center.y + du.y * r }
}

/** Промінь center + t·dir, t>0, перетин із відрізком [a,b]. */
function raySegmentForwardParam(origin: Vec2, dir: Vec2, a: Vec2, b: Vec2): number | null {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const det = dir.x * dy - dir.y * dx
  if (Math.abs(det) < 1e-12) return null
  const rx = a.x - origin.x
  const ry = a.y - origin.y
  const t = (rx * dy - ry * dx) / det
  const s = (rx * dir.y - ry * dir.x) / det
  if (t < 1e-5) return null
  if (s < -1e-5 || s > 1 + 1e-5) return null
  return t
}

/**
 * Точка на контурі об’єкта `from` у бік `to` (для ліній активації 2D/3D).
 */
export function activationPlanPointToward(
  from: StageEntityRef,
  to: StageEntityRef,
  targets: readonly Target[],
  props: readonly Prop[],
): Vec2 | null {
  const cFrom = planAnchorWorld(from, targets, props)
  const cTo = planAnchorWorld(to, targets, props)
  if (!cFrom || !cTo) return null
  const dir = { x: cTo.x - cFrom.x, y: cTo.y - cFrom.y }
  if (Math.hypot(dir.x, dir.y) < 1e-9) return cFrom
  return planFootprintExitTowardDir(from, dir, targets, props) ?? cFrom
}

/**
 * Горизонтальна позиція підпису номера: на межі «підошви» у бік сусідів по графу.
 */
export function activationPlanLabelPoint(
  ref: StageEntityRef,
  edges: readonly ActivationEdge[],
  targets: readonly Target[],
  props: readonly Prop[],
): Vec2 | null {
  const selfCenter = planAnchorWorld(ref, targets, props)
  if (!selfCenter) return null
  const neighbors: StageEntityRef[] = []
  for (const e of edges) {
    if (refKey(e.from) === refKey(ref)) neighbors.push(e.to)
    else if (refKey(e.to) === refKey(ref)) neighbors.push(e.from)
  }
  if (neighbors.length === 0) return selfCenter
  if (neighbors.length === 1) {
    return (
      activationPlanPointToward(ref, neighbors[0]!, targets, props) ?? selfCenter
    )
  }
  let sx = 0
  let sy = 0
  let c = 0
  for (const n of neighbors) {
    const p = planAnchorWorld(n, targets, props)
    if (p) {
      sx += p.x
      sy += p.y
      c++
    }
  }
  if (c === 0) return selfCenter
  const dir = { x: sx / c - selfCenter.x, y: sy / c - selfCenter.y }
  if (Math.hypot(dir.x, dir.y) < 1e-9) return selfCenter
  return planFootprintExitTowardDir(ref, dir, targets, props) ?? selfCenter
}

/** Висота Y у світі Three.js для підпису номера активації (над лицем / над реквізитом). */
export function activationEntityLabelWorldYM(
  ref: StageEntityRef,
  targets: readonly Target[],
  props: readonly Prop[],
): number {
  const e = resolveEntityRef(ref, targets, props)
  if (!e) return 1.45
  if ('sizeM' in e) return propHeightM(e as Prop) + 0.22
  return targetActivationLabelWorldYM(e as Target)
}

export function filterActivationsValid(
  edges: readonly ActivationEdge[],
  targets: readonly Target[],
  props: readonly Prop[],
): ActivationEdge[] {
  return edges.filter((e) => {
    if (refsEqual(e.from, e.to)) return false
    return resolveEntityRef(e.from, targets, props) && resolveEntityRef(e.to, targets, props)
  })
}

export function dedupeActivationEdges(edges: readonly ActivationEdge[]): ActivationEdge[] {
  const seen = new Set<string>()
  const out: ActivationEdge[] = []
  for (const e of edges) {
    const k = `${refKey(e.from)}->${refKey(e.to)}`
    if (seen.has(k)) continue
    seen.add(k)
    out.push(e)
  }
  return out
}

export function filterActivationsAfterRemoveTarget(
  edges: readonly ActivationEdge[],
  targetId: string,
): ActivationEdge[] {
  return edges.filter((e) => !(e.from.kind === 'target' && e.from.id === targetId) && !(e.to.kind === 'target' && e.to.id === targetId))
}

export function filterActivationsAfterRemoveProp(
  edges: readonly ActivationEdge[],
  propId: string,
): ActivationEdge[] {
  return edges.filter((e) => !(e.from.kind === 'prop' && e.from.id === propId) && !(e.to.kind === 'prop' && e.to.id === propId))
}
