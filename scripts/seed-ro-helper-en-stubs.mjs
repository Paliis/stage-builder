/**
 * Seeds EN-stub markdown files for every UK RO Helper article that doesn't
 * yet have an EN counterpart.
 *
 * Each stub is a *valid* article (frontmatter passes validate-ro-helper-content)
 * but the body is an English placeholder that points the reader at the UK
 * version. `status` stays `draft`, `draft_source` becomes `llm-pending`, and
 * `reviewer`/`review_date` are cleared so it never gets confused with reviewed
 * content.
 *
 * Run after adding new UK articles, then translate the body in batches.
 *   node scripts/seed-ro-helper-en-stubs.mjs
 *   node scripts/seed-ro-helper-en-stubs.mjs --dry
 */
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const ukRoot = join(root, 'content', 'ro-helper', 'uk')
const enRoot = join(root, 'content', 'ro-helper', 'en')

const ALL_CAPS = new Set([
  'dq', 'ro', 'rm', 'cro', 'cof', 'wsb', 'ipsc', 'pcc', 'pdf', 'fpsu', 'uspsa',
  'faq', 'ad', 'md', 'mr', 'rmi', 'wo', 'iroa', 'ess', 'fte',
])

const dryRun = process.argv.includes('--dry')

function humanizeSlug(slug) {
  const tokens = slug.replace(/[-_.]+/g, ' ').trim().split(/\s+/).filter(Boolean)
  return tokens
    .map((tok, i) => {
      const lower = tok.toLowerCase()
      if (ALL_CAPS.has(lower)) return lower.toUpperCase()
      if (/^\d+$/.test(tok)) return tok
      if (i === 0) return lower.charAt(0).toUpperCase() + lower.slice(1)
      return lower
    })
    .join(' ')
}

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

function transformFrontmatter(ukRaw, enTitle) {
  const m = ukRaw.match(/^---\r?\n([\s\S]*?)\r?\n---\s*\r?\n([\s\S]*)$/)
  if (!m) return null
  let meta = m[1]

  meta = meta.replace(/^title:.*$/m, `title: "${enTitle.replace(/"/g, '\\"')}"`)
  meta = meta.replace(/^locale:\s*\S+\s*$/m, 'locale: en')

  if (/^draft_source:.*/m.test(meta)) {
    meta = meta.replace(/^draft_source:.*$/m, 'draft_source: llm-pending')
  } else {
    meta += '\ndraft_source: llm-pending'
  }

  if (/^reviewer:.*/m.test(meta)) {
    meta = meta.replace(/^reviewer:.*$/m, 'reviewer: ""')
  } else {
    meta += '\nreviewer: ""'
  }
  if (/^review_date:.*/m.test(meta)) {
    meta = meta.replace(/^review_date:.*$/m, 'review_date: ""')
  } else {
    meta += '\nreview_date: ""'
  }

  if (/^status:.*/m.test(meta)) {
    meta = meta.replace(/^status:.*$/m, 'status: draft')
  } else {
    meta += '\nstatus: draft'
  }

  return `---\n${meta}\n---\n`
}

const PLACEHOLDER_BODY = `
## Translation pending

This article has not been translated into English yet. The Ukrainian version
contains the current text — switch the portal language to **UK** at the top of
the page to read it. \`status: draft\`, \`draft_source: llm-pending\`.

## IPSC

If you need to verify the rule directly, see the official IPSC source linked in
the frontmatter (\`primary_url\`) and the rule numbers under \`ipsc_refs\`.
`

let created = 0
let skipped = 0
let invalid = 0

for await (const ukFile of walk(ukRoot)) {
  const rel = relative(ukRoot, ukFile).replace(/\\/g, '/')
  const enFile = join(enRoot, rel)
  try {
    await stat(enFile)
    skipped++
    continue
  } catch {
    /* missing — proceed */
  }

  const slug = rel.split('/').pop().replace(/\.md$/i, '')
  const enTitle = humanizeSlug(slug)
  const ukRaw = await readFile(ukFile, 'utf8')
  const newFrontmatter = transformFrontmatter(ukRaw, enTitle)
  if (!newFrontmatter) {
    invalid++
    console.warn(`[skip-no-frontmatter] ${rel}`)
    continue
  }

  const out = newFrontmatter + PLACEHOLDER_BODY
  if (!dryRun) {
    await mkdir(dirname(enFile), { recursive: true })
    await writeFile(enFile, out, 'utf8')
  }
  created++
  if (created <= 5 || created % 25 === 0) {
    console.log(`[${dryRun ? 'dry' : 'create'}] ${rel}`)
  }
}

console.log('')
console.log(`[done] ${dryRun ? 'would create' : 'created'} ${created}, skipped ${skipped}, invalid ${invalid}`)
