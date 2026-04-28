/**
 * Quick scan: lists all UK RO Helper articles that don't have an EN
 * counterpart at the same discipline/category/slug. Outputs a sorted
 * report grouped by category, with totals + size buckets.
 *
 * Run: node scripts/list-missing-ro-helper-en.mjs
 */
import { readFile, readdir, stat } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const contentRoot = join(root, 'content', 'ro-helper')

async function* walk(dir) {
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const e of entries) {
    const p = join(dir, e.name)
    if (e.isDirectory()) yield* walk(p)
    else if (e.isFile() && e.name.endsWith('.md')) yield p
  }
}

const ukRoot = join(contentRoot, 'uk')
const enRoot = join(contentRoot, 'en')

const missing = []
let totalUk = 0

for await (const file of walk(ukRoot)) {
  totalUk++
  const rel = relative(ukRoot, file).replace(/\\/g, '/')
  const enFile = join(enRoot, rel)
  try {
    await stat(enFile)
  } catch {
    const raw = await readFile(file, 'utf8')
    const wc = raw.trim().split(/\s+/).length
    missing.push({ rel, words: wc, bytes: raw.length })
  }
}

missing.sort((a, b) => a.rel.localeCompare(b.rel))

const byCategory = new Map()
for (const m of missing) {
  const parts = m.rel.split('/')
  const key = parts.length >= 2 ? `${parts[0]}/${parts[1]}` : 'other'
  byCategory.set(key, (byCategory.get(key) ?? 0) + 1)
}

const totalWords = missing.reduce((s, m) => s + m.words, 0)
const avgWords = missing.length ? Math.round(totalWords / missing.length) : 0

console.log('=== RO Helper missing EN translations ===')
console.log(`Total UK articles: ${totalUk}`)
console.log(`Missing EN: ${missing.length}`)
console.log(`Total UK words to translate: ~${totalWords.toLocaleString()}`)
console.log(`Avg words per article: ~${avgWords}`)
console.log('')
console.log('By discipline/category:')
for (const [k, v] of [...byCategory.entries()].sort()) {
  console.log(`  ${k.padEnd(28)}  ${v}`)
}
console.log('')
console.log('Word buckets:')
let small = 0, medium = 0, large = 0
for (const m of missing) {
  if (m.words < 80) small++
  else if (m.words < 250) medium++
  else large++
}
console.log(`  < 80 words   : ${small}`)
console.log(`  80–250 words : ${medium}`)
console.log(`  > 250 words  : ${large}`)
