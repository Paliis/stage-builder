import { useCallback, useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n/useI18n'
import { getSupabase, isSupabaseConfigured } from '../../lib/supabaseClient'
import { useSupabaseSession } from '../useSupabaseSession'
import { useOrganizerSelfServiceProfile } from '../useOrganizerSelfServiceProfile'
import type { MessageTree } from '../../i18n/messages'
import { formatPortalDate } from './matchPortalFormat'
import { OrganizerMatchInactivePanel } from './OrganizerMatchInactivePanel'
import '../PortalHome.css'

type Portal = MessageTree['portal']

type OrganizerMatchRow = {
  id: string
  title: string
  starts_at: string
  status: string
  participant_list_visibility?: string | null
}

export function OrganizerMatchesListPage() {
  const { locale, tree } = useI18n()
  const p = tree.portal
  const configured = isSupabaseConfigured()
  const { loading: sessionLoading, user } = useSupabaseSession()
  const { loading: organizerProfileLoading, profile: organizerProfile, moderationNote } =
    useOrganizerSelfServiceProfile(user?.id)
  const [rows, setRows] = useState<OrganizerMatchRow[] | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!configured || !user?.id) return
    const sb = getSupabase()
    setError(null)
    const { data, error: qErr } = await sb
      .from('matches')
      .select('id, title, starts_at, status, participant_list_visibility')
      .eq('organizer_id', user.id)
      .order('starts_at', { ascending: true })
    if (qErr) {
      setError(qErr.message)
      setRows([])
      return
    }
    setRows((data ?? []) as OrganizerMatchRow[])
  }, [configured, user?.id])

  useEffect(() => {
    if (!configured || sessionLoading || organizerProfileLoading) return
    if (!user?.id) {
      setRows([])
      return
    }
    if (organizerProfile !== 'active') {
      setRows([])
      return
    }
    void load()
  }, [configured, sessionLoading, organizerProfileLoading, organizerProfile, user?.id, load])

  if (!configured) {
    return (
      <div className="portal-home">
        <Helmet>
          <title>{p.myMatchesHelmet}</title>
        </Helmet>
        <p>{p.matchesSupabaseUnset}</p>
        <Link to={`/${locale}`}>{p.myMatchesBackHome}</Link>
      </div>
    )
  }

  if (sessionLoading) {
    return (
      <div className="portal-home">
        <Helmet>
          <title>{p.myMatchesHelmet}</title>
        </Helmet>
        <p>{p.myMatchesLoading}</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="portal-home">
        <Helmet>
          <title>{p.myMatchesHelmet}</title>
        </Helmet>
        <p>{p.myMatchesNeedSignIn}</p>
        {import.meta.env.DEV ? (
          <p>
            <Link to={`/${locale}/dev/supabase-auth-smoke`}>{p.myMatchesDevSignInHint}</Link>
          </p>
        ) : null}
        <Link to={`/${locale}`}>{p.myMatchesBackHome}</Link>
      </div>
    )
  }

  if (organizerProfileLoading) {
    return (
      <div className="portal-home">
        <Helmet>
          <title>{p.myMatchesHelmet}</title>
        </Helmet>
        <p>{p.matchesLoadingDetail}</p>
      </div>
    )
  }

  if (organizerProfile !== 'active') {
    return (
      <div className="portal-home">
        <Helmet>
          <title>{p.myMatchesHelmet}</title>
        </Helmet>
        <header className="portal-home__hero" style={{ marginBottom: '1rem' }}>
          <h1 className="portal-home__hero-title">{p.myMatchesTitle}</h1>
        </header>
        <OrganizerMatchInactivePanel
          locale={locale}
          p={p}
          profile={organizerProfile}
          moderationNote={moderationNote}
        />
      </div>
    )
  }

  return (
    <div className="portal-home">
      <Helmet>
        <title>{p.myMatchesHelmet}</title>
      </Helmet>

      <div className="portal-home__hero" style={{ marginBottom: '1rem' }}>
        <h1 className="portal-home__hero-title">{p.myMatchesTitle}</h1>
      </div>

      <p style={{ marginBottom: '1rem' }}>
        <Link
          className="portal-shell__brand"
          style={{ fontWeight: 700, fontSize: '0.95rem' }}
          to={`/${locale}/matches/my/new`}
        >
          {p.myMatchesCreate}
        </Link>
        {' · '}
        <Link to={`/${locale}`}>{p.myMatchesBackHome}</Link>
      </p>

      {error ? (
        <p role="alert">
          {p.myMatchesLoadError}: {error}
        </p>
      ) : null}

      {rows === undefined ? (
        <p>{p.myMatchesLoading}</p>
      ) : rows.length === 0 ? (
        <p>{p.myMatchesEmpty}</p>
      ) : (
        <table
          style={{
            width: '100%',
            maxWidth: '48rem',
            borderCollapse: 'collapse',
            fontSize: '0.92rem',
          }}
        >
          <thead>
            <tr>
              <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.45rem 0.5rem' }}>
                {p.myMatchesColTitle}
              </th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.45rem 0.5rem' }}>
                {p.myMatchesColStarts}
              </th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.45rem 0.5rem' }}>
                {p.myMatchesColStatus}
              </th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', padding: '0.45rem 0.5rem' }}>
                {p.myMatchesColList}
              </th>
              <th style={{ textAlign: 'right', borderBottom: '1px solid var(--border)', padding: '0.45rem 0.5rem' }} />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td style={{ borderBottom: '1px solid var(--border)', padding: '0.45rem 0.5rem' }}>{r.title}</td>
                <td style={{ borderBottom: '1px solid var(--border)', padding: '0.45rem 0.5rem' }}>
                  {formatPortalDate(r.starts_at, locale)}
                </td>
                <td style={{ borderBottom: '1px solid var(--border)', padding: '0.45rem 0.5rem' }}>
                  {matchStatusLabel(p, r.status)}
                </td>
                <td style={{ borderBottom: '1px solid var(--border)', padding: '0.45rem 0.5rem' }}>
                  {visibilityLabel(p, r.participant_list_visibility)}
                </td>
                <td
                  style={{
                    borderBottom: '1px solid var(--border)',
                    padding: '0.45rem 0.5rem',
                    textAlign: 'right',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Link to={`/${locale}/matches/my/${r.id}`} style={{ marginRight: '0.65rem' }}>
                    {p.myMatchesEdit}
                  </Link>
                  <Link to={`/${locale}/matches/my/${r.id}/roster`} style={{ marginRight: '0.65rem' }}>
                    {p.myMatchesRoster}
                  </Link>
                  {r.status === 'published' ? (
                    <Link to={`/${locale}/matches/${r.id}`}>{p.myMatchesViewPublic}</Link>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function matchStatusLabel(p: Portal, status: string) {
  if (status === 'draft') return p.matchOrgStatusDraft
  if (status === 'published') return p.matchOrgStatusPublished
  if (status === 'cancelled') return p.matchOrgStatusCancelled
  if (status === 'completed') return p.matchOrgStatusCompleted
  return status
}

function visibilityLabel(p: Portal, v: string | null | undefined) {
  const x = v ?? 'closed'
  if (x === 'open') return p.matchOrgParticipantsOpenShort
  return p.matchOrgParticipantsClosedShort
}
