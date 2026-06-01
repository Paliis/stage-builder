import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Cropper, { type ReactCropperElement } from 'react-cropper'
import type CropperJs from 'cropperjs'
import type { MessageTree } from '../../i18n/messages'
import 'cropperjs/dist/cropper.css'
import './AccountParticipantHub.css'

type Portal = MessageTree['portal']

const AVATAR_OUTPUT_PX = 512
const FIT_ZOOM_MULTIPLIER = 4

function cropperZoomRatio(cropper: CropperJs): number {
  const { width, naturalWidth } = cropper.getCanvasData()
  return naturalWidth > 0 ? width / naturalWidth : 1
}

export function AvatarCropModal({
  imageSrc,
  onCancel,
  onApply,
  remoteError,
  p,
}: {
  imageSrc: string
  onCancel: () => void
  onApply: (jpegBlob: Blob) => void | Promise<void>
  remoteError?: string | null
  p: Portal
}) {
  const cropperRef = useRef<ReactCropperElement>(null)
  const fitRatioRef = useRef(1)
  const syncingSliderRef = useRef(false)
  const [sliderPct, setSliderPct] = useState(0)
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const sliderToRatio = useCallback((pct: number) => {
    const fit = fitRatioRef.current
    const max = fit * FIT_ZOOM_MULTIPLIER
    const t = Math.max(0, Math.min(100, pct)) / 100
    return fit + (max - fit) * t
  }, [])

  const ratioToSlider = useCallback((ratio: number) => {
    const fit = fitRatioRef.current
    const max = fit * FIT_ZOOM_MULTIPLIER
    if (max <= fit) return 0
    const t = (ratio - fit) / (max - fit)
    return Math.round(Math.max(0, Math.min(100, t * 100)))
  }, [])

  const applySliderToCropper = useCallback(
    (pct: number) => {
      const cropper = cropperRef.current?.cropper
      if (!cropper) return
      const target = sliderToRatio(pct)
      const { width, height } = cropper.getContainerData()
      syncingSliderRef.current = true
      cropper.zoomTo(target, { x: width / 2, y: height / 2 })
      syncingSliderRef.current = false
    },
    [sliderToRatio],
  )

  useEffect(() => {
    setReady(false)
    setSliderPct(0)
    setErr(null)
  }, [imageSrc])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  const onCropperReady = useCallback(() => {
    const cropper = cropperRef.current?.cropper
    if (cropper) {
      cropper.reset()
      fitRatioRef.current = cropperZoomRatio(cropper)
    }
    setSliderPct(0)
    setReady(true)
  }, [])

  const onCropperZoom = useCallback(
    (e: CropperJs.ZoomEvent<HTMLImageElement>) => {
      if (syncingSliderRef.current) return
      setSliderPct(ratioToSlider(e.detail.ratio))
    },
    [ratioToSlider],
  )

  const onSliderInput = useCallback(
    (pct: number) => {
      setSliderPct(pct)
      applySliderToCropper(pct)
    },
    [applySliderToCropper],
  )

  const handleApply = useCallback(async () => {
    const cropper = cropperRef.current?.cropper
    if (!cropper || !ready || busy) return
    setErr(null)
    setBusy(true)
    try {
      const canvas = cropper.getCroppedCanvas({
        width: AVATAR_OUTPUT_PX,
        height: AVATAR_OUTPUT_PX,
        rounded: true,
        fillColor: '#ffffff',
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
      })
      if (!canvas) throw new Error('Canvas unavailable')
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.88),
      )
      if (!blob) throw new Error('JPEG encode failed')
      await onApply(blob)
    } catch {
      setErr(p.accountParticipantAvatarErrCrop)
    } finally {
      setBusy(false)
    }
  }, [busy, onApply, p.accountParticipantAvatarErrCrop, ready])

  const modal = (
    <div
      className="portal-account__avatar-crop-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div
        className="portal-account__avatar-crop-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="portal-avatar-crop-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 id="portal-avatar-crop-title" className="portal-account__avatar-crop-title">
          {p.accountParticipantAvatarCropTitle}
        </h2>
        <p className="portal-account__field-hint portal-account__avatar-crop-lead">{p.accountParticipantAvatarCropLead}</p>

        <div className="portal-account__avatar-crop-stage portal-account__avatar-cropper-stage">
          <Cropper
            ref={cropperRef}
            src={imageSrc}
            style={{ height: '100%', width: '100%' }}
            aspectRatio={1}
            viewMode={0}
            dragMode="move"
            guides={false}
            center
            highlight={false}
            background
            autoCrop
            autoCropArea={0.9}
            responsive
            checkOrientation={false}
            modal={false}
            zoomable
            zoomOnWheel
            zoomOnTouch
            wheelZoomRatio={0.08}
            movable
            ready={onCropperReady}
            zoom={onCropperZoom}
          />
        </div>

        <div className="portal-account__avatar-crop-zoom">
          <label className="portal-account__avatar-crop-zoom-label">
            <span>{p.accountParticipantAvatarCropZoom}</span>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={sliderPct}
              onChange={(e) => onSliderInput(Number(e.target.value))}
              disabled={busy || !ready}
            />
          </label>
        </div>

        {err ?
          <p role="alert" className="portal-account__avatar-error">
            {err}
          </p>
        : null}
        {remoteError && !err ?
          <p role="alert" className="portal-account__avatar-error">
            {remoteError}
          </p>
        : null}

        <div className="portal-account__avatar-crop-actions">
          <button type="button" className="portal-btn portal-btn--secondary" disabled={busy} onClick={onCancel}>
            {p.accountParticipantAvatarCropCancel}
          </button>
          <button
            type="button"
            className="portal-btn portal-btn--primary"
            disabled={busy || !ready}
            onClick={() => void handleApply()}
          >
            {busy ? p.accountParticipantAvatarUploading : p.accountParticipantAvatarCropApply}
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
