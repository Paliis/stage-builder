import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const src = join(root, 'public', 'icon-preview.png')

/** OG / social preview canvas */
const white = { r: 255, g: 255, b: 255, alpha: 1 }

/**
 * PWA / favicon tile behind transparent line-art (black SB logo).
 * Light so the glyph stays readable; outer padding still helps round/squircle masks.
 */
const APP_ICON_BG = { r: 255, g: 255, b: 255, alpha: 1 }

/**
 * Inner safe area for maskable / circular home-screen icons (Material ~80% ellipse).
 */
const PWA_SAFE_INNER = 0.86

/** Favicons: keep a thin margin */
const FAV_SAFE_INNER = 0.9

/**
 * Many exports bake the editor “checkerboard” as real light-gray pixels (no alpha).
 * `flatten()` only fixes transparency — we also map neutral light grays to white.
 */
const BG_GRAY_MIN_AVG = 148
const BG_NEUTRAL_SPREAD_MAX = 48

/**
 * Opaque RGBA buffer: transparent → white; baked checker neutrals → white; else unchanged.
 */
async function masterPngBuffer() {
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

/**
 * App icon: solid tile + logo scaled inside safe region without cropping the mark.
 */
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

  await sharp(base).png().toFile(join(root, 'public', 'icon-preview.png'))

  console.log(
    'Wrote icon-preview.png (checker stripped), icon-512.png, icon-192.png, favicon-32.png, favicon-48.png, og-image.png, favicon.svg',
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
