import { useCallback, useEffect, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useParams } from 'react-router-dom'
import { MatchDescriptionRichText } from './matchDescriptionRichText'
import { matchDescriptionLooksLikeBbCode } from './matchDescriptionLooksLikeBbCode'
import { formatTemplate } from '../../i18n/format'
import { useI18n } from '../../i18n/useI18n'
import { getSupabase, isSupabaseConfigured } from '../../lib/supabaseClient'
import { formatPortalDate } from './matchPortalFormat'
import { MATCH_ID_UUID_RE } from './matchPortalUuid'
import { MatchPublicRegistrationSection } from './MatchPublicRegistrationSection'
import { programmeListDisplayTitles } from './matchPortalProgrammeDisplay'
import { portalLabelMatchEventKind, portalLabelPsMatchLevel } from './matchPortalLabels'
import { categoryLabel, weaponClassLabel } from '../shooterProfileCatalog'
import { formatSquadLabelNumberOnly } from './matchPortalSquadDisplay'
import {
  type RegistrationMetricRow,
  normalizeRegistrationMetricRows,
  registrationMetricNum,
  sumSquadSeatsTotals,
} from './matchPortalRegistrationMetrics'
import '../PortalHome.css'
import '../PortalMatchesUi.css'

type MatchDetailRow = {
  id: string
  title: string
  description_md: string | null
  starts_at: string
  location_label: string | null
  cover_image_url: string | null
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
  categories: unknown
  /** Same values as organizer Applications: `pending` | `confirmed` */
  registration_status: string | null
}

type PublicStageLinkRow = {
  sort_order: number
  share_stage_id: string | null
  snapshot_meta: Record<string, unknown> | null
}

function parseCategoryIdsFromRoster(raw: unknown): string[] {
  if (raw == null) return []
  if (Array.isArray(raw)) return raw.filter((x): x is string => typeof x === 'string')
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw)
      if (Array.isArray(p)) return p.filter((x): x is string => typeof x === 'string')
    } catch {
      return []
    }
  }
  return []
}

function rosterCategoriesDisplay(raw: unknown, loc: 'uk' | 'en'): string {
  const ids = parseCategoryIdsFromRoster(raw)
  if (ids.length === 0) return '—'
  return ids.map((id) => categoryLabel(id, loc)).join(', ')
}

export function MatchPublicDetailPage() {
  const { matchId } = useParams<{ matchId: string }>()
  const { locale, tree } = useI18n()
  const p = tree.portal
  const [row, setRow] = useState<MatchDetailRow | null | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  const [roster, setRoster] = useState<PublicRosterRow[] | null | undefined>(undefined)
  const [rosterError, setRosterError] = useState<string | null>(null)
  /** pending+confirmed total from public metrics — when list is open but confirmed-only table empty. */
  const [programmeLinks, setProgrammeLinks] = useState<PublicStageLinkRow[] | undefined>(undefined)
  const [programmeError, setProgrammeError] = useState<string | null>(null)
  const [regMetrics, setRegMetrics] = useState<RegistrationMetricRow[] | undefined>(undefined)
  const [regMetricsError, setRegMetricsError] = useState<string | null>(null)
  const [mastheadCtaMount, setMastheadCtaMount] = useState<HTMLElement | null>(null)

  /** Derived: total registrants from metrics when roster is open visibility (for empty confirmed table hint). */
  const openVisibilityActiveRegTotal = useMemo(() => {
    const vis = row?.participant_list_visibility ?? 'closed'
    if (!row?.id || vis !== 'open' || !regMetrics?.length) return undefined
    const raw = regMetrics[0]?.match_total_registered
    const n = registrationMetricNum(raw)
    return Number.isFinite(n) && n >= 0 ? n : undefined
  }, [row?.id, row?.participant_list_visibility, regMetrics])

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
      const { data, error: qErr } = await sb
        .from('matches')
        .select(
          'id, title, description_md, starts_at, location_label, cover_image_url, competitor_limit, discipline, status, participant_list_visibility, prematch_enabled, match_event_kind, ps_match_level',
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

  const loadRegistrationMetrics = useCallback(async () => {
    await Promise.resolve()
    if (!validId || !configured || !row?.id) {
      setRegMetrics(undefined)
      setRegMetricsError(null)
      return
    }
    const sb = getSupabase()
    setRegMetrics(undefined)
    setRegMetricsError(null)
    const { data, error } = await sb.rpc('fetch_public_match_registration_metrics', {
      p_match_id: row.id,
    })
    if (error) {
      const hintRpcMissing =
        error.message.includes('does not exist') || error.code === '42883' || error.code === 'PGRST202'
      setRegMetricsError(hintRpcMissing ? `${error.message}. ${p.matchDetailApplyMigrationHint}` : error.message)
      setRegMetrics([])
      return
    }
    setRegMetricsError(null)
    setRegMetrics(normalizeRegistrationMetricRows(data))
  }, [validId, configured, row, p.matchDetailApplyMigrationHint])

  useEffect(() => {
    queueMicrotask(() => void loadRegistrationMetrics())
  }, [loadRegistrationMetrics])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      await Promise.resolve()
      if (cancelled) return

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
        <nav className="portal-page-context portal-page-context--solo-link" aria-label={p.portalBreadcrumbAria}>
          <Link to={`/${locale}/matches`}>{p.matchDetailBackToList}</Link>
        </nav>
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
        <nav className="portal-page-context portal-page-context--solo-link" aria-label={p.portalBreadcrumbAria}>
          <Link to={`/${locale}/matches`}>{p.matchDetailBackToList}</Link>
        </nav>
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
        <nav className="portal-page-context portal-page-context--solo-link" aria-label={p.portalBreadcrumbAria}>
          <Link to={`/${locale}/matches`}>{p.matchDetailBackToList}</Link>
        </nav>
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
        <nav className="portal-page-context portal-page-context--solo-link" aria-label={p.portalBreadcrumbAria}>
          <Link to={`/${locale}/matches`}>{p.matchDetailBackToList}</Link>
        </nav>
      </div>
    )
  }

  const helmetTitle = `${row.title} — ${p.matchesPageShortTitle}`
  const coverUrl = row.cover_image_url?.trim() ?? ''
  const hasCover = Boolean(coverUrl)
  const locUi = locale === 'uk' ? 'uk' : 'en'
  const eventKindLine = portalLabelMatchEventKind(row.match_event_kind, p)
  const psLevelLine = portalLabelPsMatchLevel(row.ps_match_level, p)
  const weaponLine = weaponClassLabel((row.discipline ?? 'shotgun').trim() || 'shotgun', locUi)

  const programmeDisplayTitles =
    programmeLinks !== undefined && !programmeError ? programmeListDisplayTitles(programmeLinks, p) : null

  return (
    <article className="portal-home portal-match-public-detail">
      <Helmet>
        <title>{helmetTitle}</title>
      </Helmet>

      <section
        className={`portal-match-public-detail__masthead${hasCover ? ' portal-match-public-detail__masthead--has-cover' : ''}`}
      >
        <div className="portal-match-public-detail__masthead-sheet">
          <nav
            className="portal-page-context portal-match-public-detail__breadcrumbs"
            aria-label={p.portalBreadcrumbAria}
          >
            <ol className="portal-breadcrumbs portal-match-public-detail__breadcrumbs-list">
              <li>
                <Link to={`/${locale}/matches`}>{p.navMatches}</Link>
              </li>
              <li className="portal-breadcrumbs__current">
                <span className="portal-match-public-detail__crumb-title" title={row.title}>
                  {row.title}
                </span>
              </li>
            </ol>
          </nav>

          <header className="portal-home__hero portal-match-public-detail__title-block portal-match-public-detail__masthead-title-row">
            <h1 className="portal-home__hero-title portal-match-public-detail__hero-heading" title={row.title}>
              {row.title}
            </h1>
          </header>

          <div
            className={`portal-match-public-detail__masthead-grid${hasCover ? ' portal-match-public-detail__masthead-grid--has-cover' : ''}`}
          >
            {hasCover ?
              <div className="portal-match-public-detail__masthead-cover-col">
                <figure className="portal-match-public-detail__cover">
                  <img src={coverUrl} alt="" loading="lazy" decoding="async" />
                </figure>
                <div
                  className="portal-match-public-detail__masthead-cta-slot"
                  ref={setMastheadCtaMount}
                  aria-label={p.matchDetailMastheadActionsAria}
                />
              </div>
            : null}
            <div className="portal-match-public-detail__masthead-main">
              {!hasCover ?
                <div
                  className="portal-match-public-detail__masthead-cta-slot"
                  ref={setMastheadCtaMount}
                  aria-label={p.matchDetailMastheadActionsAria}
                />
              : null}

              <dl className="portal-match-public-detail__facts">
                <dt>{p.matchDetailStartsLabel}</dt>
                <dd>{formatPortalDate(row.starts_at, locale)}</dd>
                {eventKindLine ?
                  <>
                    <dt>{p.matchDetailEventKindLabel}</dt>
                    <dd>{eventKindLine}</dd>
                  </>
                : null}
                {psLevelLine ?
                  <>
                    <dt>{p.matchDetailPsLevelLabel}</dt>
                    <dd>{psLevelLine}</dd>
                  </>
                : null}
                {row.location_label ?
                  <>
                    <dt>{p.matchDetailLocationLabel}</dt>
                    <dd>{row.location_label}</dd>
                  </>
                : null}
                <dt>{p.matchDetailDisciplineLabel}</dt>
                <dd>{weaponLine}</dd>
                {row.competitor_limit != null ?
                  <>
                    <dt>{p.matchDetailLimitLabel}</dt>
                    <dd>
                      {regMetrics === undefined ?
                        row.competitor_limit
                      : regMetrics.length === 0 ?
                        row.competitor_limit
                      : formatTemplate(p.matchDetailLimitWithFree, {
                          limit: row.competitor_limit,
                          free: sumSquadSeatsTotals(regMetrics).totalFree,
                        })}
                    </dd>
                  </>
                : null}
                <dt>{p.matchDetailPrematchLabel}</dt>
                <dd>{row.prematch_enabled ? p.matchDetailPrematchValueYes : p.matchDetailPrematchValueNo}</dd>
              </dl>
            </div>
          </div>
        </div>
      </section>

      {row.description_md?.trim() ?
        <section className="portal-match-public-detail__surface portal-match-public-detail__description portal-home__hero-lead">
          <div
            className={
              matchDescriptionLooksLikeBbCode(row.description_md) ?
                'portal-match-description portal-match-description--bbcode'
              : 'portal-match-description portal-match-description--md'
            }
          >
            <MatchDescriptionRichText source={row.description_md} />
          </div>
        </section>
      : null}

      {programmeLinks === undefined || programmeLinks.length > 0 || programmeError ?
        <section
          className="portal-match-public-detail__surface portal-match-public-detail__section"
          aria-labelledby="match-programme-heading"
        >
          <h2 id="match-programme-heading" className="portal-match-public-detail__section-title">
            {p.matchDetailProgrammeHeading}
          </h2>
          {programmeLinks === undefined ?
            <p className="portal-match-public-detail__muted">{p.matchesLoadingDetail}</p>
          : programmeError ?
            <p role="alert" className="portal-match-public-detail__muted">
              {p.matchesLoadError}: {programmeError}
            </p>
          : (
            <ol className="portal-match-public-detail__programme">
              {programmeLinks.map((lnk, idx) => {
                const sid = lnk.share_stage_id?.trim()
                const title = programmeDisplayTitles![idx]!
                return (
                  <li key={`${sid ?? ''}-${lnk.sort_order}-${idx}`}>
                    {sid ?
                      <a
                        href={`/v/${encodeURIComponent(sid)}?lang=${locale}`}
                        target="_blank"
                        rel="noopener noreferrer"
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
          )}
        </section>
      : null}

      <MatchPublicRegistrationSection
        locale={locale}
        matchUuid={row.id}
        matchDiscipline={row.discipline}
        metrics={regMetrics}
        metricsError={regMetricsError}
        reloadMetrics={loadRegistrationMetrics}
        mastheadActionsMount={mastheadCtaMount}
        p={p}
      />

      <section
        className="portal-match-public-detail__surface portal-match-public-detail__section"
        aria-labelledby="match-participants-heading"
      >
        <h2 id="match-participants-heading" className="portal-match-public-detail__section-title">
          {p.matchDetailParticipantsHeading}
        </h2>
        {(row.participant_list_visibility ?? 'closed') !== 'open' ? (
          <p className="portal-match-public-detail__prose">{p.matchDetailParticipantsClosed}</p>
        ) : roster === undefined ? (
          <p className="portal-match-public-detail__muted">{p.matchesLoadingDetail}</p>
        ) : rosterError ? (
          <p role="alert" className="portal-match-public-detail__muted">
            {p.matchesLoadError}: {rosterError}
          </p>
        ) : (roster ?? []).length === 0 ?
          openVisibilityActiveRegTotal !== undefined && openVisibilityActiveRegTotal > 0 ?
            <p className="portal-match-public-detail__prose">
              {formatTemplate(p.matchDetailParticipantsOpenAwaitingConfirmation, {
                count: openVisibilityActiveRegTotal,
              })}
            </p>
          : <p className="portal-match-public-detail__prose">{p.matchDetailParticipantsOpenEmpty}</p>

        : (
          <>
            <div className="portal-match-public-detail__table-scroll">
              <table className="portal-match-public-participants-table">
                <thead>
                  <tr>
                    <th scope="col">{p.matchDetailParticipantsColSquad}</th>
                    {row.prematch_enabled ?
                      <th scope="col">{p.matchDetailParticipantsColPhase}</th>
                    : null}
                    <th scope="col">{p.matchDetailParticipantsColName}</th>
                    <th scope="col">{p.matchDetailParticipantsColDivision}</th>
                    <th scope="col">{p.matchDetailParticipantsColCategory}</th>
                    <th scope="col">{p.matchDetailParticipantsColPaymentConfirmation}</th>
                  </tr>
                </thead>
                <tbody>
                  {(roster ?? []).map((r, i) => {
                    const rosterAccepted = String(r.registration_status ?? '').toLowerCase() === 'confirmed'
                    return (
                    <tr
                      key={`${r.squad_phase ?? ''}-${r.squad_sort}-${r.squad_label}-${i}`}
                      className="portal-match-reg-public-roster-row"
                    >
                      <td title={r.squad_label}>{formatSquadLabelNumberOnly(r.squad_label)}</td>
                      {row.prematch_enabled ?
                        <td>
                          {r.squad_phase === 'prematch' ?
                            p.matchDetailRegistrationPhaseShortPrematch
                          : p.matchDetailRegistrationPhaseShortMain}
                        </td>
                      : null}
                      <td>{r.display_name}</td>
                      <td>{r.division}</td>
                      <td>{rosterCategoriesDisplay(r.categories, locUi)}</td>
                      <td>
                        <span
                          className={
                            rosterAccepted ?
                              'portal-match-reg-label portal-match-reg-label--confirmed'
                            : 'portal-match-reg-label portal-match-reg-label--pending'
                          }
                        >
                          {rosterAccepted ? p.matchDetailParticipantsPaymentConfirmed : p.matchDetailParticipantsPaymentPending}
                        </span>
                      </td>
                    </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {p.matchDetailParticipantsFootnote.trim() ?
              <p className="portal-match-public-detail__footnote">{p.matchDetailParticipantsFootnote}</p>
            : null}
          </>
        )}
      </section>
    </article>
  )
}
