import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const root = process.cwd()
const roRoot = join(root, 'content', 'ro-helper')

const REVIEWER = 'Gemini-Rules-2026'
const REVIEW_DATE = '2026-04-20'

const SCORING_SLUGS_ALWAYS = new Set([
  'disappearing-targets-scoring',
  'hits-misses-noshoot-values',
  'popper-calibration',
  'paper-scoring-policy',
  'radial-tears-enlarged-holes',
])

async function walk(dir) {
  /** @type {string[]} */
  const out = []
  const items = await readdir(dir, { withFileTypes: true })
  for (const it of items) {
    const p = join(dir, it.name)
    if (it.isDirectory()) out.push(...(await walk(p)))
    else if (it.isFile() && p.endsWith('.md')) out.push(p)
  }
  return out
}

function splitFrontmatter(raw) {
  const norm = raw.replace(/\r?\n/g, '\n')
  if (!norm.startsWith('---\n')) return { meta: '', body: norm }
  const end = norm.indexOf('\n---\n', 4)
  if (end === -1) return { meta: '', body: norm }
  return { meta: norm.slice(0, end + '\n---\n'.length), body: norm.slice(end + '\n---\n'.length) }
}

function getScalar(meta, key) {
  const re = new RegExp(`^${key}:\\s*(.+)\\s*$`, 'm')
  const m = meta.match(re)
  if (!m) return null
  return (m[1] ?? '').trim().replace(/^["']|["']$/g, '')
}

function setScalar(meta, key, value) {
  const re = new RegExp(`^${key}:\\s*.+\\s*$`, 'm')
  if (re.test(meta)) return meta.replace(re, `${key}: ${value}`)
  const lines = meta.split('\n')
  const end = lines.lastIndexOf('---')
  if (end === -1) return meta
  lines.splice(end, 0, `${key}: ${value}`)
  return lines.join('\n')
}

function shouldMarkReviewed(meta) {
  const category = getScalar(meta, 'category')
  const slug = getScalar(meta, 'slug')
  const verified = getScalar(meta, 'fpsu_delta_verified') === 'true'
  if (category === 'penalties' || category === 'safety') return verified
  if (category === 'scoring') return (slug && SCORING_SLUGS_ALWAYS.has(slug)) || verified
  return false
}

async function main() {
  const all = await walk(roRoot)
  const md = all.filter((p) => /[\\\\/](uk|en)[\\\\/]/.test(p))

  let updated = 0
  let candidates = 0
  for (const abs of md) {
    const raw = await readFile(abs, 'utf8')
    const { meta, body } = splitFrontmatter(raw)
    if (!meta) continue
    if (!shouldMarkReviewed(meta)) continue
    candidates++

    let nextMeta = meta
    nextMeta = setScalar(nextMeta, 'status', 'reviewed')
    nextMeta = setScalar(nextMeta, 'reviewer', `"${REVIEWER}"`)
    nextMeta = setScalar(nextMeta, 'review_date', `"${REVIEW_DATE}"`)

    const next = `${nextMeta}${body}`
    if (next !== raw.replace(/\r?\n/g, '\n')) {
      await writeFile(abs, next, 'utf8')
      updated++
    }
  }

  console.log(`candidates: ${candidates}`)
  console.log(`updated: ${updated}`)
}

await main()

