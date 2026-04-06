import { useCallback, useEffect, useRef, type MouseEvent } from 'react'
import type { Prop, Target } from '../../domain/models'
import type { WorldViewportRect } from '../lib/viewTransform'

const PAD = 5

function clientToWorldOnMinimap(
  clientX: number,
  clientY: number,
  wrap: DOMRectReadOnly,
  fw: number,
  fh: number,
  pad: number,
): { x: number; y: number } {
  const w = wrap.width
  const h = wrap.height
  const mx = clientX - wrap.left
  const my = clientY - wrap.top
  const innerW = w - 2 * pad
  const innerH = h - 2 * pad
  const scale = Math.min(innerW / fw, innerH / fh)
  const drawW = fw * scale
  const drawH = fh * scale
  const ox = pad + (innerW - drawW) / 2
  const oy = pad + (innerH - drawH) / 2
  const mxc = Math.min(Math.max(mx, ox), ox + drawW)
  const myc = Math.min(Math.max(my, oy), oy + drawH)
  const x = (mxc - ox) / scale
  const y = fh - (myc - oy) / scale
  return {
    x: Math.min(Math.max(x, 0), fw),
    y: Math.min(Math.max(y, 0), fh),
  }
}

type StageMinimapProps = {
  fieldWidthM: number
  fieldHeightM: number
  targets: readonly Target[]
  props: readonly Prop[]
  viewportWorld: WorldViewportRect | null
  ariaLabel: string
  /** Клік по міні-карті: перейти до цієї точки на основному плані (метри). */
  onWorldPick?: (worldX: number, worldY: number) => void
}

export function StageMinimap({
  fieldWidthM: fw,
  fieldHeightM: fh,
  targets,
  props,
  viewportWorld,
  ariaLabel,
  onWorldPick,
}: StageMinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  const onClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (!onWorldPick || !wrapRef.current) return
      e.stopPropagation()
      const r = wrapRef.current.getBoundingClientRect()
      const { x, y } = clientToWorldOnMinimap(e.clientX, e.clientY, r, fw, fh, PAD)
      onWorldPick(x, y)
    },
    [onWorldPick, fw, fh],
  )

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return

    const paint = () => {
      const dpr = window.devicePixelRatio || 1
      const cw = Math.max(1, Math.floor(wrap.clientWidth * dpr))
      const ch = Math.max(1, Math.floor(wrap.clientHeight * dpr))
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw
        canvas.height = ch
      }
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const w = wrap.clientWidth
      const h = wrap.clientHeight
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      const innerW = w - 2 * PAD
      const innerH = h - 2 * PAD
      const scale = Math.min(innerW / fw, innerH / fh)
      const drawW = fw * scale
      const drawH = fh * scale
      const ox = PAD + (innerW - drawW) / 2
      const oy = PAD + (innerH - drawH) / 2

      const worldToMini = (x: number, y: number) => ({
        mx: ox + x * scale,
        my: oy + (fh - y) * scale,
      })

      ctx.fillStyle = 'rgba(148, 163, 184, 0.22)'
      ctx.fillRect(ox, oy, drawW, drawH)
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.65)'
      ctx.lineWidth = 1
      ctx.strokeRect(ox + 0.5, oy + 0.5, drawW - 1, drawH - 1)

      ctx.fillStyle = 'rgba(59, 130, 246, 0.85)'
      for (const t of targets) {
        const { mx, my } = worldToMini(t.position.x, t.position.y)
        ctx.beginPath()
        ctx.arc(mx, my, Math.max(2, scale * 0.12), 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.fillStyle = 'rgba(217, 119, 6, 0.88)'
      for (const p of props) {
        const { mx, my } = worldToMini(p.position.x, p.position.y)
        const r = Math.max(2, scale * 0.1)
        ctx.fillRect(mx - r, my - r, r * 2, r * 2)
      }

      if (viewportWorld) {
        const x1 = Math.max(viewportWorld.minX, 0)
        const x2 = Math.min(viewportWorld.maxX, fw)
        const y1 = Math.max(viewportWorld.minY, 0)
        const y2 = Math.min(viewportWorld.maxY, fh)
        if (x2 > x1 && y2 > y1) {
          const a = worldToMini(x1, y2)
          const b = worldToMini(x2, y1)
          const rx = Math.min(a.mx, b.mx)
          const ry = Math.min(a.my, b.my)
          const rw = Math.abs(b.mx - a.mx)
          const rh = Math.abs(b.my - a.my)
          ctx.strokeStyle = 'rgba(236, 72, 153, 0.95)'
          ctx.lineWidth = 2
          ctx.strokeRect(rx + 0.5, ry + 0.5, Math.max(0, rw - 1), Math.max(0, rh - 1))
        }
      }
    }

    paint()
    const ro = new ResizeObserver(paint)
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [fw, fh, targets, props, viewportWorld])

  return (
    <div
      ref={wrapRef}
      className="stage-minimap"
      style={{ aspectRatio: `${fw} / ${fh}` }}
      role={onWorldPick ? 'button' : 'img'}
      aria-label={ariaLabel}
      onClick={onWorldPick ? onClick : undefined}
      onKeyDown={
        onWorldPick
          ? (e) => {
              if (e.key !== 'Enter' && e.key !== ' ') return
              e.preventDefault()
              if (!wrapRef.current) return
              const r = wrapRef.current.getBoundingClientRect()
              const { x, y } = clientToWorldOnMinimap(
                r.left + r.width / 2,
                r.top + r.height / 2,
                r,
                fw,
                fh,
                PAD,
              )
              onWorldPick(x, y)
            }
          : undefined
      }
      tabIndex={onWorldPick ? 0 : undefined}
    >
      <canvas ref={canvasRef} className="stage-minimap__canvas" aria-hidden />
    </div>
  )
}
