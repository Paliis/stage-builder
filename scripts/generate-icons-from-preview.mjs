import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const src = join(root, 'public', 'icon-preview.png')

const white = { r: 255, g: 255, b: 255, alpha: 1 }

/** Fraction of width/height to paint over bottom-right (AI sparkle etc.) */
const CORNER_COVER_RATIO = 0.11

async function averageOuterBackgroundRgb() {
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const w = info.width
  const h = info.height
  const ch = info.channels
  const pts = [
    [18, 18],
    [22, h - 22],
    [Math.floor(w * 0.35), h - 20],
  ]
  let r = 0
  let g = 0
  let b = 0
  for (const [x, y] of pts) {
    const xi = Math.max(0, Math.min(w - 1, x))
    const yi = Math.max(0, Math.min(h - 1, y))
    const i = (yi * w + xi) * ch
    r += data[i]
    g += data[i + 1]
    b += data[i + 2]
  }
  const n = pts.length
  return { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n), alpha: 1 }
}

/** Same pixels as icon-preview, but bottom-right corner filled with sampled background (no crop). */
async function masterPngBuffer() {
  const meta = await sharp(src).metadata()
  const w = meta.width ?? 0
  const h = meta.height ?? 0
  if (w < 8 || h < 8) throw new Error('Invalid icon-preview dimensions')

  const bg = await averageOuterBackgroundRgb()
  const cw = Math.max(24, Math.round(w * CORNER_COVER_RATIO))
  const ch = Math.max(24, Math.round(h * CORNER_COVER_RATIO))

  const patch = await sharp({
    create: { width: cw, height: ch, channels: 4, background: bg },
  })
    .png()
    .toBuffer()

  return sharp(src)
    .composite([{ input: patch, left: w - cw, top: h - ch }])
    .png()
    .toBuffer()
}

async function main() {
  const meta = await sharp(src).metadata()
  console.log('Source:', meta.width, 'x', meta.height)

  const base = await masterPngBuffer()

  await sharp(base)
    .resize(512, 512, { fit: 'contain', background: white })
    .png()
    .toFile(join(root, 'public', 'icon-512.png'))

  await sharp(base)
    .resize(192, 192, { fit: 'contain', background: white })
    .png()
    .toFile(join(root, 'public', 'icon-192.png'))

  await sharp(base)
    .resize(32, 32, { fit: 'contain', background: white })
    .png()
    .toFile(join(root, 'public', 'favicon-32.png'))

  await sharp(base)
    .resize(48, 48, { fit: 'contain', background: white })
    .png()
    .toFile(join(root, 'public', 'favicon-48.png'))

  const iconForOg = await sharp(base)
    .resize(520, 520, { fit: 'contain', background: white })
    .png()
    .toBuffer()

  await sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 4,
      background: white,
    },
  })
    .composite([{ input: iconForOg, left: Math.round((1200 - 520) / 2), top: Math.round((630 - 520) / 2) }])
    .png()
    .toFile(join(root, 'public', 'og-image.png'))

  const fav32 = readFileSync(join(root, 'public', 'favicon-32.png'))
  const favB64 = fav32.toString('base64')
  writeFileSync(
    join(root, 'public', 'favicon.svg'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">\n  <image width="32" height="32" href="data:image/png;base64,${favB64}"/>\n</svg>\n`,
    'utf8',
  )

  console.log('Wrote icon-512.png, icon-192.png, favicon-32.png, favicon-48.png, og-image.png, favicon.svg')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
