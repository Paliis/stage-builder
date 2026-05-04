import type { Area } from 'react-easy-crop'

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Image load failed'))
    img.src = src
  })
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

/** Renders the cropped region from the source image (browser only). */
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
