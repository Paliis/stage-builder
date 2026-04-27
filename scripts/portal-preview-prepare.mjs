#!/usr/bin/env node
/**
 * Convert a screenshot into a portal-home product preview.
 *
 * Usage:
 *   node scripts/portal-preview-prepare.mjs <input> <output-name> [mode] [bg]
 *
 *   mode  = "cover"   (default) — center-crops to 16:10 (best for tall screens
 *                                 where you want to fill the card without margins)
 *         | "contain"           — pads with `bg` so the whole input is visible
 *                                 (best for already-wide screenshots where you
 *                                  must NOT lose anything on the edges)
 *   bg    = any CSS color (default "#f1f5f9", matches portal slate background)
 *
 * Examples:
 *   node scripts/portal-preview-prepare.mjs ./shot.png stage-builder
 *   node scripts/portal-preview-prepare.mjs ./shot.png ro-helper contain
 *   node scripts/portal-preview-prepare.mjs ./shot.png hit-factor contain "#ffffff"
 *
 * Output:
 *   - 1280x800 WebP (2x retina logical 640x400 — matches PortalHome.css);
 *   - q=80 (good size/quality tradeoff for product UI);
 *   - written to public/portal-previews/<output-name>.webp.
 *
 * Tip: keep the original PNG/JPG outside the repo so you can re-run the
 * conversion if encoding settings need to change.
 */
import { mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import sharp from 'sharp'

const TARGET_W = 1280
const TARGET_H = 800
const QUALITY = 80

const [, , inputArg, outNameArg, modeArg = 'cover', bgArg = '#f1f5f9'] = process.argv
if (!inputArg || !outNameArg) {
  console.error(
    'Usage: node scripts/portal-preview-prepare.mjs <input> <output-name> [cover|contain] [bg]',
  )
  process.exit(1)
}
if (modeArg !== 'cover' && modeArg !== 'contain') {
  console.error(`Unknown mode: ${modeArg}. Use "cover" or "contain".`)
  process.exit(1)
}

const inputPath = resolve(process.cwd(), inputArg)
const outName = outNameArg.replace(/\.(webp|png|jpg|jpeg)$/i, '')
const outPath = resolve(process.cwd(), 'public', 'portal-previews', `${outName}.webp`)

const meta = await sharp(inputPath).metadata()
if (!meta.width || !meta.height) {
  throw new Error(`Could not read dimensions from ${inputPath}`)
}

const targetAspect = TARGET_W / TARGET_H

await mkdir(dirname(outPath), { recursive: true })

let info
let opLog = ''

if (modeArg === 'cover') {
  // Center-crop to 16:10 so the rendered card has no letterbox bars.
  const inputAspect = meta.width / meta.height
  let cropW = meta.width
  let cropH = meta.height
  if (inputAspect > targetAspect) {
    cropW = Math.round(meta.height * targetAspect)
  } else if (inputAspect < targetAspect) {
    cropH = Math.round(meta.width / targetAspect)
  }
  const left = Math.round((meta.width - cropW) / 2)
  const top = Math.round((meta.height - cropH) / 2)
  opLog = `crop:   ${cropW}x${cropH} from (${left}, ${top})`
  info = await sharp(inputPath)
    .extract({ left, top, width: cropW, height: cropH })
    .resize({ width: TARGET_W, height: TARGET_H, fit: 'fill' })
    .webp({ quality: QUALITY, effort: 6 })
    .toFile(outPath)
} else {
  // Pad with `bg` so the entire screenshot stays visible (no content lost).
  // sharp's `fit: 'contain'` does the math + letterboxing in one shot.
  opLog = `pad:    fit=contain, bg=${bgArg}`
  info = await sharp(inputPath)
    .resize({
      width: TARGET_W,
      height: TARGET_H,
      fit: 'contain',
      background: bgArg,
    })
    .webp({ quality: QUALITY, effort: 6 })
    .toFile(outPath)
}

console.log(
  `[portal-preview] ${inputPath}\n` +
    `  source: ${meta.width}x${meta.height} (${meta.format})\n` +
    `  mode:   ${modeArg}\n` +
    `  ${opLog}\n` +
    `  output: ${outPath}\n` +
    `          ${info.width}x${info.height}, ${(info.size / 1024).toFixed(1)} KB, q=${QUALITY}`,
)
