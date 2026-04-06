import type { Vec2 } from './models'

/** Значення за замовчуванням і мінімум «здорового» розміру площадки. */
export const DEFAULT_FIELD_WIDTH_M = 30
export const DEFAULT_FIELD_HEIGHT_M = 40

/** Сумісність: раніше були лише константи. */
export const FIELD_WIDTH_M = DEFAULT_FIELD_WIDTH_M
export const FIELD_HEIGHT_M = DEFAULT_FIELD_HEIGHT_M

export const FIELD_SIZE_LIMITS = { minM: 8, maxM: 120 } as const

export type FieldSizePreset = Readonly<{ id: string; widthM: number; heightM: number }>

export const FIELD_SIZE_PRESETS: FieldSizePreset[] = [
  { id: '30x40', widthM: 30, heightM: 40 },
  { id: '30x50', widthM: 30, heightM: 50 },
  { id: '25x35', widthM: 25, heightM: 35 },
  { id: '20x30', widthM: 20, heightM: 30 },
]

/**
 * Лише для пропорцій картки 2D/3D у UI: рамка трохи ширша за сухе співвідношення ширина/довжина плану
 * (зручніше для горизонтальних сцен). Метри поля та сітка не змінюються.
 */
export const STAGE_CARD_UI_DEPTH_FACTOR = 1.12

export function clampFieldDimensions(w: number, h: number): Vec2 {
  const { minM, maxM } = FIELD_SIZE_LIMITS
  return {
    x: Math.min(maxM, Math.max(minM, Math.round(w * 10) / 10)),
    y: Math.min(maxM, Math.max(minM, Math.round(h * 10) / 10)),
  }
}

export const GRID_SNAP_M = 0.5

/** Крок прив’язки центру мішені після перетягування (дрібніший за сітку поля, щоб NS і папір могли частково перекриватись). */
export const TARGET_PLACEMENT_SNAP_M = 0.05

/**
 * Крок прив’язки інфраструктури (пропів). Має бути дрібним: центр на сітці 0,5 м не дозволяє
 * зістикувати краї щитів під довільним кутом без зазору.
 */
export const PROP_PLACEMENT_SNAP_M = 0.05

export function snapMeters(value: number, stepM: number = GRID_SNAP_M): number {
  return Math.round(value / stepM) * stepM
}

export function snapVec2(point: Vec2, stepM: number = GRID_SNAP_M): Vec2 {
  return { x: snapMeters(point.x, stepM), y: snapMeters(point.y, stepM) }
}

export function clampVec2ToField(
  point: Vec2,
  marginM: number,
  widthM: number = DEFAULT_FIELD_WIDTH_M,
  heightM: number = DEFAULT_FIELD_HEIGHT_M,
): Vec2 {
  return {
    x: Math.max(marginM, Math.min(widthM - marginM, point.x)),
    y: Math.max(marginM, Math.min(heightM - marginM, point.y)),
  }
}
