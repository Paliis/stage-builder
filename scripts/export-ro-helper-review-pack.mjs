/**
 * Builds a ZIP for offline RO Helper card review:
 * - content/ro-helper/** (articles + INDEX)
 * - docs/RO_HELPER_CARD_MATRIX.csv and .md (context)
 *
 * Usage: npm run ro-helper:export-review
 * Output: exports/ro-helper-review-<ISO-timestamp>.zip (gitignored)
 */
import { zipSync } from 'fflate'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

/** @param {string} dir @param {string} base @param {{ full: string, rel: string }[]} acc */
async function collectFiles(dir, base, acc) {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const e of entries) {
    const full = join(dir, e.name)
    if (e.isDirectory()) {
      await collectFiles(full, base, acc)
    } else {
      acc.push({ full, rel: relative(base, full).split(/[/\\]/).join('/') })
    }
  }
}

const roHelperRoot = join(root, 'content', 'ro-helper')
if (!existsSync(roHelperRoot)) {
  console.error('Missing directory:', roHelperRoot)
  process.exit(1)
}

/** @type {Record<string, Uint8Array>} */
const files = {}

const collected = []
await collectFiles(roHelperRoot, roHelperRoot, collected)
for (const { full, rel } of collected) {
  files[`content/ro-helper/${rel}`] = new Uint8Array(await readFile(full))
}

const extras = [
  ['docs/RO_HELPER_CARD_MATRIX.csv', join(root, 'docs', 'RO_HELPER_CARD_MATRIX.csv')],
  ['docs/RO_HELPER_CARD_MATRIX.md', join(root, 'docs', 'RO_HELPER_CARD_MATRIX.md')],
]
for (const [zipPath, diskPath] of extras) {
  if (existsSync(diskPath)) {
    files[zipPath] = new Uint8Array(await readFile(diskPath))
  }
}

const generatedAt = new Date().toISOString()
const readmeUk = `Пакет для зовнішньої перевірки карток RO Helper (Shooters Tools)
Згенеровано (UTC): ${generatedAt}

Уміст архіву:
- content/ro-helper/ — Markdown-статті UK/EN, INDEX.md
- docs/RO_HELPER_CARD_MATRIX.csv та .md — повна матриця карток (контекст)

Як користуватися: надішліть ZIP рев’юеру; після рев’ю правки вносяться в той самий репозиторій за тими самими шляхами.
Демо-картки з inline-копією в коді (src/portal/roHelperCardDemoModel.ts) у цей архів не входять — лише файли з content/ro-helper/.
`
files['READ_ME_UA.txt'] = new TextEncoder().encode(readmeUk)

const outDir = join(root, 'exports')
mkdirSync(outDir, { recursive: true })
const stamp = generatedAt.replaceAll(':', '-').replace(/\.\d{3}Z$/, 'Z')
const outName = `ro-helper-review-${stamp}.zip`
const outPath = join(outDir, outName)

const zipped = zipSync(files, { level: 6 })
writeFileSync(outPath, zipped)

console.log(`RO Helper review pack: ${outPath}`)
console.log(`Files in archive: ${Object.keys(files).length}`)
