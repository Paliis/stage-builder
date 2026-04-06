import { STAGE_CARD_UI_DEPTH_FACTOR } from './field'

/** A4 portrait (як у jsPDF). */
export const A4_PAGE_WIDTH_MM = 210
export const A4_PAGE_HEIGHT_MM = 297

/** Поля PDF — збігаються з `exportBriefingPdf` (margin = 8 mm). */
export const PDF_MARGIN_MM = 8

/** Внутрішня ширина під знімок і таблицю, мм. */
export const PDF_CONTENT_INNER_WIDTH_MM = A4_PAGE_WIDTH_MM - 2 * PDF_MARGIN_MM

/** Переведення мм → px за логікою 96 dpi (типовий макет «екран ≈ друк»). */
export function mmToCssPx96(mm: number): number {
  return Math.round((mm * 96) / 25.4)
}

/** Ширина текстового блоку / знімка в px (вміст між полями A4). */
export const PDF_CONTENT_INNER_WIDTH_PX = mmToCssPx96(PDF_CONTENT_INNER_WIDTH_MM)

/** Повна ширина сторінки A4 у px (для обгортки print-root). */
export const A4_PAGE_WIDTH_PX = mmToCssPx96(A4_PAGE_WIDTH_MM)

/** План у метрах: ширина / довжина. */
export function stagePlanAspectRatio(fieldWidthM: number, fieldHeightM: number): number {
  return fieldWidthM / fieldHeightM
}

/**
 * Співвідношення width/height для PNG 3D у PDF — узгоджено з карткою перегляду в UI
 * (див. STAGE_CARD_UI_DEPTH_FACTOR), без надмірно «високого портрета» з половиною неба.
 */
export function stageViewportAspectRatio(fieldWidthM: number, fieldHeightM: number): number {
  return fieldWidthM / (fieldHeightM / STAGE_CARD_UI_DEPTH_FACTOR)
}

/** Розміри буфера для PNG у брифінг (ширина колонки PDF × exportScale; висота з поточного поля). */
export function pdfSnapshotPixelSize(
  fieldWidthM: number,
  fieldHeightM: number,
  exportScale = 2,
): { width: number; height: number } {
  const width = Math.round(PDF_CONTENT_INNER_WIDTH_PX * exportScale)
  const vAspect = stageViewportAspectRatio(fieldWidthM, fieldHeightM)
  const height = Math.round(width / vAspect)
  return { width, height }
}
