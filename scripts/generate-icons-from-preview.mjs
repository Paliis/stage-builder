/**
 * Single source: public/icon-preview.png
 *
 * Lessons baked in:
 * - Baked editor “checkerboard” = light neutral gray pixels → force white (not only alpha flatten).
 * - PWA / iOS squircle masks → keep artwork inside ~82% safe ellipse (Material maskable).
 * - Non-square masters → normalize to a square canvas so every export has predictable padding.
 * - Black line-art → light tile (APP_ICON_BG); theme bar stays dark in index.html.
 */
import sharp from 'sharp'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import pngToIco from 'png-to-ico'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const src = join(root, 'public', 'icon-preview.png')

const white = { r: 255, g: 255, b: 255, alpha: 1 }

/** Tile behind logo (line-art); matches manifest background_color */
const APP_ICON_BG = { r: 255, g: 255, b: 255, alpha: 1 }

/** Square master — all derivatives scale from this for consistent “forms” */
const MASTER_SQUARE = 1024

/**
 * Inner fraction of the final square for the mark (maskable / round icon safe zone).
 * ~0.80 is Material minimum; we use a bit more margin.
 */
const PWA_SAFE_INNER = 0.84

/** Browser favicons: slightly tighter safe area is OK */
const FAV_SAFE_INNER = 0.9

const BG_GRAY_MIN_AVG = 148
const BG_NEUTRAL_SPREAD_MAX = 48

/** OG artboard */
const OG_W = 1200
const OG_H = 630
const OG_ICON = 580

async function stripCheckerAndAlphaToWhite() {
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const w = info.width
  const h = info.height
  const ch = 4
  const out = Buffer.alloc(w * h * ch)

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * ch
      let r = data[i]
      let g = data[i + 1]
      let b = data[i + 2]
      let a = data[i + 3]

      if (a < 220) {
        r = g = b = 255
        a = 255
      } else {
        const avg = (r + g + b) / 3
        const spread = Math.max(r, g, b) - Math.min(r, g, b)
        if (spread <= BG_NEUTRAL_SPREAD_MAX && avg >= BG_GRAY_MIN_AVG) {
          r = g = b = 255
        }
        a = 255
      }

      out[i] = r
      out[i + 1] = g
      out[i + 2] = b
      out[i + 3] = a
    }
  }

  return sharp(out, { raw: { width: w, height: h, channels: ch } }).png().toBuffer()
}

async function toSquareMaster(cleanedBuffer) {
  return sharp(cleanedBuffer)
    .resize(MASTER_SQUARE, MASTER_SQUARE, { fit: 'contain', position: 'centre', background: APP_ICON_BG })
    .png()
    .toBuffer()
}

/** PWA / Android / maskable-friendly app tile */
async function appIconPng(baseBuffer, canvasSize, innerRatio, bg) {
  const inner = Math.max(2, Math.round(canvasSize * innerRatio))
  const innerImg = await sharp(baseBuffer)
    .resize(inner, inner, { fit: 'contain', position: 'centre', background: bg })
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
  console.log('Source:', meta.width, 'x', meta.height, meta.hasAlpha ? '(alpha)' : '')

  const cleaned = await stripCheckerAndAlphaToWhite()
  const square = await toSquareMaster(cleaned)

  await sharp(square).png().toFile(join(root, 'public', 'icon-preview.png'))

  const buf512 = await appIconPng(square, 512, PWA_SAFE_INNER, APP_ICON_BG)
  await sharp(buf512).toFile(join(root, 'public', 'icon-512.png'))

  const buf192 = await appIconPng(square, 192, PWA_SAFE_INNER, APP_ICON_BG)
  await sharp(buf192).toFile(join(root, 'public', 'icon-192.png'))

  const apple180 = await appIconPng(square, 180, PWA_SAFE_INNER, APP_ICON_BG)
  await sharp(apple180).toFile(join(root, 'public', 'apple-touch-icon.png'))

  const b16 = await faviconPng(square, 16, FAV_SAFE_INNER, APP_ICON_BG)
  await sharp(b16).toFile(join(root, 'public', 'favicon-16.png'))

  const b32 = await faviconPng(square, 32, FAV_SAFE_INNER, APP_ICON_BG)
  await sharp(b32).toFile(join(root, 'public', 'favicon-32.png'))

  const b48 = await faviconPng(square, 48, FAV_SAFE_INNER, APP_ICON_BG)
  await sharp(b48).toFile(join(root, 'public', 'favicon-48.png'))

  const icoBin = await pngToIco([b16, b32, b48])
  writeFileSync(join(root, 'public', 'favicon.ico'), icoBin)

  const iconForOg = await sharp(square)
    .resize(OG_ICON, OG_ICON, { fit: 'contain', background: white })
    .png()
    .toBuffer()

  await sharp({
    create: {
      width: OG_W,
      height: OG_H,
      channels: 4,
      background: white,
    },
  })
    .composite([
      {
        input: iconForOg,
        left: Math.round((OG_W - OG_ICON) / 2),
        top: Math.round((OG_H - OG_ICON) / 2),
      },
    ])
    .png()
    .toFile(join(root, 'public', 'og-image.png'))

  const favB64 = Buffer.from(b32).toString('base64')
  writeFileSync(
    join(root, 'public', 'favicon.svg'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">\n  <image width="32" height="32" href="data:image/png;base64,${favB64}"/>\n</svg>\n`,
    'utf8',
  )

  console.log(
    'Wrote icon-preview.png (square master), icon-512/192, apple-touch-icon.png, favicon-16/32/48, favicon.ico, og-image.png, favicon.svg',
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
