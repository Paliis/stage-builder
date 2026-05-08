import { describe, expect, it } from 'vitest'
import { STAGE_CARD_UI_DEPTH_FACTOR } from './field'
import {
  briefingPdfSnapshotAspectRatio,
  mmToCssPx96,
  pdfSnapshotPixelSize,
  PDF_BRIEFING_SNAPSHOT_MIN_ASPECT,
  PDF_CONTENT_INNER_WIDTH_PX,
  PDF_SNAPSHOT_EXPORT_SCALE,
  stagePlanAspectRatio,
  stageViewportAspectRatio,
} from './a4PrintLayout'

describe('mmToCssPx96', () => {
  it('rounds mm to css px at 96 dpi', () => {
    expect(mmToCssPx96(25.4)).toBe(96)
  })
})

describe('stagePlanAspectRatio', () => {
  it('returns width/height', () => {
    expect(stagePlanAspectRatio(30, 40)).toBeCloseTo(0.75)
  })
})

describe('stageViewportAspectRatio', () => {
  it('applies STAGE_CARD_UI_DEPTH_FACTOR to depth', () => {
    const w = 30
    const h = 40
    expect(stageViewportAspectRatio(w, h)).toBeCloseTo(w / (h / STAGE_CARD_UI_DEPTH_FACTOR))
  })
})

describe('briefingPdfSnapshotAspectRatio', () => {
  it('raises narrow viewport aspect to PDF briefing minimum', () => {
    expect(stageViewportAspectRatio(30, 40)).toBeLessThan(PDF_BRIEFING_SNAPSHOT_MIN_ASPECT)
    expect(briefingPdfSnapshotAspectRatio(30, 40)).toBe(PDF_BRIEFING_SNAPSHOT_MIN_ASPECT)
  })

  it('keeps wide-field viewport aspect unchanged', () => {
    const a = stageViewportAspectRatio(50, 30)
    expect(a).toBeGreaterThan(PDF_BRIEFING_SNAPSHOT_MIN_ASPECT)
    expect(briefingPdfSnapshotAspectRatio(50, 30)).toBeCloseTo(a)
  })
})

describe('pdfSnapshotPixelSize', () => {
  it('keeps width from PDF column and derives height from briefing PDF aspect', () => {
    const { width, height } = pdfSnapshotPixelSize(30, 40, 2)
    expect(width).toBe(Math.round(PDF_CONTENT_INNER_WIDTH_PX * 2))
    const aspect = briefingPdfSnapshotAspectRatio(30, 40)
    expect(height).toBe(Math.round(width / aspect))
  })

  it('changes height when field aspect changes', () => {
    const a = pdfSnapshotPixelSize(30, 40, 1)
    const b = pdfSnapshotPixelSize(50, 30, 1)
    expect(a.width).toBe(b.width)
    expect(a.height).not.toBe(b.height)
  })

  it('PDF_SNAPSHOT_EXPORT_SCALE drives briefing PNG width', () => {
    expect(PDF_SNAPSHOT_EXPORT_SCALE).toBeGreaterThanOrEqual(2)
    const { width } = pdfSnapshotPixelSize(30, 40, PDF_SNAPSHOT_EXPORT_SCALE)
    expect(width).toBe(Math.round(PDF_CONTENT_INNER_WIDTH_PX * PDF_SNAPSHOT_EXPORT_SCALE))
  })
})
