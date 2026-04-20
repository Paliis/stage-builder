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
  return (m[1] ?? '').trim()
}

function setScalar(meta, key, value) {
  const re = new RegExp(`^${key}:\\s*.+\\s*$`, 'm')
  if (re.test(meta)) return meta.replace(re, `${key}: ${value}`)
  // insert before closing frontmatter
  const lines = meta.replace(/\r?\n/g, '\n').split('\n')
  const end = lines.lastIndexOf('---')
  if (end === -1) return meta
  lines.splice(end, 0, `${key}: ${value}`)
  return lines.join('\n')
}

function collectFpsuRefs(meta) {
  const lines = meta.replace(/\r?\n/g, '\n').split('\n')
  let inBlock = false
  /** @type {{rule:string|null,url:string|null}[]} */
  const out = []
  let cur = { rule: null, url: null }

  const pushCur = () => {
    if (cur.rule || cur.url) out.push(cur)
    cur = { rule: null, url: null }
  }

  for (const l of lines) {
    const t = l.trim()
    if (t === 'fpsu_refs:') {
      inBlock = true
      continue
    }
    if (!inBlock) continue

    if (
      /^[a-zA-Z0-9_]+:/.test(t) &&
      !t.startsWith('rule:') &&
      !t.startsWith('url:') &&
      !t.startsWith('note:') &&
      !t.startsWith('- rule:') &&
      !t.startsWith('- url:') &&
      !t.startsWith('- note:')
    ) {
      pushCur()
      break
    }

    if (t.startsWith('- rule:')) {
      pushCur()
      cur.rule = t.replace(/^-?\s*rule:\s*/, '').replace(/^["']|["']$/g, '')
    } else if (t.startsWith('rule:')) {
      cur.rule = t.replace(/^rule:\s*/, '').replace(/^["']|["']$/g, '')
    } else if (t.startsWith('url:') || t.startsWith('- url:')) {
      cur.url = t.replace(/^-?\s*url:\s*/, '').replace(/^["']|["']$/g, '')
    }
  }
  pushCur()
  return out
}

function hasFpsuXiAnchor(refs, xiRulePrefix, xiHashPrefix) {
  const hasRule = refs.some((r) => (r.rule ?? '').startsWith(xiRulePrefix))
  const hasUrl = refs.some((r) => (r.url ?? '').includes('/11-penalties-and-disqualifications') && (r.url ?? '').includes(xiHashPrefix))
  return hasRule && hasUrl
}

function bodyHas3m(body) {
  const norm = body.replace(/\r?\n/g, '\n')
  return /\b3\s*(m|м)\b/.test(norm) || /3\s*метр/.test(norm) || /3\s*meters/.test(norm)
}

async function main() {
  const all = await walk(roRoot)
  const safety = all.filter((p) => /[\\/]safety[\\/][^\\/]+\.md$/.test(p))

  /** @type {{path:string, slug:string, why:string}[]} */
  const verified = []
  /** @type {{path:string, slug:string, why:string}[]} */
  const skipped = []

  for (const abs of safety) {
    const raw = await readFile(abs, 'utf8')
    const { meta, body } = splitFrontmatter(raw)
    if (!meta) continue
    if (getScalar(meta, 'category') !== 'safety') continue

    const slug = (getScalar(meta, 'slug') ?? '').replace(/["']/g, '')
    const current = getScalar(meta, 'fpsu_delta_verified')
    if (current !== 'false') continue

    const refs = collectFpsuRefs(meta)

    if (slug === 'accidental-discharge') {
      const okXi = hasFpsuXiAnchor(refs, 'XI §4', '#4-')
      const ok3m = bodyHas3m(body)
      if (okXi && ok3m) {
        const nextMeta = setScalar(meta, 'fpsu_delta_verified', 'true')
        const next = `${nextMeta}${body}`
        await writeFile(abs, next, 'utf8')
        verified.push({ path: abs, slug, why: 'FPSU XI §4 + 3m present' })
      } else {
        skipped.push({ path: abs, slug, why: `missing XI §4 anchor or 3m (okXi=${okXi}, ok3m=${ok3m})` })
      }
      continue
    }

    if (slug === 'trigger-finger') {
      const okXi = hasFpsuXiAnchor(refs, 'XI §5', '#5-')
      if (okXi) {
        const nextMeta = setScalar(meta, 'fpsu_delta_verified', 'true')
        const next = `${nextMeta}${body}`
        await writeFile(abs, next, 'utf8')
        verified.push({ path: abs, slug, why: 'FPSU XI §5 anchor present' })
      } else {
        skipped.push({ path: abs, slug, why: 'missing XI §5 anchor' })
      }
      continue
    }

    if (slug === 'break-180') {
      // User-provided mapping says XI §7.2; we intentionally do NOT auto-verify until the exact FPSU clause is confirmed.
      skipped.push({ path: abs, slug, why: 'deferred: needs human confirmation of XI §7.2 mapping for 180' })
      continue
    }
  }

  const out = []
  out.push(`# FPSU delta verification — Safety batch (targeted)`)
  out.push(`Generated (UTC): ${new Date().toISOString()}`)
  out.push('')
  out.push(`## Marked verified`)
  out.push('')
  for (const v of verified) out.push(`- ${v.path.replace(roRoot, 'content/ro-helper')} — ${v.why}`)
  if (verified.length === 0) out.push(`- (none)`)
  out.push('')
  out.push(`## Skipped`)
  out.push('')
  for (const s of skipped) out.push(`- ${s.path.replace(roRoot, 'content/ro-helper')} — ${s.why}`)
  out.push('')

  const outPath = join(root, 'docs', `RO_HELPER_FPSU_VERIFY_SAFETY_${new Date().toISOString().slice(0, 10)}.md`)
  await writeFile(outPath, out.join('\n'), 'utf8')
  console.log(outPath)
  console.log(`verified: ${verified.length}, skipped: ${skipped.length}`)
}

await main()

