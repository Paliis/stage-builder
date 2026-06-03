import type { jsPDF } from 'jspdf'

import robotoBoldB64 from '../../presentation/lib/fonts/Roboto-Bold.ttf'
import robotoRegularB64 from '../../presentation/lib/fonts/Roboto-Regular.ttf'
import { PDF_FONT_FAMILY } from '../../presentation/lib/pdfFontConstants.ts'

/** Roboto base64 embedded at esbuild bundle time (api/match-export-briefings.js only). */
export function registerPdfFontsNode(doc: jsPDF): void {
  doc.addFileToVFS('Roboto-Regular.ttf', robotoRegularB64)
  doc.addFileToVFS('Roboto-Bold.ttf', robotoBoldB64)
  doc.addFont('Roboto-Regular.ttf', PDF_FONT_FAMILY, 'normal')
  doc.addFont('Roboto-Bold.ttf', PDF_FONT_FAMILY, 'bold')
}

export { PDF_FONT_FAMILY }
