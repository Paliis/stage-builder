import { useCallback, useEffect, useState } from 'react'
import {
  applyPwaUpdate,
  markPwaUpdatePromptShown,
  PWA_UPDATE_AVAILABLE_EVENT,
} from '../../application/pwaUpdateGate'
import { useI18n } from '../../i18n/useI18n'

export function PwaUpdateBanner() {
  const { tree } = useI18n()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onAvailable = () => setOpen(true)
    window.addEventListener(PWA_UPDATE_AVAILABLE_EVENT, onAvailable)
    return () => window.removeEventListener(PWA_UPDATE_AVAILABLE_EVENT, onAvailable)
  }, [])

  useEffect(() => {
    if (open) markPwaUpdatePromptShown()
  }, [open])

  const onUpdate = useCallback(() => {
    void applyPwaUpdate()
  }, [])

  const onDismiss = useCallback(() => {
    setOpen(false)
  }, [])

  if (!open) return null

  return (
    <div
      className="app__pwa-update-banner"
      role="status"
      aria-live="polite"
      aria-label={tree.pwa.updateAriaLabel}
    >
      <span className="app__pwa-update-banner__text">{tree.pwa.updateMessage}</span>
      <div className="app__pwa-update-banner__actions">
        <button type="button" className="app__pwa-update-banner__btn app__pwa-update-banner__btn--primary" onClick={onUpdate}>
          {tree.pwa.updateNow}
        </button>
        <button type="button" className="app__pwa-update-banner__btn" onClick={onDismiss}>
          {tree.pwa.updateLater}
        </button>
      </div>
    </div>
  )
}
