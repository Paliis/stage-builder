import type { Prop, PropType, Vec2 } from './models'

function rectWorldCorners(cx: number, cy: number, hw: number, hh: number, rotRad: number): Vec2[] {
  const c = Math.cos(rotRad)
  const s = Math.sin(rotRad)
  const pts: Vec2[] = []
  for (const [lx, ly] of [
    [-hw, -hh],
    [hw, -hh],
    [hw, hh],
    [-hw, hh],
  ] as const) {
    pts.push({ x: cx + lx * c - ly * s, y: cy + lx * s + ly * c })
  }
  return pts
}

function circleWorld(cx: number, cy: number, r: number, n: number, rotRad: number): Vec2[] {
  const pts: Vec2[] = []
  for (let i = 0; i < n; i++) {
    const a = rotRad + (i / n) * Math.PI * 2
    pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) })
  }
  return pts
}

/** Контур на плані для виділення та малювання (прямокутник або коло для бочки). */
export function propOutlineWorld(p: Prop): Vec2[] {
  const { x: cx, y: cy } = p.position
  const rot = p.rotationRad
  const hw = p.sizeM.x / 2
  const hh = p.sizeM.y / 2
  if (p.type === 'barrel' || p.type === 'tireStack')
    return circleWorld(cx, cy, Math.min(hw, hh), 36, rot)
  return rectWorldCorners(cx, cy, hw, hh, rot)
}

/** Усі варіанти щита з портом / дверцями в порті. */
export function isShieldWithPortFamily(type: PropType): boolean {
  return (
    type === 'shieldWithPort' ||
    type === 'shieldPortLow' ||
    type === 'shieldPortHigh' ||
    type === 'shieldPortSlanted' ||
    type === 'shieldWithPortDoor'
  )
}

/** Плаский отвір «порту» у метрах (квадрат 300×300 мм). */
export const PORT_HOLE_HALF_M = 0.15

/** Низький/високий порт: 30×60 см на лиці (напівширина / напіввисота в м). */
export const PORT_TALL_HALF_W_M = 0.15
export const PORT_TALL_HALF_H_M = 0.3

/** Відступ точок кріплення планок від кутів лиця по ребрах (м), типово 7 см. */
export const SHIELD_PORT_SLANT_INSET_M = 0.07

/**
 * Відкритий контур косого порту на лиці (центр лиця, +Y вгору): паралелограм між двома
 * паралельними «планками». Точки на ребрах: зверху — inset від TL по горизонталі; зліва —
 * inset від TL по вертикалі; знизу — inset від BR по горизонталі; справа — inset від BR по вертикалі.
 * Вершини за обходом A→B→C→D (проти годинникової з +Z).
 */
export function shieldPortSlantOpeningLocalM(
  innerW: number,
  innerH: number,
  insetM: number = SHIELD_PORT_SLANT_INSET_M,
): Vec2[] {
  const hw = innerW / 2
  const hh = innerH / 2
  const inset = Math.min(insetM, Math.max(hw - 0.02, 0), Math.max(hh - 0.02, 0))
  const A = { x: -hw + inset, y: hh }
  const B = { x: hw, y: -hh + inset }
  const C = { x: hw - inset, y: -hh }
  const D = { x: -hw, y: hh - inset }
  return [A, B, C, D]
}

/** Схема на плані: координата Y лиця відображається вздовж товщини щита (коса смуга видно зверху). */
export function slantOpeningFaceToPlanLocal(
  facePt: Vec2,
  innerH: number,
  planHalfThicknessM: number,
): Vec2 {
  const halfH = innerH / 2
  if (halfH < 1e-6) return { x: facePt.x, y: 0 }
  const ny = (facePt.y / halfH) * planHalfThicknessM * 0.92
  const cap = planHalfThicknessM
  return { x: facePt.x, y: Math.max(-cap, Math.min(cap, ny)) }
}

function localFaceToWorldPlan(lx: number, ly: number, cx: number, cy: number, rotRad: number): Vec2 {
  const c = Math.cos(rotRad)
  const s = Math.sin(rotRad)
  return { x: cx + lx * c - ly * s, y: cy + lx * s + ly * c }
}

/** Внутрішній отвір порту на плані (світ): квадрат 30×30; низ/верх — 30×60; косий — діагональна щілина. */
export function propPortHoleWorld(p: Prop): Vec2[] | null {
  if (!isShieldWithPortFamily(p.type)) return null
  const { x: cx, y: cy } = p.position
  const rot = p.rotationRad
  const g = PORT_HOLE_HALF_M
  if (p.type === 'shieldPortLow' || p.type === 'shieldPortHigh') {
    return rectWorldCorners(cx, cy, PORT_TALL_HALF_W_M, PORT_TALL_HALF_H_M, rot)
  }
  if (p.type === 'shieldPortSlanted') {
    const f = SHIELD_FRAME_SECTION_M
    const innerW = Math.max(p.sizeM.x - 2 * f, 0.15)
    const innerH = Math.max(propHeightM(p) - 2 * f, 0.15)
    const planHt = p.sizeM.y / 2
    return shieldPortSlantOpeningLocalM(innerW, innerH).map((face) => {
      const pl = slantOpeningFaceToPlanLocal(face, innerH, planHt)
      return localFaceToWorldPlan(pl.x, pl.y, cx, cy, rot)
    })
  }
  return rectWorldCorners(cx, cy, g, g, rot)
}

/** Контур настилу 0,8×0,8 м по центру (світові координати). */
export function movingPlatformDeckOutlineWorld(p: Prop): Vec2[] | null {
  if (p.type !== 'movingPlatform') return null
  const { x: cx, y: cy } = p.position
  const h = MOVING_PLATFORM_DECK_M / 2
  return rectWorldCorners(cx, cy, h, h, p.rotationRad)
}

/** Металева рамка щита IPSC: квадратний переріз 5×5 см (план / 3D). */
export const SHIELD_FRAME_SECTION_M = 0.05

/** Штрафна лінія — брусок перетином 5×5 см; sizeM.x = довжина вздовж локальної осі X, sizeM.y = перетин. */
export const FAULT_LINE_SECTION_M = 0.05

/** Качель: довжина планки × ширина на плані (м). */
export const SEESAW_PLANK_LENGTH_M = 3
export const SEESAW_PLANK_WIDTH_M = 0.3
export const SEESAW_PIPE_RADIUS_M = 0.15

/** Рухома платформа: відстань між осями стовпів по стороні квадрата; настил всередині. */
export const MOVING_PLATFORM_PILLAR_SPAN_M = 1
export const MOVING_PLATFORM_DECK_M = 0.8

/** Тунель Купера: висота; проміжок між верхніми поздовжніми несучими планками рами (по ширині тунеля). */
export const COOPER_TUNNEL_HEIGHT_M = 1.25
export const COOPER_TUNNEL_TOP_RAIL_GAP_M = 0.5
/** @deprecated аліас */
export const COOPER_TUNNEL_TOP_RED_GAP_M = COOPER_TUNNEL_TOP_RAIL_GAP_M
/** Відстань між штрафними поперечними планками вздовж тунеля (ось довжини меша). */
export const COOPER_TUNNEL_PENALTY_PLANK_SPACING_M = 0.5
/** Довжина тунелю на плані (м) за замовчуванням. */
export const COOPER_TUNNEL_DEFAULT_LENGTH_M = 2
/** Ширина рами на плані (м) за замовчуванням. */
export const COOPER_TUNNEL_DEFAULT_WIDTH_M = 1

/** Стартова позиція на плані: розмах «стоп» × глибина кроку (м). */
export const START_POSITION_DEFAULT_SIZE_M: Vec2 = { x: 0.52, y: 0.72 }

/** Стіл у плані: довга сторона × коротша (м); висота столу в 3D фіксована. */
export const WOOD_TABLE_DEFAULT_SIZE_M: Vec2 = { x: 1.2, y: 0.65 }
export const WOOD_TABLE_HEIGHT_M = 0.76

/** Позиції центрів штрафних планок уздовж локальної X (симетричні поля, рівний крок між центрами). */
export function cooperTunnelPenaltyPlankOffsetsXM(p: Prop): number[] {
  if (p.type !== 'cooperTunnel') return []
  const hx = p.sizeM.x / 2
  const inset = 0.09
  const spacing = COOPER_TUNNEL_PENALTY_PLANK_SPACING_M
  const left = -hx + inset
  const right = hx - inset
  const usable = right - left
  if (usable <= 1e-6) return [0]
  const n = Math.max(1, Math.floor(usable / spacing) + 1)
  if (n === 1) return [(left + right) / 2]
  const step = usable / (n - 1)
  return Array.from({ length: n }, (_, i) => left + i * step)
}

export function faultLineEndPointsWorld(p: Prop): { neg: Vec2; pos: Vec2 } | null {
  if (p.type !== 'faultLine') return null
  const rot = p.rotationRad
  const dirX = Math.cos(rot)
  const dirY = Math.sin(rot)
  const hw = p.sizeM.x / 2
  const { x: cx, y: cy } = p.position
  return {
    neg: { x: cx - dirX * hw, y: cy - dirY * hw },
    pos: { x: cx + dirX * hw, y: cy + dirY * hw },
  }
}

/** Позиція й кут після обертання: кінець «neg» лишається на місці, довжина та ж (sizeM.x). */
export function faultLinePoseForRotateAboutNegEnd(p: Prop, pointerWorld: Vec2): {
  position: Vec2
  rotationRad: number
} | null {
  if (p.type !== 'faultLine') return null
  const ends = faultLineEndPointsWorld(p)
  if (!ends) return null
  const L = p.sizeM.x
  const { neg: pivot } = ends
  const ang = Math.atan2(pointerWorld.y - pivot.y, pointerWorld.x - pivot.x)
  return {
    position: { x: pivot.x + Math.cos(ang) * (L / 2), y: pivot.y + Math.sin(ang) * (L / 2) },
    rotationRad: ang,
  }
}

/** anchor 'neg' — тягнемо «+» кінець, зафіксовано «−». anchor 'pos' — тягнемо «−», зафіксовано «+». */
export function faultLineGeometryAfterStretch(
  p: Prop,
  world: Vec2,
  anchor: 'neg' | 'pos',
  maxLenM: number,
): { position: Vec2; sizeM: Vec2 } {
  const rot = p.rotationRad
  const dirX = Math.cos(rot)
  const dirY = Math.sin(rot)
  const hw = p.sizeM.x / 2
  const A = { x: p.position.x - dirX * hw, y: p.position.y - dirY * hw }
  const B = { x: p.position.x + dirX * hw, y: p.position.y + dirY * hw }
  let L: number
  if (anchor === 'neg') {
    L = (world.x - A.x) * dirX + (world.y - A.y) * dirY
  } else {
    L = (B.x - world.x) * dirX + (B.y - world.y) * dirY
  }
  L = Math.min(Math.max(L, FAULT_LINE_SECTION_M), maxLenM)
  const center =
    anchor === 'neg'
      ? { x: A.x + dirX * (L / 2), y: A.y + dirY * (L / 2) }
      : { x: B.x - dirX * (L / 2), y: B.y - dirY * (L / 2) }
  return { position: center, sizeM: { x: L, y: FAULT_LINE_SECTION_M } }
}

/** Після snap довжини зберегти зафіксований кінець (той самий anchor, що під час stretch). */
export function faultLineWithLength(
  p: Prop,
  lenM: number,
  anchor: 'neg' | 'pos',
  maxLenM: number,
): { position: Vec2; sizeM: Vec2 } {
  const L = Math.min(Math.max(lenM, FAULT_LINE_SECTION_M), maxLenM)
  const rot = p.rotationRad
  const dirX = Math.cos(rot)
  const dirY = Math.sin(rot)
  const hw = p.sizeM.x / 2
  const A = { x: p.position.x - dirX * hw, y: p.position.y - dirY * hw }
  const B = { x: p.position.x + dirX * hw, y: p.position.y + dirY * hw }
  if (anchor === 'neg') {
    const c = { x: A.x + dirX * (L / 2), y: A.y + dirY * (L / 2) }
    return { position: c, sizeM: { x: L, y: FAULT_LINE_SECTION_M } }
  }
  const c = { x: B.x - dirX * (L / 2), y: B.y - dirY * (L / 2) }
  return { position: c, sizeM: { x: L, y: FAULT_LINE_SECTION_M } }
}

/** У плані: щит / двері / щит з портом — лице × товщина (типово 1 × 0,05 м). */
export function defaultPropSizeM(type: PropType): Vec2 {
  switch (type) {
    case 'door':
    case 'shield':
    case 'shieldWithPort':
    case 'shieldPortLow':
    case 'shieldPortHigh':
    case 'shieldPortSlanted':
    case 'shieldWithPortDoor':
      return { x: 1, y: 0.05 }
    case 'shieldDouble':
      return { x: 2, y: 0.05 }
    case 'faultLine':
      return { x: 2.2, y: FAULT_LINE_SECTION_M }
    case 'barrel':
      return { x: 0.62, y: 0.62 }
    /** У плані той самий діаметр, що й бочка. */
    case 'tireStack':
      return { x: 0.62, y: 0.62 }
    case 'seesaw':
      return { x: SEESAW_PLANK_LENGTH_M, y: SEESAW_PLANK_WIDTH_M }
    case 'movingPlatform':
      return { x: MOVING_PLATFORM_PILLAR_SPAN_M, y: MOVING_PLATFORM_PILLAR_SPAN_M }
    case 'cooperTunnel':
      return { x: COOPER_TUNNEL_DEFAULT_LENGTH_M, y: COOPER_TUNNEL_DEFAULT_WIDTH_M }
    case 'startPosition':
      return { x: START_POSITION_DEFAULT_SIZE_M.x, y: START_POSITION_DEFAULT_SIZE_M.y }
    case 'woodTable':
      return { x: WOOD_TABLE_DEFAULT_SIZE_M.x, y: WOOD_TABLE_DEFAULT_SIZE_M.y }
    default: {
      const _e: never = type
      return _e
    }
  }
}

/** Висота об’єкта в 3D (м), ніби «стіна» вгору від землі. */
export function propHeightM(p: Prop): number {
  switch (p.type) {
    case 'faultLine':
      return FAULT_LINE_SECTION_M
    case 'barrel':
      return 1.1
    case 'tireStack':
      return 0.72
    case 'shield':
    case 'shieldDouble':
    case 'shieldWithPort':
    case 'shieldPortLow':
    case 'shieldPortHigh':
    case 'shieldPortSlanted':
    case 'shieldWithPortDoor':
    case 'door':
      return 2
    case 'seesaw':
      return 0.45
    case 'movingPlatform':
      return 0.34
    case 'cooperTunnel':
      return COOPER_TUNNEL_HEIGHT_M
    case 'startPosition':
      return 0.02
    case 'woodTable':
      return WOOD_TABLE_HEIGHT_M
    default: {
      const _e: never = p.type
      return _e
    }
  }
}
