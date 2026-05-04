import { useCallback, useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { getSupabase, isSupabaseConfigured } from '../../lib/supabaseClient'
import { useI18n } from '../../i18n/useI18n'
import { PortalCompactEmailAuth } from '../PortalCompactEmailAuth'
import { useOrganizerSelfServiceProfile } from '../useOrganizerSelfServiceProfile'
import { useSupabaseSession } from '../useSupabaseSession'
import { isMatchPortalEnabled } from '../featureFlags'
import { AccountParticipantHub } from './AccountParticipantHub'
import '../PortalHome.css'
import '../PortalMatchesUi.css'
import './PortalAccountPage.css'

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
  const [applyFormExpanded, setApplyFormExpanded] = useState(false)

  useEffect(() => {
    if (profile !== 'missing') {
      queueMicrotask(() => {
        setApplyFormExpanded(false)
        setApplyError(null)
        setApplyContact('')
        setApplyPastMatches('')
      })
    }
  }, [profile])

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
  }, [user, refreshOrganizerProfile, applyContact, applyPastMatches, p])

  if (!isSupabaseConfigured()) {
    return (
      <div className="portal-home">
        <Helmet>
          <title>{p.accountPageHelmet}</title>
        </Helmet>
        <p>{p.matchesSupabaseUnset}</p>
        <nav className="portal-page-context portal-page-context--solo-link" aria-label={p.portalBreadcrumbAria}>
          <Link to={`/${locale}`}>{p.myMatchesBackHome}</Link>
        </nav>
      </div>
    )
  }

  return (
    <div className="portal-home">
      <Helmet>
        <title>{p.accountPageHelmet}</title>
      </Helmet>
      <nav className="portal-page-context portal-page-context--solo-link" aria-label={p.portalBreadcrumbAria}>
        <Link to={`/${locale}`}>{p.myMatchesBackHome}</Link>
      </nav>
      <header className="portal-home__hero" style={{ marginBottom: '1rem' }}>
        <h1 className="portal-home__hero-title">{p.accountPageTitle}</h1>
      </header>

      {sessionLoading ?
        <p className="portal-account__loading">{p.matchesLoadingDetail}</p>
      : user ?
        <section className="portal-account__dashboard" aria-label={p.accountPageTitle}>
          <div className="portal-account__card">
            <h2 className="portal-account__card-title" id="account-summary-heading">
              {p.accountSummaryHeading}
            </h2>
            <div className="portal-account__summary-row">
              <p className="portal-account__summary-email" style={{ marginBottom: 0 }}>
                <strong>{p.accountSummaryLogin}</strong>{' '}
                {user.email ?? user.id}
              </p>
              <span className="portal-shell__badge portal-shell__badge--participant">{p.accountBadgeParticipant}</span>
            </div>
          </div>

          <div className="portal-account__card">
            <section className="portal-account__section" aria-labelledby="account-shooter-heading" style={{ marginBottom: 0 }}>
              <h3 id="account-shooter-heading" className="portal-account__section-title">
                {p.accountShooterCabinetHeading}
              </h3>
              <AccountParticipantHub
                locale={locale}
                p={p}
                userId={user.id}
                showMatchRegistrations={isMatchPortalEnabled()}
              />
            </section>
          </div>

          {isMatchPortalEnabled() ?
            <div className="portal-account__card">
            <section className="portal-account__section" aria-labelledby="account-organizer-heading" style={{ marginBottom: 0 }}>
              <h3 id="account-organizer-heading" className="portal-account__section-title">
                {p.accountOrganizerSectionHeading}
              </h3>

              {profileLoading ?
                <p style={{ margin: '0 0 0.5rem', fontSize: '0.94rem', opacity: 0.75 }}>{p.accountBadgeLoading}</p>
              : profile === 'active' ?
                <>
                  <div className="portal-shell__badges" style={{ marginBottom: '0.65rem' }}>
                    <span className="portal-shell__badge portal-shell__badge--organizer">{p.accountBadgeOrganizerActive}</span>
                  </div>
                  <p className="portal-account__section-lead" style={{ marginBottom: '0.65rem' }}>
                    {p.accountOrganizerActiveLead}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.94rem', lineHeight: 1.55 }}>
                    <Link to={`/${locale}/matches/my`}>{p.accountPageGoOrganizer}</Link>
                    {' — '}
                    <span>{p.accountPageOrganizerExplain}</span>
                  </p>
                </>
              : profile === 'pending' ?
                <div
                  className="portal-account__organizer-muted portal-account__organizer-muted--pending"
                  role="status"
                >
                  <div className="portal-shell__badges" style={{ marginBottom: '0.45rem' }}>
                    <span className="portal-shell__badge portal-shell__badge--pending">{p.accountBadgeOrganizerPending}</span>
                  </div>
                  <p style={{ margin: '0 0 0.35rem', fontWeight: 700, fontSize: '0.95rem' }}>
                    {p.accountOrganizerApplyPendingTitle}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.52 }}>{p.accountOrganizerApplyPendingBody}</p>
                </div>
              : profile === 'blocked' ?
                <div
                  className="portal-account__organizer-muted portal-account__organizer-muted--blocked"
                  role="status"
                >
                  <div className="portal-shell__badges" style={{ marginBottom: '0.45rem' }}>
                    <span className="portal-shell__badge portal-shell__badge--blocked">{p.accountBadgeOrganizerBlocked}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.92rem', lineHeight: 1.52 }}>{p.accountOrganizerApplyBlockedBody}</p>
                  {moderationNote ?
                    <span className="portal-account__moderation-quote">
                      <strong style={{ display: 'block', marginBottom: '0.35rem' }}>{p.accountOrganizerModerationHeading}</strong>
                      {moderationNote}
                    </span>
                  : null}
                </div>
              : (
                <>
                  <p className="portal-account__section-lead" style={{ marginBottom: '0.5rem' }}>
                    {p.accountOrganizerApplyTeaser}
                  </p>
                  {!applyFormExpanded ?
                    <div className="portal-account__apply-collapsed-actions">
                      <button
                        type="button"
                        className="portal-account__apply-expand"
                        disabled={profileLoading || applyBusy}
                        onClick={() => {
                          setApplyFormExpanded(true)
                          setApplyError(null)
                        }}
                      >
                        {p.accountOrganizerApplyToggleExpand}
                      </button>
                    </div>
                  :
                    <div
                      style={{
                        marginTop: '0.35rem',
                        padding: '0.85rem 1rem',
                        border: '1px solid var(--border)',
                        borderRadius: '0.65rem',
                        background: 'var(--btn-bg)',
                        maxWidth: '40rem',
                      }}
                    >
                      <button
                        type="button"
                        className="portal-account__apply-collapse"
                        onClick={() => {
                          setApplyFormExpanded(false)
                          setApplyError(null)
                        }}
                      >
                        {p.accountOrganizerApplyToggleCollapse}
                      </button>
                      <p
                        className="portal-home__hero-title"
                        style={{
                          fontSize: '1rem',
                          margin: '0 0 0.5rem',
                          letterSpacing: '-0.02em',
                          fontWeight: 700,
                        }}
                      >
                        {p.accountOrganizerApplyHeading}
                      </p>
                      <p style={{ margin: '0 0 0.85rem', fontSize: '0.92rem', lineHeight: 1.52 }}>
                        {p.accountOrganizerApplyIntro}
                      </p>
                      <label style={{ display: 'block', margin: '0 0 0.35rem', fontSize: '0.85rem', fontWeight: 650 }}>
                        {p.accountOrganizerApplyContactLabel}
                      </label>
                      <input
                        type="text"
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
                    </div>
                  }
                </>
              )}
            </section>
            </div>
          : null}

          <div className="portal-account__sign-out-wrap">
            <button type="button" className="portal-btn portal-btn--ghost portal-btn--block-xs" onClick={() => void onSignOut()}>
              {p.portalCompactAuthSignOut}
            </button>
          </div>
        </section>
      :
        <section className="portal-account__auth-section" aria-labelledby="account-auth-heading">
          <h2 id="account-auth-heading" className="portal-account__auth-heading">
            {p.accountAuthHeading}
          </h2>
          <PortalCompactEmailAuth p={p} locale={locale} pathnameForRedirect={pathnameRedirect} />
        </section>
      }
    </div>
  )
}
