import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { formatTemplate } from '../i18n/format'
import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient'
import type { MessageTree } from '../i18n/messages'
import { useOrganizerPortalStatus } from './useOrganizerPortalStatus'
import { useSupabaseSession } from './useSupabaseSession'
import './PortalShell.css'

type Props = {
  locale: string
  p: MessageTree['portal']
  /** Called after sign-out succeeds (e.g. close mobile drawer). */
  onAfterSignOut?: () => void
}

function ProfileAccountIconSvg() {
  return (
    <svg className="portal-shell__account-icon-svg" width={20} height={20} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M12 12q-1.73 0-2.865-1.135T8 8q0-1.73 1.135-2.865T12 4q1.73 0 2.865 1.135T16 8q0 1.73-1.135 2.865T12 12Zm-8 9v-.9q0-1.02.558-1.865 1.44-2.085 3.487-3.065T12 15q2.395 0 4.442.98 2.046.98 3.487 3.065.558.845.558 1.865v.9H4Z"
      />
    </svg>
  )
}

/** Header cluster: badges (single row) + profile icon + sign-out — email only in tooltip / aria. */
export function PortalHeaderAccount({ locale, p, onAfterSignOut }: Props) {
  const { loading: sessionLoading, user } = useSupabaseSession()
  const organizer = useOrganizerPortalStatus(user?.id)

  const onSignOut = useCallback(async () => {
    if (!isSupabaseConfigured()) return
    await getSupabase().auth.signOut()
    onAfterSignOut?.()
  }, [onAfterSignOut])

  const accountPath = `/${locale}/account`

  if (!isSupabaseConfigured()) {
    return null
  }

  if (sessionLoading) {
    return (
      <div className="portal-shell__account" aria-live="polite">
        <span className="portal-shell__account-placeholder">{p.accountHeaderChecking}</span>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="portal-shell__account">
        <Link to={accountPath} className="portal-shell__account-signin-link">
          {p.accountHeaderSignIn}
        </Link>
      </div>
    )
  }

  const emailForAria = user.email?.trim() || user.id

  return (
    <div className="portal-shell__account" role="group" aria-label={p.accountHeaderAria}>
      <div className="portal-shell__badges">
        <span className="portal-shell__badge portal-shell__badge--participant" title={p.accountBadgeParticipantHint}>
          {p.accountBadgeParticipant}
        </span>
        {organizer === 'loading' ?
          <span className="portal-shell__badge portal-shell__badge--muted">{p.accountBadgeLoading}</span>
        : organizer === 'active' ?
          <span className="portal-shell__badge portal-shell__badge--organizer">{p.accountBadgeOrganizerActive}</span>
        : organizer === 'blocked' ?
          <span className="portal-shell__badge portal-shell__badge--blocked">{p.accountBadgeOrganizerBlocked}</span>
        : null}
      </div>
      <Link
        to={accountPath}
        className="portal-shell__account-icon-link"
        title={emailForAria}
        aria-label={formatTemplate(p.accountHeaderProfileIconAria, { email: emailForAria })}
      >
        <ProfileAccountIconSvg />
        <span className="portal-shell__sr-only">{p.accountHeaderProfile}</span>
      </Link>
      <button type="button" className="portal-shell__account-sign-out" onClick={() => void onSignOut()}>
        {p.portalCompactAuthSignOut}
      </button>
    </div>
  )
}
