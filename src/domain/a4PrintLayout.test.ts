import { describe, expect, it } from 'vitest'
import { STAGE_CARD_UI_DEPTH_FACTOR } from './field'
import {
  mmToCssPx96,
  pdfSnapshotPixelSize,
  PDF_CONTENT_INNER_WIDTH_PX,
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

describe('pdfSnapshotPixelSize', () => {
  it('keeps width from PDF column and derives height from viewport aspect', () => {
    const { width, height } = pdfSnapshotPixelSize(30, 40, 2)
    expect(width).toBe(Math.round(PDF_CONTENT_INNER_WIDTH_PX * 2))
    const aspect = stageViewportAspectRatio(30, 40)
    expect(height).toBe(Math.round(width / aspect))
  })

  it('changes height when field aspect changes', () => {
    const a = pdfSnapshotPixelSize(30, 40, 1)
    const b = pdfSnapshotPixelSize(50, 30, 1)
    expect(a.width).toBe(b.width)
    expect(a.height).not.toBe(b.height)
  })
})
