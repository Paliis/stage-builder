export const MATCH_COVER_OUTPUT_ASPECT = 16 / 10

const MATCH_COVER_OUTPUT_WIDTH_PX = 1600

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    if (!src.startsWith('blob:') && !src.startsWith('data:')) {
      img.crossOrigin = 'anonymous'
    }
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Image load failed'))
    img.src = src
  })
}

export async function measureImageNaturalSize(imageSrc: string): Promise<{ width: number; height: number }> {
  const image = await loadImage(imageSrc)
  return { width: image.naturalWidth, height: image.naturalHeight }
}

/** Already ~16∶10 file: fit whole image into card JPEG without opening crop UI. */
export async function exportMatchCoverFromFullImage(imageSrc: string, quality = 0.88): Promise<Blob> {
  const image = await loadImage(imageSrc)
  const nw = image.naturalWidth
  const nh = image.naturalHeight
  if (nw < 1 || nh < 1) throw new Error('Image dimensions unavailable')

  const outW = MATCH_COVER_OUTPUT_WIDTH_PX
  const outH = Math.max(1, Math.round(outW / MATCH_COVER_OUTPUT_ASPECT))
  const canvas = document.createElement('canvas')
  canvas.width = outW
  canvas.height = outH
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D unavailable')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, outW, outH)

  const imageAspect = nw / nh
  const outAspect = outW / outH
  let drawW: number
  let drawH: number
  if (imageAspect > outAspect) {
    drawW = outW
    drawH = outW / imageAspect
  } else {
    drawH = outH
    drawW = outH * imageAspect
  }
  ctx.drawImage(image, (outW - drawW) / 2, (outH - drawH) / 2, drawW, drawH)

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/jpeg', quality),
  )
  if (!blob) throw new Error('JPEG encode failed')
  return blob
}
