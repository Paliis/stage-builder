import type { PlanDimensionLine, Vec2 } from './models'
import { clampVec2ToField } from './field'

const POINT_DEDUP_M = 0.03

/**
 * Кінець розміру вважається «на мішені», якщо ближче за цей радіус до її центру
 * (до кліку розміру без snap — запас під габарит паперу / пластини).
 */
export const PLAN_DIMENSION_TARGET_ATTACH_M = 0.6

export type PlanDimensionTargetMove = {
  /** Позиція центру мішені до цього кроку переміщення. */
  from: Vec2
  delta: Vec2
}

/** Осьовий прямокутник у метрах поля (зона копіювання / рамка). */
export type WorldAabb = {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

/** Частка довжини відрізка всередині AABB має перевищувати це, щоб розмір пішов у буфер. */
export const PLAN_DIMENSION_COPY_MAJORITY_FRAC = 0.5

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

/**
 * Зсуває кінці закріплених розмірів разом із мішенями: кінець, що був біля
 * центру мішені до кроку, отримує той самий delta (жорсткий зсув пари / розтяг однієї).
 */
export function shiftPlanDimensionsForTargetMoves(
  dims: readonly PlanDimensionLine[],
  moves: readonly PlanDimensionTargetMove[],
  widthM: number,
  heightM: number,
  attachTolM: number = PLAN_DIMENSION_TARGET_ATTACH_M,
): PlanDimensionLine[] {
  if (dims.length === 0 || moves.length === 0) return dims as PlanDimensionLine[]
  const meaningful = moves.filter((m) => m.delta.x !== 0 || m.delta.y !== 0)
  if (meaningful.length === 0) return dims as PlanDimensionLine[]

  return dims.map((d) => {
    const dA = deltaForAttachedEndpoint(d.endA, meaningful, attachTolM)
    const dB = deltaForAttachedEndpoint(d.endB, meaningful, attachTolM)
    if (!dA && !dB) return d
    const endA =
      dA ? clampVec2ToField({ x: d.endA.x + dA.x, y: d.endA.y + dA.y }, 0, widthM, heightM) : d.endA
    const endB =
      dB ? clampVec2ToField({ x: d.endB.x + dB.x, y: d.endB.y + dB.y }, 0, widthM, heightM) : d.endB
    if (endA.x === d.endA.x && endA.y === d.endA.y && endB.x === d.endB.x && endB.y === d.endB.y) {
      return d
    }
    return { ...d, endA, endB }
  })
}

function deltaForAttachedEndpoint(
  end: Vec2,
  moves: readonly PlanDimensionTargetMove[],
  attachTolM: number,
): Vec2 | null {
  let best: Vec2 | null = null
  let bestDist = attachTolM
  for (const m of moves) {
    const dist = Math.hypot(end.x - m.from.x, end.y - m.from.y)
    if (dist <= bestDist) {
      bestDist = dist
      best = m.delta
    }
  }
  return best
}

/** AABB за точками з опційним рівномірним відступом (м). */
export function worldAabbFromPoints(points: readonly Vec2[], padM = 0): WorldAabb | null {
  if (points.length === 0) return null
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const p of points) {
    minX = Math.min(minX, p.x)
    maxX = Math.max(maxX, p.x)
    minY = Math.min(minY, p.y)
    maxY = Math.max(maxY, p.y)
  }
  return {
    minX: minX - padM,
    maxX: maxX + padM,
    minY: minY - padM,
    maxY: maxY + padM,
  }
}

/**
 * Частка довжини відрізка [a→b], що лежить всередині AABB (включно з межею).
 * Нульова довжина: 1 якщо точка всередині, інакше 0.
 */
export function segmentLengthFractionInsideAabb(a: Vec2, b: Vec2, box: WorldAabb): number {
  const len = Math.hypot(b.x - a.x, b.y - a.y)
  if (len < 1e-9) {
    return pointInsideAabb(a, box) ? 1 : 0
  }
  const clipped = clipSegmentToAabb(a, b, box)
  if (!clipped) return 0
  return Math.hypot(clipped.b.x - clipped.a.x, clipped.b.y - clipped.a.y) / len
}

/** Розміри, у яких більше ніж `minFrac` довжини потрапляє в зону (типово >½). */
export function selectPlanDimensionsMajorityInAabb(
  dims: readonly PlanDimensionLine[],
  box: WorldAabb,
  minFrac: number = PLAN_DIMENSION_COPY_MAJORITY_FRAC,
): PlanDimensionLine[] {
  return dims.filter((d) => segmentLengthFractionInsideAabb(d.endA, d.endB, box) > minFrac)
}

function pointInsideAabb(p: Vec2, box: WorldAabb): boolean {
  return p.x >= box.minX && p.x <= box.maxX && p.y >= box.minY && p.y <= box.maxY
}

/** Liang–Barsky: відрізок, обрізаний по AABB, або null якщо немає перетину. */
function clipSegmentToAabb(a: Vec2, b: Vec2, box: WorldAabb): { a: Vec2; b: Vec2 } | null {
  const dx = b.x - a.x
  const dy = b.y - a.y
  let t0 = 0
  let t1 = 1
  const edges: [number, number][] = [
    [-dx, a.x - box.minX],
    [dx, box.maxX - a.x],
    [-dy, a.y - box.minY],
    [dy, box.maxY - a.y],
  ]
  for (const [p, q] of edges) {
    if (Math.abs(p) < 1e-12) {
      if (q < 0) return null
      continue
    }
    const r = q / p
    if (p < 0) {
      if (r > t1) return null
      if (r > t0) t0 = r
    } else {
      if (r < t0) return null
      if (r < t1) t1 = r
    }
  }
  return {
    a: { x: a.x + t0 * dx, y: a.y + t0 * dy },
    b: { x: a.x + t1 * dx, y: a.y + t1 * dy },
  }
}

function pointApproxEqual(a: Vec2, b: Vec2): boolean {
  return Math.hypot(a.x - b.x, a.y - b.y) <= POINT_DEDUP_M
}
