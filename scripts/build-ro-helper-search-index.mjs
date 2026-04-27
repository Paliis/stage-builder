/**
 * Generates a tiny per-locale JSON index of RO Helper articles for the in-app
 * search bar (title + slug + discipline + category — no body).
 *
 * Output:
 *   src/ro-helper/data/searchIndex.uk.json
 *   src/ro-helper/data/searchIndex.en.json
 *
 * Run as part of `npm run build` (also `npm run dev` via `predev`) and
 * manually with `npm run ro-helper:build-search-index`.
 */
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const contentRoot = join(root, 'content', 'ro-helper')
const outDir = join(root, 'src', 'ro-helper', 'data')

const LOCALES = ['uk', 'en']
const DISCIPLINES = new Set(['handgun', 'pcc', 'rifle', 'mini_rifle', 'shotgun'])
const CATEGORIES = new Set(['safety', 'penalties', 'scoring', 'equipment', 'match-admin'])

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

function extractTitle(metaBlock) {
  const line = metaBlock.split(/\r?\n/).find((l) => /^title:\s*/.test(l))
  if (!line) return null
  const rest = line.replace(/^title:\s*/, '').trim()
  if (rest.startsWith('"')) {
    const end = rest.indexOf('"', 1)
    if (end > 0) return rest.slice(1, end)
  }
  if (rest.startsWith("'")) {
    const end = rest.indexOf("'", 1)
    if (end > 0) return rest.slice(1, end)
  }
  return rest.replace(/^["']|["']$/g, '') || null
}

function splitFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\s*\r?\n([\s\S]*)$/)
  if (!m) return { metaBlock: '', body: raw.trim() }
  return { metaBlock: m[1], body: m[2].trimStart() }
}

async function buildLocaleIndex(locale) {
  const dir = join(contentRoot, locale)
  /** @type {{discipline:string,category:string,slug:string,title:string}[]} */
  const out = []
  for await (const file of walk(dir)) {
    const rel = relative(dir, file).replace(/\\/g, '/')
    const parts = rel.split('/')
    if (parts.length !== 3) continue
    const [discipline, category, fname] = parts
    if (!DISCIPLINES.has(discipline) || !CATEGORIES.has(category)) continue
    const slug = fname.replace(/\.md$/i, '')
    let raw
    try {
      raw = await readFile(file, 'utf8')
    } catch {
      continue
    }
    const { metaBlock } = splitFrontmatter(raw)
    const title = extractTitle(metaBlock) || slug
    out.push({ discipline, category, slug, title })
  }
  out.sort((a, b) => {
    if (a.discipline !== b.discipline) return a.discipline.localeCompare(b.discipline)
    if (a.category !== b.category) return a.category.localeCompare(b.category)
    return a.slug.localeCompare(b.slug)
  })
  return out
}

async function main() {
  await mkdir(outDir, { recursive: true })
  for (const locale of LOCALES) {
    const idx = await buildLocaleIndex(locale)
    const file = join(outDir, `searchIndex.${locale}.json`)
    await writeFile(file, JSON.stringify(idx) + '\n', 'utf8')
    console.log(`[ro-helper:search] ${locale}: ${idx.length} articles -> ${relative(root, file)}`)
  }
}

await main()
