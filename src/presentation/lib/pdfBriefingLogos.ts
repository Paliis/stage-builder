import type { StageBriefing } from '../../domain/stageBriefing'

/** Висота рядку логотипів у PDF (мм); базова висота для IPSC і нижня межа для ФПСУ. */
export const PDF_BRIEFING_LOGO_ROW_MM = 22

/**
 * ФПСУ в растрі інколи має зайве поле навколо знака (або інший bbox, ніж у IPSC).
 * Для квадратного `fpsu.png` без нижнього штриху множник лишається ~1.
 */
const FPSU_LOGO_HEIGHT_FACTOR = 1.05

export type BriefingPdfLogoPrepared = {
  dataUrl: string
  wMm: number
  hMm: number
  kind: 'fpsu' | 'ipsc'
}

/** Якщо ширина ≥ висоти × поріг — аркуш «UA+LAT»: беремо ліву половину (україномовна емблема). */
const FPSU_DUAL_SHEET_ASPECT_THRESHOLD = 1.2
/**
 * Частина **повної** висоти аркуша, що відрізається знизу після вибору лівої половини
 * (підпис під колом / службовий рядок). Занадто велике значення обрізає літери на колі емблеми.
 */
const FPSU_DUAL_CAPTION_BOTTOM_TRIM_RATIO = 0.17
/** Усередині лівої половини прибираємо горизонтальні поля, щоб коло ФПСУ займало більшу частину ширини в PDF. */
const FPSU_DUAL_HORIZONTAL_INSET_RATIO = 0.1

async function rasterizeLogoFromUrl(
  url: string,
  which: 'fpsu' | 'ipsc',
): Promise<{ dataUrl: string; aspect: number } | null> {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('logo load failed'))
      img.src = url
    })
    const iw = img.naturalWidth || 1
    const ih = img.naturalHeight || 1
    let sx = 0
    const sy = 0
    let sw = iw
    let sh = ih
    const fpsuDualSheet = which === 'fpsu' && iw / ih >= FPSU_DUAL_SHEET_ASPECT_THRESHOLD
    if (fpsuDualSheet) {
      const halfW = Math.floor(iw / 2)
      const inset = Math.min(
        Math.floor(halfW * FPSU_DUAL_HORIZONTAL_INSET_RATIO),
        Math.max(0, Math.floor(halfW / 2) - 4),
      )
      sx = inset
      sw = Math.max(1, halfW - 2 * inset)
      const trimBottom = Math.floor(ih * FPSU_DUAL_CAPTION_BOTTOM_TRIM_RATIO)
      sh = Math.max(1, ih - trimBottom)
    }
    const canvas = document.createElement('canvas')
    canvas.width = sw
    canvas.height = sh
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh)
    return { dataUrl: canvas.toDataURL('image/png'), aspect: sw / sh }
  } catch {
    return null
  }
}

/**
 * Растр лого з `public/briefing-logos/` — спочатку `.png`, інакше `.svg`.
 * ФПСУ (широкий UA+LAT): ліва половина з горизонтальним inset і зріз низу. Висота на друку для ФПСУ може бути вищою за базову — див. `FPSU_LOGO_HEIGHT_FACTOR` у `prepareBriefingPdfLogos`.
 */
export async function loadBriefingLogoRaster(which: 'fpsu' | 'ipsc'): Promise<{ dataUrl: string; aspect: number } | null> {
  const rawBase = import.meta.env.BASE_URL || '/'
  const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`
  for (const ext of ['png', 'svg'] as const) {
    const url = `${base}briefing-logos/${which}.${ext}`
    const r = await rasterizeLogoFromUrl(url, which)
    if (r) return r
  }
  return null
}

export async function prepareBriefingPdfLogos(briefing: StageBriefing): Promise<BriefingPdfLogoPrepared[]> {
  const rasters: Array<{ dataUrl: string; aspect: number; kind: 'fpsu' | 'ipsc' }> = []
  if (briefing.pdfLogoFpsu) {
    const r = await loadBriefingLogoRaster('fpsu')
    if (r) rasters.push({ ...r, kind: 'fpsu' })
  }
  if (briefing.pdfLogoIpsc) {
    const r = await loadBriefingLogoRaster('ipsc')
    if (r) rasters.push({ ...r, kind: 'ipsc' })
  }

  const baseHm = PDF_BRIEFING_LOGO_ROW_MM
  return rasters.map((r) => {
    const hMm = r.kind === 'fpsu' ? baseHm * FPSU_LOGO_HEIGHT_FACTOR : baseHm
    return {
      dataUrl: r.dataUrl,
      hMm,
      wMm: hMm * r.aspect,
      kind: r.kind,
    }
  })
}
