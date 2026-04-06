/**
 * Рухома мішень «ківак» (swinger): план топ-даун — основа X, стійка, поворотна балка, одна або дві мішені.
 */
import type { Target, TargetType, Vec2 } from './models'
import { CERAMIC_RADIUS_M } from './ceramicPlateSpec'

const CM = 0.01

function diagramToLocalMeters(xd: number, yd: number, cxCm: number, cyCm: number): Vec2 {
  return {
    x: (xd - cxCm) * CM,
    y: (cyCm - yd) * CM,
  }
}

function ipscClassicOutlineLocalM(): Vec2[] {
  const cx = 22.5
  const cy = 28.5
  const pts: [number, number][] = [
    [15, 0],
    [30, 0],
    [45, 19],
    [45, 38],
    [30, 57],
    [15, 57],
    [0, 38],
    [0, 19],
  ]
  return pts.map(([xa, ya]) => diagramToLocalMeters(xa, ya, cx, cy))
}

function circleOutlineLocal(r: number, n: number): Vec2[] {
  const out: Vec2[] = []
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    out.push({ x: Math.cos(a) * r, y: Math.sin(a) * r })
  }
  return out
}

function toWorld(pts: Vec2[], cx: number, cy: number, rot: number): Vec2[] {
  const c = Math.cos(rot)
  const s = Math.sin(rot)
  return pts.map(({ x: lx, y: ly }) => ({
    x: cx + lx * c - ly * s,
    y: cy + lx * s + ly * c,
  }))
}

export const SWINGER_TYPES = new Set<TargetType>([
  'swingerSinglePaper',
  'swingerDoublePaper',
  'swingerSingleCeramic',
  'swingerDoubleCeramic',
])

export function isSwingerTargetType(type: TargetType): boolean {
  return SWINGER_TYPES.has(type)
}

export function swingerIsPaperLoad(type: TargetType): boolean {
  return type === 'swingerSinglePaper' || type === 'swingerDoublePaper'
}

/** Скільки мішеней на вузлі ківак для лічильників (подвійна — два важелі). */
export function swingerTargetFaceCount(type: TargetType): number {
  if (type === 'swingerDoublePaper' || type === 'swingerDoubleCeramic') return 2
  if (isSwingerTargetType(type)) return 1
  return 0
}

/** Півдіагональ ніг X-основи (м). */
const BASE_L = 0.36
/** Стійка: півширина (м), низ/верх по локальній Y (удвічі вужча за попереднє). */
const POST_HW = 0.018
const POST_Y0 = 0.02
const POST_Y1 = 0.34
/** Балка на плані: Y центру, півдовжина по X (подвійна) або сегмент по Y (одинарна). */
const BAR_Y = 0.31
const DOUBLE_HALF = 0.58
const SINGLE_ARM_LEN = 0.52

/** Спільні розміри для 3D (узгоджені з планом). */
export const SWINGER_DIM = {
  baseL: BASE_L,
  barY: BAR_Y,
  doubleHalf: DOUBLE_HALF,
  singleArmLen: SINGLE_ARM_LEN,
  postY0: POST_Y0,
  postY1: POST_Y1,
} as const
/** Центри мішеней у локальній системі об’єкта (план, м). */
export function swingerFaceCentersLocal(t: Target): Vec2[] {
  switch (t.type) {
    case 'swingerDoublePaper':
    case 'swingerDoubleCeramic':
      return [
        { x: -DOUBLE_HALF, y: BAR_Y },
        { x: DOUBLE_HALF, y: BAR_Y },
      ]
    case 'swingerSinglePaper':
    case 'swingerSingleCeramic':
      return [{ x: 0, y: BAR_Y + SINGLE_ARM_LEN }]
    default:
      return []
  }
}

function faceOutlineAtCenter(type: TargetType, center: Vec2): Vec2[] {
  const paper = swingerIsPaperLoad(type)
  if (paper) {
    return ipscClassicOutlineLocalM().map((p) => ({
      x: p.x + center.x,
      y: p.y + center.y,
    }))
  }
  return circleOutlineLocal(CERAMIC_RADIUS_M, 28).map((p) => ({
    x: p.x + center.x,
    y: p.y + center.y,
  }))
}

function barQuadLocal(t: Target): Vec2[] {
  const hw = 0.014
  switch (t.type) {
    case 'swingerDoublePaper':
    case 'swingerDoubleCeramic': {
      const hb = 0.011
      const bx0 = -DOUBLE_HALF - 0.06
      const bx1 = DOUBLE_HALF + 0.06
      return [
        { x: bx0, y: BAR_Y - hb },
        { x: bx1, y: BAR_Y - hb },
        { x: bx1, y: BAR_Y + hb },
        { x: bx0, y: BAR_Y + hb },
      ]
    }
    case 'swingerSinglePaper':
    case 'swingerSingleCeramic': {
      const hb = 0.011
      const y0 = BAR_Y - hb
      const y1 = BAR_Y + SINGLE_ARM_LEN + hb
      return [
        { x: -hw, y: y0 },
        { x: hw, y: y0 },
        { x: hw, y: y1 },
        { x: -hw, y: y1 },
      ]
    }
    default:
      return []
  }
}

function postQuadLocal(): Vec2[] {
  return [
    { x: -POST_HW, y: POST_Y0 },
    { x: POST_HW, y: POST_Y0 },
    { x: POST_HW, y: POST_Y1 },
    { x: -POST_HW, y: POST_Y1 },
  ]
}

function crossBaseSegmentsLocal(): [Vec2, Vec2][] {
  return [
    [{ x: -BASE_L, y: -BASE_L }, { x: BASE_L, y: BASE_L }],
    [{ x: -BASE_L, y: BASE_L }, { x: BASE_L, y: -BASE_L }],
  ]
}

function crossProduct(o: Vec2, a: Vec2, b: Vec2): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
}

export function convexHull2D(points: Vec2[]): Vec2[] {
  const nIn = points.length
  if (nIn <= 2) return [...points]
  const pts = [...points].sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x))
  const lower: Vec2[] = []
  for (const p of pts) {
    while (lower.length >= 2 && crossProduct(lower[lower.length - 2]!, lower[lower.length - 1]!, p) <= 0) {
      lower.pop()
    }
    lower.push(p)
  }
  const upper: Vec2[] = []
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i]!
    while (upper.length >= 2 && crossProduct(upper[upper.length - 2]!, upper[upper.length - 1]!, p) <= 0) {
      upper.pop()
    }
    upper.push(p)
  }
  upper.pop()
  lower.pop()
  return lower.concat(upper)
}

export function swingerFootprintHullLocal(t: Target): Vec2[] {
  const pts: Vec2[] = [
    { x: -BASE_L, y: -BASE_L },
    { x: BASE_L, y: BASE_L },
    { x: -BASE_L, y: BASE_L },
    { x: BASE_L, y: -BASE_L },
    ...postQuadLocal(),
    ...barQuadLocal(t),
  ]
  for (const c of swingerFaceCentersLocal(t)) {
    pts.push(...faceOutlineAtCenter(t.type, c))
  }
  return convexHull2D(pts)
}

function polygonMaxRadiusM(pts: Vec2[]): number {
  let m = 0
  for (const p of pts) m = Math.max(m, Math.hypot(p.x, p.y))
  return m
}

export function swingerBoundsRadiusM(t: Target): number {
  return polygonMaxRadiusM(swingerFootprintHullLocal(t))
}

export type Swinger2DDrawSpec = {
  baseSegsWorld: [Vec2, Vec2][]
  postWorld: Vec2[]
  barWorld: Vec2[]
  counterWorld: { cx: number; cy: number; r: number } | null
  facesWorld: { outline: Vec2[]; isCeramic: boolean }[]
  labelWorld: Vec2
}

export function swinger2DDrawSpecWorld(t: Target): Swinger2DDrawSpec | null {
  if (!isSwingerTargetType(t.type)) return null
  const { x: cx, y: cy } = t.position
  const rot = t.rotationRad
  const centers = swingerFaceCentersLocal(t)
  const baseSegsWorld = crossBaseSegmentsLocal().map(
    ([a, b]) => [toWorld([a], cx, cy, rot)[0]!, toWorld([b], cx, cy, rot)[0]!] as [Vec2, Vec2],
  )

  let counterWorld: Swinger2DDrawSpec['counterWorld'] = null
  if (t.type === 'swingerDoublePaper' || t.type === 'swingerDoubleCeramic') {
    const loc = { x: 0, y: BAR_Y - 0.1 }
    const wpt = toWorld([loc], cx, cy, rot)[0]!
    counterWorld = { cx: wpt.x, cy: wpt.y, r: 0.024 }
  }

  const facesWorld = centers.map((c) => ({
    outline: toWorld(faceOutlineAtCenter(t.type, c), cx, cy, rot),
    isCeramic: !swingerIsPaperLoad(t.type),
  }))

  const lx =
    centers.reduce((s, p) => s + p.x, 0) / Math.max(1, centers.length)
  const ly =
    centers.reduce((s, p) => s + p.y, 0) / Math.max(1, centers.length)
  const labelWorld = toWorld([{ x: lx, y: ly }], cx, cy, rot)[0]!

  return {
    baseSegsWorld,
    postWorld: toWorld(postQuadLocal(), cx, cy, rot),
    barWorld: toWorld(barQuadLocal(t), cx, cy, rot),
    counterWorld,
    facesWorld,
    labelWorld,
  }
}
