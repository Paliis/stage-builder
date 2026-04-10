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
/** Мінімальний зазор під заголовком перед знімком (QR накладається зверху, не зсуває знімок). */
const GAP_TITLE_IMAGE = 2
const GAP_IMAGE_TABLE = 5
const GAP_TABLE_FOOTER = 3
/** Відступ знімка від країв колонки PDF (1 = майже на всю ширину). */
const IMAGE_SHRINK = 1
const QR_SIZE = 14
/** Горизонтальний зазор між заголовком і QR у верхньому рядку. */
const QR_GAP_MM = 5

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

function drawPdfQrOverlay(
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

  /* ── Заголовок (текст ліворуч, справа резерв під QR — без накладання на назву) ── */
  const titleMaxW = contentW - (qrDataUrl ? QR_SIZE + QR_GAP_MM : 0)
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

  const maxImgH =
    pageH -
    margin -
    yAfterTitle -
    GAP_TITLE_IMAGE -
    GAP_IMAGE_TABLE -
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
      cursorY += finalH + GAP_IMAGE_TABLE

      if (qrDataUrl) drawPdfQrOverlay(doc, qrDataUrl, pdf, pageW, margin)
    } catch {
      doc.setFont(PDF_FONT_FAMILY, 'normal')
      doc.setFontSize(9)
      doc.setTextColor(120, 120, 120)
      doc.text(pdf.noSnapshot, pageW / 2, cursorY + 4, { align: 'center' })
      doc.setTextColor(0, 0, 0)
      cursorY += 8
      if (qrDataUrl) drawPdfQrOverlay(doc, qrDataUrl, pdf, pageW, margin)
    }
  } else {
    doc.setFont(PDF_FONT_FAMILY, 'normal')
    doc.setFontSize(9)
    doc.setTextColor(120, 120, 120)
    doc.text(pdf.noSnapshot, pageW / 2, cursorY + 4, { align: 'center' })
    doc.setTextColor(0, 0, 0)
    cursorY += 8
    if (qrDataUrl) drawPdfQrOverlay(doc, qrDataUrl, pdf, pageW, margin)
  }

  /* ── Table ── */
  autoTable(doc, buildTableOpts(tableBody, cursorY, margin, contentW, tableMarginBottomMm))

  doc.save(fileName)
}
