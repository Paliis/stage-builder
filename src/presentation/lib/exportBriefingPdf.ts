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
const GAP_TITLE_IMAGE = 4
const GAP_IMAGE_TABLE = 5
const GAP_TABLE_FOOTER = 4
const QR_SIZE = 14
const FOOTER_H = QR_SIZE + 4
const IMAGE_SHRINK = 0.9

function buildTableOpts(
  tableBody: string[][],
  startY: number,
  margin: number,
  contentW: number,
): Parameters<typeof autoTable>[1] {
  return {
    startY,
    margin: { left: margin, right: margin },
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

function measureTableHeight(
  tableBody: string[][],
  margin: number,
  contentW: number,
): number {
  const tmp = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
  autoTable(tmp, buildTableOpts(tableBody, 0, margin, contentW))
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

  /* ── Title ── */
  let cursorY = margin
  doc.setFont(PDF_FONT_FAMILY, 'bold')
  doc.setFontSize(14)
  const titleLines = doc.splitTextToSize(briefing.documentTitle, contentW) as string[]
  doc.text(titleLines, pageW / 2, cursorY + 5, { align: 'center' })
  const titleH = titleLines.length * 6 + 4
  cursorY += titleH

  /* ── Table data & measurement ── */
  const rows = briefingTableRows(briefing, pdf.labels, pdf.categoryLabel, pdf.emptyCell)
  const tableBody = rows.map((r) => [r.label, r.value])
  const tableH = measureTableHeight(tableBody, margin, contentW)

  /* ── Footer zone (fixed at bottom) ── */
  const footerY = pageH - margin - FOOTER_H

  /* ── Available height for the image ── */
  const maxImgH =
    footerY - cursorY - GAP_TITLE_IMAGE - GAP_IMAGE_TABLE - tableH - GAP_TABLE_FOOTER

  /* ── Image ── */
  cursorY += GAP_TITLE_IMAGE
  if (snapshotDataUrl) {
    try {
      const img = await loadImage(snapshotDataUrl)
      const aspect = img.naturalWidth / Math.max(1, img.naturalHeight)
      const byWidth = contentW
      const byHeight = byWidth / aspect
      const rawH = Math.min(byHeight, Math.max(maxImgH, 40))
      const finalH = rawH * IMAGE_SHRINK
      const finalW = Math.min(finalH * aspect, contentW * IMAGE_SHRINK)
      const imgX = margin + (contentW - finalW) / 2

      doc.addImage(snapshotDataUrl, 'PNG', imgX, cursorY, finalW, finalH)
      cursorY += finalH + GAP_IMAGE_TABLE
    } catch {
      doc.setFont(PDF_FONT_FAMILY, 'normal')
      doc.setFontSize(9)
      doc.setTextColor(120, 120, 120)
      doc.text(pdf.noSnapshot, pageW / 2, cursorY + 4, { align: 'center' })
      doc.setTextColor(0, 0, 0)
      cursorY += 8
    }
  } else {
    doc.setFont(PDF_FONT_FAMILY, 'normal')
    doc.setFontSize(9)
    doc.setTextColor(120, 120, 120)
    doc.text(pdf.noSnapshot, pageW / 2, cursorY + 4, { align: 'center' })
    doc.setTextColor(0, 0, 0)
    cursorY += 8
  }

  /* ── Table ── */
  autoTable(doc, buildTableOpts(tableBody, cursorY, margin, contentW))

  /* ── Footer ── */
  doc.setDrawColor(209, 213, 219)
  doc.setLineWidth(0.3)
  doc.line(margin, footerY, pageW - margin, footerY)

  try {
    const qrDataUrl = await generateQrDataUrl(APP_URL)
    doc.addImage(qrDataUrl, 'PNG', margin, footerY + 2, QR_SIZE, QR_SIZE)
  } catch {
    /* QR generation failed — skip silently */
  }

  const textX = margin + QR_SIZE + 3
  doc.setFont(PDF_FONT_FAMILY, 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(107, 114, 128)
  doc.text(pdf.generatedBy, textX, footerY + 6)

  doc.setFontSize(6.5)
  doc.setTextColor(148, 163, 184)
  doc.text(APP_URL, textX, footerY + 10.5)

  doc.save(fileName)
}
