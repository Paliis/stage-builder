import {
  type FormEvent,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { getSupabase, isSupabaseConfigured } from '../../lib/supabaseClient'
import { isValidParticipantPhone } from '../../lib/isValidParticipantPhone'
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
import { formatSquadLabelNumberOnly } from './matchPortalSquadDisplay'
import { type ParticipantPaymentOption } from './matchPortalParticipantPayment'
import '../PortalMatchesUi.css'

type Portal = MessageTree['portal']

export type OwnRegistrationRow = {
  id: string
  status: string
  squad_id: string
  division: string
  power_factor?: string | null
}

type Props = {
  locale: Locale
  matchUuid: string
  matchDiscipline: string
  p: Portal
  metrics: RegistrationMetricRow[] | undefined
  metricsError: string | null
  reloadMetrics: () => Promise<void>
  mastheadActionsMount?: HTMLElement | null
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

type ParticipantDefaultsRow = {
  division?: string | null
  power_factor?: string | null
  categories?: unknown
  first_name?: string | null
  last_name?: string | null
  phone?: string | null
  region?: string | null
}

export function MatchPublicRegistrationSection({
  locale,
  matchUuid,
  matchDiscipline,
  p,
  metrics,
  metricsError,
  reloadMetrics,
  mastheadActionsMount = null,
}: Props) {
  const { loading: sessionLoading, user } = useSupabaseSession()
  const sb = useMemo(() => getSupabase(), [])
  const configured = isSupabaseConfigured()
  const pathnameRedirect = `/${locale}/matches/${matchUuid}`

  const matchWeaponClassId = weaponClassForMatchDiscipline(matchDiscipline)
  const divisionOptions = divisionsForWeapon(matchWeaponClassId)

  const regDialogRef = useRef<HTMLDialogElement>(null)
  const guestAuthDialogRef = useRef<HTMLDialogElement>(null)

  const [mine, setMine] = useState<OwnRegistrationRow | null | undefined>(undefined)

  const [pickedSquad, setPickedSquad] = useState('')
  const [division, setDivision] = useState('')
  const [powerFactor, setPowerFactor] = useState<'MAJOR' | 'MINOR'>('MINOR')
  const [signupCategories, setSignupCategories] = useState<string[]>([])
  const [cabinetFirstName, setCabinetFirstName] = useState('')
  const [cabinetLastName, setCabinetLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [cabinetRegion, setCabinetRegion] = useState('')
  const [participantPayment, setParticipantPayment] = useState<ParticipantPaymentOption>('bank_transfer')

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
      setPowerFactor('MINOR')
      setSignupCategories([])
      setCabinetFirstName('')
      setCabinetLastName('')
      setPhone('')
      setCabinetRegion('')
      setParticipantPayment('bank_transfer')
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
      .select('id, status, squad_id, division, power_factor')
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
    if (
      row?.division &&
      isValidDivisionForWeapon(weaponClassForMatchDiscipline(matchDiscipline), row.division)
    )
      setDivision(row.division)
    if (row) {
      const pf = typeof row.power_factor === 'string' ? row.power_factor.trim().toUpperCase() : ''
      setPowerFactor(pf === 'MAJOR' ? 'MAJOR' : 'MINOR')
    }
  }, [configured, sb, matchUuid, user, p.matchesLoadError, matchDiscipline])

  useEffect(() => {
    if (sessionLoading || !configured) return
    queueMicrotask(() => void loadMine())
  }, [configured, loadMine, sessionLoading])

  const applyParticipantDefaultsRow = useCallback((row: ParticipantDefaultsRow) => {
    setCabinetFirstName(typeof row.first_name === 'string' ? row.first_name : '')
    setCabinetLastName(typeof row.last_name === 'string' ? row.last_name : '')
    setCabinetRegion(typeof row.region === 'string' ? row.region : '')

    setPhone((prev) => {
      if (prev.trim()) return prev
      return typeof row.phone === 'string' ? row.phone : ''
    })

    setDivision((d) => {
      const t = d.trim()
      if (t) return d
      const divRaw = typeof row.division === 'string' ? row.division : ''
      return isValidDivisionForWeapon(weaponClassForMatchDiscipline(matchDiscipline), divRaw) ?
          divRaw
        : ''
    })
    setPowerFactor((prev) => {
      const raw =
        typeof row.power_factor === 'string' ?
          row.power_factor.trim().toUpperCase()
        : ''
      if (raw === 'MAJOR') return 'MAJOR'
      if (raw === 'MINOR') return 'MINOR'
      return prev
    })
    setSignupCategories((prev) => {
      if (prev.length > 0) return prev
      return normalizeParticipantCategories(row.categories)
    })
  }, [matchDiscipline])

  useEffect(() => {
    if (!configured || sessionLoading || !user?.id) return
    if (mine === undefined) return
    if (mine?.status === 'pending' || mine?.status === 'confirmed') return

    const pendingKey = `${matchUuid}:${user.id}`
    if (defaultsPrefetchKeyRef.current === pendingKey) return
    defaultsPrefetchKeyRef.current = pendingKey

    void (async () => {
      const { data, error } = await sb
        .from('participant_registration_defaults')
        .select(
          'division, power_factor, categories, first_name, last_name, phone, region',
        )
        .eq('user_id', user.id)
        .maybeSingle()

      if (defaultsPrefetchKeyRef.current !== pendingKey) return
      if (error || !data) return

      applyParticipantDefaultsRow(data as ParticipantDefaultsRow)
    })()
  }, [
    applyParticipantDefaultsRow,
    configured,
    sessionLoading,
    user?.id,
    mine,
    matchUuid,
    sb,
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
    if (configured) {
      void (async () => {
        const { data, error } = await sb
          .from('participant_registration_defaults')
          .select(
            'division, power_factor, categories, first_name, last_name, phone, region',
          )
          .eq('user_id', user.id)
          .maybeSingle()
        if (!error && data) applyParticipantDefaultsRow(data as ParticipantDefaultsRow)
      })()
    }
  }

  function closeRegistrationModal() {
    regDialogRef.current?.close()
  }

  const closeGuestAuthModal = useCallback(() => {
    guestAuthDialogRef.current?.close()
  }, [])

  const openGuestAuthModal = useCallback(() => {
    setFeedback(null)
    guestAuthDialogRef.current?.showModal()
  }, [])

  useEffect(() => {
    if (sessionLoading || !user?.id) return
    guestAuthDialogRef.current?.close()
  }, [sessionLoading, user?.id])

  function renderGuestAuthModal(dlgRef: RefObject<HTMLDialogElement | null>) {
    if (!configured) return null
    return (
      <dialog
        ref={dlgRef}
        className="portal-reg-modal portal-reg-modal--guest-auth"
        aria-labelledby="match-guest-auth-heading"
      >
        <div className="portal-reg-modal__panel">
          <h3 id="match-guest-auth-heading" className="portal-reg-modal__title">
            {p.matchDetailGuestAuthModalTitle}
          </h3>
          <p className="portal-match-public-detail__prose portal-reg-modal__guest-auth-lead">
            {p.matchDetailRegistrationSignInIntro}
          </p>
          <PortalCompactEmailAuth
            p={p}
            locale={locale}
            pathnameForRedirect={pathnameRedirect}
            defaultAuthMode="signup"
          />
          <div className="portal-reg-modal__actions portal-reg-modal__actions--guest-auth-footer">
            <button type="button" className="portal-btn portal-btn--secondary" onClick={closeGuestAuthModal}>
              {p.matchDetailRegistrationModalClose}
            </button>
          </div>
        </div>
      </dialog>
    )
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
    if (
      !division.trim() ||
      !isValidDivisionForWeapon(weaponClassForMatchDiscipline(matchDiscipline), division.trim())
    ) {
      setFeedback(p.matchDetailRegistrationChooseDivision)
      return
    }
    const lastNameTrim = cabinetLastName.trim()
    const firstNameTrim = cabinetFirstName.trim()
    if (!lastNameTrim || !firstNameTrim) {
      setFeedback(p.matchDetailRegistrationNameRequired)
      return
    }
    const phoneTrim = phone.trim()
    if (!isValidParticipantPhone(phoneTrim)) {
      setFeedback(p.matchDetailRegistrationPhoneInvalid)
      return
    }
    const div = division.trim()
    const staleCancelledRegistrationId = mine?.status === 'cancelled' ? mine.id : null

    const rowPayload = {
      division: div,
      classification_grade: '',
      phone: phoneTrim,
      weapon_details: '',
      competitor_region: cabinetRegion.trim(),
      power_factor: powerFactor,
      categories: resolveShooterCategoriesForStorage(signupCategories),
      participant_payment_option: participantPayment,
    }

    setSubmitBusy(true)
    try {
      if (staleCancelledRegistrationId) {
        const { data: removed, error: delErr } = await sb
          .from('match_registrations')
          .delete()
          .eq('id', staleCancelledRegistrationId)
          .eq('competitor_user_id', user.id)
          .eq('status', 'cancelled')
          .select('id')
          .maybeSingle()
        if (delErr) {
          setFeedback(`${p.matchDetailRegistrationErrorPrefix}: ${delErr.message}`)
          return
        }
        if (!removed) {
          setFeedback(p.matchDetailRegistrationReopenFailed)
          await refreshAll()
          return
        }
      }

      const { error } = await sb.from('match_registrations').insert({
        match_id: matchUuid,
        squad_id: pickedSquad,
        competitor_user_id: user.id,
        ...rowPayload,
      })
      if (error) {
        setFeedback(`${p.matchDetailRegistrationErrorPrefix}: ${error.message}`)
        await refreshAll()
        return
      }

      const { error: defErr } = await sb.from('participant_registration_defaults').upsert(
        {
          user_id: user.id,
          first_name: firstNameTrim,
          last_name: lastNameTrim,
          division: div,
          classification_grade: '',
          phone: phoneTrim,
          region: cabinetRegion.trim(),
          weapon_class: matchWeaponClassId,
          categories: resolveShooterCategoriesForStorage(signupCategories),
          power_factor: powerFactor,
        },
        { onConflict: 'user_id' },
      )
      if (defErr) console.warn('participant_registration_defaults upsert:', defErr.message)

      closeRegistrationModal()
      setFeedback(p.matchDetailRegistrationDonePending)
      await refreshAll()
    } finally {
      setSubmitBusy(false)
    }
  }

  async function cancelMine() {
    if (!mine || mine.status !== 'pending' || !user?.id) return
    setMineBusy(true)
    setFeedback(null)
    const { data: deleted, error } = await sb
      .from('match_registrations')
      .delete()
      .eq('id', mine.id)
      .eq('competitor_user_id', user.id)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle()
    setMineBusy(false)
    if (error) {
      setFeedback(`${p.matchDetailRegistrationErrorPrefix}: ${error.message}`)
      return
    }
    if (!deleted) {
      setFeedback(p.matchDetailRegistrationWithdrawFailed)
      await refreshAll()
      return
    }
    await refreshAll()
  }

  function renderRegistrationModal(dlgRef: RefObject<HTMLDialogElement | null>) {
    if (!metrics?.length) return null
    return (
      <dialog ref={dlgRef} className="portal-reg-modal" aria-labelledby="match-reg-modal-heading">
        <div className="portal-reg-modal__panel">
          <h3 id="match-reg-modal-heading" className="portal-reg-modal__title">
            {p.matchDetailRegistrationModalTitle}
          </h3>
          <form
            className="portal-reg-modal__form"
            aria-describedby={feedback ? 'match-reg-modal-alert' : undefined}
            onSubmit={(ev) => void submitRegistration(ev)}
          >
            {feedback ?
              <p id="match-reg-modal-alert" role="alert" className="portal-reg-modal__alert">
                {feedback}
              </p>
            : null}
            <section className="portal-reg-modal__section" aria-label={p.matchDetailRegistrationSectionContact}>
              <h4 className="portal-reg-modal__section-title">{p.matchDetailRegistrationSectionContact}</h4>
              <div className="portal-reg-modal__grid-2">
                <label className="portal-reg-modal__label">
                  {p.accountParticipantFieldLastName}
                  <input
                    type="text"
                    required
                    value={cabinetLastName}
                    onChange={(e) => setCabinetLastName(e.target.value)}
                    disabled={submitBusy}
                    autoComplete="family-name"
                    className="portal-reg-modal__control"
                  />
                </label>
                <label className="portal-reg-modal__label">
                  {p.accountParticipantFieldFirstName}
                  <input
                    type="text"
                    required
                    value={cabinetFirstName}
                    onChange={(e) => setCabinetFirstName(e.target.value)}
                    disabled={submitBusy}
                    autoComplete="given-name"
                    className="portal-reg-modal__control"
                  />
                </label>
              </div>
              <div className="portal-reg-modal__grid-2">
                <label className="portal-reg-modal__label">
                  {p.matchDetailRegistrationPhone}
                  <input
                    type="tel"
                    required
                    maxLength={28}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={submitBusy}
                    autoComplete="tel"
                    className="portal-reg-modal__control"
                  />
                </label>
                <label className="portal-reg-modal__label">
                  {p.accountParticipantFieldRegion}
                  <input
                    type="text"
                    value={cabinetRegion}
                    onChange={(e) => setCabinetRegion(e.target.value)}
                    disabled={submitBusy}
                    autoComplete="address-level1"
                    placeholder={p.accountParticipantFieldRegionPlaceholder}
                    className="portal-reg-modal__control"
                  />
                </label>
              </div>
            </section>

            <section className="portal-reg-modal__section" aria-label={p.matchDetailRegistrationSectionMatch}>
              <h4 className="portal-reg-modal__section-title">{p.matchDetailRegistrationSectionMatch}</h4>
              <div className="portal-reg-modal__grid-2">
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
                  {p.matchDetailRegistrationParticipantPayment}
                  <select
                    required
                    value={participantPayment}
                    onChange={(ev) =>
                      setParticipantPayment(
                        ev.target.value === 'on_site' ? 'on_site' : 'bank_transfer',
                      )
                    }
                    disabled={submitBusy}
                    className="portal-reg-modal__control portal-reg-modal__select"
                  >
                    <option value="bank_transfer">{p.matchDetailRegistrationPaymentBankTransfer}</option>
                    <option value="on_site">{p.matchDetailRegistrationPaymentOnSite}</option>
                  </select>
                </label>
              </div>

              <div className="portal-reg-modal__grid-2">
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
                  {p.matchDetailRegistrationPowerFactor}
                  <select
                    required
                    value={powerFactor}
                    onChange={(ev) =>
                      setPowerFactor(ev.target.value === 'MAJOR' ? 'MAJOR' : 'MINOR')
                    }
                    disabled={submitBusy}
                    className="portal-reg-modal__control portal-reg-modal__select"
                  >
                    <option value="MAJOR">{p.matchDetailRegistrationPFMajor}</option>
                    <option value="MINOR">{p.matchDetailRegistrationPFMinor}</option>
                  </select>
                </label>
              </div>
            </section>

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

  /** Guest sees the same «Зареєструватись» as logged-in shooters when squads exist and capacity allows. */
  const showGuestRegisterCta =
    !sessionLoading &&
    !user &&
    metrics !== undefined &&
    !matchFull &&
    Boolean(metrics?.length)

  const showRegisterCta =
    Boolean(user) &&
    !sessionLoading &&
    mine !== undefined &&
    (mine === null || mine.status === 'cancelled') &&
    !matchFull &&
    Boolean(metrics?.length)
  const showPendingTools = Boolean(user && !sessionLoading && mine?.status === 'pending')
  const showCancelledNote = Boolean(user && !sessionLoading && mine?.status === 'cancelled')
  const showRegisteredMasthead = Boolean(user && !sessionLoading && mine?.status === 'confirmed')

  const showMastheadUi =
    showGuestRegisterCta ||
    showRegisterCta ||
    showPendingTools ||
    showCancelledNote ||
    showRegisteredMasthead

  const showMatchFullNote =
    Boolean(matchFull && metrics && metrics.length > 0 && mine?.status !== 'confirmed')

  const hasAnyInline =
    Boolean(metricsError) ||
    (metrics !== undefined && metrics.length === 0) ||
    showMatchFullNote ||
    (!mastheadActionsMount && showMastheadUi) ||
    Boolean(feedback)

  const mastheadBody = (
    <>
      {showGuestRegisterCta ?
        <>
          <button
            type="button"
            className="portal-btn portal-btn--primary portal-reg-cta portal-match-public-detail__masthead-cta"
            onClick={openGuestAuthModal}
          >
            {p.matchDetailRegistrationCta}
          </button>
        </>
      : null}

      {showPendingTools ?
        <>
          <p className="portal-reg-inline-meta">
            <strong>{p.matchDetailRegistrationYourStatus}: </strong>
            {p.matchDetailRegistrationStatusPending}
          </p>
          <button
            type="button"
            className="portal-btn portal-btn--secondary portal-btn--compact"
            disabled={mineBusy}
            onClick={() => void cancelMine()}
          >
            {mineBusy ? p.matchDetailRegistrationCancelling : p.matchDetailRegistrationCancel}
          </button>
        </>
      : null}

      {showCancelledNote ?
        <p className="portal-reg-inline-meta">
          <strong>{p.matchDetailRegistrationYourStatus}: </strong>
          {p.matchDetailRegistrationStatusCancelled}
        </p>
      : null}

      {showRegisterCta ?
        <button
          type="button"
          className="portal-btn portal-btn--primary portal-reg-cta portal-match-public-detail__masthead-cta"
          onClick={openRegistrationModal}
        >
          {p.matchDetailRegistrationCta}
        </button>
      : null}

      {showRegisteredMasthead ?
        <p className="portal-reg-inline-meta" role="status">
          <strong>{p.matchDetailRegistrationYourStatus}: </strong>
          {p.matchDetailRegistrationMastheadRegistered}
        </p>
      : null}
    </>
  )

  const mastheadPortal =
    mastheadActionsMount && showMastheadUi ?
      createPortal(
        <div className="portal-match-public-detail__masthead-actions-inner">{mastheadBody}</div>,
        mastheadActionsMount,
      )
    : null

  if (!configured) {
    return (
      <>
        {renderRegistrationModal(regDialogRef)}
        {renderGuestAuthModal(guestAuthDialogRef)}
        {mastheadPortal}
        <div className="portal-match-public-detail__surface portal-reg-minimal">
          <p className="portal-match-public-detail__muted">{p.matchesSupabaseUnset}</p>
        </div>
      </>
    )
  }

  if (!hasAnyInline) {
    return (
      <>
        {renderRegistrationModal(regDialogRef)}
        {renderGuestAuthModal(guestAuthDialogRef)}
        {mastheadPortal}
      </>
    )
  }

  return (
    <>
      {renderRegistrationModal(regDialogRef)}
      {renderGuestAuthModal(guestAuthDialogRef)}
      {mastheadPortal}
      <div className="portal-match-public-detail__surface portal-reg-minimal">
        {metricsError ?
          <p role="alert" className="portal-match-public-detail__muted">
            {p.matchesLoadError}: {metricsError}
          </p>
        : null}
        {metrics !== undefined && metrics.length === 0 ?
          <p className="portal-match-public-detail__muted">{p.matchDetailRegistrationNoSquads}</p>
        : null}
        {showMatchFullNote ?
          <p className="portal-match-public-detail__muted">{p.matchDetailRegistrationMatchFull}</p>
        : null}

        {!mastheadActionsMount && showMastheadUi ?
          <div className="portal-match-public-detail__masthead-actions-inner">
            {mastheadBody}
          </div>
        : null}

        {feedback ?
          <p role="status" className="portal-reg-feedback">
            {feedback}
          </p>
        : null}
      </div>
    </>
  )
}
