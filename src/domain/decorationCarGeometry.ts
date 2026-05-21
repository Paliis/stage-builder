import type { Prop, Vec2 } from './models'

/**
 * Еталон SUV — єдине джерело для `CarSUV.tsx` і плану 2D (довжина → локальний +u до переду).
 */
export const DECORATION_CAR_MODEL_REF = {
  length: 4.7,
  width: 1.9,
  height: 1.75,
  chassisLength: 4.5,
  chassisWidth: 1.9,
  chassisH: 0.7,
  clearance: 0.25,
  cabinLength: 2.8,
  cabinWidth: 1.7,
  cabinH: 0.7,
  wheelRadius: 0.35,
  wheelTread: 0.25,
} as const

/**
 * Подовження кабіни вперед (+X): передня дверна зона / бокове вікно; метри як у REF (× sx).
 */
export const DECORATION_CABIN_EXTRA_FORWARD_LENGTH_M = 0.5

/** Центр бокового скла по X: `cabinCX + frac * cabinLenInner`. */
export const DECORATION_CAR_SIDE_GLASS_CENTER_X_FRAC = -0.04
/** Довжина бокового скла уздовж кабіни / `cabinLenInner`. */
export const DECORATION_CAR_SIDE_GLASS_LENGTH_FRAC = 0.66
/** Шов між дверима (B-подібний): `cabinCX + frac * cabinLenInner` (0 — геометричний центр кабіни). */
export const DECORATION_CAR_DOOR_SEAM_CENTER_X_FRAC = 0

/**
 * Колір кузова SUV у 3D (`meshStandardMaterial.color`).
 * Світліший за бочку (`PROP_BARREL_BLUE` / `#1d4ed8` у `StageView3D`) приблизно на 2 ступені шкали blue.
 */
export const DECORATION_CAR_BODY_HEX = '#3b82f6'

export type DecorationCarGeometry = {
  sx: number
  sz: number
  sy: number
  sWheel: number
  chassisLen: number
  chassisWid: number
  chassisH: number
  chassisY: number
  chassisHalf: number
  cabinLenInner: number
  cabinWid: number
  cabinH: number
  cabinCX: number
  cabinY: number
  clearance: number
  chassisTop: number
  r: number
  tread: number
  wheelY: number
  axleFrontX: number
  axleRearX: number
  wheelZ: number
  glassT: number
  wsXB: number
  wsXT: number
  wsYB: number
  wsYT: number
  wsHW: number
  bumperProtrude: number
  bumperH: number
  bumperY: number
  hlX: number
  hlY: number
  hlZ: number
  tlX: number
  tlY: number
  tlZ: number
}

/** Розрахунок пропорцій декоративного авто (спільно для 3D і плану). */
export function computeDecorationCarGeometry(
  lengthM: number,
  widthM: number,
  heightM: number,
): DecorationCarGeometry {
  const REF = DECORATION_CAR_MODEL_REF
  const sx = lengthM / REF.length
  const sz = widthM / REF.width
  const sy = heightM / REF.height
  const sWheel = (sx + sz) / 2

  const chassisLen = REF.chassisLength * sx
  const chassisWid = REF.chassisWidth * sz
  const chassisH = REF.chassisH * sy
  const clearance = REF.clearance * sy

  const cabinLenBase = REF.cabinLength * sx
  const cabinLenExtra = DECORATION_CABIN_EXTRA_FORWARD_LENGTH_M * sx
  const cabinLen = cabinLenBase + cabinLenExtra
  const cabinWid = REF.cabinWidth * sz
  const cabinH = REF.cabinH * sy

  const chassisHalf = chassisLen / 2
  const chassisY = clearance + chassisH / 2

  /*
   * Зсув «центру» кабіни вперед (коротший капот). Для подовження лише вперед без зміщення заднього
   * внутрішнього краю: додаємо cabinLenExtra/2 до raw (rear_inner = raw − cabinLen/2 лишається як при cabinLenBase).
   */
  const cabinCenterXRaw =
    -chassisHalf +
    Math.max(0.035 * sx, cabinLenBase * 0.045) +
    cabinLenBase / 2 +
    0.22 * sx +
    cabinLenExtra / 2
  const chassisTop = clearance + chassisH
  const cabinY = chassisTop + cabinH / 2

  const wsRun = Math.max(0.32 * sx, 0.28)
  const cabinLenInner = cabinLen - wsRun
  const cabinCX = cabinCenterXRaw - wsRun / 2
  const cabinFrontInner = cabinCX + cabinLenInner / 2

  /* Нижній край лобового майже на капоті — інакше проступає вертикальна передня грань кабіни під склом. */
  const wsXB = cabinFrontInner + 0.02 * sx
  const wsXT = cabinFrontInner - 0.78 * wsRun
  const wsYB = chassisTop + Math.max(0.012 * sy, 0.01)
  const wsYT = cabinY + cabinH * 0.42
  /* Лобове майже на всю ширину кабіни — інакше лишається непрозорий «обідок» між склом і боковиною. */
  const cabinHalfW = cabinWid / 2
  const wsHW = Math.max(cabinHalfW - Math.max(0.008 * sz, 0.01), cabinWid * 0.42)

  const r = REF.wheelRadius * sWheel
  const tread = REF.wheelTread * sz
  const wheelY = r
  const axleFrontX = chassisHalf * 0.62
  const axleRearX = -chassisHalf * 0.62
  const wheelZ = chassisWid / 2 - Math.min(0.14 * sz, r * 0.35)

  const glassT = Math.max(0.028 * sy, 0.02)

  const bumperProtrude = Math.max(0.055 * sx, 0.05)
  const bumperH = Math.max(0.085 * sy, 0.06)
  const bumperY = clearance + bumperH / 2 + 0.02 * sy

  const hlZ = chassisWid * 0.38
  const hlX = chassisHalf - 0.02 * sx
  const hlY = clearance + chassisH * 0.52

  const tlX = -chassisHalf + 0.035 * sx
  const tlY = clearance + chassisH * 0.5
  const tlZ = chassisWid * 0.38

  return {
    sx,
    sz,
    sy,
    sWheel,
    chassisLen,
    chassisWid,
    chassisH,
    chassisY,
    chassisHalf,
    cabinLenInner,
    cabinWid,
    cabinH,
    cabinCX,
    cabinY,
    clearance,
    chassisTop,
    r,
    tread,
    wheelY,
    axleFrontX,
    axleRearX,
    wheelZ,
    glassT,
    wsXB,
    wsXT,
    wsYB,
    wsYT,
    wsHW,
    bumperProtrude,
    bumperH,
    bumperY,
    hlX,
    hlY,
    hlZ,
    tlX,
    tlY,
    tlZ,
  }
}

/** Локальні (u,v) авто → світові координати плану (узгоджено з `propOutlineWorld`). */
export function decorationCarLocalToWorld(p: Prop, lx: number, lz: number): Vec2 {
  const c = Math.cos(p.rotationRad)
  const s = Math.sin(p.rotationRad)
  const { x: cx, y: cy } = p.position
  return {
    x: cx + lx * c - lz * s,
    y: cy + lx * s + lz * c,
  }
}
