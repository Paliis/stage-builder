import type { Vec2 } from './models'

export type SafetyAngles = {
  leftDeg: number
  rightDeg: number
}

/**
 * Parse "90/90/90" or "90/90" into left/right angles in degrees.
 * Format: left/right/top — we use left and right for the 2D plan.
 * Returns null if the string cannot be parsed.
 */
export function parseSafetyAngles(text: string): SafetyAngles | null {
  const parts = text
    .split('/')
    .map((s) => s.trim())
    .filter(Boolean)
  if (parts.length < 2) return null
  const left = Number(parts[0])
  const right = Number(parts[1])
  if (!Number.isFinite(left) || !Number.isFinite(right)) return null
  if (left <= 0 || right <= 0) return null
  return { leftDeg: left, rightDeg: right }
}

/**
 * Check whether a target position is inside the safety zone wedge.
 * The shooting direction is from startPos towards +Y (downrange).
 * Left angle opens to the left of the +Y axis, right to the right.
 */
export function isTargetInSafetyZone(
  targetPos: Vec2,
  startPos: Vec2,
  angles: SafetyAngles,
): boolean {
  const dx = targetPos.x - startPos.x
  const dy = targetPos.y - startPos.y
  if (Math.abs(dx) < 1e-6 && Math.abs(dy) < 1e-6) return true
  const angleRad = Math.atan2(dx, dy)
  const leftLimitRad = (angles.leftDeg * Math.PI) / 180
  const rightLimitRad = (angles.rightDeg * Math.PI) / 180
  return angleRad >= -leftLimitRad && angleRad <= rightLimitRad
}
