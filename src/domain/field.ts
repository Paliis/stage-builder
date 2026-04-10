import type { Vec2 } from './models'

/** Значення за замовчуванням і мінімум «здорового» розміру площадки. */
export const DEFAULT_FIELD_WIDTH_M = 30
export const DEFAULT_FIELD_HEIGHT_M = 40

/** Сумісність: раніше були лише константи. */
export const FIELD_WIDTH_M = DEFAULT_FIELD_WIDTH_M
export const FIELD_HEIGHT_M = DEFAULT_FIELD_HEIGHT_M

/** Мінімальна сторона поля; максимум окремо по ширині (X) і довжині (Y) у метрах. */
export const FIELD_SIZE_LIMITS = { minM: 8, maxWidthM: 50, maxHeightM: 100 } as const

export type FieldSizePreset = Readonly<{ id: string; widthM: number; heightM: number }>

export const FIELD_SIZE_PRESETS: FieldSizePreset[] = [
  { id: '50x100', widthM: 50, heightM: 100 },
  { id: '40x80', widthM: 40, heightM: 80 },
  { id: '30x40', widthM: 30, heightM: 40 },
  { id: '30x50', widthM: 30, heightM: 50 },
  { id: '25x35', widthM: 25, heightM: 35 },
  { id: '20x30', widthM: 20, heightM: 30 },
  { id: '20x20', widthM: 20, heightM: 20 },
  { id: '15x20', widthM: 15, heightM: 20 },
]

/**
 * Лише для пропорцій картки 2D/3D у UI: рамка трохи ширша за сухе співвідношення ширина/довжина плану
 * (зручніше для горизонтальних сцен). Метри поля та сітка не змінюються.
 */
export const STAGE_CARD_UI_DEPTH_FACTOR = 1.12

export function clampFieldDimensions(w: number, h: number): Vec2 {
  const { minM, maxWidthM, maxHeightM } = FIELD_SIZE_LIMITS
  return {
    x: Math.min(maxWidthM, Math.max(minM, Math.round(w * 10) / 10)),
    y: Math.min(maxHeightM, Math.max(minM, Math.round(h * 10) / 10)),
  }
}

export const GRID_SNAP_M = 0.5

/** Крок «шахматки» на 2D-плані (м); тонкі лінії сітки лишаються з кроком `GRID_SNAP_M`. */
export const GRID_CHESS_M = 1

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
