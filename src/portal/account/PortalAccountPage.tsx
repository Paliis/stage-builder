import { useCallback, useEffect, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { getSupabase, isSupabaseConfigured } from '../../lib/supabaseClient'
import { useI18n } from '../../i18n/useI18n'
import { PortalCompactEmailAuth } from '../PortalCompactEmailAuth'
import { isSafePortalReturnPath } from '../safePortalReturnPath'
import { useOrganizerSelfServiceProfile } from '../useOrganizerSelfServiceProfile'
import { usePlatformIsAdmin } from '../usePlatformIsAdmin'
import { useSupabaseSession } from '../useSupabaseSession'
import { isMatchPortalEnabled } from '../featureFlags'
import { AccountParticipantHub } from './AccountParticipantHub'
import '../PortalHome.css'
import '../PortalMatchesUi.css'
import './PortalAccountPage.css'

export function PortalAccountPage() {
  const { locale, tree } = useI18n()
  const p = tree.portal
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { loading: sessionLoading, user } = useSupabaseSession()
  const { loading: profileLoading, profile, moderationNote, refresh: refreshOrganizerProfile } =
    useOrganizerSelfServiceProfile(user?.id)
  const nextParam = searchParams.get('next')?.trim() ?? ''
  /** After email confirm / sign-in, redirect here when `next` query is present and safe. */
  const pathnameForAuthRedirect = useMemo(() => {
    return nextParam && isSafePortalReturnPath(nextParam, locale) ?
        nextParam
      : `/${locale}/account`
  }, [nextParam, locale])
  const compactEmailAuthDefaultMode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin'

  useEffect(() => {
    if (sessionLoading || !user?.id || !nextParam) return
    if (!isSafePortalReturnPath(nextParam, locale)) return
    navigate(nextParam, { replace: true })
  }, [sessionLoading, user?.id, nextParam, locale, navigate])
  const platformAdmin = usePlatformIsAdmin(user?.id, isMatchPortalEnabled())
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

      {sessionLoading ?
        <p className="portal-account__loading">{p.matchesLoadingDetail}</p>
      : user ?
        <section className="portal-account__dashboard" aria-label={p.accountShooterCabinetHeading}>
          <div className="portal-account__card portal-account__cabinet-card">
            <div className="portal-account__section-head">
              <h1 id="account-shooter-heading" className="portal-account__cabinet-title">
                {p.accountShooterCabinetHeading}
              </h1>
            </div>
            <AccountParticipantHub
              locale={locale}
              p={p}
              userId={user.id}
              showMatchRegistrations={isMatchPortalEnabled()}
            />
          </div>

          {isMatchPortalEnabled() ?
            <div className="portal-account__card">
            <section className="portal-account__section" aria-labelledby="account-organizer-heading" style={{ marginBottom: 0 }}>
              <h3 id="account-organizer-heading" className="portal-account__section-title">
                {p.accountOrganizerSectionHeading}
              </h3>

              {profileLoading ?
                <p className="portal-account__organizer-profile-loading">{p.matchesLoadingDetail}</p>
              : (
                <div className="portal-account__organizer-stack">
                  {(profile === 'active' || platformAdmin === true) ?
                    <div className="portal-account__organizer-action-row">
                      {profile === 'active' ?
                        <Link
                          className="portal-btn portal-btn--primary portal-btn--block-xs"
                          to={`/${locale}/matches/my`}
                        >
                          {p.matchesPortalOrganizerLink}
                        </Link>
                      : null}
                      {platformAdmin === true ?
                        <Link
                          className="portal-btn portal-btn--secondary portal-btn--block-xs"
                          to={`/${locale}/admin/organizers`}
                          title={p.organizersAdminTitle}
                        >
                          {p.accountPlatformOrganizerApplicationsCta}
                        </Link>
                      : null}
                    </div>
                  : null}
                  {profile === 'pending' ?
                    <div
                      className="portal-account__organizer-muted portal-account__organizer-muted--pending"
                      role="status"
                    >
                      <p className="portal-account__organizer-status-line">{p.accountOrganizerApplyPendingBody}</p>
                    </div>
                  : null}
                  {profile === 'blocked' ?
                    <div
                      className="portal-account__organizer-muted portal-account__organizer-muted--blocked"
                      role="status"
                    >
                      <p className="portal-account__organizer-status-line">{p.accountOrganizerApplyBlockedBody}</p>
                      {moderationNote ?
                        <span className="portal-account__moderation-quote">
                          <strong style={{ display: 'block', marginBottom: '0.35rem' }}>{p.accountOrganizerModerationHeading}</strong>
                          {moderationNote}
                        </span>
                      : null}
                    </div>
                  : null}
                  {profile === 'missing' ?
                    <>
                  <p className="portal-account__organizer-apply-teaser">{p.accountOrganizerApplyTeaser}</p>
                  {!applyFormExpanded ?
                    <div className="portal-account__apply-collapsed-actions">
                      <button
                        type="button"
                        className="portal-btn portal-btn--primary portal-btn--block-xs"
                        disabled={applyBusy}
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
                        className="portal-btn portal-btn--primary portal-btn--compact portal-btn--block-xs portal-account__organizer-apply-submit"
                        onClick={() => void submitOrganizerApplication()}
                      >
                        {applyBusy ? p.accountOrganizerApplySubmitting : p.accountOrganizerApplyButton}
                      </button>
                    </div>
                  }
                    </>
                  : null}
                </div>
              )}
            </section>
            </div>
          : null}

          <div className="portal-account__session-bar">
            <p className="portal-account__session-email">
              <strong className="portal-account__session-label">{p.accountSummaryLogin}</strong>{' '}
              <span className="portal-account__session-value">{user.email ?? user.id}</span>
            </p>
            <button
              type="button"
              className="portal-btn portal-btn--ghost portal-btn--compact portal-account__session-signout"
              onClick={() => void onSignOut()}
            >
              {p.portalCompactAuthSignOut}
            </button>
          </div>
        </section>
      :
        <section className="portal-account__auth-section" aria-labelledby="account-auth-heading">
          <h2 id="account-auth-heading" className="portal-account__auth-heading">
            {p.accountAuthHeading}
          </h2>
          <PortalCompactEmailAuth
            p={p}
            locale={locale}
            pathnameForRedirect={pathnameForAuthRedirect}
            defaultAuthMode={compactEmailAuthDefaultMode}
          />
        </section>
      }
    </div>
  )
}
