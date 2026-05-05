import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Cropper, { type Area, type Point } from 'react-easy-crop'
import type { MessageTree } from '../../i18n/messages'
import { cropPixelsToJpeg } from '../cropPixelsToJpeg'
import '../account/AccountParticipantHub.css'
import 'react-easy-crop/react-easy-crop.css'

type Portal = MessageTree['portal']

const COVER_ASPECT = 16 / 10

export function MatchCoverCropModal({
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
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedPixels, setCroppedPixels] = useState<Area | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  const handleApply = useCallback(async () => {
    if (!croppedPixels || busy) return
    setErr(null)
    setBusy(true)
    try {
      const blob = await cropPixelsToJpeg(imageSrc, croppedPixels)
      await onApply(blob)
    } catch {
      setErr(p.matchOrgCoverCropErrCrop)
    } finally {
      setBusy(false)
    }
  }, [busy, croppedPixels, imageSrc, onApply, p.matchOrgCoverCropErrCrop])

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
        aria-labelledby="portal-match-cover-crop-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 id="portal-match-cover-crop-title" className="portal-account__avatar-crop-title">
          {p.matchOrgCoverCropTitle}
        </h2>
        <p className="portal-account__field-hint portal-account__avatar-crop-lead">{p.matchOrgCoverCropLead}</p>

        <div className="portal-account__avatar-crop-stage portal-match-cover-crop-stage">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={COVER_ASPECT}
            cropShape="rect"
            showGrid
            objectFit="contain"
            minZoom={1}
            maxZoom={4}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropAreaChange={(_a, pixels) => setCroppedPixels(pixels)}
          />
        </div>

        <div className="portal-account__avatar-crop-zoom">
          <label className="portal-account__avatar-crop-zoom-label">
            <span>{p.matchOrgCoverCropZoom}</span>
            <input
              type="range"
              min={1}
              max={4}
              step={0.02}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              disabled={busy}
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
            {p.matchOrgCoverCropCancel}
          </button>
          <button
            type="button"
            className="portal-btn portal-btn--primary"
            disabled={busy || !croppedPixels}
            onClick={() => void handleApply()}
          >
            {busy ? p.accountParticipantAvatarUploading : p.matchOrgCoverCropApply}
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}
