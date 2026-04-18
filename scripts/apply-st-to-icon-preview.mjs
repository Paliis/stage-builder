/**
 * Option 2: keep IPSC target artwork from committed icon-preview (SB),
 * replace centre monogram with "ST" via vector overlay (white stroke knocks out SB).
 *
 * Source (default): `git show HEAD:public/icon-preview.png` (1024 master).
 * Output: `public/icon-preview.png` (overwrite).
 *
 * Tune `OVERLAY_*` if letters sit slightly off on future art tweaks.
 */
import { execSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

/** Centre of monogram on 1024 canvas (tweak if SB/ST drift). */
const OVERLAY_W = 440
const OVERLAY_H = 280
const OVERLAY_LEFT = Math.round((1024 - OVERLAY_W) / 2)
const OVERLAY_TOP = Math.round((1024 - OVERLAY_H) / 2 + 28)

const ST_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${OVERLAY_W}" height="${OVERLAY_H}" viewBox="0 0 ${OVERLAY_W} ${OVERLAY_H}">
  <text
    x="${OVERLAY_W / 2}"
    y="${Math.round(OVERLAY_H * 0.58)}"
    text-anchor="middle"
    font-family="system-ui, Arial Black, Helvetica, sans-serif"
    font-size="158"
    font-weight="900"
    fill="#0f172a"
    stroke="#ffffff"
    stroke-width="16"
    paint-order="stroke fill"
    letter-spacing="-8"
  >ST</text>
</svg>`

async function main() {
  const base = execSync('git show HEAD:public/icon-preview.png', { cwd: root, maxBuffer: 20 * 1024 * 1024 })

  const overlay = await sharp(Buffer.from(ST_SVG, 'utf8'))
    .resize(OVERLAY_W, OVERLAY_H)
    .png()
    .toBuffer()

  await sharp(base)
    .composite([{ input: overlay, left: OVERLAY_LEFT, top: OVERLAY_TOP }])
    .png()
    .toFile(join(root, 'public', 'icon-preview.png'))

  console.log('Wrote public/icon-preview.png (IPSC mark + ST overlay)')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
