/**
 * Generates `public/sitemap-0.xml`, `public/sitemap.xml`, `public/sitemap_index.xml`
 * including all RO Helper routes from `docs/RO_HELPER_CARD_MATRIX.csv`.
 *
 * Usage: node scripts/generate-sitemap.mjs
 */
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const ORIGIN = 'https://shooters-tools.com'
const matrixPath = join(root, 'docs', 'RO_HELPER_CARD_MATRIX.csv')
const outSitemap0 = join(root, 'public', 'sitemap-0.xml')
const outSitemap = join(root, 'public', 'sitemap.xml')
const outIndex = join(root, 'public', 'sitemap_index.xml')

function todayLastmodUtc() {
  const d = new Date()
  const yyyy = d.getUTCFullYear()
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}T00:00:00+00:00`
}

/** Parse one CSV line with optional "..." fields */
function parseCsvLine(line) {
  const out = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      inQuotes = !inQuotes
      continue
    }
    if (!inQuotes && c === ',') {
      out.push(cur)
      cur = ''
      continue
    }
    cur += c
  }
  out.push(cur)
  return out
}

function escXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function urlEntry(loc, lastmod, changefreq, priority) {
  return [
    '  <url>',
    `    <loc>${escXml(loc)}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority.toFixed(2)}</priority>`,
    '  </url>',
  ].join('\n')
}

async function main() {
  const lastmod = todayLastmodUtc()

  const csv = await readFile(matrixPath, 'utf8')
  const lines = csv.trim().split(/\r?\n/)
  const dataRows = lines.slice(1).filter(Boolean)

  /** @type {Set<string>} */
  const urls = new Set()
  urls.add(`${ORIGIN}/`)
  urls.add(`${ORIGIN}/stage-builder`)
  urls.add(`${ORIGIN}/publish-policy`)
  urls.add(`${ORIGIN}/ro-helper`)
  urls.add(`${ORIGIN}/ro-helper/demo`)

  for (const line of dataRows) {
    const cols = parseCsvLine(line)
    const slug = (cols[1] ?? '').trim()
    const discipline = (cols[2] ?? '').trim()
    const category = (cols[3] ?? '').trim()
    if (!slug || !discipline || !category) continue
    urls.add(`${ORIGIN}/ro-helper/topics/${category}`)
    urls.add(`${ORIGIN}/ro-helper/${discipline}`)
    urls.add(`${ORIGIN}/ro-helper/${discipline}/${category}`)
    urls.add(`${ORIGIN}/ro-helper/${discipline}/${category}/${slug}`)
  }

  const sorted = [...urls].sort()

  const entries = []
  for (const loc of sorted) {
    let changefreq = 'weekly'
    let priority = 0.5
    if (loc === `${ORIGIN}/`) {
      priority = 1.0
    } else if (loc === `${ORIGIN}/stage-builder`) {
      priority = 0.95
    } else if (loc === `${ORIGIN}/ro-helper`) {
      priority = 0.9
    } else if (loc.startsWith(`${ORIGIN}/ro-helper/`)) {
      priority = 0.75
      changefreq = 'monthly'
    }
    entries.push(urlEntry(loc, lastmod, changefreq, priority))
  }

  const sitemapXml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    '</urlset>',
    '',
  ].join('\n')

  const indexXml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    '  <sitemap>',
    `    <loc>${ORIGIN}/sitemap-0.xml</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    '  </sitemap>',
    '</sitemapindex>',
    '',
  ].join('\n')

  await writeFile(outSitemap0, sitemapXml, 'utf8')
  await writeFile(outSitemap, sitemapXml, 'utf8')
  await writeFile(outIndex, indexXml, 'utf8')

  console.log(`Generated ${sorted.length} URLs`)
}

await main()

