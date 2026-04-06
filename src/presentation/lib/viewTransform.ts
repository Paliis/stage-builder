export type ViewTransform = {
  pxPerMeter: number
  padX: number
  padY: number
  fieldWidthM: number
  fieldHeightM: number
}

/** Віс видимої області канваса у світових координатах плану (віс Y вгору). */
export type WorldViewportRect = {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

const PAD_CSS = 16

/** Масштаб 1 = уся площа поля вміщується в канвас. */
export function buildStageViewTransform(
  canvasCssWidth: number,
  canvasCssHeight: number,
  zoom: number,
  panCss: { x: number; y: number },
  fieldWidthM: number,
  fieldHeightM: number,
  padCss: number = PAD_CSS,
): ViewTransform {
  const innerW = canvasCssWidth - 2 * padCss
  const innerH = canvasCssHeight - 2 * padCss
  const fitPpm = Math.min(innerW / fieldWidthM, innerH / fieldHeightM)
  const pxPerMeter = fitPpm * zoom
  const usedW = fieldWidthM * pxPerMeter
  const usedH = fieldHeightM * pxPerMeter
  const basePadX = padCss + (innerW - usedW) / 2
  const basePadY = padCss + (innerH - usedH) / 2
  return {
    pxPerMeter,
    padX: basePadX + panCss.x,
    padY: basePadY + panCss.y,
    fieldWidthM,
    fieldHeightM,
  }
}

export function computeViewTransform(
  canvasCssWidth: number,
  canvasCssHeight: number,
  fieldWidthM: number,
  fieldHeightM: number,
  padCss = PAD_CSS,
): ViewTransform {
  return buildStageViewTransform(
    canvasCssWidth,
    canvasCssHeight,
    1,
    { x: 0, y: 0 },
    fieldWidthM,
    fieldHeightM,
    padCss,
  )
}

/** World: bottom-left origin, y up. Screen: y down. */
export function worldToScreen(x: number, y: number, t: ViewTransform): { x: number; y: number } {
  return {
    x: t.padX + x * t.pxPerMeter,
    y: t.padY + (t.fieldHeightM - y) * t.pxPerMeter,
  }
}

export function screenToWorld(
  sx: number,
  sy: number,
  t: ViewTransform,
): { x: number; y: number } {
  const x = (sx - t.padX) / t.pxPerMeter
  const y = t.fieldHeightM - (sy - t.padY) / t.pxPerMeter
  return { x, y }
}

export function computeWorldViewportRect(
  cssWidth: number,
  cssHeight: number,
  t: ViewTransform,
): WorldViewportRect {
  const c00 = screenToWorld(0, 0, t)
  const c10 = screenToWorld(cssWidth, 0, t)
  const c01 = screenToWorld(0, cssHeight, t)
  const c11 = screenToWorld(cssWidth, cssHeight, t)
  const xs = [c00.x, c10.x, c01.x, c11.x]
  const ys = [c00.y, c10.y, c01.y, c11.y]
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  }
}

/** Центр канваса в метрах плану (для появи нового об’єкта в зазумленій зоні). */
export function spawnCenterWorldFromView(
  cssWidth: number,
  cssHeight: number,
  t: ViewTransform,
): { x: number; y: number } {
  return screenToWorld(cssWidth * 0.5, cssHeight * 0.5, t)
}

export const STAGE_VIEW_ZOOM_MIN = 0.35
export const STAGE_VIEW_ZOOM_MAX = 8

/** Залишити світову точку під екранними sx, sy після зміни масштабу. */
export function applyZoomAtWorldPoint(
  canvasCssW: number,
  canvasCssH: number,
  sx: number,
  sy: number,
  world: { x: number; y: number },
  newZoom: number,
  fieldWidthM: number,
  fieldHeightM: number,
  padCss: number = PAD_CSS,
): { zoom: number; pan: { x: number; y: number } } {
  const innerW = canvasCssW - 2 * padCss
  const innerH = canvasCssH - 2 * padCss
  const fitPpm = Math.min(innerW / fieldWidthM, innerH / fieldHeightM)
  const z = Math.min(Math.max(newZoom, STAGE_VIEW_ZOOM_MIN), STAGE_VIEW_ZOOM_MAX)
  const ppm = fitPpm * z
  const basePadX = padCss + (innerW - fieldWidthM * ppm) / 2
  const basePadY = padCss + (innerH - fieldHeightM * ppm) / 2
  const panX = sx - basePadX - world.x * ppm
  const panY = sy - basePadY - (fieldHeightM - world.y) * ppm
  return { zoom: z, pan: { x: panX, y: panY } }
}

/** Коліщатко: deltaY>0 — віддалення (як у картах). */
export function wheelZoomAdjust(
  canvasCssW: number,
  canvasCssH: number,
  sx: number,
  sy: number,
  prevZoom: number,
  prevPan: { x: number; y: number },
  deltaY: number,
  fieldWidthM: number,
  fieldHeightM: number,
): { zoom: number; pan: { x: number; y: number } } {
  const prev = buildStageViewTransform(
    canvasCssW,
    canvasCssH,
    prevZoom,
    prevPan,
    fieldWidthM,
    fieldHeightM,
    PAD_CSS,
  )
  const world = screenToWorld(sx, sy, prev)
  const zNew = prevZoom * Math.exp(-deltaY * 0.0012)
  return applyZoomAtWorldPoint(canvasCssW, canvasCssH, sx, sy, world, zNew, fieldWidthM, fieldHeightM)
}

/** Панорама так, щоб світова точка опинилась у центрі канваса (масштаб без змін). */
export function panCssToCenterWorldPoint(
  canvasCssW: number,
  canvasCssH: number,
  worldX: number,
  worldY: number,
  zoom: number,
  fieldWidthM: number,
  fieldHeightM: number,
  padCss: number = PAD_CSS,
): { x: number; y: number } {
  const innerW = canvasCssW - 2 * padCss
  const innerH = canvasCssH - 2 * padCss
  const fitPpm = Math.min(innerW / fieldWidthM, innerH / fieldHeightM)
  const ppm = fitPpm * zoom
  const usedW = fieldWidthM * ppm
  const usedH = fieldHeightM * ppm
  const basePadX = padCss + (innerW - usedW) / 2
  const basePadY = padCss + (innerH - usedH) / 2
  const scx = canvasCssW * 0.5
  const scy = canvasCssH * 0.5
  const panX = scx - basePadX - worldX * ppm
  const panY = scy - basePadY - (fieldHeightM - worldY) * ppm
  return { x: panX, y: panY }
}
