/**
 * Keep IPSC target artwork from the SB-only master, then:
 * 1) white fill in the inner octagon (clears SB / halos),
 * 2) larger "ST" in pure black (#000000) to match target line colour (no white stroke).
 *
 * Master PNG is pinned to a fixed commit (SB era) so re-runs do not stack ST on ST.
 * Override: ICON_BASE_REF=<git-ref> node scripts/apply-st-to-icon-preview.mjs
 *
 * After this script: npm run icons
 */
import { execSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

/** Last commit with SB-only `public/icon-preview.png` (before ST overlay landed). */
const SB_MASTER_REF = process.env.ICON_BASE_REF ?? 'b2b5854'

/** Overlay canvas (centred on 1024 master). */
const OVERLAY_W = 440
const OVERLAY_H = 300
const OVERLAY_LEFT = Math.round((1024 - OVERLAY_W) / 2)
const OVERLAY_TOP = Math.round((1024 - OVERLAY_H) / 2 + 12)

/** Inner flat-top octagon (white), ~ inner ring around monogram — tweak R/cy if needed. */
const INNER_CX = OVERLAY_W / 2
const INNER_CY = OVERLAY_H * 0.48
const INNER_R = 108

function flatTopOctagonPoints(cx, cy, R) {
  const pts = []
  for (let i = 0; i < 8; i++) {
    const theta = -Math.PI / 2 + Math.PI / 8 + (i * Math.PI) / 4
    pts.push(`${(cx + R * Math.cos(theta)).toFixed(2)},${(cy + R * Math.sin(theta)).toFixed(2)}`)
  }
  return pts.join(' ')
}

const innerWhite = flatTopOctagonPoints(INNER_CX, INNER_CY, INNER_R)

/** ST: black only, size aligned visually with heavy target strokes (~28px on 512 ≈ 56 on 1024 → ~0.11 of width). */
const ST_FONT_PX = 208
const ST_BASELINE_Y = Math.round(INNER_CY + ST_FONT_PX * 0.31)

const ST_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${OVERLAY_W}" height="${OVERLAY_H}" viewBox="0 0 ${OVERLAY_W} ${OVERLAY_H}">
  <polygon fill="#ffffff" stroke="none" points="${innerWhite}"/>
  <text
    x="${INNER_CX}"
    y="${ST_BASELINE_Y}"
    text-anchor="middle"
    font-family="system-ui, Arial Black, Helvetica, sans-serif"
    font-size="${ST_FONT_PX}"
    font-weight="900"
    fill="#000000"
    letter-spacing="-10"
  >ST</text>
</svg>`

async function main() {
  const base = execSync(`git show ${SB_MASTER_REF}:public/icon-preview.png`, {
    cwd: root,
    maxBuffer: 20 * 1024 * 1024,
  })

  const overlay = await sharp(Buffer.from(ST_SVG, 'utf8'))
    .resize(OVERLAY_W, OVERLAY_H)
    .png()
    .toBuffer()

  await sharp(base)
    .composite([{ input: overlay, left: OVERLAY_LEFT, top: OVERLAY_TOP }])
    .png()
    .toFile(join(root, 'public', 'icon-preview.png'))

  console.log(`Wrote public/icon-preview.png (base ${SB_MASTER_REF} + white inner + ST)`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
