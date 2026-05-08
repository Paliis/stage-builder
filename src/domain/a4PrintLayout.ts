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
 * Співвідношення width/height viewport карти в UI (див. STAGE_CARD_UI_DEPTH_FACTOR),
 * без надмірно «високого портрета» з половиною неба. Для PNG у брифінговому PDF використовуй
 * {@link briefingPdfSnapshotAspectRatio}.
 */
export function stageViewportAspectRatio(fieldWidthM: number, fieldHeightM: number): number {
  return fieldWidthM / (fieldHeightM / STAGE_CARD_UI_DEPTH_FACTOR)
}

/**
 * Нижня межа width/height для PNG у брифінговому PDF: ширший за «вузький портрет» карти,
 * щоб кадр був горизонтальнішим і краще заповнював колонку A4 (узгоджено з режимом камери «як у PDF»).
 */
export const PDF_BRIEFING_SNAPSHOT_MIN_ASPECT = 1.45

/** Aspect для знімка в PDF: не вужче за {@link PDF_BRIEFING_SNAPSHOT_MIN_ASPECT}; для широких полів — як viewport карти. */
export function briefingPdfSnapshotAspectRatio(fieldWidthM: number, fieldHeightM: number): number {
  return Math.max(stageViewportAspectRatio(fieldWidthM, fieldHeightM), PDF_BRIEFING_SNAPSHOT_MIN_ASPECT)
}

/**
 * Масштаб рендеру PNG для PDF (ширина ≈ колонка контенту × цей коефіцієнт).
 * Трохи вище «екранних» 2× — краща читабельність на друку без різкого стрибка розміру файлу.
 */
export const PDF_SNAPSHOT_EXPORT_SCALE = 2.25

/** Розміри буфера для PNG у брифінг (ширина колонки PDF × exportScale; висота з поточного поля). */
export function pdfSnapshotPixelSize(
  fieldWidthM: number,
  fieldHeightM: number,
  exportScale = 2,
): { width: number; height: number } {
  const width = Math.round(PDF_CONTENT_INNER_WIDTH_PX * exportScale)
  const vAspect = briefingPdfSnapshotAspectRatio(fieldWidthM, fieldHeightM)
  const height = Math.round(width / vAspect)
  return { width, height }
}
