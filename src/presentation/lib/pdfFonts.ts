import { jsPDF } from 'jspdf'
import robotoRegularUrl from './fonts/Roboto-Regular.ttf'
import robotoBoldUrl from './fonts/Roboto-Bold.ttf'

export const PDF_FONT_FAMILY = 'Roboto'

let cachedRegular: string | null = null
let cachedBold: string | null = null

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

async function loadFontData(): Promise<{ regular: string; bold: string }> {
  if (cachedRegular && cachedBold) {
    return { regular: cachedRegular, bold: cachedBold }
  }

  const [regularBuf, boldBuf] = await Promise.all([
    fetch(robotoRegularUrl).then((r) => r.arrayBuffer()),
    fetch(robotoBoldUrl).then((r) => r.arrayBuffer()),
  ])

  cachedRegular = arrayBufferToBase64(regularBuf)
  cachedBold = arrayBufferToBase64(boldBuf)
  return { regular: cachedRegular, bold: cachedBold }
}

/**
 * Fetches Roboto Regular + Bold TTFs and registers them on the given
 * jsPDF document so Cyrillic glyphs render correctly.
 * Font data is fetched once and cached for subsequent calls.
 */
export async function registerPdfFonts(doc: jsPDF): Promise<void> {
  const { regular, bold } = await loadFontData()

  doc.addFileToVFS('Roboto-Regular.ttf', regular)
  doc.addFileToVFS('Roboto-Bold.ttf', bold)
  doc.addFont('Roboto-Regular.ttf', PDF_FONT_FAMILY, 'normal')
  doc.addFont('Roboto-Bold.ttf', PDF_FONT_FAMILY, 'bold')
}
