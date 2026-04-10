import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'
import QRCode from 'qrcode'
import { PDF_MARGIN_MM } from '../../domain/a4PrintLayout'
import type { StageBriefing } from '../../domain/stageBriefing'
import { briefingTableRows, type BriefingPdfLabels } from '../../domain/stageBriefing'
import type { StageCategory } from '../../domain/models'
import { registerPdfFonts, PDF_FONT_FAMILY } from './pdfFonts'

const APP_URL = 'https://stage-builder.vercel.app'

export type BriefingPdfExportStrings = {
  labels: BriefingPdfLabels
  categoryLabel: (c: StageCategory) => string
  emptyCell: string
  sceneAlt: string
  noSnapshot: string
  imageLoadError: string
  generatedBy: string
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Image load failed'))
    img.src = dataUrl
  })
}

async function generateQrDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    width: 200,
    margin: 1,
    color: { dark: '#111827', light: '#ffffff' },
    errorCorrectionLevel: 'M',
  })
}

const TABLE_FONT_SIZE = 9
const TABLE_CELL_PADDING = { top: 2.2, right: 3, bottom: 2.2, left: 3 }
/** Мінімальний зазор під заголовком перед знімком. */
const GAP_TITLE_IMAGE = 2
/** Після знімка: бренд-текст (під картинкою), потім зазор перед таблицею. */
const GAP_IMAGE_BRAND = 2
const GAP_BRAND_TABLE = 5
const GAP_TABLE_FOOTER = 3
/** Відступ знімка від країв колонки PDF (1 = майже на всю ширину). */
const IMAGE_SHRINK = 1
const QR_SIZE = 14
/** Відступ QR від краю знімка (мм), коли QR у правому верхньому куті PNG. */
const QR_INSET_MM = 1.2
/** Рамка навколо знімка сцени (мм), щоб у PDF було видно межі кадру як у прев’ю. */
const SNAPSHOT_FRAME_LINE_MM = 0.35
const SNAPSHOT_FRAME_RADIUS_MM = 0.9

function buildTableOpts(
  tableBody: string[][],
  startY: number,
  margin: number,
  contentW: number,
  tableMarginBottomMm: number,
): Parameters<typeof autoTable>[1] {
  return {
    startY,
    margin: { left: margin, right: margin, bottom: tableMarginBottomMm },
    head: [],
    body: tableBody,
    theme: 'grid',
    styles: {
      font: PDF_FONT_FAMILY,
      fontSize: TABLE_FONT_SIZE,
      cellPadding: TABLE_CELL_PADDING,
      lineColor: [209, 213, 219],
      lineWidth: 0.3,
      textColor: [17, 24, 39],
      valign: 'top',
      overflow: 'linebreak',
    },
    columnStyles: {
      0: {
        cellWidth: contentW * 0.34,
        fontStyle: 'bold',
        fillColor: [249, 250, 251],
      },
      1: {
        cellWidth: contentW * 0.66,
      },
    },
  }
}

/**
 * QR у правому верхньому куті знімка (білий фон), без тексту — текст під картинкою, щоб не наїзджав на PNG.
 */
function drawPdfQrOnSnapshot(
  doc: InstanceType<typeof jsPDF>,
  qrDataUrl: string,
  imgX: number,
  imgY: number,
  imgW: number,
): void {
  const qrX = imgX + imgW - QR_SIZE - QR_INSET_MM
  const qrY = imgY + QR_INSET_MM
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(qrX - 0.6, qrY - 0.4, QR_SIZE + 1.2, QR_SIZE + 1, 0.8, 0.8, 'F')
  doc.addImage(qrDataUrl, 'PNG', qrX, qrY, QR_SIZE, QR_SIZE)
}

/** Висота блоку «згенеровано + URL» під знімком (мм), узгоджено з `drawPdfBrandBelowSnapshot`. */
function measureBrandBlockHeightMm(doc: InstanceType<typeof jsPDF>): number {
  const urlLines = doc.splitTextToSize(APP_URL, 42) as string[]
  return 4 + urlLines.length * 3 + 2
}

/** Текст під знімком, вирівняний вправо по полю контенту. */
function drawPdfBrandBelowSnapshot(
  doc: InstanceType<typeof jsPDF>,
  pdf: BriefingPdfExportStrings,
  pageW: number,
  margin: number,
  yTop: number,
): void {
  const brandRight = pageW - margin
  const urlLines = doc.splitTextToSize(APP_URL, 42) as string[]
  doc.setFont(PDF_FONT_FAMILY, 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(107, 114, 128)
  let y = yTop
  doc.text(pdf.generatedBy, brandRight, y, { align: 'right' })
  y += 4
  doc.setFontSize(6)
  doc.setTextColor(148, 163, 184)
  for (const line of urlLines) {
    doc.text(line, brandRight, y, { align: 'right' })
    y += 3
  }
  doc.setTextColor(0, 0, 0)
}

/** Якщо знімка немає — QR і бренд лишаються у «шапці» сторінки (немає PNG під текстом). */
function drawPdfQrHeaderWhenNoSnapshot(
  doc: InstanceType<typeof jsPDF>,
  qrDataUrl: string,
  pdf: BriefingPdfExportStrings,
  pageW: number,
  margin: number,
): void {
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(pageW - margin - QR_SIZE - 0.6, margin - 0.4, QR_SIZE + 1.2, QR_SIZE + 1, 0.8, 0.8, 'F')
  doc.addImage(qrDataUrl, 'PNG', pageW - margin - QR_SIZE, margin, QR_SIZE, QR_SIZE)
  const brandRight = pageW - margin
  const urlLines = doc.splitTextToSize(APP_URL, 42) as string[]
  doc.setFont(PDF_FONT_FAMILY, 'normal')
  doc.setFontSize(6.5)
  doc.setTextColor(107, 114, 128)
  doc.text(pdf.generatedBy, brandRight, margin + QR_SIZE + 2, { align: 'right' })
  doc.setFontSize(6)
  doc.setTextColor(148, 163, 184)
  let urlY = margin + QR_SIZE + 5
  for (const line of urlLines) {
    doc.text(line, brandRight, urlY, { align: 'right' })
    urlY += 3
  }
  doc.setTextColor(0, 0, 0)
}

function measureTableHeight(
  tableBody: string[][],
  margin: number,
  contentW: number,
  tableMarginBottomMm: number,
): number {
  const tmp = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
  autoTable(tmp, buildTableOpts(tableBody, 0, margin, contentW, tableMarginBottomMm))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (tmp as any).lastAutoTable.finalY as number
}

export async function exportBriefingPdf(opts: {
  snapshotDataUrl: string | null
  briefing: StageBriefing
  pdf: BriefingPdfExportStrings
  fileName?: string
}): Promise<void> {
  const { snapshotDataUrl, briefing, pdf, fileName = 'briefing.pdf' } = opts
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })

  await registerPdfFonts(doc)

  const margin = PDF_MARGIN_MM
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const contentW = pageW - margin * 2

  let qrDataUrl: string | null = null
  try {
    qrDataUrl = await generateQrDataUrl(APP_URL)
  } catch {
    qrDataUrl = null
  }

  /* ── Заголовок на всю ширину контенту; QR на знімку або в шапці, якщо знімка немає. ── */
  const titleMaxW = contentW
  doc.setFont(PDF_FONT_FAMILY, 'bold')
  doc.setFontSize(14)
  const titleLines = doc.splitTextToSize(briefing.documentTitle, titleMaxW) as string[]
  doc.text(titleLines, margin, margin + 5)
  const titleH = titleLines.length * 6 + 4
  /** Висота смуги лише під заголовок: знімок починається одразу під нею — QR малюємо поверх знімка пізніше. */
  const yAfterTitle = margin + titleH

  /* ── Table data & measurement ── */
  const rows = briefingTableRows(briefing, pdf.labels, pdf.categoryLabel, pdf.emptyCell)
  const tableBody = rows.map((r) => [r.label, r.value])

  /** Після перенесення QR у верх — низ сторінки лише поле A4 (без окремого футера). */
  const tableMarginBottomMm = margin

  const tableH = measureTableHeight(tableBody, margin, contentW, tableMarginBottomMm)

  const brandBelowImageH =
    snapshotDataUrl && qrDataUrl ? GAP_IMAGE_BRAND + measureBrandBlockHeightMm(doc) + GAP_BRAND_TABLE : GAP_BRAND_TABLE

  const maxImgH =
    pageH -
    margin -
    yAfterTitle -
    GAP_TITLE_IMAGE -
    brandBelowImageH -
    tableH -
    GAP_TABLE_FOOTER

  /* ── Image ── */
  let cursorY = yAfterTitle + GAP_TITLE_IMAGE
  if (snapshotDataUrl) {
    try {
      const img = await loadImage(snapshotDataUrl)
      const aspect = img.naturalWidth / Math.max(1, img.naturalHeight)
      /** Висота PNG при масштабуванні на повну ширину контенту (мм). */
      const byHeight = contentW / aspect
      /**
       * Вміщуємо знімок у прямокутник без спотворення (contain): інакше finalW/finalH
       * могли не збігатися з aspect — jsPDF розтягував PNG і низ сцени виглядав «обрізаним».
       */
      const boxW = contentW * IMAGE_SHRINK
      const boxH = Math.max(1, Math.min(byHeight, maxImgH)) * IMAGE_SHRINK
      let finalW = boxW
      let finalH = finalW / aspect
      if (finalH > boxH) {
        finalH = boxH
        finalW = finalH * aspect
      }
      const imgX = margin + (contentW - finalW) / 2

      doc.addImage(snapshotDataUrl, 'PNG', imgX, cursorY, finalW, finalH)
      doc.setDrawColor(99, 102, 241)
      doc.setLineWidth(SNAPSHOT_FRAME_LINE_MM)
      doc.roundedRect(
        imgX,
        cursorY,
        finalW,
        finalH,
        SNAPSHOT_FRAME_RADIUS_MM,
        SNAPSHOT_FRAME_RADIUS_MM,
        'S',
      )
      doc.setDrawColor(0, 0, 0)
      doc.setLineWidth(0.2)
      cursorY += finalH
      if (qrDataUrl) {
        drawPdfQrOnSnapshot(doc, qrDataUrl, imgX, cursorY - finalH, finalW)
        const brandTop = cursorY + GAP_IMAGE_BRAND
        drawPdfBrandBelowSnapshot(doc, pdf, pageW, margin, brandTop)
        cursorY = brandTop + measureBrandBlockHeightMm(doc)
      }
      cursorY += GAP_BRAND_TABLE
    } catch {
      doc.setFont(PDF_FONT_FAMILY, 'normal')
      doc.setFontSize(9)
      doc.setTextColor(120, 120, 120)
      doc.text(pdf.noSnapshot, pageW / 2, cursorY + 4, { align: 'center' })
      doc.setTextColor(0, 0, 0)
      cursorY += 8
      if (qrDataUrl) drawPdfQrHeaderWhenNoSnapshot(doc, qrDataUrl, pdf, pageW, margin)
    }
  } else {
    doc.setFont(PDF_FONT_FAMILY, 'normal')
    doc.setFontSize(9)
    doc.setTextColor(120, 120, 120)
    doc.text(pdf.noSnapshot, pageW / 2, cursorY + 4, { align: 'center' })
    doc.setTextColor(0, 0, 0)
    cursorY += 8
    if (qrDataUrl) drawPdfQrHeaderWhenNoSnapshot(doc, qrDataUrl, pdf, pageW, margin)
  }

  /* ── Table ── */
  autoTable(doc, buildTableOpts(tableBody, cursorY, margin, contentW, tableMarginBottomMm))

  doc.save(fileName)
}
