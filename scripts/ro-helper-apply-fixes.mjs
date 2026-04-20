/**
 * Applies batch content fixes proposed by review:
 * 1) UK terminology: дуло/дула/дулом -> ствол/ствола/стволом (content/ro-helper/uk/**)
 * 2) Accidental discharge: add explicit 10.4.2 distance (3 meters) note.
 * 3) Long-gun movement safety: ensure 10.5.11 is referenced and highlighted.
 *
 * Usage: node scripts/ro-helper-apply-fixes.mjs
 */
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const roRoot = join(root, 'content', 'ro-helper')

function splitFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\s*\r?\n([\s\S]*)$/)
  if (!m) return { meta: '', body: raw }
  return { meta: m[1], body: m[2] }
}

function joinFrontmatter(meta, body) {
  return `---\n${meta.trimEnd()}\n---\n\n${body.replace(/^\s+/, '')}`.replace(/\r?\n/g, '\n')
}

async function walk(dir) {
  const out = []
  async function rec(d) {
    const entries = await readdir(d, { withFileTypes: true })
    for (const e of entries) {
      const p = join(d, e.name)
      if (e.isDirectory()) await rec(p)
      else if (e.isFile() && e.name.endsWith('.md')) out.push(p)
    }
  }
  await rec(dir)
  return out
}

function replaceUkDulo(text) {
  // order matters: longest first
  return text
    .replaceAll('дулом', 'стволом')
    .replaceAll('дула', 'ствола')
    .replaceAll('дуло', 'ствол')
}

function ensureIpscRef(meta, rule) {
  if (meta.includes(`rule: "${rule}"`) || meta.includes(`rule: '${rule}'`) || meta.includes(`rule: ${rule}`))
    return meta
  if (!meta.includes('ipsc_refs:')) return meta

  // Insert new list item right after `ipsc_refs:` line for minimal churn.
  const lines = meta.split('\n')
  const idx = lines.findIndex((l) => l.trim() === 'ipsc_refs:')
  if (idx === -1) return meta
  lines.splice(idx + 1, 0, `  - rule: \"${rule}\"`, `    note: \"\"`)
  return lines.join('\n')
}

function ensureSection(body, heading, contentLines) {
  const norm = body.replace(/\r?\n/g, '\n')
  if (norm.includes(heading)) return body
  const lines = norm.split('\n')
  const insertAt = (() => {
    const ipsIdx = lines.findIndex((l) => l.trim().toLowerCase() === '## ipsc (jan 2026)')
    if (ipsIdx !== -1) {
      // after IPSC heading and blank line if present
      let i = ipsIdx + 1
      if (lines[i] === '') i++
      return i
    }
    // fallback: after first H2 section
    const h2 = lines.findIndex((l) => /^##\s+/.test(l))
    return h2 === -1 ? 0 : h2 + 1
  })()

  const toInsert = ['', heading, '', ...contentLines, '']
  lines.splice(insertAt, 0, ...toInsert)
  return lines.join('\n')
}

function addAccidentalDischargeDistance(locale, body) {
  const heading = locale === 'uk' ? '### 10.4.2 — постріл у землю (дистанція)' : '### 10.4.2 — shot into the ground (distance)'
  const content =
    locale === 'uk'
      ? ['- **10.4.2**: постріл **у землю** в межах **3 метрів** (3 м) — підстава для **DQ** за правилом.']
      : ['- **10.4.2**: a shot **into the ground** within **3 meters** (3 m) — **DQ** per the rule.']
  return ensureSection(body, heading, content)
}

function addLongGunSafety10511(locale, body) {
  const heading = locale === 'uk' ? '### 10.5.11 — запобіжник під час руху (довгі стволи)' : '### 10.5.11 — safety engaged while moving (long guns)'
  const content =
    locale === 'uk'
      ? [
          '- Для **Rifle / PCC / Shotgun / Mini Rifle** це окрема вимога, не лише «палець поза скобою».',
          '- **DQ за п. 10.5.11: рух зі зброєю, запобіжник якої не вимкнено (не встановлено в положення safe)** — якщо спортсмен не веде вогонь по мішенях.',
        ]
      : [
          '- For **Rifle / PCC / Shotgun / Mini Rifle** this is a separate requirement (not only trigger finger discipline).',
          '- **10.5.11 DQ**: moving with the long gun while the **safety is not engaged** (not in **SAFE**) — unless targets are being engaged.',
        ]
  return ensureSection(body, heading, content)
}

async function main() {
  if (!existsSync(roRoot)) {
    console.error('Missing content root:', roRoot)
    process.exit(1)
  }

  // Step 1: UK terminology replacement across uk pack.
  const ukRoot = join(roRoot, 'uk')
  const ukFiles = await walk(ukRoot)
  for (const p of ukFiles) {
    const raw = await readFile(p, 'utf8')
    const next = replaceUkDulo(raw)
    if (next !== raw) await writeFile(p, next, 'utf8')
  }

  // Step 2: accidental-discharge: add 10.4.2 distance note (3m)
  const adFiles = [
    // uk
    'uk/handgun/safety/accidental-discharge.md',
    'uk/pcc/safety/accidental-discharge.md',
    'uk/rifle/safety/accidental-discharge.md',
    'uk/mini_rifle/safety/accidental-discharge.md',
    'uk/shotgun/safety/accidental-discharge.md',
    // en
    'en/handgun/safety/accidental-discharge.md',
    'en/pcc/safety/accidental-discharge.md',
    'en/rifle/safety/accidental-discharge.md',
    'en/mini_rifle/safety/accidental-discharge.md',
    'en/shotgun/safety/accidental-discharge.md',
  ]
  for (const rel of adFiles) {
    const abs = join(roRoot, ...rel.split('/'))
    const raw = await readFile(abs, 'utf8')
    const { meta, body } = splitFrontmatter(raw)
    const locale = rel.startsWith('uk/') ? 'uk' : 'en'
    const nextBody = addAccidentalDischargeDistance(locale, body)
    const next = joinFrontmatter(meta, nextBody)
    if (next !== raw.replace(/\r?\n/g, '\n')) await writeFile(abs, next, 'utf8')
  }

  // Step 3: movement-and-trigger-safety long guns: add 10.5.11
  const longGunMoveFiles = [
    'uk/pcc/safety/movement-and-trigger-safety.md',
    'uk/rifle/safety/movement-and-trigger-safety.md',
    'uk/shotgun/safety/movement-and-trigger-safety.md',
    'uk/mini_rifle/safety/movement-and-trigger-safety.md',
    'en/pcc/safety/movement-and-trigger-safety.md',
    'en/rifle/safety/movement-and-trigger-safety.md',
    'en/shotgun/safety/movement-and-trigger-safety.md',
    'en/mini_rifle/safety/movement-and-trigger-safety.md',
  ]
  for (const rel of longGunMoveFiles) {
    const abs = join(roRoot, ...rel.split('/'))
    const raw = await readFile(abs, 'utf8')
    const { meta, body } = splitFrontmatter(raw)
    const nextMeta = ensureIpscRef(meta, '10.5.11')
    const locale = rel.startsWith('uk/') ? 'uk' : 'en'
    const nextBody = addLongGunSafety10511(locale, body)
    const next = joinFrontmatter(nextMeta, nextBody)
    if (next !== raw.replace(/\r?\n/g, '\n')) await writeFile(abs, next, 'utf8')
  }
}

await main()

