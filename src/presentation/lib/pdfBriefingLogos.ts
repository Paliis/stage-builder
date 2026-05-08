import type { StageBriefing } from '../../domain/stageBriefing'

/** Висота рядку логотипів у PDF (мм); ширина пропорційна SVG. */
export const PDF_BRIEFING_LOGO_ROW_MM = 14

async function rasterizeSvgFromUrl(url: string): Promise<{ dataUrl: string; aspect: number } | null> {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('logo load failed'))
      img.src = url
    })
    const w = img.naturalWidth || 1
    const h = img.naturalHeight || 1
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(img, 0, 0)
    return { dataUrl: canvas.toDataURL('image/png'), aspect: w / h }
  } catch {
    return null
  }
}

/** SVG із `public/briefing-logos/` — можна замінити на офіційні версії організацій. */
export async function loadBriefingLogoRaster(which: 'fpsu' | 'ipsc'): Promise<{ dataUrl: string; aspect: number } | null> {
  const rawBase = import.meta.env.BASE_URL || '/'
  const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`
  const url = `${base}briefing-logos/${which}.svg`
  return rasterizeSvgFromUrl(url)
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
