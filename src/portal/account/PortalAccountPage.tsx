import { useCallback, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { getSupabase, isSupabaseConfigured } from '../../lib/supabaseClient'
import { useI18n } from '../../i18n/useI18n'
import { PortalCompactEmailAuth } from '../PortalCompactEmailAuth'
import { useOrganizerSelfServiceProfile } from '../useOrganizerSelfServiceProfile'
import { useSupabaseSession } from '../useSupabaseSession'
import { isMatchPortalEnabled } from '../featureFlags'

export function PortalAccountPage() {
  const { locale, tree } = useI18n()
  const p = tree.portal
  const { loading: sessionLoading, user } = useSupabaseSession()
  const { loading: profileLoading, profile, moderationNote, refresh: refreshOrganizerProfile } =
    useOrganizerSelfServiceProfile(user?.id)
  const pathnameRedirect = `/${locale}/account`
  const [applyBusy, setApplyBusy] = useState(false)
  const [applyError, setApplyError] = useState<string | null>(null)
  const [applyContact, setApplyContact] = useState('')
  const [applyPastMatches, setApplyPastMatches] = useState('')

  const onSignOut = useCallback(async () => {
    if (!isSupabaseConfigured()) return
    await getSupabase().auth.signOut()
  }, [])

  const submitOrganizerApplication = useCallback(async () => {
    if (!user?.id || !isSupabaseConfigured()) return
    const contact = applyContact.trim()
    const past = applyPastMatches.trim()
    if (contact.length > 280 || past.length > 2000) {
      setApplyError(p.accountOrganizerApplyValidationLength)
      return
    }
    setApplyBusy(true)
    setApplyError(null)
    const sb = getSupabase()
    const { error } = await sb.from('match_admin_profiles').insert({
      user_id: user.id,
      organizer_status: 'pending',
      ...(contact.length ? { organizer_application_contact: contact } : {}),
      ...(past.length ? { organizer_application_past_matches: past } : {}),
    })
    setApplyBusy(false)
    if (error) {
      const msg = error.message ?? ''
      const dup =
        error.code === '23505' || /duplicate key|unique constraint/i.test(msg) || /already exists/i.test(msg)
      setApplyError(dup ? p.accountOrganizerApplyDuplicateFriendly : `${p.accountOrganizerApplyErrorPrefix}: ${msg}`)
      await refreshOrganizerProfile()
      return
    }
    await refreshOrganizerProfile()
  }, [user?.id, refreshOrganizerProfile, applyContact, applyPastMatches, p])

  if (!isSupabaseConfigured()) {
    return (
      <div className="portal-home">
        <Helmet>
          <title>{p.accountPageHelmet}</title>
        </Helmet>
        <p>{p.matchesSupabaseUnset}</p>
        <Link to={`/${locale}`}>{p.myMatchesBackHome}</Link>
      </div>
    )
  }

  return (
    <div className="portal-home">
      <Helmet>
        <title>{p.accountPageHelmet}</title>
      </Helmet>
      <header className="portal-home__hero" style={{ marginBottom: '1rem' }}>
        <h1 className="portal-home__hero-title">{p.accountPageTitle}</h1>
      </header>

      <p style={{ margin: '0 0 1rem' }}>
        <Link to={`/${locale}`}>{p.myMatchesBackHome}</Link>
      </p>

      {sessionLoading ?
        <p>{p.matchesLoadingDetail}</p>
      : user ?
        <section aria-labelledby="account-summary-heading">
          <h2
            id="account-summary-heading"
            className="portal-home__hero-title"
            style={{ fontSize: '1.1rem', margin: '0 0 0.65rem', letterSpacing: '-0.02em' }}
          >
            {p.accountSummaryHeading}
          </h2>
          <p style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', wordBreak: 'break-word' }}>
            <strong>{p.accountSummaryLogin}</strong>{' '}
            {user.email ?? user.id}
          </p>

          <div className="portal-shell__badges" style={{ marginBottom: '0.85rem' }}>
            <span className="portal-shell__badge portal-shell__badge--participant">{p.accountBadgeParticipant}</span>
            {profileLoading ?
              <span className="portal-shell__badge portal-shell__badge--muted">{p.accountBadgeLoading}</span>
            : profile === 'pending' ?
              <span className="portal-shell__badge portal-shell__badge--pending">{p.accountBadgeOrganizerPending}</span>
            : profile === 'active' ?
              <span className="portal-shell__badge portal-shell__badge--organizer">{p.accountBadgeOrganizerActive}</span>
            : profile === 'blocked' ?
              <span className="portal-shell__badge portal-shell__badge--blocked">{p.accountBadgeOrganizerBlocked}</span>
            : null}
          </div>

          <p style={{ margin: '0 0 1rem', fontSize: '0.95rem', lineHeight: 1.55 }}>{p.accountPageIntroParticipant}</p>

          {isMatchPortalEnabled() && !profileLoading && user?.id ?
            profile === 'missing' ?
              <section
                aria-labelledby="account-organizer-apply-heading"
                style={{
                  margin: '0 0 1.25rem',
                  padding: '0.85rem 1rem',
                  maxWidth: '40rem',
                  border: '1px solid var(--border)',
                  borderRadius: '0.65rem',
                  background: 'var(--btn-bg)',
                }}
              >
                <h2
                  id="account-organizer-apply-heading"
                  className="portal-home__hero-title"
                  style={{ fontSize: '1rem', margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}
                >
                  {p.accountOrganizerApplyHeading}
                </h2>
                <p style={{ margin: '0 0 0.85rem', fontSize: '0.92rem', lineHeight: 1.52 }}>{p.accountOrganizerApplyIntro}</p>
                <label style={{ display: 'block', margin: '0 0 0.35rem', fontSize: '0.85rem', fontWeight: 650 }}>
                  {p.accountOrganizerApplyContactLabel}
                </label>
                <input
                  type="text"
                  className="portal-shell__account-sign-out"
                  style={{
                    display: 'block',
                    width: '100%',
                    maxWidth: '22rem',
                    boxSizing: 'border-box',
                    margin: '0 0 0.65rem',
                    padding: '0.45rem 0.55rem',
                    borderRadius: '0.45rem',
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text)',
                    fontSize: '0.9rem',
                  }}
                  value={applyContact}
                  maxLength={280}
                  onChange={(e) => setApplyContact(e.target.value)}
                  autoComplete="off"
                  placeholder={p.accountOrganizerApplyContactPlaceholder}
                />
                <label style={{ display: 'block', margin: '0 0 0.35rem', fontSize: '0.85rem', fontWeight: 650 }}>
                  {p.accountOrganizerApplyPastMatchesLabel}
                </label>
                <textarea
                  className="portal-shell__account-sign-out"
                  style={{
                    display: 'block',
                    width: '100%',
                    maxWidth: '28rem',
                    minHeight: '4.5rem',
                    boxSizing: 'border-box',
                    margin: '0 0 0.85rem',
                    padding: '0.45rem 0.55rem',
                    borderRadius: '0.45rem',
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--text)',
                    fontSize: '0.9rem',
                    lineHeight: 1.45,
                    resize: 'vertical',
                  }}
                  value={applyPastMatches}
                  maxLength={2000}
                  onChange={(e) => setApplyPastMatches(e.target.value)}
                  placeholder={p.accountOrganizerApplyPastMatchesPlaceholder}
                />
                {applyError ?
                  <p role="alert" style={{ margin: '0 0 0.65rem', fontSize: '0.9rem' }}>
                    {applyError}
                  </p>
                : null}
                <button
                  type="button"
                  disabled={applyBusy}
                  className="portal-shell__account-sign-out portal-shell__account-sign-out--block"
                  style={{ marginTop: 0 }}
                  onClick={() => void submitOrganizerApplication()}
                >
                  {applyBusy ? p.accountOrganizerApplySubmitting : p.accountOrganizerApplyButton}
                </button>
              </section>
            : profile === 'pending' ?
              <section
                aria-labelledby="account-organizer-pending-heading"
                style={{
                  margin: '0 0 1.25rem',
                  padding: '0.85rem 1rem',
                  maxWidth: '40rem',
                  border: '1px solid var(--border)',
                  borderRadius: '0.65rem',
                  background: 'rgba(251, 191, 36, 0.08)',
                }}
              >
                <h2
                  id="account-organizer-pending-heading"
                  className="portal-home__hero-title"
                  style={{ fontSize: '1rem', margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}
                >
                  {p.accountOrganizerApplyPendingTitle}
                </h2>
                <p style={{ margin: 0, fontSize: '0.92rem', lineHeight: 1.52 }}>{p.accountOrganizerApplyPendingBody}</p>
              </section>
            : profile === 'blocked' ?
              <p
                role="status"
                style={{
                  margin: '0 0 1.25rem',
                  maxWidth: '40rem',
                  fontSize: '0.92rem',
                  lineHeight: 1.52,
                  color: 'var(--text)',
                }}
              >
                {p.accountOrganizerApplyBlockedBody}
                {moderationNote ?
                  <span style={{ display: 'block', marginTop: '0.65rem' }}>
                    <strong style={{ display: 'block', marginBottom: '0.35rem' }}>
                      {p.accountOrganizerModerationHeading}
                    </strong>
                    <span
                      style={{
                        display: 'block',
                        padding: '0.6rem 0.75rem',
                        borderLeft: '3px solid var(--border)',
                        background: 'rgba(0,0,0,0.04)',
                        fontSize: '0.9rem',
                        lineHeight: 1.5,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {moderationNote}
                    </span>
                  </span>
                : null}
              </p>
            : null
          : null}

          <ul style={{ margin: '0 0 1.25rem', paddingLeft: '1.25rem', fontSize: '0.95rem', lineHeight: 1.55 }}>
            {isMatchPortalEnabled() ?
              <>
                <li>
                  <Link to={`/${locale}/matches/my`}>{p.accountPageGoOrganizer}</Link>
                  {' — '}
                  <span>{p.accountPageOrganizerExplain}</span>
                </li>
                <li>{p.accountPageShooterSoon}</li>
              </>
            : (
              <li>{p.accountPageShooterSoon}</li>
            )}
          </ul>

          <button type="button" className="portal-shell__account-sign-out portal-shell__account-sign-out--block" onClick={() => void onSignOut()}>
            {p.portalCompactAuthSignOut}
          </button>
        </section>
      :
        <section aria-labelledby="account-auth-heading">
          <h2
            id="account-auth-heading"
            className="portal-home__hero-title"
            style={{ fontSize: '1.1rem', margin: '0 0 0.65rem', letterSpacing: '-0.02em' }}
          >
            {p.accountAuthHeading}
          </h2>
          <PortalCompactEmailAuth p={p} pathnameForRedirect={pathnameRedirect} />
        </section>
      }
    </div>
  )
}
