import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { useI18n } from '../../i18n/useI18n'
import { getSupabase, isSupabaseConfigured } from '../../lib/supabaseClient'
import { formatPortalDate } from './matchPortalFormat'
import { MATCH_ID_UUID_RE } from './matchPortalUuid'
import { MatchPublicRegistrationSection } from './MatchPublicRegistrationSection'
import '../PortalHome.css'

type MatchDetailRow = {
  id: string
  title: string
  description_md: string | null
  starts_at: string
  location_label: string | null
  competitor_limit: number | null
  discipline: string
  status: string
  participant_list_visibility: 'open' | 'closed' | null
}

type PublicRosterRow = {
  squad_sort: number
  squad_label: string
  display_name: string
  division: string
  classification_grade: string
}

export function MatchPublicDetailPage() {
  const { matchId } = useParams<{ matchId: string }>()
  const { locale, tree } = useI18n()
  const p = tree.portal
  const [row, setRow] = useState<MatchDetailRow | null | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  const [roster, setRoster] = useState<PublicRosterRow[] | null | undefined>(undefined)
  const [rosterError, setRosterError] = useState<string | null>(null)

  const validId = matchId && MATCH_ID_UUID_RE.test(matchId)
  const configured = isSupabaseConfigured()

  useEffect(() => {
    if (!validId || !configured) return
    let cancelled = false
    const sb = getSupabase()
    void (async () => {
      setRow(undefined)
      setRoster(undefined)
      setRosterError(null)
      const { data, error: qErr } = await sb
        .from('matches')
        .select(
          'id, title, description_md, starts_at, location_label, competitor_limit, discipline, status, participant_list_visibility',
        )
        .eq('id', matchId)
        .eq('status', 'published')
        .maybeSingle()
      if (cancelled) return
      if (qErr) {
        setError(qErr.message)
        setRow(null)
        return
      }
      setError(null)
      setRow((data ?? null) as MatchDetailRow | null)
    })()
    return () => {
      cancelled = true
    }
  }, [matchId, validId, configured])

  useEffect(() => {
    if (!validId || !configured || !row?.id) {
      setRoster(undefined)
      setRosterError(null)
      return
    }
    const vis = row.participant_list_visibility ?? 'closed'
    if (vis !== 'open') {
      setRoster(null)
      setRosterError(null)
      return
    }
    let cancelled = false
    const sb = getSupabase()
    setRoster(undefined)
    setRosterError(null)
    void sb.rpc('fetch_public_match_roster', { p_match_id: row.id }).then(({ data, error: rErr }) => {
      if (cancelled) return
      if (rErr) {
        setRosterError(rErr.message)
        setRoster([])
        return
      }
      setRoster((data ?? []) as PublicRosterRow[])
    })
    return () => {
      cancelled = true
    }
  }, [validId, configured, row?.id, row?.participant_list_visibility])

  if (!validId) {
    return (
      <div className="portal-home">
        <Helmet>
          <title>{p.matchDetailNotFoundTitle}</title>
        </Helmet>
        <p>{p.matchDetailNotFoundBody}</p>
        <p>
          <Link to={`/${locale}`}>{p.matchDetailBackToList}</Link>
        </p>
      </div>
    )
  }

  if (!configured) {
    return (
      <div className="portal-home">
        <Helmet>
          <title>{p.matchesPageHelmetTitle}</title>
        </Helmet>
        <p>{p.matchesSupabaseUnset}</p>
        <p>
          <Link to={`/${locale}`}>{p.matchDetailBackToList}</Link>
        </p>
      </div>
    )
  }

  if (row === undefined) {
    return (
      <div className="portal-home">
        <Helmet>
          <title>{p.matchesPageHelmetTitle}</title>
        </Helmet>
        <p>{p.matchesLoadingDetail}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="portal-home">
        <Helmet>
          <title>{p.matchesPageHelmetTitle}</title>
        </Helmet>
        <p role="alert">
          {p.matchesLoadError}: {error}
        </p>
        <p>
          <Link to={`/${locale}`}>{p.matchDetailBackToList}</Link>
        </p>
      </div>
    )
  }

  if (!row) {
    return (
      <div className="portal-home">
        <Helmet>
          <title>{p.matchDetailNotFoundTitle}</title>
        </Helmet>
        <p>{p.matchDetailNotFoundBody}</p>
        <p>
          <Link to={`/${locale}`}>{p.matchDetailBackToList}</Link>
        </p>
      </div>
    )
  }

  const helmetTitle = `${row.title} — ${p.matchesPageShortTitle}`

  return (
    <article className="portal-home">
      <Helmet>
        <title>{helmetTitle}</title>
      </Helmet>

      <p style={{ margin: '0 0 0.5rem' }}>
        <Link to={`/${locale}`}>{p.matchDetailBackToList}</Link>
      </p>

      <header className="portal-home__hero">
        <h1 className="portal-home__hero-title">{row.title}</h1>
      </header>

      <dl
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: '0.35rem 1rem',
          fontSize: '0.95rem',
          margin: 0,
        }}
      >
        <dt>{p.matchDetailStartsLabel}</dt>
        <dd style={{ margin: 0 }}>{formatPortalDate(row.starts_at, locale)}</dd>
        {row.location_label ? (
          <>
            <dt>{p.matchDetailLocationLabel}</dt>
            <dd style={{ margin: 0 }}>{row.location_label}</dd>
          </>
        ) : null}
        <dt>{p.matchDetailDisciplineLabel}</dt>
        <dd style={{ margin: 0 }}>{row.discipline}</dd>
        {row.competitor_limit != null ? (
          <>
            <dt>{p.matchDetailLimitLabel}</dt>
            <dd style={{ margin: 0 }}>{row.competitor_limit}</dd>
          </>
        ) : null}
      </dl>

      {row.description_md?.trim() ? (
        <section className="portal-home__hero-lead" style={{ marginTop: '1.25rem', maxWidth: '50rem' }}>
          <ReactMarkdown>{row.description_md}</ReactMarkdown>
        </section>
      ) : null}

      <MatchPublicRegistrationSection locale={locale} matchUuid={row.id} p={p} />

      <section style={{ marginTop: '1.75rem', maxWidth: '48rem' }} aria-labelledby="match-participants-heading">
        <h2
          id="match-participants-heading"
          className="portal-home__hero-title"
          style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 0.65rem', letterSpacing: '-0.02em' }}
        >
          {p.matchDetailParticipantsHeading}
        </h2>
        {(row.participant_list_visibility ?? 'closed') !== 'open' ? (
          <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.55, color: 'var(--text)' }}>
            {p.matchDetailParticipantsClosed}
          </p>
        ) : roster === undefined ? (
          <p style={{ margin: 0, fontSize: '0.95rem' }}>{p.matchesLoadingDetail}</p>
        ) : rosterError ? (
          <p role="alert" style={{ margin: 0, fontSize: '0.95rem' }}>
            {p.matchesLoadError}: {rosterError}
          </p>
        ) : (roster ?? []).length === 0 ? (
          <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.55 }}>{p.matchDetailParticipantsOpenEmpty}</p>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.92rem',
                }}
              >
                <thead>
                  <tr>
                    <th
                      scope="col"
                      style={{
                        textAlign: 'left',
                        padding: '0.5rem 0.6rem',
                        borderBottom: '1px solid var(--border)',
                        color: 'var(--text-h)',
                      }}
                    >
                      {p.matchDetailParticipantsColSquad}
                    </th>
                    <th
                      scope="col"
                      style={{
                        textAlign: 'left',
                        padding: '0.5rem 0.6rem',
                        borderBottom: '1px solid var(--border)',
                        color: 'var(--text-h)',
                      }}
                    >
                      {p.matchDetailParticipantsColName}
                    </th>
                    <th
                      scope="col"
                      style={{
                        textAlign: 'left',
                        padding: '0.5rem 0.6rem',
                        borderBottom: '1px solid var(--border)',
                        color: 'var(--text-h)',
                      }}
                    >
                      {p.matchDetailParticipantsColDivision}
                    </th>
                    <th
                      scope="col"
                      style={{
                        textAlign: 'left',
                        padding: '0.5rem 0.6rem',
                        borderBottom: '1px solid var(--border)',
                        color: 'var(--text-h)',
                      }}
                    >
                      {p.matchDetailParticipantsColClass}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(roster ?? []).map((r, i) => (
                    <tr key={`${r.squad_sort}-${r.squad_label}-${i}`}>
                      <td style={{ padding: '0.5rem 0.6rem', borderBottom: '1px solid var(--border)' }}>
                        {r.squad_label}
                      </td>
                      <td style={{ padding: '0.5rem 0.6rem', borderBottom: '1px solid var(--border)' }}>
                        {r.display_name}
                      </td>
                      <td style={{ padding: '0.5rem 0.6rem', borderBottom: '1px solid var(--border)' }}>
                        {r.division}
                      </td>
                      <td style={{ padding: '0.5rem 0.6rem', borderBottom: '1px solid var(--border)' }}>
                        {r.classification_grade}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p
              style={{
                margin: '0.65rem 0 0',
                fontSize: '0.8125rem',
                lineHeight: 1.45,
                color: 'var(--text)',
              }}
            >
              {p.matchDetailParticipantsFootnote}
            </p>
          </>
        )}
      </section>
    </article>
  )
}
