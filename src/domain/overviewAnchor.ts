import type { Prop, Vec2 } from './models'
import { faultLineEndPointsWorld } from './propGeometry'

/**
 * Для огляду 3D: серед кандидатів обираємо точку з мінімальним Y (нижня на плані, ближче до «низу» поля),
 * при рівності Y — з максимальним X (правіша).
 */
function pickMinYMaxX(candidates: readonly Vec2[]): Vec2 | null {
  if (candidates.length === 0) return null
  let best = candidates[0]!
  for (let i = 1; i < candidates.length; i++) {
    const q = candidates[i]!
    if (q.y < best.y - 1e-9) best = q
    else if (Math.abs(q.y - best.y) <= 1e-9 && q.x > best.x) best = q
  }
  return best
}

/**
 * Точка на плані (м), навколо якої центрується огляд 3D:
 * - якщо є стартові позиції — центр обраної (мінімальний Y, при рівності — максимальний X);
 * - інакше якщо є штрафні лінії (`faultLine`) — серед усіх кінців усіх ліній та сама логіка (нижня, при рівності — права);
 * - інакше `null` (викликати має підставити центр поля).
 */
export function computeOverviewAnchorWorld2d(props: readonly Prop[]): Vec2 | null {
  const starts = props.filter((p): p is Prop & { type: 'startPosition' } => p.type === 'startPosition')
  if (starts.length > 0) {
    return pickMinYMaxX(starts.map((p) => p.position))!
  }
  const ends: Vec2[] = []
  for (const p of props) {
    if (p.type !== 'faultLine') continue
    const e = faultLineEndPointsWorld(p)
    if (e) {
      ends.push(e.neg, e.pos)
    }
  }
  if (ends.length > 0) {
    return pickMinYMaxX(ends)!
  }
  return null
}

/** Примітив для залежностей React: змінюється лише при зміні стартів / штрафних ліній. */
export function overviewAnchorRelevantSignature(props: readonly Prop[]): string {
  const parts: string[] = []
  for (const p of props) {
    if (p.type === 'startPosition') {
      parts.push(`S:${p.id}:${p.position.x}:${p.position.y}`)
    }
    if (p.type === 'faultLine') {
      parts.push(`F:${p.id}:${p.position.x}:${p.position.y}:${p.rotationRad}:${p.sizeM.x}`)
    }
  }
  parts.sort()
  return parts.join(';')
}
