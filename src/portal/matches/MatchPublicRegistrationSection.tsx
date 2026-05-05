import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSupabase, isSupabaseConfigured } from '../../lib/supabaseClient'
import type { MessageTree } from '../../i18n/messages'
import { PortalCompactEmailAuth } from '../PortalCompactEmailAuth'
import { useSupabaseSession } from '../useSupabaseSession'
import { resolveShooterCategoriesForStorage } from '../shooterProfileCatalog'
import { sortPrematchFirstByPhase } from './matchSquadsSort'
import { portalMatchRegLabelClass } from './matchPortalRegStatusUi'
import '../PortalMatchesUi.css'

type Portal = MessageTree['portal']

type MetricRow = {
  squad_id: string
  squad_label: string
  squad_sort: number
  capacity: number
  squad_taken: number | string
  match_total_registered: number | string
  match_competitor_limit: number
  squad_phase?: string | null
}

export type OwnRegistrationRow = {
  id: string
  status: string
  squad_id: string
  division: string
  classification_grade: string
  power_factor?: string | null
}

type Props = {
  locale: string
  matchUuid: string
  p: Portal
  prematchEnabled: boolean
}

function phaseOf(m: MetricRow): 'main' | 'prematch' {
  return m.squad_phase === 'prematch' ? 'prematch' : 'main'
}

function num(v: number | string | undefined): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string') {
    const n = Number(v)
    if (Number.isFinite(n)) return n
  }
  return 0
}

export function MatchPublicRegistrationSection({ locale, matchUuid, p, prematchEnabled }: Props) {
  const { loading: sessionLoading, user } = useSupabaseSession()
  const sb = useMemo(() => getSupabase(), [])
  const configured = isSupabaseConfigured()
  const pathnameRedirect = `/${locale}/matches/${matchUuid}`

  const [metrics, setMetrics] = useState<MetricRow[] | undefined>(undefined)
  const [metricsError, setMetricsError] = useState<string | null>(null)

  const [mine, setMine] = useState<OwnRegistrationRow | null | undefined>(undefined)

  const [pickedSquad, setPickedSquad] = useState('')
  const [division, setDivision] = useState('')
  const [classification, setClassification] = useState('')
  const [powerFactor, setPowerFactor] = useState<'MAJOR' | 'MINOR' | ''>('')

  const [submitBusy, setSubmitBusy] = useState(false)
  const [mineBusy, setMineBusy] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  /** Dedupe prefilling participant defaults per (match,user) pair; cleared when `matchUuid` changes. */
  const defaultsPrefetchKeyRef = useRef<string | null>(null)

  useEffect(() => {
    defaultsPrefetchKeyRef.current = null
    queueMicrotask(() => {
      setMine(undefined)
      setPickedSquad('')
      setDivision('')
      setClassification('')
      setPowerFactor('')
      setFeedback(null)
    })
  }, [matchUuid])

  const loadMetrics = useCallback(async () => {
    await Promise.resolve()
    setMetrics(undefined)
    setMetricsError(null)
    const { data, error } = await sb.rpc('fetch_public_match_registration_metrics', {
      p_match_id: matchUuid,
    })
    if (error) {
      const hintRpcMissing =
        error.message.includes('does not exist') || error.code === '42883' || error.code === 'PGRST202'
      setMetricsError(hintRpcMissing ? `${error.message}. ${p.matchDetailApplyMigrationHint}` : error.message)
      setMetrics([])
      return
    }
    const rows = sortPrematchFirstByPhase<MetricRow>((data ?? []) as MetricRow[], (m) => num(m.squad_sort))
    setMetrics(rows)
  }, [sb, matchUuid, p.matchDetailApplyMigrationHint])

  useEffect(() => {
    if (!configured) return
    queueMicrotask(() => void loadMetrics())
  }, [configured, loadMetrics])

  const loadMine = useCallback(async () => {
    await Promise.resolve()
    if (!user?.id || !configured) {
      setMine(undefined)
      return
    }
    setMine(undefined)
    const { data, error } = await sb
      .from('match_registrations')
      .select('id, status, squad_id, division, classification_grade, power_factor')
      .eq('match_id', matchUuid)
      .eq('competitor_user_id', user.id)
      .maybeSingle()

    if (error) {
      setMine(null)
      setFeedback(`${p.matchesLoadError}: ${error.message}`)
      return
    }
    const row = data as OwnRegistrationRow | null
    setMine(row)
    setFeedback(null)
    if (row?.squad_id) setPickedSquad(row.squad_id)
    if (row?.division) setDivision(row.division)
    if (row?.classification_grade) setClassification(row.classification_grade)
    if (row?.power_factor) {
      const pf = typeof row.power_factor === 'string' ? row.power_factor.trim().toUpperCase() : ''
      setPowerFactor(pf === 'MAJOR' ? 'MAJOR' : pf === 'MINOR' ? 'MINOR' : '')
    }
  }, [configured, sb, matchUuid, user, p.matchesLoadError])

  useEffect(() => {
    if (sessionLoading || !configured) return
    queueMicrotask(() => void loadMine())
  }, [configured, loadMine, sessionLoading])

  useEffect(() => {
    if (!configured || sessionLoading || !user?.id) return
    if (mine === undefined) return
    if (mine !== null) return

    const pendingKey = `${matchUuid}:${user.id}`
    if (defaultsPrefetchKeyRef.current === pendingKey) return
    defaultsPrefetchKeyRef.current = pendingKey

    void (async () => {
      const { data, error } = await sb
        .from('participant_registration_defaults')
        .select('division, classification_grade, power_factor')
        .eq('user_id', user.id)
        .maybeSingle()

      if (defaultsPrefetchKeyRef.current !== pendingKey) return
      if (error || !data) return

      const row = data as {
        division?: string | null
        classification_grade?: string | null
        power_factor?: string | null
      }

      setDivision((d) => {
        const t = d.trim()
        if (t) return d
        return typeof row.division === 'string' ? row.division : ''
      })
      setClassification((c) => {
        const t = c.trim()
        if (t) return c
        return typeof row.classification_grade === 'string' ? row.classification_grade : ''
      })
      setPowerFactor((pf) => {
        if (pf !== '') return pf
        const raw =
          typeof row.power_factor === 'string' ?
            row.power_factor.trim().toUpperCase()
          : ''
        return raw === 'MAJOR' ? 'MAJOR' : raw === 'MINOR' ? 'MINOR' : ''
      })
    })()
  }, [configured, sessionLoading, user?.id, mine, matchUuid, sb])

  const matchTotal =
    metrics && metrics.length > 0 ? num(metrics[0]!.match_total_registered) : undefined
  const matchLimit =
    metrics && metrics.length > 0 ?
      metrics[0]!.match_competitor_limit
    : undefined

  const matchFull =
    matchTotal !== undefined &&
    matchLimit !== undefined &&
    matchLimit > 0 &&
    matchTotal >= matchLimit

  const prematchMetrics = useMemo(
    () => (metrics ?? []).filter((r) => phaseOf(r) === 'prematch'),
    [metrics],
  )

  const mainMetrics = useMemo(
    () => (metrics ?? []).filter((r) => phaseOf(r) === 'main'),
    [metrics],
  )

  const spotFreeMap = useMemo(() => {
    const m: Record<string, number> = {}
    if (!metrics) return m
    for (const row of metrics) {
      const cap = Number(row.capacity)
      const tk = num(row.squad_taken)
      m[row.squad_id] = Math.max(0, cap - tk)
    }
    return m
  }, [metrics])

  const firstOpenSquad = useMemo(() => {
    if (!metrics || matchFull) return ''
    const open = metrics.find((r) => (spotFreeMap[r.squad_id] ?? 0) > 0)
    return open?.squad_id ?? ''
  }, [metrics, spotFreeMap, matchFull])

  useEffect(() => {
    if (pickedSquad || !firstOpenSquad) return
    queueMicrotask(() => setPickedSquad(firstOpenSquad))
  }, [firstOpenSquad, pickedSquad])

  async function refreshAll() {
    await loadMetrics()
    await loadMine()
  }

  async function submitRegistration(ev: FormEvent) {
    ev.preventDefault()
    setFeedback(null)
    if (!user?.id || !configured) return
    const limit = metrics?.[0]?.match_competitor_limit
    const total = metrics?.[0] ? num(metrics[0]!.match_total_registered) : 0
    if (limit !== undefined && total >= limit && limit > 0) {
      setFeedback(p.matchDetailRegistrationMatchFull)
      return
    }
    const free = pickedSquad ? (spotFreeMap[pickedSquad] ?? 0) : 0
    if (!pickedSquad || free <= 0) {
      setFeedback(p.matchDetailRegistrationPickOpenSquad)
      return
    }
    const div = division.trim()
    const cg = classification.trim()

    setSubmitBusy(true)
    const { error } = await sb.from('match_registrations').insert({
      match_id: matchUuid,
      squad_id: pickedSquad,
      competitor_user_id: user.id,
      division: div,
      classification_grade: cg,
      power_factor: powerFactor === '' ? null : powerFactor,
      categories: resolveShooterCategoriesForStorage([]),
    })
    setSubmitBusy(false)

    if (error) {
      setFeedback(`${p.matchDetailRegistrationErrorPrefix}: ${error.message}`)
      return
    }

    setFeedback(p.matchDetailRegistrationDonePending)
    await refreshAll()
  }

  async function cancelMine() {
    if (!mine || mine.status !== 'pending' || !user?.id) return
    setMineBusy(true)
    setFeedback(null)
    const { error } = await sb
      .from('match_registrations')
      .update({ status: 'cancelled' })
      .eq('id', mine.id)
      .eq('competitor_user_id', user.id)
    setMineBusy(false)
    if (error) {
      setFeedback(`${p.matchDetailRegistrationErrorPrefix}: ${error.message}`)
      return
    }
    await refreshAll()
  }

  if (!configured) {
    return (
      <section style={{ marginTop: '1.75rem' }} aria-labelledby="match-reg-heading">
        <p>{p.matchesSupabaseUnset}</p>
      </section>
    )
  }

  return (
    <section style={{ marginTop: '1.75rem', maxWidth: '48rem' }} aria-labelledby="match-reg-heading">
      <h2
        id="match-reg-heading"
        className="portal-home__hero-title"
        style={{
          fontSize: '1.2rem',
          fontWeight: 800,
          margin: '0 0 0.65rem',
          letterSpacing: '-0.02em',
        }}
      >
        {p.matchDetailRegistrationHeading}
      </h2>

      {metricsError ?
        <p role="alert" style={{ fontSize: '0.95rem' }}>
          {p.matchesLoadError}: {metricsError}
        </p>
      : metrics === undefined ?
        <p style={{ fontSize: '0.95rem' }}>{p.matchesLoadingDetail}</p>
      : metrics.length === 0 ?
        <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.55 }}>
          {p.matchDetailRegistrationNoSquads}
        </p>
      : <>
          {prematchEnabled ?
            <>
              <h3
                style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  margin: '0 0 0.45rem',
                  letterSpacing: '-0.02em',
                }}
              >
                {p.matchDetailRegistrationPrematchHeading}
              </h3>
              {prematchMetrics.length === 0 ?
                <p style={{ margin: '0 0 1rem', fontSize: '0.92rem' }}>{p.matchDetailRegistrationPrematchEmpty}</p>
              : <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
                  <table style={{ borderCollapse: 'collapse', fontSize: '0.92rem', width: '100%' }}>
                    <thead>
                      <tr>
                        <th
                          scope="col"
                          style={{ padding: '0.5rem 0.55rem', textAlign: 'left', borderBottom: '1px solid var(--border)' }}
                        >
                          {p.matchDetailRegistrationColSquad}
                        </th>
                        <th
                          scope="col"
                          style={{ padding: '0.5rem 0.55rem', textAlign: 'left', borderBottom: '1px solid var(--border)' }}
                        >
                          {p.matchDetailRegistrationColFree}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {prematchMetrics.map((r) => {
                        const cap = Number(r.capacity)
                        const tk = num(r.squad_taken)
                        const free = Math.max(0, cap - tk)
                        const fullRow = free <= 0
                        return (
                          <tr key={r.squad_id}>
                            <td style={{ padding: '0.5rem 0.55rem', borderBottom: '1px solid var(--border)' }}>
                              {r.squad_label}
                            </td>
                            <td style={{ padding: '0.5rem 0.55rem', borderBottom: '1px solid var(--border)' }}>
                              {fullRow ? p.matchDetailRegistrationFull : `${free} / ${cap}`}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              }

              <h3
                style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  margin: '0.35rem 0 0.45rem',
                  letterSpacing: '-0.02em',
                }}
              >
                {p.matchDetailRegistrationMainHeading}
              </h3>
              {mainMetrics.length === 0 ?
                <p style={{ margin: '0 0 1rem', fontSize: '0.92rem' }}>{p.matchDetailRegistrationMainEmpty}</p>
              : <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
                  <table style={{ borderCollapse: 'collapse', fontSize: '0.92rem', width: '100%' }}>
                    <thead>
                      <tr>
                        <th
                          scope="col"
                          style={{ padding: '0.5rem 0.55rem', textAlign: 'left', borderBottom: '1px solid var(--border)' }}
                        >
                          {p.matchDetailRegistrationColSquad}
                        </th>
                        <th
                          scope="col"
                          style={{ padding: '0.5rem 0.55rem', textAlign: 'left', borderBottom: '1px solid var(--border)' }}
                        >
                          {p.matchDetailRegistrationColFree}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {mainMetrics.map((r) => {
                        const cap = Number(r.capacity)
                        const tk = num(r.squad_taken)
                        const free = Math.max(0, cap - tk)
                        const fullRow = free <= 0
                        return (
                          <tr key={r.squad_id}>
                            <td style={{ padding: '0.5rem 0.55rem', borderBottom: '1px solid var(--border)' }}>
                              {r.squad_label}
                            </td>
                            <td style={{ padding: '0.5rem 0.55rem', borderBottom: '1px solid var(--border)' }}>
                              {fullRow ? p.matchDetailRegistrationFull : `${free} / ${cap}`}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              }
            </>
          : (
            <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
              <table style={{ borderCollapse: 'collapse', fontSize: '0.92rem', width: '100%' }}>
                <thead>
                  <tr>
                    <th
                      scope="col"
                      style={{ padding: '0.5rem 0.55rem', textAlign: 'left', borderBottom: '1px solid var(--border)' }}
                    >
                      {p.matchDetailRegistrationColSquad}
                    </th>
                    <th
                      scope="col"
                      style={{ padding: '0.5rem 0.55rem', textAlign: 'left', borderBottom: '1px solid var(--border)' }}
                    >
                      {p.matchDetailRegistrationColFree}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(metrics ?? []).map((r) => {
                    const cap = Number(r.capacity)
                    const tk = num(r.squad_taken)
                    const free = Math.max(0, cap - tk)
                    const fullRow = free <= 0
                    return (
                      <tr key={r.squad_id}>
                        <td style={{ padding: '0.5rem 0.55rem', borderBottom: '1px solid var(--border)' }}>
                          {r.squad_label}
                        </td>
                        <td style={{ padding: '0.5rem 0.55rem', borderBottom: '1px solid var(--border)' }}>
                          {fullRow ? p.matchDetailRegistrationFull : `${free} / ${cap}`}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {matchFull ?
            <p style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', color: 'var(--text)' }}>
              {p.matchDetailRegistrationMatchFull}
            </p>
          : null}

          {sessionLoading ?
            <p style={{ fontSize: '0.95rem' }}>{p.matchesLoadingDetail}</p>
          : user ?
            <>
              {mine === undefined ?
                <p style={{ fontSize: '0.95rem' }}>{p.matchesLoadingDetail}</p>
              : mine ?
                <>
                  <p style={{ margin: '0 0 0.5rem', fontSize: '0.95rem', lineHeight: 1.55 }}>
                    <strong>{p.matchDetailRegistrationYourStatus}: </strong>
                    <span className={portalMatchRegLabelClass(mine.status)}>
                      {mine.status === 'confirmed' ?
                        p.matchDetailRegistrationStatusConfirmed
                      : mine.status === 'pending' ?
                        p.matchDetailRegistrationStatusPending
                      : mine.status === 'cancelled' ?
                        p.matchDetailRegistrationStatusCancelled
                      : mine.status}
                    </span>
                  </p>
                  {mine.status === 'pending' ?
                    <button type="button" disabled={mineBusy} onClick={() => void cancelMine()}>
                      {mineBusy ? p.matchDetailRegistrationCancelling : p.matchDetailRegistrationCancel}
                    </button>
                  : null}
                </>
              :
                <>
                  {!matchFull ?
                    <form
                      onSubmit={(ev) => void submitRegistration(ev)}
                      style={{
                        marginTop: '0.65rem',
                        display: 'grid',
                        gap: '0.65rem',
                        maxWidth: '22rem',
                        fontSize: '0.93rem',
                      }}
                    >
                      <label style={{ display: 'grid', gap: '0.25rem' }}>
                        {p.matchDetailRegistrationFieldSquad}
                        <select
                          required
                          value={pickedSquad}
                          onChange={(ev) => setPickedSquad(ev.target.value)}
                          disabled={submitBusy}
                          style={{
                            padding: '0.4rem',
                            borderRadius: '6px',
                            border: '1px solid var(--border)',
                          }}
                        >
                          <option value="">{p.matchDetailRegistrationSelectSquad}</option>
                          {metrics.map((r) => {
                            const phaseLabel =
                              phaseOf(r) === 'prematch' ?
                                p.matchDetailRegistrationPhaseShortPrematch
                              : p.matchDetailRegistrationPhaseShortMain
                            return (
                              <option
                                key={r.squad_id}
                                value={r.squad_id}
                                disabled={(spotFreeMap[r.squad_id] ?? 0) <= 0}
                              >
                                [{phaseLabel}] {r.squad_label} ({spotFreeMap[r.squad_id] ?? 0}/{Number(r.capacity)})
                              </option>
                            )
                          })}
                        </select>
                      </label>
                      <label style={{ display: 'grid', gap: '0.25rem' }}>
                        {p.matchDetailRegistrationDivision}
                        <input
                          type="text"
                          value={division}
                          onChange={(e) => setDivision(e.target.value)}
                          disabled={submitBusy}
                          required
                          autoComplete="off"
                        />
                      </label>
                      <label style={{ display: 'grid', gap: '0.25rem' }}>
                        {p.matchDetailRegistrationClass}
                        <input
                          type="text"
                          value={classification}
                          onChange={(e) => setClassification(e.target.value)}
                          disabled={submitBusy}
                          required
                          autoComplete="off"
                        />
                      </label>
                      <label style={{ display: 'grid', gap: '0.25rem' }}>
                        {p.matchDetailRegistrationPFOptional}
                        <select
                          value={powerFactor}
                          onChange={(ev) =>
                            setPowerFactor(ev.target.value === '' ? '' : ev.target.value === 'MAJOR' ? 'MAJOR' : 'MINOR')
                          }
                          disabled={submitBusy}
                          style={{
                            padding: '0.4rem',
                            borderRadius: '6px',
                            border: '1px solid var(--border)',
                            maxWidth: '12rem',
                          }}
                        >
                          <option value="">{p.matchDetailRegistrationPFNone}</option>
                          <option value="MAJOR">{p.matchDetailRegistrationPFMajor}</option>
                          <option value="MINOR">{p.matchDetailRegistrationPFMinor}</option>
                        </select>
                      </label>
                      <button type="submit" disabled={submitBusy}>
                        {submitBusy ? p.matchDetailRegistrationSubmitting : p.matchDetailRegistrationSubmit}
                      </button>
                    </form>
                  : null}

                  {feedback ?
                    <p role="status" style={{ margin: '0.65rem 0 0', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>
                      {feedback}
                    </p>
                  : null}
                </>
              }
            </>
          :
            <>
              <p style={{ margin: '0 0 0.55rem', fontSize: '0.95rem' }}>{p.matchDetailRegistrationSignInIntro}</p>
              <PortalCompactEmailAuth p={p} locale={locale} pathnameForRedirect={pathnameRedirect} />
              {import.meta.env.DEV ?
                <p style={{ margin: '0.55rem 0 0', fontSize: '0.88rem' }}>
                  <Link to={`/${locale}/dev/supabase-auth-smoke`}>{p.myMatchesDevSignInHint}</Link>
                </p>
              : null}
            </>
          }
        </>
      }
    </section>
  )
}
