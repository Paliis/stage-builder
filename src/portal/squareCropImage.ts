/**
 * Center-crops image to a square and outputs JPEG — fits circular avatar display.
 * Runs in the browser only (`createImageBitmap`, canvas).
 */
export async function squareCropImageToJpeg(
  file: File,
  maxEdgePx = 512,
  quality = 0.88,
): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  try {
    const w = bitmap.width
    const h = bitmap.height
    const side = Math.min(w, h)
    const sx = (w - side) / 2
    const sy = (h - side) / 2
    const out = Math.min(maxEdgePx, side)
    const canvas = document.createElement('canvas')
    canvas.width = out
    canvas.height = out
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D unavailable')
    ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, out, out)
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/jpeg', quality),
    )
    if (!blob) throw new Error('JPEG encode failed')
    return blob
  } finally {
    bitmap.close()
  }
}
