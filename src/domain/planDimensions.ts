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

function pointApproxEqual(a: Vec2, b: Vec2): boolean {
  return Math.hypot(a.x - b.x, a.y - b.y) <= POINT_DEDUP_M
}
