import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const root = process.cwd()
const indexPath = join(root, 'content', 'ro-helper', 'INDEX.md')

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

async function readCardFrontmatter(locale, discipline, category, slug) {
  const p = join(root, 'content', 'ro-helper', locale, discipline, category, `${slug}.md`)
  const raw = await readFile(p, 'utf8')
  const { meta } = splitFrontmatter(raw)
  return {
    path: p,
    status: getScalar(meta, 'status'),
    verified: getScalar(meta, 'fpsu_delta_verified'),
  }
}

function updateRow(line, nextUk, nextEn, nextVerified) {
  // keep leading/trailing pipes exactly one per side
  const parts = line.split('|').map((s) => s.trim())
  // parts[0] and parts[last] are empty due to leading/trailing pipe
  // expected columns:
  // 1 card_id, 2 slug, 3 discipline, 4 category, 5 status_uk, 6 status_en, 7 fpsu_delta_verified, 8 reviewer, 9 notes
  if (parts.length < 11) return line

  parts[5] = nextUk
  parts[6] = nextEn
  parts[7] = nextVerified
  return `| ${parts.slice(1, -1).join(' | ')} |`
}

async function main() {
  const raw = await readFile(indexPath, 'utf8')
  const lines = raw.replace(/\r?\n/g, '\n').split('\n')

  let changed = 0
  /** @type {string[]} */
  const warnings = []

  const out = []
  for (const line of lines) {
    if (!line.startsWith('| C')) {
      out.push(line)
      continue
    }

    const cols = line.split('|').map((s) => s.trim())
    if (cols.length < 11) {
      out.push(line)
      continue
    }
    const cardId = cols[1]
    const slug = cols[2]
    const discipline = cols[3]
    const category = cols[4]

    try {
      const uk = await readCardFrontmatter('uk', discipline, category, slug)
      const en = await readCardFrontmatter('en', discipline, category, slug)

      const nextUk = uk.status ?? cols[5]
      const nextEn = en.status ?? cols[6]

      const ukV = uk.verified === 'true'
      const enV = en.verified === 'true'
      const nextVerified = ukV && enV ? 'true' : 'false'

      const nextLine = updateRow(line, nextUk, nextEn, nextVerified)
      if (nextLine !== line) changed++
      out.push(nextLine)
    } catch (e) {
      warnings.push(`${cardId} ${discipline}/${category}/${slug}: ${(/** @type {Error} */ (e)).message}`)
      out.push(line)
    }
  }

  const next = out.join('\n')
  await writeFile(indexPath, next, 'utf8')

  const reportPath = join(root, 'docs', `RO_HELPER_INDEX_SYNC_${new Date().toISOString().slice(0, 10)}.md`)
  const report = []
  report.push(`# RO Helper index sync report`)
  report.push(`Generated (UTC): ${new Date().toISOString()}`)
  report.push('')
  report.push(`- Updated rows: ${changed}`)
  report.push(`- Warnings: ${warnings.length}`)
  report.push('')
  if (warnings.length) {
    report.push('## Warnings')
    report.push('')
    for (const w of warnings) report.push(`- ${w}`)
    report.push('')
  }
  await writeFile(reportPath, report.join('\n'), 'utf8')

  console.log(indexPath)
  console.log(reportPath)
  console.log(`updated rows: ${changed}, warnings: ${warnings.length}`)
}

await main()

