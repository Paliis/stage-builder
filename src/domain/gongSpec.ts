/**
 * Гонг: рамка з трьох червоних палок (дві вертикальні + перекладина), помаранчева пластина на ланцюгах.
 * Розмір пластини — 30 або 40 см (квадрат або коло).
 */
import type { Target, TargetType, Vec2 } from './models'

const CM = 0.01

export const GONG_FRAME_COLOR = '#e53935'
export const GONG_PLATE_COLOR = '#ff6600'
export const GONG_CHAIN_COLOR = '#9ca3af'

/** Товщина палки рамки (діаметр циліндра в 3D). */
export const GONG_POLE_RADIUS_M = 0.014
/** Довжина «ланцюга» між пластиною й перекладиною (м). */
export const GONG_CHAIN_LEN_M = 0.25
/** Висота вертикальних стійок рамки (м). */
export const GONG_FRAME_HEIGHT_M = 1.0
/** Розмах перекладини між стійками (м). */
export const GONG_FRAME_WIDTH_M = 1.0
export const GONG_FRAME_HALF_WIDTH_M = GONG_FRAME_WIDTH_M * 0.5

export function isGongTargetType(type: TargetType): boolean {
  return type === 'gongSquare' || type === 'gongRound'
}

export function isGongSquareTargetType(type: TargetType): boolean {
  return type === 'gongSquare'
}

export function isGongRoundTargetType(type: TargetType): boolean {
  return type === 'gongRound'
}

export function gongPlateSizeM(t: Target): number {
  if (!isGongTargetType(t.type)) return 0.3
  return (t.gongSizeCm ?? 30) * CM
}

export function gongFrameHalfWidthM(): number {
  return GONG_FRAME_HALF_WIDTH_M
}

/** Локальні Y: низ пластини (центр пластини = 0,0). */
export function gongPlateBottomLocalY(t: Target): number {
  return -gongPlateSizeM(t) * 0.5
}

export function gongPlateTopLocalY(t: Target): number {
  return gongPlateSizeM(t) * 0.5
}

export function gongTopBarLocalY(t: Target): number {
  return gongPlateTopLocalY(t) + GONG_CHAIN_LEN_M
}

/** Низ стійок: перекладина мінус фіксована висота рамки 1 м. */
export function gongFrameBottomLocalY(t: Target): number {
  return gongTopBarLocalY(t) - GONG_FRAME_HEIGHT_M
}

export function gongFrameHeightM(): number {
  return GONG_FRAME_HEIGHT_M
}

/** Точки кріплення ланцюгів на верхньому краї пластини (локально). */
export function gongChainAnchorsLocalM(t: Target): Vec2[] {
  const top = gongPlateTopLocalY(t)
  const half = gongPlateSizeM(t) * 0.35
  return [
    { x: -half, y: top },
    { x: half, y: top },
  ]
}

/** Позиції вертикальних стійок рамки (локально, x). */
export function gongFramePostXsLocalM(): [number, number] {
  const hw = gongFrameHalfWidthM()
  return [-hw, hw]
}

export type GongFrame2DSpec = {
  /** Вертикальні стійки: [низ, верх]. */
  postsWorld: { from: Vec2; to: Vec2 }[]
  /** Горизонтальна перекладина. */
  topBarWorld: { from: Vec2; to: Vec2 }
  /** Ланцюги до пластини. */
  chainsWorld: { from: Vec2; to: Vec2 }[]
}

function localToWorld(lx: number, ly: number, cx: number, cy: number, rot: number): Vec2 {
  const c = Math.cos(rot)
  const s = Math.sin(rot)
  return {
    x: cx + lx * c - ly * s,
    y: cy + lx * s + ly * c,
  }
}

export function gongFrame2DSpecWorld(t: Target): GongFrame2DSpec | null {
  if (!isGongTargetType(t.type)) return null
  const { x: cx, y: cy } = t.position
  const rot = t.rotationRad
  const bottom = gongFrameBottomLocalY(t)
  const topBar = gongTopBarLocalY(t)
  const [xL, xR] = gongFramePostXsLocalM()
  const postsWorld = [
    { from: localToWorld(xL, bottom, cx, cy, rot), to: localToWorld(xL, topBar, cx, cy, rot) },
    { from: localToWorld(xR, bottom, cx, cy, rot), to: localToWorld(xR, topBar, cx, cy, rot) },
  ]
  const topBarWorld = {
    from: localToWorld(xL, topBar, cx, cy, rot),
    to: localToWorld(xR, topBar, cx, cy, rot),
  }
  const chainsWorld = gongChainAnchorsLocalM(t).map((a) => ({
    from: localToWorld(a.x, topBar, cx, cy, rot),
    to: localToWorld(a.x, a.y, cx, cy, rot),
  }))
  return { postsWorld, topBarWorld, chainsWorld }
}
