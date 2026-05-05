import { useCallback, useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import type { Locale } from '../../i18n/messages'
import { useI18n } from '../../i18n/useI18n'
import { getSupabase, isSupabaseConfigured } from '../../lib/supabaseClient'
import { useSupabaseSession } from '../useSupabaseSession'
import { useOrganizerSelfServiceProfile } from '../useOrganizerSelfServiceProfile'
import type { MessageTree } from '../../i18n/messages'
import { formatPortalDate } from './matchPortalFormat'
import { portalLabelMatchEventKind } from './matchPortalLabels'
import { OrganizerMatchInactivePanel } from './OrganizerMatchInactivePanel'
import '../PortalHome.css'
import '../PortalMatchesUi.css'

type Portal = MessageTree['portal']

type OrganizerMatchRow = {
  id: string
  title: string
  starts_at: string
  status: string
  participant_list_visibility?: string | null
  match_event_kind?: string | null
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
    await Promise.resolve()
    const sb = getSupabase()
    setError(null)
    const { data, error: qErr } = await sb
      .from('matches')
      .select('id, title, starts_at, status, participant_list_visibility, match_event_kind')
      .eq('organizer_id', user.id)
      .order('starts_at', { ascending: true })
    if (qErr) {
      setError(qErr.message)
      setRows([])
      return
    }
    setRows((data ?? []) as OrganizerMatchRow[])
  }, [configured, user])

  useEffect(() => {
    if (!configured || sessionLoading || organizerProfileLoading) return
    if (!user?.id) {
      queueMicrotask(() => setRows([]))
      return
    }
    if (organizerProfile !== 'active') {
      queueMicrotask(() => setRows([]))
      return
    }
    queueMicrotask(() => void load())
  }, [configured, sessionLoading, organizerProfileLoading, organizerProfile, user?.id, load])

  if (!configured) {
    return (
      <div className="portal-home">
        <Helmet>
          <title>{p.myMatchesHelmet}</title>
        </Helmet>
        <div className="portal-matches-organizer__panel" role="status">
          <p className="portal-matches-organizer__hint">{p.matchesSupabaseUnset}</p>
          <Link className="portal-btn portal-btn--secondary" to={`/${locale}`}>
            {p.myMatchesBackHome}
          </Link>
        </div>
      </div>
    )
  }

  if (sessionLoading) {
    return (
      <div className="portal-home">
        <Helmet>
          <title>{p.myMatchesHelmet}</title>
        </Helmet>
        <p className="portal-matches-organizer__hint">{p.myMatchesLoading}</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="portal-home">
        <Helmet>
          <title>{p.myMatchesHelmet}</title>
        </Helmet>
        <div className="portal-matches-organizer__panel">
          <p className="portal-matches-organizer__hint">{p.myMatchesNeedSignIn}</p>
          {import.meta.env.DEV ? (
            <p className="portal-matches-organizer__hint">
              <Link to={`/${locale}/dev/supabase-auth-smoke`}>{p.myMatchesDevSignInHint}</Link>
            </p>
          ) : null}
          <Link className="portal-btn portal-btn--secondary" to={`/${locale}`}>
            {p.myMatchesBackHome}
          </Link>
        </div>
      </div>
    )
  }

  if (organizerProfileLoading) {
    return (
      <div className="portal-home">
        <Helmet>
          <title>{p.myMatchesHelmet}</title>
        </Helmet>
        <p className="portal-matches-organizer__hint">{p.matchesLoadingDetail}</p>
      </div>
    )
  }

  if (organizerProfile !== 'active') {
    return (
      <div className="portal-home">
        <Helmet>
          <title>{p.myMatchesHelmet}</title>
        </Helmet>
        <div className="portal-matches-organizer__list-head">
          <nav className="portal-page-context" aria-label={p.portalBreadcrumbAria}>
            <ol className="portal-breadcrumbs">
              <li>
                <Link to={`/${locale}/matches`}>{p.navMatches}</Link>
              </li>
              <li className="portal-breadcrumbs__current">{p.myMatchesTitle}</li>
            </ol>
          </nav>
          <Link className="portal-matches-organizer__portal-home" to={`/${locale}`}>
            {p.myMatchesBackHome}
          </Link>
        </div>
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

      <div className="portal-matches-organizer__list-head">
        <nav className="portal-page-context" aria-label={p.portalBreadcrumbAria}>
          <ol className="portal-breadcrumbs">
            <li>
              <Link to={`/${locale}/matches`}>{p.navMatches}</Link>
            </li>
            <li className="portal-breadcrumbs__current">{p.myMatchesTitle}</li>
          </ol>
        </nav>
        <Link className="portal-matches-organizer__portal-home" to={`/${locale}`}>
          {p.myMatchesBackHome}
        </Link>
      </div>

      <header className="portal-home__hero" style={{ marginBottom: '0.25rem' }}>
        <div className="portal-matches-page__toolbar">
          <h1 className="portal-home__hero-title" style={{ margin: 0 }}>
            {p.myMatchesTitle}
          </h1>
          <div className="portal-matches-page__toolbar-actions">
            <Link className="portal-btn portal-btn--primary portal-btn--block-xs" to={`/${locale}/matches/my/new`}>
              {p.myMatchesCreate}
            </Link>
          </div>
        </div>
      </header>

      {error ? (
        <p className="portal-matches-organizer__hint" role="alert">
          {p.myMatchesLoadError}: {error}
        </p>
      ) : null}

      {rows === undefined ? (
        <p className="portal-matches-organizer__hint">{p.myMatchesLoading}</p>
      ) : rows.length === 0 ? (
        <div className="portal-matches-organizer__panel" role="status">
          <p className="portal-matches-organizer__hint">{p.myMatchesEmpty}</p>
          <Link className="portal-btn portal-btn--primary" to={`/${locale}/matches/my/new`}>
            {p.myMatchesCreate}
          </Link>
        </div>
      ) : (
        <>
          <ul className="portal-matches-organizer__cards" aria-label={p.myMatchesTitle}>
            {rows.map((r) => {
              const f = summarizeOrganizerMatchRow(p, r, locale)
              const rosterPath = `/${locale}/matches/my/${r.id}/roster`
              const editPath = `/${locale}/matches/my/${r.id}`
              const publicPath = `/${locale}/matches/${r.id}`
              return (
                <li key={r.id} className="portal-matches-organizer__card">
                  <h2 className="portal-matches-organizer__card-title" title={r.title}>
                    {r.title}
                  </h2>
                  <dl className="portal-matches-organizer__meta">
                    <dt>{p.myMatchesColStarts}</dt>
                    <dd>{f.starts}</dd>
                    <dt>{p.myMatchesColEventKind}</dt>
                    <dd>{f.eventKind}</dd>
                    <dt>{p.myMatchesColStatus}</dt>
                    <dd>{f.status}</dd>
                    <dt>{p.myMatchesColList}</dt>
                    <dd>{f.listVis}</dd>
                  </dl>
                  <div className="portal-matches-organizer__primary-row">
                    <Link className="portal-btn portal-btn--primary portal-btn--block" to={editPath}>
                      {p.myMatchesManage}
                    </Link>
                    <nav className="portal-matches-organizer__secondary" aria-label={p.myMatchesQuickLinksAria}>
                      <Link to={rosterPath}>{p.myMatchesRoster}</Link>
                      {r.status === 'published' ?
                        <Link to={publicPath}>{p.myMatchesViewPublic}</Link>
                      : null}
                    </nav>
                  </div>
                </li>
              )
            })}
          </ul>

          <div className="portal-matches-organizer__table-shell">
            <table className="portal-matches-organizer__table">
              <thead>
                <tr>
                  <th className="portal-matches-organizer__table-col-title">{p.myMatchesColTitle}</th>
                  <th>{p.myMatchesColStarts}</th>
                  <th>{p.myMatchesColEventKind}</th>
                  <th>{p.myMatchesColStatus}</th>
                  <th>{p.myMatchesColList}</th>
                  <th>{p.myMatchesManage}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const f = summarizeOrganizerMatchRow(p, r, locale)
                  const rosterPath = `/${locale}/matches/my/${r.id}/roster`
                  const editPath = `/${locale}/matches/my/${r.id}`
                  const publicPath = `/${locale}/matches/${r.id}`
                  return (
                    <tr key={r.id}>
                      <td className="portal-matches-organizer__table-col-title">
                        <span className="portal-match-title-ellipsis" title={r.title}>
                          {r.title}
                        </span>
                      </td>
                      <td>{f.starts}</td>
                      <td>{f.eventKind}</td>
                      <td>{f.status}</td>
                      <td>{f.listVis}</td>
                      <td>
                        <div className="portal-matches-organizer__cell-actions">
                          <Link className="portal-btn portal-btn--primary portal-btn--compact" to={editPath}>
                            {p.myMatchesManage}
                          </Link>
                          <div className="portal-matches-organizer__cell-actions-secondary">
                            <Link to={rosterPath}>{p.myMatchesRoster}</Link>
                            {r.status === 'published' ?
                              <Link to={publicPath}>{p.myMatchesViewPublic}</Link>
                            : null}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

function summarizeOrganizerMatchRow(p: Portal, r: OrganizerMatchRow, locale: Locale) {
  return {
    starts: formatPortalDate(r.starts_at, locale),
    eventKind: portalLabelMatchEventKind(r.match_event_kind ?? null, p) || p.portalMatchesHubListDash,
    status: matchStatusLabel(p, r.status),
    listVis: visibilityLabel(p, r.participant_list_visibility),
  }
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
