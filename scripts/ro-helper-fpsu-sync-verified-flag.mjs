import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const root = process.cwd()
const roRoot = join(root, 'content', 'ro-helper')

async function walk(dir) {
  /** @type {string[]} */
  const out = []
  const items = await readdir(dir, { withFileTypes: true })
  for (const it of items) {
    const p = join(dir, it.name)
    if (it.isDirectory()) {
      out.push(...(await walk(p)))
      continue
    }
    if (!it.isFile()) continue
    if (!p.endsWith('.md')) continue
    out.push(p)
  }
  return out
}

function splitFrontmatter(raw) {
  const norm = raw.replace(/\r?\n/g, '\n')
  if (!norm.startsWith('---\n')) return { meta: '', body: norm }
  const end = norm.indexOf('\n---\n', 4)
  if (end === -1) return { meta: '', body: norm }
  const meta = norm.slice(0, end + '\n---\n'.length)
  const body = norm.slice(end + '\n---\n'.length)
  return { meta, body }
}

function getScalar(meta, key) {
  const re = new RegExp(`^${key}:\\s*(.+)\\s*$`, 'm')
  const m = meta.match(re)
  if (!m) return null
  return (m[1] ?? '').trim()
}

async function main() {
  const all = await walk(roRoot)
  const md = all.filter((p) => /[\\/](safety|penalties)[\\/][^\\/]+\.md$/.test(p))

  let changed = 0
  for (const abs of md) {
    const raw = await readFile(abs, 'utf8')
    const { meta, body } = splitFrontmatter(raw)
    if (!meta) continue
    if (getScalar(meta, 'fpsu_delta_verified') !== 'true') continue

    const nextBody = body
      // common patterns used in cards
      .replace(/\*\*`fpsu_delta_verified`?\*\*:\s*\*\*false\*\*/g, '**`fpsu_delta_verified`**: **true**')
      .replace(/`fpsu_delta_verified`:\s*\*\*false\*\*/g, '`fpsu_delta_verified`: **true**')
      .replace(/`fpsu_delta_verified`:\s*false/g, '`fpsu_delta_verified`: true')

    const next = `${meta}${nextBody}`
    if (next !== raw.replace(/\r?\n/g, '\n')) {
      await writeFile(abs, next, 'utf8')
      changed++
    }
  }

  console.log(`updated files: ${changed}`)
}

await main()
