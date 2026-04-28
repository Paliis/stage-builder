/**
 * Audits English RO Helper markdown for incomplete translations.
 *
 * Default (relaxed): **exit 0** if only translation stubs remain (`draft_source: llm-pending`,
 * `## Translation pending`); those print as **[WARN]**. **Exit 1** only when Ukrainian text
 * appears in markdown headings inside EN files (data hygiene bug).
 *
 * Strict match-complete-repo mode:
 *   npm run ro-helper:audit-en -- --fail-on-stubs
 * or:
 *   npm run ro-helper:audit-en -- --strict
 *
 * Usage:
 *   npm run ro-helper:audit-en
 *   node scripts/ro-helper-audit-en.mjs [--json] [--fail-on-stubs|--strict]
 *
 * Short bodies (<350 chars after frontmatter) always **[WARN]** (never fail unless combined with --fail-on-stubs in future — currently short is warn only).
 */
import { readdir } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const root = join(__dirname, '..')
const enRoot = join(root, 'content', 'ro-helper', 'en')

const MIN_BODY_CHARS = 350

/** @typedef {{ path: string, kind: 'stub' | 'uk-heading' | 'short-body', detail?: string }} Issue */

/** @param {string} dir */
async function collectMdFiles(dir, acc = []) {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const e of entries) {
    const p = join(dir, e.name)
    if (e.isDirectory()) await collectMdFiles(p, acc)
    else if (e.isFile() && e.name.endsWith('.md')) acc.push(p)
  }
  return acc
}

function splitFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\s*\r?\n([\s\S]*)$/)
  if (!m) return { fmBlock: '', body: raw.trim(), metaLines: '' }
  return { fmBlock: m[1], body: m[2].trimStart(), metaLines: m[1] }
}

/**
 * @param {string} body
 */
function hasUkMarkdownHeading(body) {
  return /^##\s+[^\n]*[\u0400-\u04FF]/m.test(body)
}

/**
 * @param {string} body
 * @param {string} metaLines
 */
function auditFile(relPath, body, metaLines) {
  /** @type {Issue[]} */
  const issues = []

  const stubPending =
    /draft_source:\s*llm-pending\b/i.test(metaLines) ||
    /^##\s+Translation pending\b/im.test(body)

  if (stubPending) {
    issues.push({ path: relPath, kind: 'stub', detail: 'pending EN translation' })
  }
  if (hasUkMarkdownHeading(body)) {
    issues.push({ path: relPath, kind: 'uk-heading', detail: 'Ukrainian ## heading in EN file' })
  }
  const trimmed = body.replace(/\s+/g, ' ').trim()
  if (trimmed.length > 0 && trimmed.length < MIN_BODY_CHARS && !stubPending) {
    issues.push({
      path: relPath,
      kind: 'short-body',
      detail: `body ~${trimmed.length} chars (min ${MIN_BODY_CHARS})`,
    })
  }

  return issues
}

const json = process.argv.includes('--json') || process.argv.includes('-j')
const failOnStubs =
  process.argv.includes('--fail-on-stubs') ||
  process.argv.includes('--strict')

async function main() {
  let files
  try {
    files = await collectMdFiles(enRoot)
  } catch (e) {
    console.error('ro-helper:audit-en: cannot read', enRoot, e)
    process.exit(2)
  }

  /** @type {Issue[]} */
  const all = []
  for (const abs of files) {
    let raw
    try {
      raw = readFileSync(abs, 'utf8')
    } catch {
      continue
    }
    const rel = relative(root, abs).replace(/\\/g, '/')
    const { body, metaLines } = splitFrontmatter(raw)
    all.push(...auditFile(rel, body, metaLines))
  }

  const stubs = all.filter((i) => i.kind === 'stub')
  const ukHeadings = all.filter((i) => i.kind === 'uk-heading')
  const shorts = all.filter((i) => i.kind === 'short-body')

  /** Fail on: Ukrainian headings always; stubs only if --fail-on-stubs */
  const fatal = [...ukHeadings]
  if (failOnStubs) fatal.push(...stubs)

  if (json) {
    console.log(
      JSON.stringify(
        {
          stubs: stubs.length,
          ukHeadings: ukHeadings.length,
          shortBodies: shorts.length,
          failOnStubs,
          fatalExit: fatal.length > 0,
          issues: all,
        },
        null,
        2,
      ),
    )
  } else {
    for (const i of ukHeadings) {
      console.error(`[ERROR] ${i.kind}\t${i.path}${i.detail ? `\t${i.detail}` : ''}`)
    }
    for (const i of stubs) {
      console.warn(`[WARN] ${i.kind}\t${i.path}${i.detail ? `\t${i.detail}` : ''}`)
    }
    for (const i of shorts) {
      console.warn(`[WARN] ${i.kind}\t${i.path}${i.detail ? `\t${i.detail}` : ''}`)
    }
    console.log(
      `ro-helper:audit-en: ${files.length} EN files — ${ukHeadings.length} heading error(s), ${stubs.length} stub(s), ${shorts.length} short-body warning(s). ${failOnStubs ? '(strict: stubs fail CI)' : '(relaxed: stubs are warnings only)'}`,
    )
  }

  process.exit(fatal.length > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(2)
})
