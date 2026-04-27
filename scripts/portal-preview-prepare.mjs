#!/usr/bin/env node
/**
 * Convert a screenshot into a portal-home product preview.
 *
 * Usage:
 *   node scripts/portal-preview-prepare.mjs <input.png> <output-name>
 *
 * Example:
 *   node scripts/portal-preview-prepare.mjs ./screenshot.png stage-builder
 *
 * Behaviour:
 *   - reads <input> (PNG, JPG, WebP — anything sharp supports);
 *   - center-crops it to a 16:10 aspect ratio;
 *   - resizes to 1280x800 (2x retina logical 640x400 — matches PortalHome.css);
 *   - encodes as WebP with q=80 (good size/quality tradeoff for product UI);
 *   - writes the result to public/portal-previews/<output-name>.webp.
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

const [, , inputArg, outNameArg] = process.argv
if (!inputArg || !outNameArg) {
  console.error('Usage: node scripts/portal-preview-prepare.mjs <input> <output-name>')
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

await mkdir(dirname(outPath), { recursive: true })

const info = await sharp(inputPath)
  .extract({ left, top, width: cropW, height: cropH })
  .resize({ width: TARGET_W, height: TARGET_H, fit: 'fill' })
  .webp({ quality: QUALITY, effort: 6 })
  .toFile(outPath)

console.log(
  `[portal-preview] ${inputPath}\n` +
    `  source: ${meta.width}x${meta.height} (${meta.format})\n` +
    `  crop:   ${cropW}x${cropH} from (${left}, ${top})\n` +
    `  output: ${outPath}\n` +
    `          ${info.width}x${info.height}, ${(info.size / 1024).toFixed(1)} KB, q=${QUALITY}`,
)
