import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'
import QRCode from 'qrcode'
import { PDF_MARGIN_MM } from '../../domain/a4PrintLayout'
import type { StageBriefing } from '../../domain/stageBriefing'
import { briefingTableRows, type BriefingPdfLabels } from '../../domain/stageBriefing'
import type { StageCategory } from '../../domain/models'
import { CANONICAL_PRODUCTION_ORIGIN } from '../../seo/canonicalProductionOrigin'
import {
  prepareBriefingPdfLogos,
  type BriefingPdfLogoPrepared,
} from './pdfBriefingLogos'
import { registerPdfFonts, PDF_FONT_FAMILY } from './pdfFonts'

/** Default link in PDF footer / QR when caller does not pass `qrTargetUrl` (matches portal editor path). */
const DEFAULT_PDF_PUBLIC_URL = `${CANONICAL_PRODUCTION_ORIGIN}/stage-builder`

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
const TABLE_CELL_PADDING = { top: 2.2, right: 4, bottom: 2.2, left: 4 }
/** Мінімальний зазор під заголовком перед знімком. */
const GAP_TITLE_IMAGE = 3
/** Після знімка: бренд-текст (під картинкою), потім зазор перед таблицею. */
const GAP_IMAGE_BRAND = 2
/** Зазор між блоком «згенеровано…» і таблицею брифінгу (мм). */
const GAP_BRAND_TABLE = 9
/** Додатковий відступ зліва/справа для переносу рядка під знімком (мм від країв контенту). */
const BRAND_LINE_HORIZONTAL_INSET_MM = 10
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

/** Зазор між двома логотипами у заголовку PDF (мм). */
const HEADER_LOGO_GAP_MM = 5
/**
 * Додатковий підйом через верхнє поле: береться разом із вирівнюванням під перший рядок тексту (`Math.min`).
 * У jsPDF менший `y` — вище на сторінці.
 */
const HEADER_LOGO_TOP_NUDGE_MM = -5
/** Додатковий зсув угору лише для растру ФПСУ (прозорість / нижній «повітря» в PNG). */
const HEADER_LOGO_FPSU_EXTRA_Y_MM = -0.9
/** Приблизний cap height від baseline першого рядка назви матчу (`MATCH_TITLE_FONT_PT`). */
const HEADER_LOGO_CAP_ASCENT_MATCH_MM = 4.1
/** Приблизний cap height для першого рядка лише з document title (`DOC_TITLE_FONT_PT`). */
const HEADER_LOGO_CAP_ASCENT_DOCONLY_MM = 5.3
/** Зазор між блоком логотипів і центральним текстом (мм). */
const GAP_LOGO_TO_CENTER_TEXT_MM = 4
const MATCH_TITLE_FONT_PT = 11
const LINE_MM_MATCH = 5
const GAP_AFTER_MATCH_MM = 2
const DOC_TITLE_FONT_PT = 13
const LINE_MM_DOC_TITLE = 6
const TITLE_TAIL_PAD_MM = 4

function computeBriefingPdfLogoTopBaseMm(margin: number, briefing: StageBriefing): number {
  const matchTrim = briefing.matchName.trim()
  const firstTextBaseline = matchTrim ? margin + 4 : margin + 5
  const capAscent = matchTrim ? HEADER_LOGO_CAP_ASCENT_MATCH_MM : HEADER_LOGO_CAP_ASCENT_DOCONLY_MM
  const alignedTop = firstTextBaseline - capAscent
  const liftedTop = margin + HEADER_LOGO_TOP_NUDGE_MM
  return Math.max(0.5, Math.min(liftedTop, alignedTop))
}

function logoExtraYMm(L: BriefingPdfLogoPrepared): number {
  return L.kind === 'fpsu' ? HEADER_LOGO_FPSU_EXTRA_Y_MM : 0
}

function computeLogoStripBottomMm(logoTopBase: number, logos: BriefingPdfLogoPrepared[]): number {
  if (logos.length === 0) return logoTopBase
  return Math.max(...logos.map((L) => logoTopBase + logoExtraYMm(L) + L.hMm))
}

function computeLogoStripWidthMm(logos: Array<{ wMm: number }>): number {
  if (logos.length === 0) return 0
  const gap = HEADER_LOGO_GAP_MM
  return logos.reduce((sum, L) => sum + L.wMm, 0) + gap * (logos.length - 1)
}

function measureBriefingPdfHeaderBottomMm(
  doc: InstanceType<typeof jsPDF>,
  briefing: StageBriefing,
  logos: BriefingPdfLogoPrepared[],
  headerRightEdge: number,
  margin: number,
): number {
  const stripW = computeLogoStripWidthMm(logos)
  const centerLeft = margin + stripW + (stripW > 0 ? GAP_LOGO_TO_CENTER_TEXT_MM : 0)
  const centerTextMaxW = Math.max(16, headerRightEdge - centerLeft)

  const logoTopBase = computeBriefingPdfLogoTopBaseMm(margin, briefing)
  const logoBottom =
    logos.length === 0 ? margin : computeLogoStripBottomMm(logoTopBase, logos)

  const matchTrim = briefing.matchName.trim()
  let titleFirstBaseline: number
  if (matchTrim) {
    doc.setFont(PDF_FONT_FAMILY, 'bold')
    doc.setFontSize(MATCH_TITLE_FONT_PT)
    const ml = doc.splitTextToSize(matchTrim, centerTextMaxW) as string[]
    titleFirstBaseline = margin + 4 + ml.length * LINE_MM_MATCH + GAP_AFTER_MATCH_MM
  } else {
    titleFirstBaseline = margin + 5
  }
  doc.setFont(PDF_FONT_FAMILY, 'bold')
  doc.setFontSize(DOC_TITLE_FONT_PT)
  const titleLines = doc.splitTextToSize(briefing.documentTitle, centerTextMaxW) as string[]
  const lastTitleBaseline =
    titleLines.length === 0
      ? titleFirstBaseline
      : titleFirstBaseline + (titleLines.length - 1) * LINE_MM_DOC_TITLE
  const textExtentBottom = lastTitleBaseline + 4

  doc.setFont(PDF_FONT_FAMILY, 'normal')
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)

  return Math.max(logoBottom, textExtentBottom) + TITLE_TAIL_PAD_MM
}

function drawBriefingPdfHeader(
  doc: InstanceType<typeof jsPDF>,
  briefing: StageBriefing,
  logos: BriefingPdfLogoPrepared[],
  headerRightEdge: number,
  margin: number,
): void {
  const stripW = computeLogoStripWidthMm(logos)
  const centerLeft = margin + stripW + (stripW > 0 ? GAP_LOGO_TO_CENTER_TEXT_MM : 0)
  const centerCx = (centerLeft + headerRightEdge) / 2
  const centerMaxW = Math.max(16, headerRightEdge - centerLeft)

  const logoTopBase = computeBriefingPdfLogoTopBaseMm(margin, briefing)

  if (logos.length > 0) {
    let x = margin
    logos.forEach((L) => {
      const y = logoTopBase + logoExtraYMm(L)
      doc.addImage(L.dataUrl, 'PNG', x, y, L.wMm, L.hMm)
      x += L.wMm + HEADER_LOGO_GAP_MM
    })
  }

  const matchTrim = briefing.matchName.trim()
  let baseline: number
  if (matchTrim) {
    doc.setFont(PDF_FONT_FAMILY, 'bold')
    doc.setFontSize(MATCH_TITLE_FONT_PT)
    doc.setTextColor(17, 24, 39)
    const lines = doc.splitTextToSize(matchTrim, centerMaxW) as string[]
    baseline = margin + 4
    for (const line of lines) {
      doc.text(line, centerCx, baseline, { align: 'center' })
      baseline += LINE_MM_MATCH
    }
    baseline += GAP_AFTER_MATCH_MM
  } else {
    baseline = margin + 5
  }

  doc.setFont(PDF_FONT_FAMILY, 'bold')
  doc.setFontSize(DOC_TITLE_FONT_PT)
  doc.setTextColor(17, 24, 39)
  const titleLines = doc.splitTextToSize(briefing.documentTitle, centerMaxW) as string[]
  for (const line of titleLines) {
    doc.text(line, centerCx, baseline, { align: 'center' })
    baseline += LINE_MM_DOC_TITLE
  }
  doc.setFont(PDF_FONT_FAMILY, 'normal')
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
}

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
  publicSiteUrl: string,
): number {
  const brandMaxW = Math.max(20, contentW - 2 * BRAND_LINE_HORIZONTAL_INSET_MM)
  const combined = `${pdf.generatedBy}  ${publicSiteUrl}`
  let fs = 6
  doc.setFont(PDF_FONT_FAMILY, 'normal')
  doc.setFontSize(fs)
  let lines = doc.splitTextToSize(combined, brandMaxW) as string[]
  while (lines.length > 1 && fs >= 5) {
    fs -= 0.5
    doc.setFontSize(fs)
    lines = doc.splitTextToSize(combined, brandMaxW) as string[]
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
  publicSiteUrl: string,
): void {
  const contentW = pageW - margin * 2
  const brandMaxW = Math.max(20, contentW - 2 * BRAND_LINE_HORIZONTAL_INSET_MM)
  const combined = `${pdf.generatedBy}  ${publicSiteUrl}`
  doc.setFont(PDF_FONT_FAMILY, 'normal')
  let fs = 6
  doc.setFontSize(fs)
  let lines = doc.splitTextToSize(combined, brandMaxW) as string[]
  while (lines.length > 1 && fs >= 5) {
    fs -= 0.5
    doc.setFontSize(fs)
    lines = doc.splitTextToSize(combined, brandMaxW) as string[]
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
  /** When set (e.g. opened from a share URL), QR encodes this URL — typically `/v/:id?lang=` for shooters. */
  qrTargetUrl?: string
}): Promise<void> {
  const { snapshotDataUrl, briefing, pdf, fileName = 'briefing.pdf', qrTargetUrl } = opts
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })

  await registerPdfFonts(doc)

  const margin = PDF_MARGIN_MM
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const contentW = pageW - margin * 2

  const qrEncodeUrl = (qrTargetUrl?.trim() || DEFAULT_PDF_PUBLIC_URL).replace(/\/$/, '')
  let qrDataUrl: string | null = null
  try {
    qrDataUrl = await generateQrDataUrl(qrEncodeUrl)
  } catch {
    qrDataUrl = null
  }

  /* ── Table data & measurement (компактніший перший ряд: тип + постріли) ── */
  const rows = briefingTableRows(briefing, pdf.labels, pdf.categoryLabel, pdf.emptyCell)
  const tableBody = rows.map((r) => [r.label, r.value])

  const tableMarginBottomMm = margin

  const tableH = measureTableHeight(tableBody, margin, contentW, tableMarginBottomMm)

  const preparedLogos = await prepareBriefingPdfLogos(briefing)
  const headerRightEdge = qrDataUrl ? pageW - margin - QR_SIZE - QR_GAP_MM : pageW - margin
  const headerBottomMm = measureBriefingPdfHeaderBottomMm(
    doc,
    briefing,
    preparedLogos,
    headerRightEdge,
    margin,
  )

  const brandBlockH = qrDataUrl ? measureBrandBlockHeightMm(doc, contentW, pdf, qrEncodeUrl) : 0
  const brandBelowImageH = qrDataUrl ? GAP_IMAGE_BRAND + brandBlockH + GAP_BRAND_TABLE : GAP_BRAND_TABLE

  const baseImageTop = headerBottomMm + GAP_TITLE_IMAGE
  const imageStartY =
    qrDataUrl ? Math.max(baseImageTop, margin + QR_SIZE + QR_CLEAR_BELOW_MM) : baseImageTop

  const maxImgH =
    pageH - margin - imageStartY - brandBelowImageH - tableH - GAP_TABLE_FOOTER

  drawBriefingPdfHeader(doc, briefing, preparedLogos, headerRightEdge, margin)

  if (qrDataUrl) {
    drawPdfQrPageCorner(doc, qrDataUrl, pageW, margin)
  }

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
        drawPdfBrandCenteredBelowImage(doc, pdf, pageW, margin, brandTop, qrEncodeUrl)
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
        drawPdfBrandCenteredBelowImage(doc, pdf, pageW, margin, brandTop, qrEncodeUrl)
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
      drawPdfBrandCenteredBelowImage(doc, pdf, pageW, margin, brandTop, qrEncodeUrl)
      cursorY = brandTop + brandBlockH
      cursorY += GAP_BRAND_TABLE
    }
  }

  /* ── Table ── */
  autoTable(doc, buildTableOpts(tableBody, cursorY, margin, contentW, tableMarginBottomMm))

  doc.save(fileName)
}
