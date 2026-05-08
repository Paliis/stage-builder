import type { StageBriefing } from '../../domain/stageBriefing'

/** Висота рядку логотипів у PDF (мм); ширина пропорційна зображенню. */
export const PDF_BRIEFING_LOGO_ROW_MM = 14

/** Якщо ширина ≥ висоти × поріг — вважаємо аркушем «дві версії» і беремо ліву половину (UA для ФПСУ). */
const FPSU_DUAL_SHEET_ASPECT_THRESHOLD = 1.2

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
    let sy = 0
    let sw = iw
    let sh = ih
    if (which === 'fpsu' && iw / ih >= FPSU_DUAL_SHEET_ASPECT_THRESHOLD) {
      sw = Math.floor(iw / 2)
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
 * ФПСУ: якщо файл широкий (UA+LAT на одному аркуші), для PDF береться ліва половина (україномовна версія).
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

export async function prepareBriefingPdfLogos(
  briefing: StageBriefing,
): Promise<Array<{ dataUrl: string; wMm: number; hMm: number }>> {
  const out: Array<{ dataUrl: string; wMm: number; hMm: number }> = []
  if (briefing.pdfLogoFpsu) {
    const r = await loadBriefingLogoRaster('fpsu')
    if (r) {
      out.push({
        dataUrl: r.dataUrl,
        wMm: PDF_BRIEFING_LOGO_ROW_MM * r.aspect,
        hMm: PDF_BRIEFING_LOGO_ROW_MM,
      })
    }
  }
  if (briefing.pdfLogoIpsc) {
    const r = await loadBriefingLogoRaster('ipsc')
    if (r) {
      out.push({
        dataUrl: r.dataUrl,
        wMm: PDF_BRIEFING_LOGO_ROW_MM * r.aspect,
        hMm: PDF_BRIEFING_LOGO_ROW_MM,
      })
    }
  }
  return out
}
