import {
  type FormEvent,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Link } from 'react-router-dom'
import { getSupabase, isSupabaseConfigured } from '../../lib/supabaseClient'
import type { Locale, MessageTree } from '../../i18n/messages'
import { PortalCompactEmailAuth } from '../PortalCompactEmailAuth'
import { useSupabaseSession } from '../useSupabaseSession'
import {
  type WeaponClassId,
  resolveShooterCategoriesForStorage,
  SHOOTER_CATEGORIES,
  WEAPON_CLASS_ORDER,
  divisionsForWeapon,
  isValidDivisionForWeapon,
} from '../shooterProfileCatalog'
import {
  type RegistrationMetricRow,
  registrationMetricNum,
} from './matchPortalRegistrationMetrics'
import { portalMatchRegLabelClass } from './matchPortalRegStatusUi'
import { formatSquadLabelNumberOnly } from './matchPortalSquadDisplay'
import '../PortalMatchesUi.css'

type Portal = MessageTree['portal']

export type OwnRegistrationRow = {
  id: string
  status: string
  squad_id: string
  division: string
  classification_grade: string
  power_factor?: string | null
}

type Props = {
  locale: Locale
  matchUuid: string
  matchDiscipline: string
  p: Portal
  prematchEnabled: boolean
  metrics: RegistrationMetricRow[] | undefined
  metricsError: string | null
  reloadMetrics: () => Promise<void>
}

const SHOOTER_CATEGORY_IDS = new Set(SHOOTER_CATEGORIES.map((c) => c.id))

function normalizeParticipantCategories(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((x): x is string => typeof x === 'string' && SHOOTER_CATEGORY_IDS.has(x))
}

function phaseOf(m: RegistrationMetricRow): 'main' | 'prematch' {
  return m.squad_phase === 'prematch' ? 'prematch' : 'main'
}

function num(v: number | string | undefined): number {
  return registrationMetricNum(v)
}

function weaponClassForMatchDiscipline(raw: string): WeaponClassId {
  const t = raw.trim()
  return (WEAPON_CLASS_ORDER as readonly string[]).includes(t) ? (t as WeaponClassId) : 'shotgun'
}

function SquadFreeTable(props: {
  rows: RegistrationMetricRow[]
  colSquad: string
  colFree: string
  fullLabel: string
}) {
  const { rows, colSquad, colFree, fullLabel } = props
  if (rows.length === 0) return null
  return (
    <div className="portal-reg-table-wrap">
      <table className="portal-reg-table">
        <thead>
          <tr>
            <th scope="col">{colSquad}</th>
            <th scope="col">{colFree}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const cap = Number(r.capacity)
            const tk = num(r.squad_taken)
            const free = Math.max(0, cap - tk)
            const fullRow = free <= 0
            return (
              <tr key={r.squad_id}>
                <td title={r.squad_label}>{formatSquadLabelNumberOnly(r.squad_label)}</td>
                <td>{fullRow ? fullLabel : `${free} / ${cap}`}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export function MatchPublicRegistrationSection({
  locale,
  matchUuid,
  matchDiscipline,
  p,
  prematchEnabled,
  metrics,
  metricsError,
  reloadMetrics,
}: Props) {
  const { loading: sessionLoading, user } = useSupabaseSession()
  const sb = useMemo(() => getSupabase(), [])
  const configured = isSupabaseConfigured()
  const pathnameRedirect = `/${locale}/matches/${matchUuid}`

  const matchWeaponClassId = weaponClassForMatchDiscipline(matchDiscipline)
  const divisionOptions = divisionsForWeapon(matchWeaponClassId)

  const regDialogRef = useRef<HTMLDialogElement>(null)

  const [mine, setMine] = useState<OwnRegistrationRow | null | undefined>(undefined)

  const [pickedSquad, setPickedSquad] = useState('')
  const [division, setDivision] = useState('')
  const [classification, setClassification] = useState('')
  const [powerFactor, setPowerFactor] = useState<'MAJOR' | 'MINOR' | ''>('')
  const [signupCategories, setSignupCategories] = useState<string[]>([])

  const [submitBusy, setSubmitBusy] = useState(false)
  const [mineBusy, setMineBusy] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  const defaultsPrefetchKeyRef = useRef<string | null>(null)

  useEffect(() => {
    defaultsPrefetchKeyRef.current = null
    queueMicrotask(() => {
      setMine(undefined)
      setPickedSquad('')
      setDivision('')
      setClassification('')
      setPowerFactor('')
      setSignupCategories([])
      setFeedback(null)
    })
  }, [matchUuid])

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
      defaultsPrefetchKeyRef.current = null
      setMine(null)
      setFeedback(`${p.matchesLoadError}: ${error.message}`)
      return
    }
    const row = data as OwnRegistrationRow | null
    if (!row) defaultsPrefetchKeyRef.current = null
    setMine(row)
    setFeedback(null)
    if (row?.squad_id) setPickedSquad(row.squad_id)
    if (row?.division && isValidDivisionForWeapon(matchWeaponClassId, row.division))
      setDivision(row.division)
    if (row?.classification_grade) setClassification(row.classification_grade)
    if (row?.power_factor) {
      const pf = typeof row.power_factor === 'string' ? row.power_factor.trim().toUpperCase() : ''
      setPowerFactor(pf === 'MAJOR' ? 'MAJOR' : pf === 'MINOR' ? 'MINOR' : '')
    }
  }, [configured, sb, matchUuid, user, p.matchesLoadError, matchWeaponClassId])

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
        .select('division, classification_grade, power_factor, categories')
        .eq('user_id', user.id)
        .maybeSingle()

      if (defaultsPrefetchKeyRef.current !== pendingKey) return
      if (error || !data) return

      const row = data as {
        division?: string | null
        classification_grade?: string | null
        power_factor?: string | null
        categories?: unknown
      }

      setDivision((d) => {
        const t = d.trim()
        if (t) return d
        const divRaw = typeof row.division === 'string' ? row.division : ''
        return isValidDivisionForWeapon(matchWeaponClassId, divRaw) ? divRaw : ''
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
      setSignupCategories((prev) => {
        if (prev.length > 0) return prev
        return normalizeParticipantCategories(row.categories)
      })
    })()
  }, [
    configured,
    sessionLoading,
    user?.id,
    mine,
    matchUuid,
    sb,
    matchWeaponClassId,
  ])

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

  const prematchMetrics = useMemo(
    () => (metrics ?? []).filter((r) => phaseOf(r) === 'prematch'),
    [metrics],
  )

  const mainMetrics = useMemo(() => (metrics ?? []).filter((r) => phaseOf(r) === 'main'), [metrics])

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
    await reloadMetrics()
    await loadMine()
  }

  function openRegistrationModal() {
    if (!user?.id || metrics === undefined || metrics.length === 0 || matchFull) return
    setFeedback(null)
    if (!pickedSquad && firstOpenSquad) setPickedSquad(firstOpenSquad)
    regDialogRef.current?.showModal()
  }

  function closeRegistrationModal() {
    regDialogRef.current?.close()
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
    if (!division.trim() || !isValidDivisionForWeapon(matchWeaponClassId, division.trim())) {
      setFeedback(p.matchDetailRegistrationChooseDivision)
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
      categories: resolveShooterCategoriesForStorage(signupCategories),
    })
    setSubmitBusy(false)

    if (error) {
      setFeedback(`${p.matchDetailRegistrationErrorPrefix}: ${error.message}`)
      return
    }

    closeRegistrationModal()
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
      <section className="portal-match-public-detail__section portal-reg-root" aria-labelledby="match-reg-heading">
        <p>{p.matchesSupabaseUnset}</p>
      </section>
    )
  }

  function renderRegistrationModal(dlgRef: RefObject<HTMLDialogElement | null>) {
    if (!metrics?.length) return null
    return (
      <dialog ref={dlgRef} className="portal-reg-modal" aria-labelledby="match-reg-modal-heading">
        <div className="portal-reg-modal__panel">
          <h3 id="match-reg-modal-heading" className="portal-reg-modal__title">
            {p.matchDetailRegistrationModalTitle}
          </h3>
          <p className="portal-reg-modal__prefill">
            {p.matchDetailRegistrationModalPrefillNote}{' '}
            <Link to={`/${locale}/account`} className="portal-reg-modal__profile-link">
              {p.matchDetailRegistrationModalProfileLink}
            </Link>
          </p>
          <form
            className="portal-reg-modal__form"
            onSubmit={(ev) => void submitRegistration(ev)}
          >
            <label className="portal-reg-modal__label">
              {p.matchDetailRegistrationFieldSquad}
              <select
                required
                value={pickedSquad}
                onChange={(ev) => setPickedSquad(ev.target.value)}
                disabled={submitBusy}
                className="portal-reg-modal__control portal-reg-modal__select"
              >
                <option value="">{p.matchDetailRegistrationSelectSquad}</option>
                {(metrics ?? []).map((r) => {
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
                      [{phaseLabel}] {formatSquadLabelNumberOnly(r.squad_label)} (
                      {spotFreeMap[r.squad_id] ?? 0}/{Number(r.capacity)})
                    </option>
                  )
                })}
              </select>
            </label>

            <label className="portal-reg-modal__label">
              {p.matchDetailRegistrationDivision}
              <select
                required
                value={division}
                onChange={(e) => setDivision(e.target.value)}
                disabled={submitBusy || divisionOptions.length === 0}
                className="portal-reg-modal__control portal-reg-modal__select"
              >
                <option value="">{p.accountParticipantOptionNotSelected}</option>
                {divisionOptions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {locale === 'en' ? d.labelEn : d.labelUk}
                  </option>
                ))}
              </select>
            </label>

            <label className="portal-reg-modal__label">
              {p.matchDetailRegistrationClass}
              <input
                type="text"
                value={classification}
                onChange={(e) => setClassification(e.target.value)}
                disabled={submitBusy}
                required
                autoComplete="off"
                className="portal-reg-modal__control"
              />
            </label>

            <fieldset className="portal-reg-modal__categories">
              <legend className="portal-reg-modal__categories-legend">{p.accountParticipantFieldCategory}</legend>
              <div className="portal-reg-modal__cat-grid" role="group">
                {SHOOTER_CATEGORIES.map((c) => {
                  const checked = signupCategories.includes(c.id)
                  const lab = locale === 'en' ? c.labelEn : c.labelUk
                  return (
                    <label key={c.id} className="portal-reg-modal__check">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={submitBusy}
                        onChange={(e) => {
                          const next = e.target.checked
                          setSignupCategories((prev) => {
                            if (next) return [...prev, c.id].filter((x, i, a) => a.indexOf(x) === i)
                            return prev.filter((id) => id !== c.id)
                          })
                        }}
                      />
                      <span>{lab}</span>
                    </label>
                  )
                })}
              </div>
            </fieldset>

            <label className="portal-reg-modal__label">
              {p.matchDetailRegistrationPFOptional}
              <select
                value={powerFactor}
                onChange={(ev) =>
                  setPowerFactor(ev.target.value === '' ? '' : ev.target.value === 'MAJOR' ? 'MAJOR' : 'MINOR')
                }
                disabled={submitBusy}
                className="portal-reg-modal__control portal-reg-modal__select portal-reg-modal__select--narrow"
              >
                <option value="">{p.matchDetailRegistrationPFNone}</option>
                <option value="MAJOR">{p.matchDetailRegistrationPFMajor}</option>
                <option value="MINOR">{p.matchDetailRegistrationPFMinor}</option>
              </select>
            </label>

            <div className="portal-reg-modal__actions">
              <button type="button" className="portal-btn portal-btn--secondary" disabled={submitBusy} onClick={closeRegistrationModal}>
                {p.matchDetailRegistrationModalClose}
              </button>
              <button type="submit" className="portal-btn portal-btn--primary" disabled={submitBusy}>
                {submitBusy ? p.matchDetailRegistrationSubmitting : p.matchDetailRegistrationSubmit}
              </button>
            </div>
          </form>
        </div>
      </dialog>
    )
  }

  return (
    <>
      {renderRegistrationModal(regDialogRef)}
      <section
        className="portal-match-public-detail__section portal-reg-root"
        aria-labelledby="match-reg-heading"
      >
        <h2 id="match-reg-heading" className="portal-match-public-detail__section-title">
          {p.matchDetailRegistrationHeading}
        </h2>

        {metricsError ?
          <p role="alert" className="portal-match-public-detail__muted">
            {p.matchesLoadError}: {metricsError}
          </p>
        : metrics === undefined ?
          <p className="portal-match-public-detail__muted">{p.matchesLoadingDetail}</p>
        : metrics.length === 0 ?
          <p className="portal-match-public-detail__prose">{p.matchDetailRegistrationNoSquads}</p>
        : <>
            {prematchEnabled ?
              <>
                <h3 className="portal-reg-phase-subtitle">{p.matchDetailRegistrationPrematchHeading}</h3>
                {prematchMetrics.length === 0 ?
                  <p className="portal-reg-phase-empty">{p.matchDetailRegistrationPrematchEmpty}</p>
                : <SquadFreeTable
                    rows={prematchMetrics}
                    colSquad={p.matchDetailRegistrationColSquad}
                    colFree={p.matchDetailRegistrationColFree}
                    fullLabel={p.matchDetailRegistrationFull}
                  />}

                <h3 className="portal-reg-phase-subtitle">{p.matchDetailRegistrationMainHeading}</h3>
                {mainMetrics.length === 0 ?
                  <p className="portal-reg-phase-empty">{p.matchDetailRegistrationMainEmpty}</p>
                : <SquadFreeTable
                    rows={mainMetrics}
                    colSquad={p.matchDetailRegistrationColSquad}
                    colFree={p.matchDetailRegistrationColFree}
                    fullLabel={p.matchDetailRegistrationFull}
                  />}
              </>
            : <SquadFreeTable
                rows={metrics}
                colSquad={p.matchDetailRegistrationColSquad}
                colFree={p.matchDetailRegistrationColFree}
                fullLabel={p.matchDetailRegistrationFull}
              />}

            {matchFull ?
              <p className="portal-match-public-detail__prose">{p.matchDetailRegistrationMatchFull}</p>
            : null}

            {sessionLoading ?
              <p className="portal-match-public-detail__muted">{p.matchesLoadingDetail}</p>
            : user ?
              <>
                {mine === undefined ?
                  <p className="portal-match-public-detail__muted">{p.matchesLoadingDetail}</p>
                : mine ?
                  <>
                    <p className="portal-reg-status-line">
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
                      <button
                        type="button"
                        className="portal-btn portal-btn--secondary portal-btn--compact"
                        disabled={mineBusy}
                        onClick={() => void cancelMine()}
                      >
                        {mineBusy ? p.matchDetailRegistrationCancelling : p.matchDetailRegistrationCancel}
                      </button>
                    : null}
                  </>
                : !matchFull ?
                  <button
                    type="button"
                    className="portal-btn portal-btn--primary portal-reg-cta"
                    onClick={openRegistrationModal}
                  >
                    {p.matchDetailRegistrationCta}
                  </button>
                : null}

                {feedback ?
                  <p role="status" className="portal-reg-feedback">
                    {feedback}
                  </p>
                : null}
              </>
            :
              <>
                <p className="portal-match-public-detail__prose">{p.matchDetailRegistrationSignInIntro}</p>
                <PortalCompactEmailAuth p={p} locale={locale} pathnameForRedirect={pathnameRedirect} />
                {import.meta.env.DEV ?
                  <p className="portal-reg-dev-auth-hint">
                    <Link to={`/${locale}/dev/supabase-auth-smoke`}>{p.myMatchesDevSignInHint}</Link>
                  </p>
                : null}
              </>
            }
          </>
        }
      </section>
    </>
  )
}
