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
/** Горизонтальний зазор між заголовком і QR у верхньому рядку. */
const QR_GAP_MM = 5
/** Мінімальний зазор під блоком QR (мм), перш ніж починати знімок — щоб PNG не заходив під QR. */
const QR_CLEAR_BELOW_MM = 2
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

/** QR у верхньому правому куті сторінки (біла підкладка). */
function drawPdfQrPageCorner(
  doc: InstanceType<typeof jsPDF>,
  qrDataUrl: string,
  pageW: number,
  margin: number,
): void {
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(pageW - margin - QR_SIZE - 0.6, margin - 0.4, QR_SIZE + 1.2, QR_SIZE + 1, 0.8, 0.8, 'F')
  doc.addImage(qrDataUrl, 'PNG', pageW - margin - QR_SIZE, margin, QR_SIZE, QR_SIZE)
}

/** Висота блоку бренду під знімком (узгоджено з `drawPdfBrandCenteredBelowImage`). */
function measureBrandBlockHeightMm(
  doc: InstanceType<typeof jsPDF>,
  contentW: number,
  pdf: BriefingPdfExportStrings,
): number {
  const combined = `${pdf.generatedBy}  ${APP_URL}`
  let fs = 6
  doc.setFont(PDF_FONT_FAMILY, 'normal')
  doc.setFontSize(fs)
  let lines = doc.splitTextToSize(combined, contentW) as string[]
  while (lines.length > 1 && fs >= 5) {
    fs -= 0.5
    doc.setFontSize(fs)
    lines = doc.splitTextToSize(combined, contentW) as string[]
  }
  const lineH = 3
  const h = lines.length * lineH + 1
  doc.setFont(PDF_FONT_FAMILY, 'normal')
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  return h
}

/** Один рядок (за можливості) по центру під знімком: «згенеровано…» + URL. */
function drawPdfBrandCenteredBelowImage(
  doc: InstanceType<typeof jsPDF>,
  pdf: BriefingPdfExportStrings,
  pageW: number,
  margin: number,
  yTop: number,
): void {
  const contentW = pageW - margin * 2
  const combined = `${pdf.generatedBy}  ${APP_URL}`
  doc.setFont(PDF_FONT_FAMILY, 'normal')
  let fs = 6
  doc.setFontSize(fs)
  let lines = doc.splitTextToSize(combined, contentW) as string[]
  while (lines.length > 1 && fs >= 5) {
    fs -= 0.5
    doc.setFontSize(fs)
    lines = doc.splitTextToSize(combined, contentW) as string[]
  }
  doc.setTextColor(100, 116, 139)
  const cx = pageW / 2
  let y = yTop
  for (const line of lines) {
    doc.text(line, cx, y, { align: 'center' })
    y += 3
  }
  doc.setFont(PDF_FONT_FAMILY, 'normal')
  doc.setFontSize(10)
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

  /* ── Заголовок; під QR лишаємо ширину, щоб назва не заходила під код. ── */
  const titleMaxW = contentW - (qrDataUrl ? QR_SIZE + QR_GAP_MM : 0)
  doc.setFont(PDF_FONT_FAMILY, 'bold')
  doc.setFontSize(14)
  const titleLines = doc.splitTextToSize(briefing.documentTitle, titleMaxW) as string[]
  doc.text(titleLines, margin, margin + 5)
  const titleH = titleLines.length * 6 + 4
  const yAfterTitle = margin + titleH

  if (qrDataUrl) {
    drawPdfQrPageCorner(doc, qrDataUrl, pageW, margin)
  }

  /* ── Table data & measurement ── */
  const rows = briefingTableRows(briefing, pdf.labels, pdf.categoryLabel, pdf.emptyCell)
  const tableBody = rows.map((r) => [r.label, r.value])

  const tableMarginBottomMm = margin

  const tableH = measureTableHeight(tableBody, margin, contentW, tableMarginBottomMm)

  const brandBlockH = qrDataUrl ? measureBrandBlockHeightMm(doc, contentW, pdf) : 0
  const brandBelowImageH = qrDataUrl ? GAP_IMAGE_BRAND + brandBlockH + GAP_BRAND_TABLE : GAP_BRAND_TABLE

  const baseImageTop = yAfterTitle + GAP_TITLE_IMAGE
  const imageStartY =
    qrDataUrl ? Math.max(baseImageTop, margin + QR_SIZE + QR_CLEAR_BELOW_MM) : baseImageTop

  const maxImgH =
    pageH - margin - imageStartY - brandBelowImageH - tableH - GAP_TABLE_FOOTER

  /* ── Image ── */
  let cursorY = imageStartY
  if (snapshotDataUrl) {
    try {
      const img = await loadImage(snapshotDataUrl)
      const aspect = img.naturalWidth / Math.max(1, img.naturalHeight)
      const byHeight = contentW / aspect
      /**
       * Contain у доступній висоті: однакова логіка для ширини й висоти,
       * без подвійного IMAGE_SHRINK на висоті — рамка щільніше облягає PNG.
       */
      const boxW = contentW * IMAGE_SHRINK
      const innerCap = Math.max(1, Math.min(byHeight, maxImgH))
      const boxH = innerCap * IMAGE_SHRINK
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
        const brandTop = cursorY + GAP_IMAGE_BRAND
        drawPdfBrandCenteredBelowImage(doc, pdf, pageW, margin, brandTop)
        cursorY = brandTop + brandBlockH
      }
      cursorY += GAP_BRAND_TABLE
    } catch {
      doc.setFont(PDF_FONT_FAMILY, 'normal')
      doc.setFontSize(9)
      doc.setTextColor(120, 120, 120)
      doc.text(pdf.noSnapshot, pageW / 2, cursorY + 4, { align: 'center' })
      doc.setTextColor(0, 0, 0)
      cursorY += 8
      if (qrDataUrl) {
        const brandTop = cursorY + GAP_IMAGE_BRAND
        drawPdfBrandCenteredBelowImage(doc, pdf, pageW, margin, brandTop)
        cursorY = brandTop + brandBlockH
        cursorY += GAP_BRAND_TABLE
      }
    }
  } else {
    doc.setFont(PDF_FONT_FAMILY, 'normal')
    doc.setFontSize(9)
    doc.setTextColor(120, 120, 120)
    doc.text(pdf.noSnapshot, pageW / 2, cursorY + 4, { align: 'center' })
    doc.setTextColor(0, 0, 0)
    cursorY += 8
    if (qrDataUrl) {
      const brandTop = cursorY + GAP_IMAGE_BRAND
      drawPdfBrandCenteredBelowImage(doc, pdf, pageW, margin, brandTop)
      cursorY = brandTop + brandBlockH
      cursorY += GAP_BRAND_TABLE
    }
  }

  /* ── Table ── */
  autoTable(doc, buildTableOpts(tableBody, cursorY, margin, contentW, tableMarginBottomMm))

  doc.save(fileName)
}
