import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'
import QRCode from 'qrcode'
import { PDF_MARGIN_MM } from '../../domain/a4PrintLayout'
import type { StageBriefing } from '../../domain/stageBriefing'
import { briefingTableRows, type BriefingPdfLabels } from '../../domain/stageBriefing'
import type { StageCategory } from '../../domain/models'
import { registerPdfFonts, PDF_FONT_FAMILY } from './pdfFonts'

const APP_URL = 'https://stage-builder.example.com'

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
  let cursorY = margin

  doc.setFont(PDF_FONT_FAMILY, 'bold')
  doc.setFontSize(16)
  const titleLines = doc.splitTextToSize(briefing.documentTitle, contentW) as string[]
  doc.text(titleLines, margin, cursorY + 5)
  cursorY += titleLines.length * 7 + 6

  if (snapshotDataUrl) {
    try {
      const img = await loadImage(snapshotDataUrl)
      const aspect = img.naturalWidth / Math.max(1, img.naturalHeight)
      const imgW = contentW
      const imgH = imgW / aspect
      const maxImgH = 110
      const finalH = Math.min(imgH, maxImgH)
      const finalW = finalH * aspect

      doc.addImage(snapshotDataUrl, 'PNG', margin, cursorY, Math.min(finalW, contentW), finalH)
      cursorY += finalH + 4
    } catch {
      doc.setFont(PDF_FONT_FAMILY, 'normal')
      doc.setFontSize(10)
      doc.setTextColor(120, 120, 120)
      doc.text(pdf.noSnapshot, margin, cursorY + 4)
      doc.setTextColor(0, 0, 0)
      cursorY += 8
    }
  } else {
    doc.setFont(PDF_FONT_FAMILY, 'normal')
    doc.setFontSize(10)
    doc.setTextColor(120, 120, 120)
    doc.text(pdf.noSnapshot, margin, cursorY + 4)
    doc.setTextColor(0, 0, 0)
    cursorY += 8
  }

  const rows = briefingTableRows(briefing, pdf.labels, pdf.categoryLabel, pdf.emptyCell)
  const tableBody = rows.map((r) => [r.label, r.value])

  autoTable(doc, {
    startY: cursorY,
    margin: { left: margin, right: margin },
    head: [],
    body: tableBody,
    theme: 'grid',
    styles: {
      font: PDF_FONT_FAMILY,
      fontSize: 10,
      cellPadding: { top: 2.5, right: 3, bottom: 2.5, left: 3 },
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
  })

  const qrSize = 18
  const footerH = qrSize + 4
  const footerY = pageH - margin - footerH

  doc.setDrawColor(209, 213, 219)
  doc.setLineWidth(0.3)
  doc.line(margin, footerY, pageW - margin, footerY)

  try {
    const qrDataUrl = await generateQrDataUrl(APP_URL)
    doc.addImage(qrDataUrl, 'PNG', margin, footerY + 2, qrSize, qrSize)
  } catch {
    /* QR generation failed — skip silently */
  }

  const textX = margin + qrSize + 4
  doc.setFont(PDF_FONT_FAMILY, 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(107, 114, 128)
  doc.text(pdf.generatedBy, textX, footerY + 8)

  doc.setFontSize(7)
  doc.setTextColor(148, 163, 184)
  doc.text(APP_URL, textX, footerY + 12.5)

  doc.save(fileName)
}
