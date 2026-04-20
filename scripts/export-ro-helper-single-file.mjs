/**
 * Exports all RO Helper markdown articles into a single text file
 * for pasting into other LLMs/tools that can't open ZIP archives.
 *
 * Usage: node scripts/export-ro-helper-single-file.mjs
 * Output: exports/ro-helper-cards-<ISO>.md (gitignored)
 */
import { existsSync, mkdirSync } from 'node:fs'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const roHelperRoot = join(root, 'content', 'ro-helper')
const exportsDir = join(root, 'exports')

/** @param {string} dir @param {string} base @param {{ full: string, rel: string }[]} acc */
async function collectMdFiles(dir, base, acc) {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const e of entries) {
    const full = join(dir, e.name)
    if (e.isDirectory()) {
      await collectMdFiles(full, base, acc)
      continue
    }
    if (!e.isFile()) continue
    if (!e.name.endsWith('.md')) continue
    acc.push({ full, rel: relative(base, full).split(/[/\\]/).join('/') })
  }
}

function looksLikeArticle(rel) {
  // keep INDEX.md too (useful for context), but exclude hidden stuff
  if (rel.startsWith('.')) return false
  return true
}

async function main() {
  if (!existsSync(roHelperRoot)) {
    console.error('Missing directory:', roHelperRoot)
    process.exit(1)
  }

  mkdirSync(exportsDir, { recursive: true })

  const collected = []
  await collectMdFiles(roHelperRoot, roHelperRoot, collected)

  const rows = collected
    .filter((f) => looksLikeArticle(f.rel))
    .sort((a, b) => a.rel.localeCompare(b.rel))

  const generatedAt = new Date().toISOString()
  const outPath = join(exportsDir, `ro-helper-cards-${generatedAt.replace(/[:.]/g, '-')}.md`)

  const parts = []
  parts.push(`# RO Helper — cards export`)
  parts.push(`Generated (UTC): ${generatedAt}`)
  parts.push(`Source: content/ro-helper/**/*.md`)
  parts.push(`Total markdown files: ${rows.length}`)
  parts.push('')

  for (const r of rows) {
    const text = await readFile(r.full, 'utf8')
    parts.push(`---`)
    parts.push(`## content/ro-helper/${r.rel}`)
    parts.push('```md')
    parts.push(text.trimEnd())
    parts.push('```')
    parts.push('')
  }

  await writeFile(outPath, parts.join('\n'), 'utf8')
  console.log(outPath)
}

await main()

