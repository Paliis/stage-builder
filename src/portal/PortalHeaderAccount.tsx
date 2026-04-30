import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient'
import type { MessageTree } from '../i18n/messages'
import { useOrganizerPortalStatus } from './useOrganizerPortalStatus'
import { useSupabaseSession } from './useSupabaseSession'
import './PortalShell.css'

type Props = {
  locale: string
  p: MessageTree['portal']
}

/** Header cluster: explicit login state + role badges + profile / sign-out. */
export function PortalHeaderAccount({ locale, p }: Props) {
  const { loading: sessionLoading, user } = useSupabaseSession()
  const organizer = useOrganizerPortalStatus(user?.id)

  const onSignOut = useCallback(async () => {
    if (!isSupabaseConfigured()) return
    await getSupabase().auth.signOut()
  }, [])

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

  const email = user.email?.trim() || user.id.slice(0, 8)

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
      <span className="portal-shell__account-email" title={user.email ?? undefined}>
        {email}
      </span>
      <Link to={accountPath} className="portal-shell__account-profile-link">
        {p.accountHeaderProfile}
      </Link>
      <button type="button" className="portal-shell__account-sign-out" onClick={() => void onSignOut()}>
        {p.portalCompactAuthSignOut}
      </button>
    </div>
  )
}
