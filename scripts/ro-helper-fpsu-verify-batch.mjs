import { readdir } from 'node:fs/promises'
import { readFile, writeFile } from 'node:fs/promises'
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

function collectFpsuRulesAndUrls(meta) {
  const lines = meta.replace(/\r?\n/g, '\n').split('\n')
  let inFpsu = false
  /** @type {string[]} */
  const rules = []
  /** @type {string[]} */
  const urls = []

  for (const l of lines) {
    const t = l.trim()
    if (t === 'fpsu_refs:') {
      inFpsu = true
      continue
    }
    if (!inFpsu) continue

    // End fpsu_refs when next top-level key begins.
    if (
      /^[a-zA-Z0-9_]+:/.test(t) &&
      !t.startsWith('rule:') &&
      !t.startsWith('url:') &&
      !t.startsWith('note:') &&
      !t.startsWith('- rule:') &&
      !t.startsWith('- url:') &&
      !t.startsWith('- note:')
    ) {
      break
    }

    if (t.startsWith('rule:') || t.startsWith('- rule:')) {
      rules.push(t.replace(/^-?\s*rule:\s*/, '').replace(/^["']|["']$/g, ''))
    }
    if (t.startsWith('url:') || t.startsWith('- url:')) {
      urls.push(t.replace(/^-?\s*url:\s*/, '').replace(/^["']|["']$/g, ''))
    }
  }

  return { rules, urls }
}

function setFpsuVerifiedTrue(meta) {
  if (meta.includes('fpsu_delta_verified: true')) return meta
  if (!meta.includes('fpsu_delta_verified: false')) return meta
  return meta.replace('fpsu_delta_verified: false', 'fpsu_delta_verified: true')
}

function looksLikeXiRef({ rules, urls }) {
  const hasXiRule = rules.some((r) => /^XI\b/.test(r))
  const hasXiUrl = urls.some((u) => u.includes('/11-penalties-and-disqualifications'))
  return hasXiRule && hasXiUrl
}

async function main() {
  const all = await walk(roRoot)
  const target = all.filter((p) => /[\\/](safety|penalties)[\\/][^\\/]+\.md$/.test(p))

  /** @type {{path:string, category:string}[]} */
  const verified = []
  /** @type {{path:string, category:string, why:string}[]} */
  const skipped = []

  for (const abs of target) {
    const raw = await readFile(abs, 'utf8')
    const { meta, body } = splitFrontmatter(raw)
    if (!meta) continue

    const verifiedScalar = getScalar(meta, 'fpsu_delta_verified')
    if (verifiedScalar !== 'false') continue

    const category = getScalar(meta, 'category') ?? ''
    if (category !== 'penalties' && category !== 'safety') continue

    const refs = collectFpsuRulesAndUrls(meta)
    const okXi = looksLikeXiRef(refs)
    if (!okXi) {
      skipped.push({ path: abs, category, why: 'no XI rule+url pair in fpsu_refs' })
      continue
    }

    if (category !== 'penalties') {
      skipped.push({ path: abs, category, why: 'B1 only: safety deferred' })
      continue
    }

    const nextMeta = setFpsuVerifiedTrue(meta)
    const next = `${nextMeta}${body}`
    if (next !== raw.replace(/\r?\n/g, '\n')) await writeFile(abs, next, 'utf8')
    verified.push({ path: abs, category })
  }

  const reportLines = []
  reportLines.push(`# FPSU delta verification — Batch B1 (penalties)`)
  reportLines.push(`Generated (UTC): ${new Date().toISOString()}`)
  reportLines.push('')
  reportLines.push(`## Marked verified (fpsu_delta_verified: true)`)
  reportLines.push('')
  for (const v of verified) reportLines.push(`- ${v.path.replace(roRoot, 'content/ro-helper')}`)
  if (verified.length === 0) reportLines.push(`- (none)`)
  reportLines.push('')
  reportLines.push(`## Skipped`)
  reportLines.push('')
  for (const s of skipped) reportLines.push(`- ${s.path.replace(roRoot, 'content/ro-helper')} — ${s.why}`)
  reportLines.push('')

  const outPath = join(root, 'docs', `RO_HELPER_FPSU_VERIFY_B1_${new Date().toISOString().slice(0, 10)}.md`)
  await writeFile(outPath, reportLines.join('\n'), 'utf8')
  console.log(outPath)
  console.log(`verified: ${verified.length}, skipped: ${skipped.length}`)
}

await main()
