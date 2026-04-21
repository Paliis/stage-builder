/**
 * Normalize RO Helper frontmatter to RO_HELPER_V0 expectations:
 * - ensure ipsc_edition + primary_url (per discipline defaults)
 * - convert shorthand ipsc_refs: ["9.1", "9.5.4"] -> list objects with rule/note
 * - ensure fpsu_refs exists (default []), positioned before fpsu_delta_verified
 *
 * Usage: node scripts/normalize-ro-helper-frontmatter.mjs
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const roRoot = join(root, 'content', 'ro-helper')

const DEFAULT_IPSC_EDITION = 'Jan 2026'
/** @type {Record<string, string>} */
const PRIMARY_URL_BY_DISCIPLINE = {
  handgun:
    'https://ipsc-pl.org/images/przepisy_2026/IPSC%20Handgun%20Competition%20Rules%20-%20Jan%202026%20Edition%20-%20Final%2029%20Dec%202025.pdf',
  pcc: 'https://ipsc-pl.org/images/przepisy_2026/IPSC%20Pistol%20Caliber%20Carbine%20Competition%20Rules%20-%20Jan%202026%20Edition%20-%20Final%2029%20Dec%202025.pdf',
  rifle:
    'https://ipsc-pl.org/images/przepisy_2026/IPSC%20Rifle%20Competition%20Rules%20-%20Jan%202026%20Edition%20-%20Final%2029%20Dec%202025.pdf',
  mini_rifle:
    'https://ipsc-pl.org/images/przepisy_2026/IPSC%20Mini%20Rifle%20Competition%20Rules%20-%20Jan%202026%20Edition%20-%20Final%2029%20Dec%202025.pdf',
  shotgun:
    'https://ipsc-pl.org/images/przepisy_2026/IPSC%20Shotgun%20Competition%20Rules%20-%20Jan%202026%20Edition%20-%20Final%2029%20Dec%202025.pdf',
}

function splitFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\s*\r?\n([\s\S]*)$/)
  if (!m) return null
  return { meta: m[1], body: m[2] }
}

function joinFrontmatter(meta, body) {
  return `---\n${meta.trimEnd()}\n---\n\n${body.replace(/^\s+/, '')}`.replace(/\r?\n/g, '\n')
}

function getScalar(meta, key) {
  const re = new RegExp(`^${key}:\\s*(.+)\\s*$`, 'm')
  const m = meta.match(re)
  if (!m) return null
  return (m[1] ?? '').trim().replace(/^["']|["']$/g, '')
}

function ensureScalar(meta, key, value) {
  const re = new RegExp(`^${key}:\\s*.+\\s*$`, 'm')
  if (re.test(meta)) return meta
  return `${meta.trimEnd()}\n${key}: ${JSON.stringify(value)}\n`
}

function ensureFpsuRefsField(meta) {
  if (/^fpsu_refs:/m.test(meta)) return meta
  // Prefer insertion right before fpsu_delta_verified if present.
  if (/^fpsu_delta_verified:/m.test(meta)) {
    return meta.replace(/^fpsu_delta_verified:/m, 'fpsu_refs: []\nfpsu_delta_verified:')
  }
  // Fallback: append.
  return `${meta.trimEnd()}\nfpsu_refs: []\n`
}

function normalizeIpscRefs(meta) {
  // Already list-style? keep.
  if (/^ipsc_refs:\s*\n\s+-\s+rule:/m.test(meta)) return meta

  // Inline YAML array: ipsc_refs: ["9.1", "9.5.4"]
  const m = meta.match(/^ipsc_refs:\s*\[([^\]]*)\]\s*$/m)
  if (!m) return meta

  const inner = m[1]
  const items = inner
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.replace(/^["']|["']$/g, ''))

  const lines = ['ipsc_refs:']
  for (const rule of items) {
    lines.push(`  - rule: ${JSON.stringify(rule)}`)
    lines.push(`    note: ${JSON.stringify('')}`)
  }
  return meta.replace(/^ipsc_refs:\s*\[[^\]]*\]\s*$/m, lines.join('\n'))
}

function walkMd(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) walkMd(p, out)
    else if (st.isFile() && name.endsWith('.md')) out.push(p)
  }
  return out
}

let updated = 0
for (const abs of walkMd(roRoot)) {
  const raw = readFileSync(abs, 'utf8')
  const fm = splitFrontmatter(raw)
  if (!fm) continue

  let { meta, body } = fm
  const before = meta

  // ipsc_edition
  meta = ensureScalar(meta, 'ipsc_edition', DEFAULT_IPSC_EDITION)

  // primary_url
  const discipline = getScalar(meta, 'discipline')
  if (!/^primary_url:/m.test(meta) && discipline && PRIMARY_URL_BY_DISCIPLINE[discipline]) {
    meta = ensureScalar(meta, 'primary_url', PRIMARY_URL_BY_DISCIPLINE[discipline])
  }

  // ipsc_refs list format
  meta = normalizeIpscRefs(meta)

  // fpsu_refs field must exist for injector (and V0)
  meta = ensureFpsuRefsField(meta)

  if (meta !== before) {
    writeFileSync(abs, joinFrontmatter(meta, body), 'utf8')
    updated++
  }
}

console.log(`Normalized frontmatter in ${updated} files.`)

