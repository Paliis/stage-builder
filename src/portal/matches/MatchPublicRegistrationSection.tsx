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
import { useSearchParams } from 'react-router-dom'
import { formatTemplate } from '../../i18n/format'
import { getSupabase, isSupabaseConfigured } from '../../lib/supabaseClient'
import { isValidParticipantPhone } from '../../lib/isValidParticipantPhone'
import { participantDefaultsCompleteForMatchPrefill } from '../../lib/participantDefaultsPrefillGate'
import type { Locale, MessageTree } from '../../i18n/messages'
import { PortalCompactEmailAuth } from '../PortalCompactEmailAuth'
import { useSupabaseSession } from '../useSupabaseSession'
import { getMatchEventKindProfile } from '../../domain/matchEventKindProfile'
import {
  resolveShooterCategoriesForStorage,
  SHOOTER_CATEGORIES,
  parseMatchDiscipline,
  divisionsForWeapon,
  isValidDivisionForWeapon,
} from '../shooterProfileCatalog'
import {
  type RegistrationMetricRow,
  registrationMetricNum,
} from './matchPortalRegistrationMetrics'
import { formatSquadLabelNumberOnly } from './matchPortalSquadDisplay'
import { type ParticipantPaymentOption } from './matchPortalParticipantPayment'
import {
  entryFeeKopForCategories,
  formatEntryFeeKopAsUah,
  type MatchEntryFeesKop,
} from '../../domain/matchEntryFee'
import '../PortalMatchesUi.css'

type Portal = MessageTree['portal']

export type OwnRegistrationRow = {
  id: string
  status: string
  squad_id: string
  division: string
  power_factor?: string | null
  payment_received?: boolean | null
  categories?: unknown
}

type Props = {
  locale: Locale
  matchUuid: string
  matchDiscipline: string
  matchEventKind: string | null
  matchEntryFees: MatchEntryFeesKop | null
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

function participantDefaultsCompleteForSeminarPrefill(row: ParticipantDefaultsRow): boolean {
  const fn = typeof row.first_name === 'string' ? row.first_name.trim() : ''
  const ln = typeof row.last_name === 'string' ? row.last_name.trim() : ''
  const ph = typeof row.phone === 'string' ? row.phone.trim() : ''
  return fn !== '' && ln !== '' && isValidParticipantPhone(ph)
}

function phaseOf(m: RegistrationMetricRow): 'main' | 'prematch' {
  return m.squad_phase === 'prematch' ? 'prematch' : 'main'
}

function num(v: number | string | undefined): number {
  return registrationMetricNum(v)
}

type ParticipantDefaultsRow = {
  division?: string | null
  power_factor?: string | null
  categories?: unknown
  first_name?: string | null
  last_name?: string | null
  phone?: string | null
  region?: string | null
  weapon_class?: string | null
}

const CREATE_PAYMENT_TIMEOUT_MS = 35_000

async function createMatchPayment(
  accessToken: string,
  registrationId: string,
  loc: Locale,
): Promise<
  | { ok: true; pageUrl: string }
  | { ok: false; message: string; kind?: 'timeout' | 'local_dev' | 'not_configured' | 'other' }
> {
  const ac = new AbortController()
  const timer = setTimeout(() => ac.abort(), CREATE_PAYMENT_TIMEOUT_MS)
  let res: Response
  try {
    res = await fetch('/api/create-payment', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ registrationId, locale: loc }),
      signal: ac.signal,
    })
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      return { ok: false, message: 'timeout', kind: 'timeout' }
    }
    return { ok: false, message: e instanceof Error ? e.message : 'network_error', kind: 'other' }
  } finally {
    clearTimeout(timer)
  }
  let data: unknown = null
  try {
    data = await res.json()
  } catch {
    data = null
  }
  if (!res.ok) {
    const err =
      data && typeof data === 'object' && 'error' in data && typeof (data as { error: unknown }).error === 'string' ?
        (data as { error: string }).error
      : `HTTP ${res.status}`
    if (err === 'Organizer payment not configured') {
      return { ok: false, message: 'not_configured', kind: 'not_configured' }
    }
    if (err.includes('VITE_SHARE_PUBLIC_ORIGIN')) {
      return { ok: false, message: err, kind: 'local_dev' }
    }
    return { ok: false, message: err, kind: 'other' }
  }
  const pageUrl =
    data && typeof data === 'object' && 'pageUrl' in data && typeof (data as { pageUrl: unknown }).pageUrl === 'string' ?
      (data as { pageUrl: string }).pageUrl
    : ''
  if (!pageUrl) return { ok: false, message: 'missing_page_url' }
  return { ok: true, pageUrl }
}

export function MatchPublicRegistrationSection({
  locale,
  matchUuid,
  matchDiscipline,
  matchEventKind,
  matchEntryFees,
  p,
  metrics,
  metricsError,
  reloadMetrics,
  mastheadActionsMount = null,
}: Props) {
  const [searchParams, setSearchParams] = useSearchParams()
  const { loading: sessionLoading, user } = useSupabaseSession()
  const sb = useMemo(() => getSupabase(), [])
  const configured = isSupabaseConfigured()
  const pathnameRedirect = `/${locale}/matches/${matchUuid}`

  const eventKindProfile = useMemo(
    () => getMatchEventKindProfile(matchEventKind),
    [matchEventKind],
  )
  const isSeminarMinimal = eventKindProfile.registrationMode === 'seminar_minimal'
  const accountEmail = typeof user?.email === 'string' ? user.email.trim() : ''

  const matchWeaponClassId = parseMatchDiscipline(matchDiscipline) ?? 'shotgun'
  const divisionOptions = isSeminarMinimal ? [] : divisionsForWeapon(matchWeaponClassId)

  const regDialogRef = useRef<HTMLDialogElement>(null)
  const guestAuthDialogRef = useRef<HTMLDialogElement>(null)

  const [mine, setMine] = useState<OwnRegistrationRow | null | undefined>(undefined)

  const [pickedSquad, setPickedSquad] = useState('')
  const [division, setDivision] = useState('')
  const [powerFactor, setPowerFactor] = useState<'MAJOR' | 'MINOR'>('MAJOR')
  const [signupCategories, setSignupCategories] = useState<string[]>([])
  const [cabinetFirstName, setCabinetFirstName] = useState('')
  const [cabinetLastName, setCabinetLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [cabinetRegion, setCabinetRegion] = useState('')
  const [participantPayment, setParticipantPayment] = useState<ParticipantPaymentOption>('bank_transfer')

  const [submitBusy, setSubmitBusy] = useState(false)
  const [mineBusy, setMineBusy] = useState(false)
  const [payOnlineBusy, setPayOnlineBusy] = useState(false)
  const [onlinePaymentAvailable, setOnlinePaymentAvailable] = useState<boolean | undefined>(undefined)
  const [paymentReturnHint, setPaymentReturnHint] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  const defaultsPrefetchKeyRef = useRef<string | null>(null)

  useEffect(() => {
    defaultsPrefetchKeyRef.current = null
    queueMicrotask(() => {
      setMine(undefined)
      setPickedSquad('')
      setDivision('')
      setPowerFactor('MAJOR')
      setSignupCategories([])
      setCabinetFirstName('')
      setCabinetLastName('')
      setPhone('')
      setCabinetRegion('')
      setParticipantPayment('bank_transfer')
      setFeedback(null)
      setOnlinePaymentAvailable(undefined)
    })
  }, [matchUuid])

  useEffect(() => {
    if (!configured || !matchUuid) {
      queueMicrotask(() => setOnlinePaymentAvailable(false))
      return
    }
    let cancelled = false
    void (async () => {
      const { data, error } = await sb.rpc('match_online_payment_available', {
        p_match_id: matchUuid,
      })
      if (cancelled) return
      setOnlinePaymentAvailable(!error && data === true)
    })()
    return () => {
      cancelled = true
    }
  }, [configured, matchUuid, sb])

  const loadMine = useCallback(async () => {
    await Promise.resolve()
    if (!user?.id || !configured) {
      setMine(undefined)
      return
    }
    setMine(undefined)
    const { data, error } = await sb
      .from('match_registrations')
      .select('id, status, squad_id, division, power_factor, payment_received, categories')
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
      isValidDivisionForWeapon(matchWeaponClassId, row.division)
    )
      setDivision(row.division)
    if (row) {
      const pf = typeof row.power_factor === 'string' ? row.power_factor.trim().toUpperCase() : ''
      setPowerFactor(pf === 'MINOR' ? 'MINOR' : 'MAJOR')
    }
  }, [configured, sb, matchUuid, user, p.matchesLoadError, matchWeaponClassId])

  useEffect(() => {
    if (sessionLoading || !configured) return
    queueMicrotask(() => void loadMine())
  }, [configured, loadMine, sessionLoading])

  const paymentReturnHandledRef = useRef(false)
  useEffect(() => {
    if (searchParams.get('payment') !== 'return' || paymentReturnHandledRef.current) return
    paymentReturnHandledRef.current = true
    setPaymentReturnHint(true)
    const next = new URLSearchParams(searchParams)
    next.delete('payment')
    setSearchParams(next, { replace: true })
    if (user?.id && configured) queueMicrotask(() => void loadMine())
  }, [configured, loadMine, searchParams, setSearchParams, user?.id])

  const reconcilePaymentAttemptedRef = useRef<string | null>(null)
  const reconcilePaymentAfterReturn = useCallback(
    async (registrationId: string) => {
      const { data: sessionData } = await sb.auth.getSession()
      const accessToken = sessionData.session?.access_token
      if (!accessToken) return
      try {
        const res = await fetch('/api/payments/reconcile', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ registrationId }),
        })
        if (!res.ok) return
        const data = (await res.json()) as { paid?: boolean }
        if (data.paid) await loadMine()
      } catch {
        /* webhook may still apply */
      }
    },
    [sb, loadMine],
  )

  useEffect(() => {
    if (!configured || !user?.id || !mine?.id || mine.payment_received) return
    if (mine.status !== 'pending') return
    if (reconcilePaymentAttemptedRef.current === mine.id) return
    reconcilePaymentAttemptedRef.current = mine.id
    void (async () => {
      await reconcilePaymentAfterReturn(mine.id)
      await loadMine()
    })()
  }, [
    configured,
    user?.id,
    mine?.id,
    mine?.payment_received,
    mine?.status,
    reconcilePaymentAfterReturn,
    loadMine,
  ])

  const myCategories = useMemo(
    () => normalizeParticipantCategories(mine?.categories),
    [mine?.categories],
  )

  const myEntryFeeKop = useMemo(() => {
    if (!matchEntryFees) return null
    return entryFeeKopForCategories(matchEntryFees, myCategories)
  }, [matchEntryFees, myCategories])

  const startPayOnline = useCallback(async () => {
    if (!mine?.id || payOnlineBusy) return
    const { data: sessionData } = await sb.auth.getSession()
    const accessToken = sessionData.session?.access_token
    if (!accessToken) {
      setFeedback(p.matchDetailRegistrationSignInIntro)
      return
    }
    setPayOnlineBusy(true)
    setFeedback(null)
    try {
      const result = await createMatchPayment(accessToken, mine.id, locale)
      if (!result.ok) {
        setFeedback(
          result.kind === 'not_configured' ? p.matchDetailPayOnlineNotConfigured
          : result.kind === 'timeout' ? p.matchDetailPayOnlineTimeout
          : result.kind === 'local_dev' ? p.matchDetailPayOnlineLocalDevHint
          : `${p.matchDetailPayOnlineError}: ${result.message}`,
        )
        return
      }
      window.location.assign(result.pageUrl)
    } catch (e) {
      setFeedback(
        `${p.matchDetailPayOnlineError}: ${e instanceof Error ? e.message : 'unknown'}`,
      )
    } finally {
      setPayOnlineBusy(false)
    }
  }, [locale, mine?.id, payOnlineBusy, p, sb])

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
      return isValidDivisionForWeapon(matchWeaponClassId, divRaw) ?
          divRaw
        : ''
    })
    setPowerFactor(() => {
      const raw =
        typeof row.power_factor === 'string' ?
          row.power_factor.trim().toUpperCase()
        : ''
      if (raw === 'MINOR') return 'MINOR'
      return 'MAJOR'
    })
    setSignupCategories((prev) => {
      if (prev.length > 0) return prev
      return normalizeParticipantCategories(row.categories)
    })
  }, [matchWeaponClassId])

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
          'division, power_factor, categories, first_name, last_name, phone, region, weapon_class',
        )
        .eq('user_id', user.id)
        .maybeSingle()

      if (defaultsPrefetchKeyRef.current !== pendingKey) return
      if (error || !data) return
      if (!participantDefaultsCompleteForMatchPrefill(data as ParticipantDefaultsRow, matchWeaponClassId))
        return

      applyParticipantDefaultsRow(data as ParticipantDefaultsRow)
    })()
  }, [
    applyParticipantDefaultsRow,
    configured,
    sessionLoading,
    user?.id,
    mine,
    matchUuid,
    matchWeaponClassId,
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
            'division, power_factor, categories, first_name, last_name, phone, region, weapon_class',
          )
          .eq('user_id', user.id)
          .maybeSingle()
        if (
          !error &&
          data &&
          (isSeminarMinimal ?
            participantDefaultsCompleteForSeminarPrefill(data as ParticipantDefaultsRow)
          : participantDefaultsCompleteForMatchPrefill(
              data as ParticipantDefaultsRow,
              matchWeaponClassId,
            ))
        )
          applyParticipantDefaultsRow(data as ParticipantDefaultsRow)
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

    const squadId = pickedSquad || firstOpenSquad || ''
    const free = squadId ? (spotFreeMap[squadId] ?? 0) : 0
    if (!squadId || free <= 0) {
      setFeedback(p.matchDetailRegistrationPickOpenSquad)
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

    const regionTrim = cabinetRegion.trim()
    if (isSeminarMinimal && !regionTrim) {
      setFeedback(p.matchDetailRegistrationRegionRequired)
      return
    }

    if (!isSeminarMinimal) {
      if (
        !division.trim() ||
        !isValidDivisionForWeapon(matchWeaponClassId, division.trim())
      ) {
        setFeedback(p.matchDetailRegistrationChooseDivision)
        return
      }
      if (signupCategories.length === 0) {
        setFeedback(p.matchDetailRegistrationCategoryRequired)
        return
      }
    }

    const div = isSeminarMinimal ? '' : division.trim()
    const storedCategories = isSeminarMinimal ? [] : resolveShooterCategoriesForStorage(signupCategories)
    const staleCancelledRegistrationId = mine?.status === 'cancelled' ? mine.id : null

    const rowPayload = {
      division: div,
      classification_grade: '',
      phone: phoneTrim,
      competitor_region: regionTrim,
      power_factor: isSeminarMinimal ? 'MAJOR' : powerFactor,
      categories: storedCategories,
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
        squad_id: squadId,
        competitor_user_id: user.id,
        ...rowPayload,
      })
      if (error) {
        setFeedback(`${p.matchDetailRegistrationErrorPrefix}: ${error.message}`)
        await refreshAll()
        return
      }

      // Separate upserts: a ternary union breaks Supabase Insert excess-property checks.
      const { error: defErr } =
        isSeminarMinimal ?
          await sb.from('participant_registration_defaults').upsert(
            {
              user_id: user.id,
              first_name: firstNameTrim,
              last_name: lastNameTrim,
              phone: phoneTrim,
              region: regionTrim,
            },
            { onConflict: 'user_id' },
          )
        : await sb.from('participant_registration_defaults').upsert(
            {
              user_id: user.id,
              first_name: firstNameTrim,
              last_name: lastNameTrim,
              division: div,
              classification_grade: '',
              phone: phoneTrim,
              region: regionTrim,
              weapon_class: matchWeaponClassId,
              categories: storedCategories,
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

  async function withdrawMine() {
    if (!mine || !user?.id) return
    if (mine.status !== 'pending' && mine.status !== 'confirmed') return
    setMineBusy(true)
    setFeedback(null)
    const { data: ok, error } = await sb.rpc('withdraw_my_match_registration', {
      p_registration_id: mine.id,
    })
    setMineBusy(false)
    if (error) {
      setFeedback(`${p.matchDetailRegistrationErrorPrefix}: ${error.message}`)
      return
    }
    if (!ok) {
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
                    required={isSeminarMinimal}
                    value={cabinetRegion}
                    onChange={(e) => setCabinetRegion(e.target.value)}
                    disabled={submitBusy}
                    autoComplete="address-level1"
                    placeholder={p.accountParticipantFieldRegionPlaceholder}
                    className="portal-reg-modal__control"
                  />
                </label>
              </div>
              {isSeminarMinimal && accountEmail ?
                <label className="portal-reg-modal__label">
                  {p.matchDetailRegistrationAccountEmail}
                  <input
                    type="email"
                    readOnly
                    value={accountEmail}
                    disabled
                    className="portal-reg-modal__control portal-reg-modal__control--readonly"
                  />
                </label>
              : null}
            </section>

            {!isSeminarMinimal ?
              <>
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

            <fieldset className="portal-reg-modal__categories" aria-required="true">
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
              </>
            : null}

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
  const showWithdrawTools = Boolean(
    user &&
      !sessionLoading &&
      (mine?.status === 'pending' || mine?.status === 'confirmed'),
  )
  const minePaid = mine?.payment_received === true
  const showPayOnline =
    Boolean(user) &&
    !sessionLoading &&
    showWithdrawTools &&
    !minePaid &&
    onlinePaymentAvailable === true &&
    myEntryFeeKop != null &&
    myEntryFeeKop >= 100
  const showCancelledNote = Boolean(user && !sessionLoading && mine?.status === 'cancelled')

  const showMastheadUi =
    showGuestRegisterCta ||
    showRegisterCta ||
    showWithdrawTools ||
    showPayOnline ||
    showCancelledNote ||
    paymentReturnHint ||
    (showWithdrawTools && minePaid)

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

      {paymentReturnHint ?
        <p className="portal-reg-inline-meta portal-reg-inline-meta--hint">{p.matchDetailPayOnlineReturnHint}</p>
      : null}

      {showWithdrawTools ?
        <>
          <p className="portal-reg-inline-meta">
            <strong>{p.matchDetailRegistrationYourStatus}: </strong>
            {mine?.status === 'confirmed' ?
              p.matchDetailRegistrationStatusConfirmed
            : p.matchDetailRegistrationStatusPending}
            {minePaid ?
              <>
                {' · '}
                <span className="portal-reg-paid-badge">{p.matchDetailPayOnlinePaidBadge}</span>
              </>
            : null}
          </p>
          {showPayOnline ?
            <button
              type="button"
              className="portal-btn portal-btn--primary portal-btn--compact portal-match-public-detail__masthead-cta"
              disabled={payOnlineBusy || mineBusy}
              onClick={() => void startPayOnline()}
            >
              {payOnlineBusy ?
                p.matchDetailPayOnlineBusy
              : formatTemplate(p.matchDetailPayOnlineCta, {
                  amount: (() => {
                    const uah = formatEntryFeeKopAsUah(myEntryFeeKop)
                    return uah ? ` (${uah} ₴)` : ''
                  })(),
                })}
            </button>
          : null}
          <button
            type="button"
            className="portal-btn portal-btn--secondary portal-btn--compact"
            disabled={mineBusy}
            onClick={() => void withdrawMine()}
          >
            {mineBusy ?
              mine?.status === 'confirmed' ?
                p.matchDetailRegistrationWithdrawing
              : p.matchDetailRegistrationCancelling
            : mine?.status === 'confirmed' ?
              p.matchDetailRegistrationWithdraw
            : p.matchDetailRegistrationCancel}
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
