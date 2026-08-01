import { useEffect, useId, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useI18n } from '../i18n/useI18n'
import { isSupabaseConfigured } from '../lib/supabaseClient'
import { PortalCompactEmailAuth } from './PortalCompactEmailAuth'
import { useSupabaseSession } from './useSupabaseSession'
import './PortalAuthDialog.css'

type Props = {
  open: boolean
  onClose: () => void
  /** Why the visitor is being asked to sign in, e.g. «Увійдіть, щоб зберігати вправи в хмарі». */
  lead?: string
  defaultAuthMode?: 'signin' | 'signup'
}

/** Sign in without leaving the page: same form as the account page, in a modal. */
export function PortalAuthDialog({ open, onClose, lead, defaultAuthMode = 'signin' }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const headingId = useId()
  const { locale, tree } = useI18n()
  const p = tree.portal
  const { pathname } = useLocation()
  const { loading: sessionLoading, user } = useSupabaseSession()
  const configured = isSupabaseConfigured()

  useEffect(() => {
    const dlg = dialogRef.current
    if (!dlg) return
    if (open && !dlg.open) dlg.showModal()
    if (!open && dlg.open) dlg.close()
  }, [open])

  useEffect(() => {
    if (!open || sessionLoading || !user?.id) return
    onClose()
  }, [open, sessionLoading, user?.id, onClose])

  if (!configured) return null

  return (
    <dialog
      ref={dialogRef}
      className="portal-auth-dialog"
      aria-labelledby={headingId}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
    >
      <div className="portal-auth-dialog__panel">
        <h2 className="portal-auth-dialog__title" id={headingId}>
          {p.portalAuthDialogTitle}
        </h2>
        {lead ? <p className="portal-auth-dialog__lead">{lead}</p> : null}
        <PortalCompactEmailAuth
          p={p}
          locale={locale}
          pathnameForRedirect={pathname}
          defaultAuthMode={defaultAuthMode}
          onAuthenticated={onClose}
        />
        <div className="portal-auth-dialog__actions">
          <button type="button" className="portal-btn portal-btn--secondary" onClick={onClose}>
            {p.portalAuthDialogClose}
          </button>
        </div>
      </div>
    </dialog>
  )
}
