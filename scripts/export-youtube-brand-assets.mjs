/**
 * One-off / repeatable export: logo + YouTube channel icon + banner.
 * Source: public/icon-preview.png
 */
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = join(root, 'public', 'icon-preview.png')
const outDir = join(root, 'public', 'brand')

/** YouTube crops a circle — keep mark inside ~76% so edges are not clipped. */
const YOUTUBE_ICON_SAFE_INNER = 0.76
const ICON_BG = { r: 255, g: 255, b: 255, alpha: 1 }

mkdirSync(outDir, { recursive: true })

async function squareIconWithPadding(baseBuffer, canvasSize, innerRatio, bg) {
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

await sharp(src).png().toFile(join(outDir, 'shooters-tools-logo-1024.png'))
await sharp(src)
  .resize(2048, 2048, { kernel: sharp.kernel.lanczos3 })
  .png()
  .toFile(join(outDir, 'shooters-tools-logo-2048.png'))

const icon800 = await squareIconWithPadding(src, 800, YOUTUBE_ICON_SAFE_INNER, ICON_BG)
await sharp(icon800).toFile(join(outDir, 'youtube-channel-icon-800.png'))

const bannerW = 2560
const bannerH = 1440
const logoSize = 480
const logoBuf = await sharp(src).resize(logoSize, logoSize).png().toBuffer()
const tilePad = Math.round(logoSize * 0.16)
const tileSize = logoSize + tilePad * 2
const tile = await sharp({
  create: {
    width: tileSize,
    height: tileSize,
    channels: 4,
    background: { r: 255, g: 255, b: 255, alpha: 1 },
  },
})
  .composite([{ input: logoBuf, gravity: 'center' }])
  .png()
  .toBuffer()

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${bannerW}" height="${bannerH}">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e1b4b"/>
      <stop offset="48%" stop-color="#3730a3"/>
      <stop offset="100%" stop-color="#4f46e5"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
</svg>`

const bg = await sharp(Buffer.from(svg)).png().toBuffer()
await sharp(bg)
  .composite([{ input: tile, gravity: 'center' }])
  .png()
  .toFile(join(outDir, 'youtube-channel-banner-2560x1440.png'))

console.log('Wrote public/brand/:')
console.log('  shooters-tools-logo-1024.png')
console.log('  shooters-tools-logo-2048.png')
console.log('  youtube-channel-icon-800.png')
console.log('  youtube-channel-banner-2560x1440.png')
