import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { formatTemplate } from '../../i18n/format'
import { useI18n } from '../../i18n/useI18n'
import type { MessageTree } from '../../i18n/messages'
import { getSupabase, isSupabaseConfigured } from '../../lib/supabaseClient'
import { formatPortalDate } from './matchPortalFormat'
import { MATCH_ID_UUID_RE } from './matchPortalUuid'
import { MatchPublicRegistrationSection } from './MatchPublicRegistrationSection'
import { isMatchEventKind, isPsMatchLevel } from '../../domain/matchTaxonomy'
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
  prematch_enabled: boolean | null
  match_event_kind: string | null
  ps_match_level: string | null
}

type PublicRosterRow = {
  squad_phase: string | null
  squad_sort: number
  squad_label: string
  display_name: string
  division: string
  classification_grade: string
}

type PublicStageLinkRow = {
  sort_order: number
  share_stage_id: string | null
  snapshot_meta: Record<string, unknown> | null
}

function programmeRowTitle(r: PublicStageLinkRow): string {
  const meta = r.snapshot_meta
  const snap = typeof meta?.title_snapshot === 'string' ? meta.title_snapshot.trim() : ''
  if (snap) return snap
  return r.share_stage_id?.trim() || '—'
}

function labelEventKind(
  kind: string | null,
  p: MessageTree['portal'],
): string {
  if (!kind || !isMatchEventKind(kind)) return ''
  if (kind === 'training') return p.matchEventKindTraining
  if (kind === 'match') return p.matchEventKindMatch
  return p.matchEventKindClassification
}

function labelPsLevel(level: string | null, p: MessageTree['portal']): string {
  if (!level || !isPsMatchLevel(level)) return ''
  const m: Record<string, string> = {
    L1: p.matchPsLevelL1,
    L2: p.matchPsLevelL2,
    L3: p.matchPsLevelL3,
    L4: p.matchPsLevelL4,
    L5: p.matchPsLevelL5,
  }
  return m[level] ?? level
}

export function MatchPublicDetailPage() {
  const { matchId } = useParams<{ matchId: string }>()
  const { locale, tree } = useI18n()
  const p = tree.portal
  const [row, setRow] = useState<MatchDetailRow | null | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  const [roster, setRoster] = useState<PublicRosterRow[] | null | undefined>(undefined)
  const [rosterError, setRosterError] = useState<string | null>(null)
  /** pending+confirmed total from public metrics — used when participant list is open but таблиця confirmed-only порожня. */
  const [openVisibilityActiveRegTotal, setOpenVisibilityActiveRegTotal] = useState<number | undefined>(undefined)
  const [programmeLinks, setProgrammeLinks] = useState<PublicStageLinkRow[] | undefined>(undefined)
  const [programmeError, setProgrammeError] = useState<string | null>(null)

  const validId = matchId && MATCH_ID_UUID_RE.test(matchId)
  const configured = isSupabaseConfigured()

  useEffect(() => {
    if (!validId || !configured) return
    let cancelled = false
    const sb = getSupabase()
    void (async () => {
      await Promise.resolve()
      if (cancelled) return
      setRow(undefined)
      setRoster(undefined)
      setRosterError(null)
      setOpenVisibilityActiveRegTotal(undefined)
      const { data, error: qErr } = await sb
        .from('matches')
        .select(
          'id, title, description_md, starts_at, location_label, competitor_limit, discipline, status, participant_list_visibility, prematch_enabled, match_event_kind, ps_match_level',
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
    let cancelled = false
    let cancelledMetrics = false
    void (async () => {
      await Promise.resolve()
      if (cancelled) return

      if (!validId || !configured || !row?.id) {
        setRoster(undefined)
        setRosterError(null)
        setOpenVisibilityActiveRegTotal(undefined)
        return
      }
      const vis = row.participant_list_visibility ?? 'closed'
      if (vis !== 'open') {
        setRoster(null)
        setRosterError(null)
        setOpenVisibilityActiveRegTotal(undefined)
        return
      }
      const sbM = getSupabase()
      setOpenVisibilityActiveRegTotal(undefined)
      void sbM.rpc('fetch_public_match_registration_metrics', { p_match_id: row.id }).then(({ data: mdata, error: mErr }) => {
        if (cancelledMetrics) return
        if (mErr || !mdata?.length) {
          setOpenVisibilityActiveRegTotal(undefined)
          return
        }
        const raw = (mdata[0] as { match_total_registered?: number | string }).match_total_registered
        const n =
          typeof raw === 'number' ?
            raw
          : typeof raw === 'string' ?
            Number(raw)
          : NaN
        setOpenVisibilityActiveRegTotal(Number.isFinite(n) ? n : undefined)
      })
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
    })()
    return () => {
      cancelled = true
      cancelledMetrics = true
    }
  }, [validId, configured, row?.id, row?.participant_list_visibility])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      await Promise.resolve()
      if (cancelled) return
      if (!validId || !configured || !row?.id) {
        setProgrammeLinks(undefined)
        setProgrammeError(null)
        return
      }
      const sb = getSupabase()
      setProgrammeLinks(undefined)
      setProgrammeError(null)
      const { data, error: qErr } = await sb
        .from('match_stage_links')
        .select('sort_order, share_stage_id, snapshot_meta')
        .eq('match_id', row.id)
        .order('sort_order', { ascending: true })
      if (cancelled) return
      if (qErr) {
        setProgrammeError(qErr.message)
        setProgrammeLinks([])
        return
      }
      setProgrammeLinks((data ?? []) as PublicStageLinkRow[])
    })()
    return () => {
      cancelled = true
    }
  }, [validId, configured, row?.id])

  if (!validId) {
    return (
      <div className="portal-home">
        <Helmet>
          <title>{p.matchDetailNotFoundTitle}</title>
        </Helmet>
        <p>{p.matchDetailNotFoundBody}</p>
        <p>
          <Link to={`/${locale}/matches`}>{p.matchDetailBackToList}</Link>
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
          <Link to={`/${locale}/matches`}>{p.matchDetailBackToList}</Link>
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
          <Link to={`/${locale}/matches`}>{p.matchDetailBackToList}</Link>
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
          <Link to={`/${locale}/matches`}>{p.matchDetailBackToList}</Link>
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
        <Link to={`/${locale}/matches`}>{p.matchDetailBackToList}</Link>
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
        <dt>{p.matchDetailEventKindLabel}</dt>
        <dd style={{ margin: 0 }}>
          {labelEventKind(row.match_event_kind, p) || p.matchDetailNotSpecifiedValue}
        </dd>
        <dt>{p.matchDetailPsLevelLabel}</dt>
        <dd style={{ margin: 0 }}>
          {labelPsLevel(row.ps_match_level, p) || p.matchDetailNotSpecifiedValue}
        </dd>
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
        <dt>{p.matchDetailPrematchLabel}</dt>
        <dd style={{ margin: 0 }}>
          {row.prematch_enabled ? p.matchDetailPrematchValueYes : p.matchDetailPrematchValueNo}
        </dd>
      </dl>

      {row.description_md?.trim() ? (
        <section className="portal-home__hero-lead" style={{ marginTop: '1.25rem', maxWidth: '50rem' }}>
          <ReactMarkdown>{row.description_md}</ReactMarkdown>
        </section>
      ) : null}

      {programmeLinks === undefined || programmeLinks.length > 0 || programmeError ?
        <section style={{ marginTop: '1.75rem', maxWidth: '48rem' }} aria-labelledby="match-programme-heading">
          <h2
            id="match-programme-heading"
            className="portal-home__hero-title"
            style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 0.65rem', letterSpacing: '-0.02em' }}
          >
            {p.matchDetailProgrammeHeading}
          </h2>
          {programmeLinks === undefined ?
            <p style={{ margin: 0, fontSize: '0.95rem' }}>{p.matchesLoadingDetail}</p>
          : programmeError ?
            <p role="alert" style={{ margin: 0, fontSize: '0.95rem' }}>
              {p.matchesLoadError}: {programmeError}
            </p>
          : (
            <>
              <ol style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.95rem', lineHeight: 1.6 }}>
                {programmeLinks.map((lnk, idx) => {
                  const sid = lnk.share_stage_id?.trim()
                  const title = programmeRowTitle(lnk)
                  return (
                    <li key={`${sid ?? ''}-${lnk.sort_order}-${idx}`}>
                      {sid ?
                        <a
                          href={`/v/${encodeURIComponent(sid)}?lang=${locale}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${title} (${p.matchDetailProgrammeViewLink})`}
                        >
                          {title}
                        </a>
                      : (
                        title
                      )}
                    </li>
                  )
                })}
              </ol>
              <p
                style={{
                  margin: '0.65rem 0 0',
                  fontSize: '0.8125rem',
                  lineHeight: 1.45,
                  color: 'var(--text)',
                }}
              >
                {p.matchDetailProgrammeFootnote}
              </p>
            </>
          )}
        </section>
      : null}

      <MatchPublicRegistrationSection
        locale={locale}
        matchUuid={row.id}
        p={p}
        prematchEnabled={Boolean(row.prematch_enabled)}
      />

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
        ) : (roster ?? []).length === 0 ?
          openVisibilityActiveRegTotal !== undefined && openVisibilityActiveRegTotal > 0 ?
            <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.55 }}>
              {formatTemplate(p.matchDetailParticipantsOpenAwaitingConfirmation, {
                count: openVisibilityActiveRegTotal,
              })}
            </p>
          : <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.55 }}>{p.matchDetailParticipantsOpenEmpty}</p>

        : (
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
                    {row.prematch_enabled ?
                      <th
                        scope="col"
                        style={{
                          textAlign: 'left',
                          padding: '0.5rem 0.6rem',
                          borderBottom: '1px solid var(--border)',
                          color: 'var(--text-h)',
                        }}
                      >
                        {p.matchDetailParticipantsColPhase}
                      </th>
                    : null}
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
                    <tr key={`${r.squad_phase ?? ''}-${r.squad_sort}-${r.squad_label}-${i}`}>
                      <td style={{ padding: '0.5rem 0.6rem', borderBottom: '1px solid var(--border)' }}>
                        {r.squad_label}
                      </td>
                      {row.prematch_enabled ?
                        <td style={{ padding: '0.5rem 0.6rem', borderBottom: '1px solid var(--border)' }}>
                          {r.squad_phase === 'prematch' ?
                            p.matchDetailRegistrationPhaseShortPrematch
                          : p.matchDetailRegistrationPhaseShortMain}
                        </td>
                      : null}
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
