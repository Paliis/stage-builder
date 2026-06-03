import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'
import QRCode from 'qrcode'

import { PDF_MARGIN_MM } from '../../domain/a4PrintLayout.ts'
import { briefingTableRows } from '../../domain/stageBriefing.ts'
import {
  summaryRowTotal,
  summaryTotals,
  type MatchParticipantSummary,
} from '../../domain/matchParticipantSummary.ts'
import type { MatchProgrammeStatsBundle, MatchStageStatRow } from '../../domain/matchProgrammeStats.ts'
import { categoryLabel, divisionLabel, parseMatchDiscipline } from '../../portal/shooterProfileCatalog.ts'
import type { MatchBriefingsExportBundle, MatchBriefingsStageExport } from '../loadMatchBriefingsExportData.ts'
import { registerPdfFontsNode, PDF_FONT_FAMILY } from 'match-briefings-pdf-fonts'
import {
  matchBriefingsPdfStrings,
  type MatchBriefingsPdfLocale,
  type MatchBriefingsPdfStrings,
} from './matchBriefingsPdfLabels.ts'

const TABLE_FONT_SIZE = 10
const TABLE_CELL_PADDING = { top: 2.8, right: 4.5, bottom: 2.8, left: 4.5 }
const PROGRAMME_STATS_ROWS_PER_PAGE = 12
const PROGRAMME_TABLE_FONT_SIZE = 9
const PROGRAMME_TABLE_CELL_PADDING = { top: 2, right: 3, bottom: 2, left: 3 }
/** Share of content width used for centred programme-stats grid. */
const PROGRAMME_TABLE_WIDTH_RATIO = 0.96

function cellCount(n: number, empty: string): string {
  return n > 0 ? String(n) : empty
}

function formatMatchDate(iso: string, locale: MatchBriefingsPdfLocale): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString(locale === 'en' ? 'en-GB' : 'uk-UA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

function centredTableMargin(contentW: number, tableW: number, baseMargin: number): number {
  return baseMargin + Math.max(0, (contentW - tableW) / 2)
}

function gridTableOpts(
  body: string[][],
  startY: number,
  margin: number,
  contentW: number,
  head?: string[],
  tableW = contentW,
): Parameters<typeof autoTable>[1] {
  const colCount = body[0]?.length ?? head?.length ?? 1
  const colWidth = tableW / Math.max(1, colCount)
  const columnStyles: Record<number, { cellWidth: number; halign?: 'left' | 'center' | 'right' }> = {}
  for (let i = 0; i < colCount; i++) {
    columnStyles[i] = {
      cellWidth: colWidth,
      halign: i === 0 ? 'left' : 'center',
    }
  }
  const left = centredTableMargin(contentW, tableW, margin)
  return {
    startY,
    tableWidth: tableW,
    margin: { left, right: margin, bottom: margin },
    head: head ? [head] : [],
    body,
    theme: 'grid',
    styles: {
      font: PDF_FONT_FAMILY,
      fontSize: TABLE_FONT_SIZE,
      cellPadding: TABLE_CELL_PADDING,
      lineColor: [209, 213, 219],
      lineWidth: 0.3,
      textColor: [17, 24, 39],
      valign: 'middle',
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [17, 24, 39],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles,
  }
}

/** Column widths tuned for 11 cols — wide stage name, compact numeric cols. */
function programmeStatsColumnStyles(tableW: number): Record<
  number,
  { cellWidth: number; halign?: 'left' | 'center' | 'right'; fontSize?: number }
> {
  const stage = tableW * 0.28
  const type = tableW * 0.09
  const tiny = tableW * 0.052
  const ammo = tableW * 0.08
  const num = tableW * 0.068
  return {
    0: { cellWidth: stage, halign: 'left', fontSize: PROGRAMME_TABLE_FONT_SIZE },
    1: { cellWidth: type, halign: 'center', fontSize: PROGRAMME_TABLE_FONT_SIZE },
    2: { cellWidth: tiny, halign: 'center' },
    3: { cellWidth: tiny, halign: 'center' },
    4: { cellWidth: tiny, halign: 'center' },
    5: { cellWidth: tiny, halign: 'center' },
    6: { cellWidth: tiny, halign: 'center' },
    7: { cellWidth: ammo, halign: 'center', fontSize: PROGRAMME_TABLE_FONT_SIZE },
    8: { cellWidth: num, halign: 'center' },
    9: { cellWidth: num, halign: 'center' },
    10: { cellWidth: tableW - stage - type - tiny * 5 - ammo - num * 2, halign: 'center' },
  }
}

function programmeStatsTableOpts(
  body: string[][],
  startY: number,
  margin: number,
  contentW: number,
  head: string[],
  doc: jsPDF,
  totalRowLabel: string,
): Parameters<typeof autoTable>[1] {
  const tableW = contentW * PROGRAMME_TABLE_WIDTH_RATIO
  const left = centredTableMargin(contentW, tableW, margin)
  const stageColW = tableW * 0.28
  const fittedBody = body.map((row) => {
    if (row[0] === totalRowLabel) return row
    const stageText = row[0] ?? ''
    const lines = doc.splitTextToSize(stageText, stageColW - 4) as string[]
    const fitted =
      lines.length <= 2 ?
        lines.join('\n')
      : `${lines[0]}\n${lines[1]!.length > 3 ? `${lines[1]!.slice(0, -1)}…` : lines[1]}`
    return [fitted, ...row.slice(1)]
  })

  return {
    startY,
    tableWidth: tableW,
    margin: { left, right: margin, bottom: margin },
    head: [head],
    body: fittedBody,
    theme: 'grid',
    styles: {
      font: PDF_FONT_FAMILY,
      fontSize: PROGRAMME_TABLE_FONT_SIZE,
      cellPadding: PROGRAMME_TABLE_CELL_PADDING,
      lineColor: [209, 213, 219],
      lineWidth: 0.25,
      textColor: [17, 24, 39],
      valign: 'middle',
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [17, 24, 39],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: PROGRAMME_TABLE_FONT_SIZE,
    },
    columnStyles: programmeStatsColumnStyles(tableW),
  }
}

function twoColTableOpts(
  body: string[][],
  startY: number,
  margin: number,
  contentW: number,
): Parameters<typeof autoTable>[1] {
  return {
    startY,
    margin: { left: margin, right: margin, bottom: margin },
    head: [],
    body,
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
      0: { cellWidth: contentW * 0.34, fontStyle: 'bold', fillColor: [249, 250, 251] },
      1: { cellWidth: contentW * 0.66 },
    },
  }
}

function drawSectionTitle(
  doc: jsPDF,
  y: number,
  margin: number,
  title: string,
  centered = false,
): number {
  const pageW = doc.internal.pageSize.getWidth()
  doc.setFont(PDF_FONT_FAMILY, 'bold')
  doc.setFontSize(13)
  doc.setTextColor(17, 24, 39)
  if (centered) {
    doc.text(title, pageW / 2, y, { align: 'center' })
  } else {
    doc.text(title, margin, y)
  }
  doc.setFont(PDF_FONT_FAMILY, 'normal')
  doc.setFontSize(10)
  return y + 8
}

function drawTitlePage(
  doc: jsPDF,
  bundle: MatchBriefingsExportBundle,
  s: MatchBriefingsPdfStrings,
  locale: MatchBriefingsPdfLocale,
  margin: number,
  contentW: number,
): void {
  const pageW = doc.internal.pageSize.getWidth()
  let y = margin + 12
  doc.setFont(PDF_FONT_FAMILY, 'bold')
  doc.setFontSize(18)
  doc.text(s.titlePageHeading, pageW / 2, y, { align: 'center' })
  y += 12
  doc.setFontSize(15)
  const titleLines = doc.splitTextToSize(bundle.match.title.trim() || '—', pageW - margin * 2) as string[]
  for (const line of titleLines) {
    doc.text(line, pageW / 2, y, { align: 'center' })
    y += 7
  }
  doc.setFont(PDF_FONT_FAMILY, 'normal')
  doc.setFontSize(11)
  y += 4
  doc.text(`${s.titleDate}: ${formatMatchDate(bundle.match.startsAt, locale)}`, pageW / 2, y, {
    align: 'center',
  })
  y += 6
  if (bundle.match.locationLabel?.trim()) {
    const locLines = doc.splitTextToSize(
      `${s.titleLocation}: ${bundle.match.locationLabel.trim()}`,
      pageW - margin * 2,
    ) as string[]
    for (const line of locLines) {
      doc.text(line, pageW / 2, y, { align: 'center' })
      y += 5
    }
  }

  if (bundle.participantSummary) {
    y += 6
    drawParticipantSummaryOnTitlePage(
      doc,
      bundle.participantSummary,
      locale,
      s,
      margin,
      contentW,
      y,
    )
  }

  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text(s.generatedFooter, pageW / 2, doc.internal.pageSize.getHeight() - margin, { align: 'center' })
  doc.setTextColor(0, 0, 0)
}

function programmeStatsDataRows(
  rows: MatchStageStatRow[],
  stageTitleByOrder: Map<number, string>,
  s: MatchBriefingsPdfStrings,
): string[][] {
  return rows.map((r) => {
    const t = r.targets
    return [
      stageTitleByOrder.get(r.sortOrder) ?? String(r.sortOrder),
      s.categoryLabel(r.exerciseType),
      cellCount(t.paper, s.emptyCell),
      cellCount(t.metalPlates, s.emptyCell),
      cellCount(t.ceramic, s.emptyCell),
      cellCount(t.poppers, s.emptyCell),
      cellCount(t.miniPoppers, s.emptyCell),
      r.ammoLabel,
      String(r.shots),
      String(r.points),
      `${r.matchPercent}%`,
    ]
  })
}

function programmeStatsTotalRow(
  rows: MatchStageStatRow[],
  s: MatchBriefingsPdfStrings,
): string[] {
  const tot = rows.reduce(
    (acc, r) => {
      acc.paper += r.targets.paper
      acc.metal += r.targets.metalPlates
      acc.ceramic += r.targets.ceramic
      acc.poppers += r.targets.poppers
      acc.mini += r.targets.miniPoppers
      acc.shots += r.shots
      acc.points += r.points
      return acc
    },
    { paper: 0, metal: 0, ceramic: 0, poppers: 0, mini: 0, shots: 0, points: 0 },
  )
  return [
    s.rowTotal,
    '',
    cellCount(tot.paper, s.emptyCell),
    cellCount(tot.metal, s.emptyCell),
    cellCount(tot.ceramic, s.emptyCell),
    cellCount(tot.poppers, s.emptyCell),
    cellCount(tot.mini, s.emptyCell),
    '',
    String(tot.shots),
    String(tot.points),
    '100%',
  ]
}

function chunkRows<T>(items: T[], size: number): T[][] {
  if (items.length === 0) return [[]]
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size))
  }
  return out
}

function drawProgrammeStats(
  doc: jsPDF,
  stats: MatchProgrammeStatsBundle,
  stageTitleByOrder: Map<number, string>,
  s: MatchBriefingsPdfStrings,
  margin: number,
  contentW: number,
): void {
  const head = [
    s.colStage,
    s.colType,
    s.colPaper,
    s.colMetal,
    s.colCeramic,
    s.colPopper,
    s.colMini,
    s.colAmmo,
    s.colShots,
    s.colPoints,
    s.colPercent,
  ]
  const dataRows = programmeStatsDataRows(stats.rows, stageTitleByOrder, s)
  const totalRow = programmeStatsTotalRow(stats.rows, s)
  const chunks = chunkRows(dataRows, PROGRAMME_STATS_ROWS_PER_PAGE)

  for (let page = 0; page < chunks.length; page++) {
    doc.addPage()
    let y = drawSectionTitle(doc, margin + 4, margin, s.sectionProgrammeStats, true)
    if (chunks.length > 1) {
      doc.setFontSize(9)
      doc.setTextColor(100, 116, 139)
      doc.text(`${page + 1} / ${chunks.length}`, doc.internal.pageSize.getWidth() - margin, y - 2, {
        align: 'right',
      })
      doc.setTextColor(0, 0, 0)
    }
    const isLast = page === chunks.length - 1
    const body = isLast ? [...chunks[page]!, totalRow] : chunks[page]!
    autoTable(doc, programmeStatsTableOpts(body, y, margin, contentW, head, doc, s.rowTotal))
  }
}

function compactParticipantTableOpts(
  body: string[][],
  startY: number,
  margin: number,
  contentW: number,
  head: string[],
  tableW: number,
): Parameters<typeof autoTable>[1] {
  const base = gridTableOpts(body, startY, margin, contentW, head, tableW)
  return {
    ...base,
    styles: {
      ...base.styles,
      fontSize: 9,
      cellPadding: PROGRAMME_TABLE_CELL_PADDING,
    },
    headStyles: {
      ...base.headStyles,
      fontSize: 9,
    },
  }
}

function summaryCountTable(
  rows: { label: string; confirmed: number; pending: number }[],
  s: MatchBriefingsPdfStrings,
): string[][] {
  const body = rows.map((r) => [
    r.label,
    cellCount(r.confirmed, s.emptyCell),
    cellCount(r.pending, s.emptyCell),
    String(summaryRowTotal(r)),
  ])
  const totals = summaryTotals(
    rows.map((r) => ({ confirmed: r.confirmed, pending: r.pending })),
  )
  body.push([
    s.rowTotal,
    String(totals.confirmed),
    String(totals.pending),
    String(totals.total),
  ])
  return body
}

function drawParticipantSummaryOnTitlePage(
  doc: jsPDF,
  summary: MatchParticipantSummary,
  locale: MatchBriefingsPdfLocale,
  s: MatchBriefingsPdfStrings,
  margin: number,
  contentW: number,
  startY: number,
): void {
  const weaponId = parseMatchDiscipline(summary.discipline)
  const locUi = locale === 'en' ? 'en' : 'uk'
  const head = [s.colGroup, s.colConfirmed, s.colPending, s.colTotal]
  const tableW = contentW * 0.72

  let y = drawSectionTitle(doc, startY, margin, s.sectionParticipants, true)

  const drawSubTitle = (yy: number, label: string) => {
    doc.setFont(PDF_FONT_FAMILY, 'bold')
    doc.setFontSize(11)
    doc.text(label, doc.internal.pageSize.getWidth() / 2, yy, { align: 'center' })
    doc.setFont(PDF_FONT_FAMILY, 'normal')
    doc.setFontSize(10)
    return yy + 7
  }

  if (summary.byDivision.length > 0) {
    y = drawSubTitle(y + 2, s.sectionByDivision)
    const divRows = summary.byDivision.map((r) => ({
      label: weaponId ? divisionLabel(weaponId, r.division, locUi) : r.division,
      confirmed: r.confirmed,
      pending: r.pending,
    }))
    autoTable(
      doc,
      compactParticipantTableOpts(summaryCountTable(divRows, s), y, margin, contentW, head, tableW),
    )
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = ((doc as any).lastAutoTable?.finalY as number | undefined) ?? y
    y += 10
  }

  if (summary.byCategory.length > 0) {
    y = drawSubTitle(y, s.sectionByCategory)
    const catRows = summary.byCategory.map((r) => ({
      label: categoryLabel(r.category, locUi),
      confirmed: r.confirmed,
      pending: r.pending,
    }))
    autoTable(
      doc,
      compactParticipantTableOpts(summaryCountTable(catRows, s), y, margin, contentW, head, tableW),
    )
  }
}

async function drawStageBriefingPage(
  doc: jsPDF,
  stage: MatchBriefingsStageExport,
  s: MatchBriefingsPdfStrings,
  margin: number,
  contentW: number,
): Promise<void> {
  doc.addPage()
  const pageW = doc.internal.pageSize.getWidth()
  let y = margin + 6
  doc.setFont(PDF_FONT_FAMILY, 'bold')
  doc.setFontSize(14)
  const titleLines = doc.splitTextToSize(stage.displayTitle, contentW) as string[]
  for (const line of titleLines) {
    doc.text(line, margin, y)
    y += 7
  }
  doc.setFont(PDF_FONT_FAMILY, 'normal')
  doc.setFontSize(10)
  y += 2

  try {
    const qrDataUrl = await QRCode.toDataURL(stage.viewUrl, {
      width: 160,
      margin: 1,
      errorCorrectionLevel: 'M',
    })
    doc.addImage(qrDataUrl, 'PNG', pageW - margin - 22, margin, 22, 22)
  } catch {
    /* skip QR */
  }

  doc.setTextColor(37, 99, 235)
  doc.textWithLink(`${s.stageViewOnline}: ${stage.viewUrl}`, margin, y, { url: stage.viewUrl })
  doc.setTextColor(0, 0, 0)
  y += 10

  const briefing = {
    ...stage.project.briefing,
    matchName: stage.project.briefing.matchName.trim() || stage.displayTitle,
    documentTitle: stage.project.briefing.documentTitle.trim() || stage.displayTitle,
  }
  const rows = briefingTableRows(
    briefing,
    s.briefingLabels,
    s.categoryLabel,
    s.emptyCell,
  )
  const tableBody = rows.map((r) => [r.label, r.value])
  autoTable(doc, twoColTableOpts(tableBody, y, margin, contentW))
}

export async function buildMatchBriefingsPdf(
  bundle: MatchBriefingsExportBundle,
  locale: MatchBriefingsPdfLocale,
): Promise<Uint8Array> {
  const s = matchBriefingsPdfStrings(locale)
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
  registerPdfFontsNode(doc)

  const margin = PDF_MARGIN_MM
  const contentW = doc.internal.pageSize.getWidth() - margin * 2

  const stageTitleByOrder = new Map(bundle.stages.map((st) => [st.sortOrder, st.displayTitle]))

  drawTitlePage(doc, bundle, s, locale, margin, contentW)
  drawProgrammeStats(doc, bundle.stats, stageTitleByOrder, s, margin, contentW)

  for (const stage of bundle.stages) {
    await drawStageBriefingPage(doc, stage, s, margin, contentW)
  }

  const buf = doc.output('arraybuffer') as ArrayBuffer
  return new Uint8Array(buf)
}

