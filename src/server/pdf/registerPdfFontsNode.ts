import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { jsPDF } from 'jspdf'

import { PDF_FONT_FAMILY } from '../../presentation/lib/pdfFontConstants.ts'

function resolveFontsDir(): string {
  const fromModule = join(dirname(fileURLToPath(import.meta.url)), '../../presentation/lib/fonts')
  if (existsSync(join(fromModule, 'Roboto-Regular.ttf'))) return fromModule
  const fromCwd = join(process.cwd(), 'src/presentation/lib/fonts')
  if (existsSync(join(fromCwd, 'Roboto-Regular.ttf'))) return fromCwd
  return fromModule
}

const fontsDir = resolveFontsDir()

let cachedRegular: string | null = null
let cachedBold: string | null = null

function fontBase64(fileName: string): string {
  return readFileSync(join(fontsDir, fileName)).toString('base64')
}

/** Register Roboto for Cyrillic in Node (Vite dev API; production uses embedded bundle alias). */
export function registerPdfFontsNode(doc: jsPDF): void {
  if (!cachedRegular) {
    cachedRegular = fontBase64('Roboto-Regular.ttf')
    cachedBold = fontBase64('Roboto-Bold.ttf')
  }
  doc.addFileToVFS('Roboto-Regular.ttf', cachedRegular)
  doc.addFileToVFS('Roboto-Bold.ttf', cachedBold!)
  doc.addFont('Roboto-Regular.ttf', PDF_FONT_FAMILY, 'normal')
  doc.addFont('Roboto-Bold.ttf', PDF_FONT_FAMILY, 'bold')
}

export { PDF_FONT_FAMILY }
