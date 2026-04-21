/**
 * Ensure fpsu_delta_verified is consistent with fpsu_refs:
 * - if fpsu_refs is empty list (no "- rule:" entries) -> fpsu_delta_verified: false
 *
 * Usage: node scripts/sync-ro-helper-fpsu-verified-by-refs.mjs
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const roRoot = join(root, 'content', 'ro-helper')

function walkMd(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) walkMd(p, out)
    else if (st.isFile() && name.endsWith('.md')) out.push(p)
  }
  return out
}

function splitFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\s*\r?\n([\s\S]*)$/)
  if (!m) return null
  return { meta: m[1], body: m[2] }
}

let changed = 0
for (const abs of walkMd(roRoot)) {
  const raw = readFileSync(abs, 'utf8')
  const fm = splitFrontmatter(raw)
  if (!fm) continue
  let { meta, body } = fm
  const before = meta

  if (!/^fpsu_refs:/m.test(meta) || !/^fpsu_delta_verified:/m.test(meta)) continue

  const refsBlock = (meta.match(/^fpsu_refs:[\s\S]*?\n(?=fpsu_delta_verified:)/m) ?? [''])[0]
  const hasAnyRef = /\n\s+-\s+rule:/m.test(refsBlock)
  if (!hasAnyRef) {
    meta = meta.replace(/^fpsu_delta_verified:\s*true\s*$/m, 'fpsu_delta_verified: false')
  }

  if (meta !== before) {
    writeFileSync(abs, `---\n${meta.trimEnd()}\n---\n\n${body.replace(/^\s+/, '')}`.replace(/\r?\n/g, '\n'), 'utf8')
    changed++
  }
}

console.log(`updated files: ${changed}`)

