import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const src = join(root, 'public', 'icon-preview.png')

const white = { r: 255, g: 255, b: 255, alpha: 1 }

async function main() {
  const meta = await sharp(src).metadata()
  console.log('Source:', meta.width, 'x', meta.height)

  await sharp(src)
    .resize(512, 512, { fit: 'contain', background: white })
    .png()
    .toFile(join(root, 'public', 'icon-512.png'))

  await sharp(src)
    .resize(192, 192, { fit: 'contain', background: white })
    .png()
    .toFile(join(root, 'public', 'icon-192.png'))

  await sharp(src)
    .resize(32, 32, { fit: 'contain', background: white })
    .png()
    .toFile(join(root, 'public', 'favicon-32.png'))

  await sharp(src)
    .resize(48, 48, { fit: 'contain', background: white })
    .png()
    .toFile(join(root, 'public', 'favicon-48.png'))

  const iconForOg = await sharp(src)
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
