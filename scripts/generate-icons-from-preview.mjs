import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const src = join(root, 'public', 'icon-preview.png')

/** Light canvas for OG / link previews */
const white = { r: 255, g: 255, b: 255, alpha: 1 }

/** Same as theme-color in index.html / manifest — round masks crop corners; this blends on dark launchers */
const APP_ICON_BG = { r: 15, g: 23, b: 42, alpha: 1 }

/**
 * Fraction of canvas used for artwork. Rest is padding so squircle/circle home-screen masks
 * do not clip the silver frame (Material ~80% safe ellipse; we use slightly more margin).
 */
const PWA_SAFE_INNER = 0.82

/** Favicons: a bit more breathing room so tiny sizes stay readable */
const FAV_SAFE_INNER = 0.9

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

/**
 * PWA / app icon: dark square, artwork in safe inner region.
 * `fit: 'cover'` makes the stage graphic larger inside that region (slight edge crop vs `contain`).
 */
async function appIconPng(baseBuffer, canvasSize, innerRatio, bg) {
  const inner = Math.max(2, Math.round(canvasSize * innerRatio))
  const innerImg = await sharp(baseBuffer)
    .resize(inner, inner, { fit: 'cover', position: 'centre' })
    .png()
    .toBuffer()
  const pad = Math.round((canvasSize - inner) / 2)
  return sharp({
    create: {
      width: canvasSize,
      height: canvasSize,
      channels: 4,
      background: bg,
    },
  })
    .composite([{ input: innerImg, left: pad, top: pad }])
    .png()
    .toBuffer()
}

async function faviconPng(baseBuffer, size, innerRatio, bg) {
  const inner = Math.max(2, Math.round(size * innerRatio))
  const innerImg = await sharp(baseBuffer)
    .resize(inner, inner, { fit: 'contain', position: 'centre', background: bg })
    .png()
    .toBuffer()
  const pad = Math.round((size - inner) / 2)
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: bg,
    },
  })
    .composite([{ input: innerImg, left: pad, top: pad }])
    .png()
    .toBuffer()
}

async function main() {
  const meta = await sharp(src).metadata()
  console.log('Source:', meta.width, 'x', meta.height)

  const base = await masterPngBuffer()

  const buf512 = await appIconPng(base, 512, PWA_SAFE_INNER, APP_ICON_BG)
  await sharp(buf512).toFile(join(root, 'public', 'icon-512.png'))

  const buf192 = await appIconPng(base, 192, PWA_SAFE_INNER, APP_ICON_BG)
  await sharp(buf192).toFile(join(root, 'public', 'icon-192.png'))

  const fav32 = await faviconPng(base, 32, FAV_SAFE_INNER, APP_ICON_BG)
  await sharp(fav32).toFile(join(root, 'public', 'favicon-32.png'))

  const fav48 = await faviconPng(base, 48, FAV_SAFE_INNER, APP_ICON_BG)
  await sharp(fav48).toFile(join(root, 'public', 'favicon-48.png'))

  const ogIconSize = 580
  const iconForOg = await sharp(base)
    .resize(ogIconSize, ogIconSize, { fit: 'contain', background: white })
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
    .composite([
      {
        input: iconForOg,
        left: Math.round((1200 - ogIconSize) / 2),
        top: Math.round((630 - ogIconSize) / 2),
      },
    ])
    .png()
    .toFile(join(root, 'public', 'og-image.png'))

  const fav32File = readFileSync(join(root, 'public', 'favicon-32.png'))
  const favB64 = fav32File.toString('base64')
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
