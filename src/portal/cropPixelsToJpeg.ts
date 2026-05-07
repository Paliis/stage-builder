import type { Area } from 'react-easy-crop'

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Image load failed'))
    img.src = src
  })
}

export async function measureImageNaturalSize(imageSrc: string): Promise<{ width: number; height: number }> {
  const image = await loadImage(imageSrc)
  return { width: image.naturalWidth, height: image.naturalHeight }
}

function clampCropToImage(image: HTMLImageElement, crop: Area): Area {
  const w = image.naturalWidth
  const h = image.naturalHeight
  const x = Math.max(0, Math.min(crop.x, w - 1))
  const y = Math.max(0, Math.min(crop.y, h - 1))
  const maxW = w - x
  const maxH = h - y
  const cw = Math.max(1, Math.min(crop.width, maxW))
  const ch = Math.max(1, Math.min(crop.height, maxH))
  return { x, y, width: cw, height: ch }
}

/**
 * Avatar / square preview: fills a square from the cropped rect (same behavior as legacy export).
 */
export async function cropPixelsToJpeg(
  imageSrc: string,
  pixelCrop: Area,
  maxEdgePx = 512,
  quality = 0.88,
): Promise<Blob> {
  const image = await loadImage(imageSrc)
  const safe = clampCropToImage(image, pixelCrop)
  const side = Math.min(safe.width, safe.height)
  const out = Math.min(maxEdgePx, Math.max(1, Math.round(side)))
  const canvas = document.createElement('canvas')
  canvas.width = out
  canvas.height = out
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D unavailable')
  ctx.drawImage(
    image,
    Math.round(safe.x),
    Math.round(safe.y),
    Math.round(side),
    Math.round(side),
    0,
    0,
    out,
    out,
  )
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/jpeg', quality),
  )
  if (!blob) throw new Error('JPEG encode failed')
  return blob
}

/**
 * Match list cover (16∶10 rectangle): preserves crop aspect; scales down only if pixels exceed bounds.
 */
export async function cropRectRegionToJpeg(
  imageSrc: string,
  pixelCrop: Area,
  maxLongEdgePx = 2048,
  quality = 0.88,
): Promise<Blob> {
  const image = await loadImage(imageSrc)
  const safe = clampCropToImage(image, pixelCrop)
  const w = Math.round(safe.width)
  const h = Math.round(safe.height)
  const long = Math.max(w, h)
  const scale = long > maxLongEdgePx ? maxLongEdgePx / long : 1
  const outW = Math.max(1, Math.round(w * scale))
  const outH = Math.max(1, Math.round(h * scale))

  const canvas = document.createElement('canvas')
  canvas.width = outW
  canvas.height = outH
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D unavailable')
  ctx.drawImage(image, Math.round(safe.x), Math.round(safe.y), w, h, 0, 0, outW, outH)
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/jpeg', quality),
  )
  if (!blob) throw new Error('JPEG encode failed')
  return blob
}
