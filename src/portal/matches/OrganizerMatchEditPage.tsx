import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { Helmet } from 'react-helmet-async'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useI18n } from '../../i18n/useI18n'
import { formatTemplate } from '../../i18n/format'
import { getSupabase, isSupabaseConfigured } from '../../lib/supabaseClient'
import { useSupabaseSession } from '../useSupabaseSession'
import { useOrganizerSelfServiceProfile } from '../useOrganizerSelfServiceProfile'
import { MATCH_ID_UUID_RE } from './matchPortalUuid'
import { OrganizerMatchStagesPanel } from './OrganizerMatchStagesPanel'
import { organizerSquadSyncErrorMessage } from './organizerSquadSyncErrorMessage'
import { OrganizerMatchInactivePanel } from './OrganizerMatchInactivePanel'
import { MatchCoverCropModal } from './MatchCoverCropModal'
import { exportMatchCoverFromFullImage, measureImageNaturalSize } from '../cropPixelsToJpeg'
import { wrapBbCode } from './bbCodeTextareaWrap'
import { isMatchEventKind, isPsMatchLevel } from '../../domain/matchTaxonomy'
import { getMatchEventKindProfile } from '../../domain/matchEventKindProfile'
import { MATCH_LOCATION_LABEL_MAX_LEN } from './matchLocationLabel'
import {
  isWeaponClassId,
  parseMatchDiscipline,
  WEAPON_CLASS_ORDER,
  weaponClassLabel,
  type WeaponClassId,
} from '../shooterProfileCatalog'
import '../PortalHome.css'
import '../PortalMatchesUi.css'

const MATCH_COVER_MAX_BYTES = 5 * 1024 * 1024
/** Published match list / masthead previews use this aspect (see `MatchCoverCropModal`). */
const MATCH_COVER_LIST_ASPECT = 16 / 10
/**
 * Relative tolerance vs `MATCH_COVER_LIST_ASPECT`; within this band we upload without opening the crop UI
 * so finished 16∶10 artwork matches the organizer’s file pixel-for-pixel.
 */
const MATCH_COVER_ASPECT_SKIP_CROP_TOL = 0.022

type MatchDraft = {
  title: string
  description_md: string
  starts_at_local: string
  location_label: string
  cover_image_url: string
  match_event_kind: '' | 'training' | 'match' | 'classification' | 'seminar'
  discipline: '' | WeaponClassId
  ps_match_level: '' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5'
  status: string
  participant_list_visibility: 'open' | 'closed'
  prematch_enabled: boolean
  planned_main_squad_count: number
  planned_prematch_squad_count: number
  shooters_per_main_squad: number
  shooters_per_prematch_squad: number
  programme_stages_enabled: boolean
}

function defaultStartsLocal(): string {
  const d = new Date(Date.now() + 7 * 86400000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function isoFromDatetimeLocal(local: string): string {
  const t = Date.parse(local)
  if (!Number.isFinite(t)) return new Date().toISOString()
  return new Date(t).toISOString()
}

function localFromIso(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

type PlanQtyKey = 'shooters_main' | 'planned_main' | 'shooters_prematch' | 'planned_prematch'

function parsePlanQty(raw: string, fallback: number, min = 1): number {
  const t = raw.trim()
  if (t === '') return fallback
  const n = Math.floor(Number(t))
  if (!Number.isFinite(n)) return fallback
  return Math.max(min, n)
}

function effectivePlanQty(s: string | undefined, fallback: number, min = 1): number {
  if (s === undefined) return fallback
  return parsePlanQty(s, fallback, min)
}

function mergePlanQtyIntoDraft(
  d: MatchDraft,
  q: Partial<Record<PlanQtyKey, string>>,
): MatchDraft {
  return {
    ...d,
    shooters_per_main_squad:
      q.shooters_main !== undefined ? parsePlanQty(q.shooters_main, d.shooters_per_main_squad) : d.shooters_per_main_squad,
    planned_main_squad_count:
      q.planned_main !== undefined ? parsePlanQty(q.planned_main, d.planned_main_squad_count) : d.planned_main_squad_count,
    shooters_per_prematch_squad:
      q.shooters_prematch !== undefined
        ? parsePlanQty(q.shooters_prematch, d.shooters_per_prematch_squad)
        : d.shooters_per_prematch_squad,
    planned_prematch_squad_count:
      q.planned_prematch !== undefined
        ? parsePlanQty(q.planned_prematch, Math.max(1, d.planned_prematch_squad_count || 1))
        : d.planned_prematch_squad_count,
  }
}

export function OrganizerMatchEditPage() {
  const { locale, tree } = useI18n()
  const p = tree.portal
  const configured = isSupabaseConfigured()
  const { loading: sessionLoading, user } = useSupabaseSession()
  const { loading: organizerProfileLoading, profile: organizerProfile, moderationNote } =
    useOrganizerSelfServiceProfile(user?.id)
  const navigate = useNavigate()
  const location = useLocation()
  const params = useParams<{ matchId: string }>()
  const isNew = /\/matches\/my\/new\/?$/.test(location.pathname)
  const matchId = params.matchId
  const validEditId = Boolean(matchId && MATCH_ID_UUID_RE.test(matchId))

  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'loaded' | 'error'>(
    isNew ? 'loaded' : 'loading',
  )
  const [loadError, setLoadError] = useState<string | null>(null)
  const [draft, setDraft] = useState<MatchDraft>(() => ({
    title: '',
    description_md: '',
    starts_at_local: defaultStartsLocal(),
    location_label: '',
    cover_image_url: '',
    match_event_kind: '',
    discipline: '',
    ps_match_level: '',
    status: 'draft',
    participant_list_visibility: 'closed',
    prematch_enabled: false,
    planned_main_squad_count: 8,
    planned_prematch_squad_count: 2,
    shooters_per_main_squad: 18,
    shooters_per_prematch_squad: 18,
    programme_stages_enabled: true,
  }))
  const [saveError, setSaveError] = useState<string | null>(null)
  const [squadSyncBanner, setSquadSyncBanner] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [pscBusy, setPscBusy] = useState(false)
  const [pscErr, setPscErr] = useState<string | null>(null)
  const [coverUploadErr, setCoverUploadErr] = useState<string | null>(null)
  const [coverUploadOk, setCoverUploadOk] = useState(false)
  const coverCropObjectUrlRef = useRef<string | null>(null)
  const [coverCropSrc, setCoverCropSrc] = useState<string | null>(null)
  const [planQtyStr, setPlanQtyStr] = useState<Partial<Record<PlanQtyKey, string>>>({})
  const descriptionRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    return () => {
      if (coverCropObjectUrlRef.current) {
        URL.revokeObjectURL(coverCropObjectUrlRef.current)
        coverCropObjectUrlRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (isNew) {
      setLoadState('loaded')
      setLoadError(null)
      setSaveError(null)
      setPlanQtyStr({})
      setDraft({
        title: '',
        description_md: '',
        starts_at_local: defaultStartsLocal(),
        location_label: '',
        cover_image_url: '',
        match_event_kind: '',
        discipline: '',
        ps_match_level: '',
        status: 'draft',
        participant_list_visibility: 'closed',
        prematch_enabled: false,
        planned_main_squad_count: 8,
        planned_prematch_squad_count: 2,
        shooters_per_main_squad: 18,
        shooters_per_prematch_squad: 18,
        programme_stages_enabled: true,
      })
      return
    }

    if (!configured || sessionLoading || !user?.id) return
    if (organizerProfileLoading || organizerProfile !== 'active') return
    if (!validEditId) {
      setLoadState('error')
      setLoadError(p.matchOrgEditBadId)
      return
    }
    let cancelled = false
    const sb = getSupabase()
    setLoadState('loading')
    setLoadError(null)
    void sb
      .from('matches')
      .select(
        'id, title, description_md, starts_at, location_label, cover_image_url, discipline, match_event_kind, ps_match_level, status, participant_list_visibility, organizer_id, prematch_enabled, planned_main_squad_count, planned_prematch_squad_count, shooters_per_main_squad, shooters_per_prematch_squad, programme_stages_enabled',
      )
      .eq('id', matchId!)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          setLoadError(error.message)
          setLoadState('error')
          return
        }
        if (!data || data.organizer_id !== user.id) {
          setLoadError(p.matchOrgEditNotFound)
          setLoadState('error')
          return
        }
        const vis =
          data.participant_list_visibility === 'open' ? 'open' : 'closed'
        setDraft({
          title: data.title ?? '',
          description_md: data.description_md ?? '',
          starts_at_local: localFromIso(data.starts_at),
          location_label: (data.location_label ?? '').slice(0, MATCH_LOCATION_LABEL_MAX_LEN),
          cover_image_url: typeof data.cover_image_url === 'string' ? data.cover_image_url : '',
          match_event_kind:
            typeof data.match_event_kind === 'string' && isMatchEventKind(data.match_event_kind)
              ? data.match_event_kind
              : '',
          discipline: parseMatchDiscipline(
            typeof data.discipline === 'string' ? data.discipline : null,
          ) ?? '',
          ps_match_level:
            typeof data.ps_match_level === 'string' && isPsMatchLevel(data.ps_match_level)
              ? data.ps_match_level
              : '',
          status: data.status ?? 'draft',
          participant_list_visibility: vis,
          prematch_enabled: Boolean(data.prematch_enabled),
          planned_main_squad_count: Math.max(1, Number(data.planned_main_squad_count) || 8),
          planned_prematch_squad_count: Math.max(0, Number(data.planned_prematch_squad_count) || 0),
          shooters_per_main_squad: Math.max(1, Number(data.shooters_per_main_squad) || 18),
          shooters_per_prematch_squad: Math.max(1, Number(data.shooters_per_prematch_squad) || 18),
          programme_stages_enabled: data.programme_stages_enabled !== false,
        })
        setPlanQtyStr({})
        setLoadState('loaded')
      })
    return () => {
      cancelled = true
    }
  }, [
    location.pathname,
    configured,
    sessionLoading,
    isNew,
    validEditId,
    matchId,
    user?.id,
    p.matchOrgEditBadId,
    p.matchOrgEditNotFound,
    organizerProfileLoading,
    organizerProfile,
  ])

  useEffect(() => {
    if (draft.prematch_enabled) return
    setPlanQtyStr((s) => {
      if (s.shooters_prematch === undefined && s.planned_prematch === undefined) return s
      const next = { ...s }
      delete next.shooters_prematch
      delete next.planned_prematch
      return next
    })
  }, [draft.prematch_enabled])

  useEffect(() => {
    const msg = (location.state as { squadSyncWarning?: string } | null)?.squadSyncWarning
    if (typeof msg === 'string' && msg.trim()) setSquadSyncBanner(msg.trim())
  }, [location.state])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaveError(null)
    if (!configured || !user?.id || saving) return
    if (organizerProfile !== 'active') return

    const merged = mergePlanQtyIntoDraft(draft, planQtyStr)
    const title = merged.title.trim()
    if (!title) {
      setSaveError(p.matchOrgTitleRequired)
      return
    }
    const locationTrimmed = merged.location_label.trim()
    if (locationTrimmed.length > MATCH_LOCATION_LABEL_MAX_LEN) {
      setSaveError(
        formatTemplate(p.matchOrgFieldLocationTooLong, {
          max: String(MATCH_LOCATION_LABEL_MAX_LEN),
        }),
      )
      return
    }

    const plannedMain = Math.floor(Number(merged.planned_main_squad_count))
    if (!Number.isFinite(plannedMain) || plannedMain < 1) {
      setSaveError(p.matchOrgPlannedMainInvalid)
      return
    }
    let plannedPrematch = Math.floor(Number(merged.planned_prematch_squad_count))
    if (!merged.prematch_enabled) {
      plannedPrematch = 0
    } else if (!Number.isFinite(plannedPrematch) || plannedPrematch < 1) {
      setSaveError(p.matchOrgPlannedPrematchInvalid)
      return
    }

    const shootersMain = Math.floor(Number(merged.shooters_per_main_squad))
    if (!Number.isFinite(shootersMain) || shootersMain < 1) {
      setSaveError(p.matchOrgShootersInvalid)
      return
    }
    let shootersPrematch = Math.floor(Number(merged.shooters_per_prematch_squad))
    if (!merged.prematch_enabled) {
      shootersPrematch = Math.max(1, shootersPrematch)
    } else if (!Number.isFinite(shootersPrematch) || shootersPrematch < 1) {
      setSaveError(p.matchOrgShootersInvalid)
      return
    }

    setPlanQtyStr({})
    setDraft(merged)

    const kindProfile = getMatchEventKindProfile(merged.match_event_kind || null)

    let discipline: string | null = null
    if (kindProfile.showDisciplineOnCard) {
      if (!merged.discipline || !isWeaponClassId(merged.discipline)) {
        setSaveError(p.matchOrgDisciplineRequired)
        return
      }
      discipline = merged.discipline
    }

    const row = {
      organizer_id: user.id,
      title,
      description_md: merged.description_md.trim() ? merged.description_md : null,
      starts_at: isoFromDatetimeLocal(merged.starts_at_local),
      location_label: locationTrimmed ? locationTrimmed : null,
      cover_image_url: merged.cover_image_url.trim() ? merged.cover_image_url.trim() : null,
      discipline,
      status: merged.status,
      participant_list_visibility: merged.participant_list_visibility,
      match_event_kind:
        merged.match_event_kind && isMatchEventKind(merged.match_event_kind)
          ? merged.match_event_kind
          : null,
      ps_match_level:
        kindProfile.showPsLevelField && merged.ps_match_level && isPsMatchLevel(merged.ps_match_level)
          ? merged.ps_match_level
          : null,
      programme_stages_enabled:
        kindProfile.showProgrammeStagesToggle ? merged.programme_stages_enabled : true,
      ps_match_subtype: 'ipsc',
      prematch_enabled: merged.prematch_enabled,
      planned_main_squad_count: plannedMain,
      planned_prematch_squad_count: plannedPrematch,
      shooters_per_main_squad: shootersMain,
      shooters_per_prematch_squad: shootersPrematch,
    }

    setSaving(true)
    const sb = getSupabase()
    if (isNew) {
      const { data, error } = await sb.from('matches').insert(row).select('id').single()
      setSaving(false)
      if (error) {
        setSaveError(error.message)
        return
      }
      if (data?.id) {
        const { error: syncErr } = await sb.rpc('organizer_sync_match_squads', { p_match_id: data.id })
        if (syncErr) {
          navigate(`/${locale}/matches/my/${data.id}`, {
            replace: true,
            state: { squadSyncWarning: organizerSquadSyncErrorMessage(syncErr.message, p) },
          })
          return
        }
        navigate(`/${locale}/matches/my/${data.id}`, { replace: true })
      }
      return
    }

    if (!matchId || !validEditId) {
      setSaving(false)
      return
    }
    const { organizer_id, ...updatePayload } = row
    void organizer_id
    const { error } = await sb.from('matches').update(updatePayload).eq('id', matchId).eq('organizer_id', user.id)
    setSaving(false)
    if (error) {
      setSaveError(error.message)
      return
    }
    const { error: syncErr } = await sb.rpc('organizer_sync_match_squads', { p_match_id: matchId })
    if (syncErr) {
      setSaveError(organizerSquadSyncErrorMessage(syncErr.message, p))
    }
  }

  function applyDescBbcode(open: string, close: string, emptyInner = '') {
    const el = descriptionRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const { text, selStart, selEnd } = wrapBbCode(draft.description_md, start, end, open, close, emptyInner)
    flushSync(() => {
      setDraft((d) => ({ ...d, description_md: text }))
    })
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(selStart, selEnd)
    })
  }

  async function handleDownloadMatchPsc() {
    if (!matchId || !configured || organizerProfile !== 'active') return
    setPscErr(null)
    setPscBusy(true)
    try {
      const sb = getSupabase()
      const { data: sess } = await sb.auth.getSession()
      const token = sess.session?.access_token
      if (!token) {
        setPscErr(p.matchOrgExportPscErrSession)
        return
      }
      const res = await fetch('/api/match-export-psc', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ matchId }),
      })

      if (!res.ok) {
        let parsed: { error?: string; code?: string } | undefined
        try {
          parsed = (await res.json()) as { error?: string; code?: string }
        } catch {
          parsed = undefined
        }
        if (parsed?.code === 'no_stages') setPscErr(p.matchOrgExportPscErrNoStages)
        else if (typeof parsed?.error === 'string' && parsed.error.trim())
          setPscErr(parsed.error.trim())
        else if (res.status === 503 || res.status === 404) setPscErr(p.matchOrgExportPscErrNetwork)
        else setPscErr(p.matchOrgExportPscErrGeneric)
        return
      }

      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      try {
        const a = document.createElement('a')
        a.href = objectUrl
        const cd = res.headers.get('Content-Disposition')
        const m = cd ? /filename="([^"]+)"/i.exec(cd) : null
        a.download = m?.[1] ?? `match-${matchId.slice(0, 8)}.psc`
        document.body.appendChild(a)
        a.click()
        a.remove()
      } finally {
        URL.revokeObjectURL(objectUrl)
      }
    } catch {
      setPscErr(p.matchOrgExportPscErrNetwork)
    } finally {
      setPscBusy(false)
    }
  }

  function closeCoverCropModal() {
    if (coverCropObjectUrlRef.current) {
      URL.revokeObjectURL(coverCropObjectUrlRef.current)
      coverCropObjectUrlRef.current = null
    }
    setCoverCropSrc(null)
  }

  async function uploadCoverJpegBlob(file: Blob): Promise<boolean> {
    if (!configured || !user?.id) return false
    if (!validEditId || !matchId || isNew) {
      setCoverUploadErr(p.matchOrgCoverHintNew)
      return false
    }
    setCoverUploadErr(null)
    setCoverUploadOk(false)
    const objectPath = `${user.id}/${matchId}/cover-${Date.now()}.jpg`
    const sb = getSupabase()
    const { error: upErr } = await sb.storage.from('match-covers').upload(objectPath, file, {
      upsert: false,
      contentType: 'image/jpeg',
    })
    if (upErr) {
      setCoverUploadErr(upErr.message)
      return false
    }
    const { data: pub } = sb.storage.from('match-covers').getPublicUrl(objectPath)
    const publicUrl = pub.publicUrl
    const { error: dbErr } = await sb
      .from('matches')
      .update({ cover_image_url: publicUrl })
      .eq('id', matchId)
    if (dbErr) {
      setCoverUploadErr(dbErr.message)
      return false
    }
    setDraft((d) => ({ ...d, cover_image_url: publicUrl }))
    setCoverUploadOk(true)
    return true
  }

  async function clearCoverImage(): Promise<void> {
    if (!configured || !validEditId || !matchId) return
    setCoverUploadErr(null)
    setCoverUploadOk(false)
    const { error: dbErr } = await getSupabase()
      .from('matches')
      .update({ cover_image_url: null })
      .eq('id', matchId)
    if (dbErr) {
      setCoverUploadErr(dbErr.message)
      return
    }
    setDraft((d) => ({ ...d, cover_image_url: '' }))
  }

  async function handleCoverFileChange(e: ChangeEvent<HTMLInputElement>) {
    setCoverUploadErr(null)
    setCoverUploadOk(false)
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !configured || !user?.id) return
    if (!validEditId || !matchId || isNew) {
      setCoverUploadErr(p.matchOrgCoverHintNew)
      return
    }
    const okTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    if (!okTypes.includes(file.type)) {
      setCoverUploadErr(p.matchOrgCoverErrType)
      return
    }
    if (file.size > MATCH_COVER_MAX_BYTES) {
      setCoverUploadErr(p.matchOrgCoverErrSize)
      return
    }
    if (coverCropObjectUrlRef.current) {
      URL.revokeObjectURL(coverCropObjectUrlRef.current)
      coverCropObjectUrlRef.current = null
    }
    const url = URL.createObjectURL(file)
    try {
      const { width, height } = await measureImageNaturalSize(url)
      if (width > 0 && height > 0) {
        const ar = width / height
        if (Math.abs(ar - MATCH_COVER_LIST_ASPECT) / MATCH_COVER_LIST_ASPECT <= MATCH_COVER_ASPECT_SKIP_CROP_TOL) {
          const blob = await exportMatchCoverFromFullImage(url)
          URL.revokeObjectURL(url)
          setCoverUploadErr(null)
          await uploadCoverJpegBlob(blob)
          return
        }
      }
    } catch {
      // Fall through: open cropper (e.g. decode failure).
    }
    coverCropObjectUrlRef.current = url
    setCoverCropSrc(url)
  }

  if (!configured) {
    return (
      <div className="portal-home">
        <Helmet>
          <title>{p.myMatchesHelmet}</title>
        </Helmet>
        <p>{p.matchesSupabaseUnset}</p>
        <nav className="portal-page-context portal-page-context--solo-link" aria-label={p.portalBreadcrumbAria}>
          <Link to={`/${locale}/matches/my`}>{p.matchOrgBackList}</Link>
        </nav>
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
        <nav className="portal-page-context portal-page-context--solo-link" aria-label={p.portalBreadcrumbAria}>
          <Link to={`/${locale}/matches/my`}>{p.matchOrgBackList}</Link>
        </nav>
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
          <title>{p.matchesPageHelmetTitle}</title>
        </Helmet>
        <nav className="portal-page-context" aria-label={p.portalBreadcrumbAria}>
          <ol className="portal-breadcrumbs">
            <li>
              <Link to={`/${locale}/matches/my`}>{p.myMatchesTitle}</Link>
            </li>
            <li className="portal-breadcrumbs__current">{isNew ? p.matchOrgCreateTitle : p.matchOrgEditTitle}</li>
          </ol>
        </nav>
        <header className="portal-home__hero portal-match-org-edit__hero">
          <h1 className="portal-home__hero-title portal-match-title-hero-wrap portal-match-org-edit__title">
            {isNew ? p.matchOrgCreateTitle : p.matchOrgEditTitle}
          </h1>
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

  if (!isNew && loadState !== 'loaded') {
    return (
      <div className="portal-home">
        <Helmet>
          <title>{p.matchOrgEditHelmetLoading}</title>
        </Helmet>
        {loadState === 'loading' ? <p>{p.myMatchesLoading}</p> : <p role="alert">{loadError ?? p.matchesLoadError}</p>}
        <nav className="portal-page-context portal-page-context--solo-link" aria-label={p.portalBreadcrumbAria}>
          <Link to={`/${locale}/matches/my`}>{p.matchOrgBackList}</Link>
        </nav>
      </div>
    )
  }

  const pageTitle = isNew ? p.matchOrgCreateTitle : p.matchOrgEditTitle
  const helmet = isNew ? p.matchOrgCreateHelmet : p.matchOrgEditHelmetEdit
  const eventKindProfile = getMatchEventKindProfile(draft.match_event_kind || null)
  const showStagesPanel =
    !isNew &&
    validEditId &&
    matchId &&
    (eventKindProfile.showProgrammeStagesToggle ? draft.programme_stages_enabled : true)

  const smActive = effectivePlanQty(planQtyStr.shooters_main, draft.shooters_per_main_squad)
  const pmActive = effectivePlanQty(planQtyStr.planned_main, draft.planned_main_squad_count)
  const spActive = effectivePlanQty(planQtyStr.shooters_prematch, draft.shooters_per_prematch_squad)
  const ppActive = effectivePlanQty(
    planQtyStr.planned_prematch,
    Math.max(1, draft.planned_prematch_squad_count || 1),
  )
  const derivedCompetitorLimit =
    smActive * pmActive + (draft.prematch_enabled ? ppActive * spActive : 0)

  const derivedCapacityFull = formatTemplate(p.matchOrgDerivedCapacityLine, {
    total: String(derivedCompetitorLimit),
  })

  return (
    <div className="portal-home portal-match-org-edit-page">
      <Helmet>
        <title>{helmet}</title>
      </Helmet>

      <nav className="portal-page-context" aria-label={p.portalBreadcrumbAria}>
        <ol className="portal-breadcrumbs">
          <li>
            <Link to={`/${locale}/matches/my`}>{p.myMatchesTitle}</Link>
          </li>
          <li className="portal-breadcrumbs__current">{pageTitle}</li>
        </ol>
      </nav>

      <header className="portal-home__hero portal-match-org-edit__hero">
        <h1 className="portal-home__hero-title portal-match-title-hero-wrap portal-match-org-edit__title">{pageTitle}</h1>
      </header>

      <div className="portal-match-org-edit__shell">
      <aside
        className="portal-match-org-quick portal-match-org-edit__aside"
        aria-label={p.matchOrgQuickActionsAria}
      >
        <div className="portal-match-org-quick__head">
          <h2 className="portal-match-org-quick__title">{p.matchOrgQuickActionsHeading}</h2>
          {isNew ?
            <p className="portal-match-org-quick__hint">{p.matchOrgQuickActionsNewHint}</p>
          : null}
        </div>
        <div className="portal-match-org-quick__toolbar">
          <button
            form="match-org-edit-form"
            type="submit"
            disabled={saving}
            className="portal-btn portal-btn--primary portal-btn--compact portal-match-org-quick__btn"
          >
            {saving ? p.matchOrgSaveSaving : p.matchOrgSave}
          </button>

          {!isNew && validEditId && matchId ?
            <>
              <Link
                className="portal-btn portal-btn--secondary portal-btn--compact portal-match-org-quick__btn"
                to={`/${locale}/matches/my/${matchId}/roster`}
              >
                {p.matchOrgRosterManageLink}
              </Link>
              <button
                type="button"
                disabled={pscBusy}
                className="portal-btn portal-btn--secondary portal-btn--compact portal-match-org-quick__btn"
                onClick={() => void handleDownloadMatchPsc()}
              >
                {pscBusy ? p.matchOrgExportPscBusy : p.matchOrgExportPsc}
              </button>
            </>
          : null}

          {!isNew && draft.status === 'published' && matchId ?
            <Link
              className="portal-btn portal-btn--secondary portal-btn--compact portal-match-org-quick__btn"
              to={`/${locale}/matches/${encodeURIComponent(matchId)}`}
            >
              {p.myMatchesViewPublic}
            </Link>
          : null}
        </div>

        {saveError ?
          <p role="alert" className="portal-match-org-quick__error">{saveError}</p>
        : null}

        {!isNew && validEditId && matchId && pscErr ?
          <p role="alert" className="portal-match-org-quick__error">{pscErr}</p>
        : null}
      </aside>

      <div className="portal-match-org-edit__primary">
      {squadSyncBanner ?
        <div className="portal-match-org-form__alert portal-match-org-edit__banner" role="alert">
          {formatTemplate(p.matchOrgSquadSyncBanner, { detail: squadSyncBanner })}
          <button
            type="button"
            className="portal-btn portal-btn--secondary portal-btn--compact portal-match-org-form__alert-dismiss"
            onClick={() => setSquadSyncBanner(null)}
          >
            {p.matchOrgSquadSyncBannerDismiss}
          </button>
        </div>
      : null}

      <div className="portal-match-org-edit__card">
      <form id="match-org-edit-form" className="portal-match-org-form" onSubmit={(e) => void handleSubmit(e)}>
        <label className="portal-match-org-form__field">
          <span className="portal-match-org-form__label">{p.matchOrgFieldTitle}</span>
          <input
            type="text"
            required
            className="portal-match-org-form__control"
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            autoComplete="off"
          />
        </label>

        <label className="portal-match-org-form__field">
          <span className="portal-match-org-form__label">{p.matchOrgFieldStarts}</span>
          <input
            type="datetime-local"
            required
            className="portal-match-org-form__control portal-match-org-form__control--datetime"
            title={p.matchOrgFieldStartsTitle}
            value={draft.starts_at_local}
            onChange={(e) => setDraft((d) => ({ ...d, starts_at_local: e.target.value }))}
          />
        </label>

        <label className="portal-match-org-form__field">
          <span className="portal-match-org-form__label">{p.matchOrgFieldLocation}</span>
          <input
            type="text"
            className="portal-match-org-form__control"
            placeholder={p.matchOrgFieldLocationPlaceholder}
            maxLength={MATCH_LOCATION_LABEL_MAX_LEN}
            autoComplete="off"
            value={draft.location_label}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                location_label: e.target.value.slice(0, MATCH_LOCATION_LABEL_MAX_LEN),
              }))
            }
          />
        </label>
        <p className="portal-match-org-form__hint">
          {formatTemplate(p.matchOrgFieldLocationHint, {
            max: String(MATCH_LOCATION_LABEL_MAX_LEN),
          })}
        </p>

        {!isNew && validEditId ?
          <div className="portal-match-org-form__cover-block">
            <span className="portal-match-org-form__label">{p.matchOrgFieldCoverImage}</span>
            <div className="portal-match-org-form__cover-row">
              {draft.cover_image_url.trim() ?
                <img
                  key={draft.cover_image_url.trim()}
                  src={draft.cover_image_url.trim()}
                  alt=""
                  className="portal-match-org-form__cover-preview portal-match-cover-img"
                />
              : <div className="portal-match-org-form__cover-placeholder" aria-hidden />}
              {draft.cover_image_url.trim() ?
                <button
                  type="button"
                  className="portal-btn portal-btn--secondary portal-btn--compact"
                  disabled={saving || Boolean(coverCropSrc)}
                  onClick={() => void clearCoverImage()}
                >
                  {p.matchOrgCoverRemove}
                </button>
              : <label className="portal-match-org-form__cover-upload">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    disabled={saving || Boolean(coverCropSrc)}
                    onChange={(e) => void handleCoverFileChange(e)}
                    style={{ display: 'none' }}
                  />
                  <span className="portal-btn portal-btn--secondary portal-btn--compact">{p.matchOrgCoverUpload}</span>
                </label>
              }
            </div>
            {coverUploadErr ?
              <p role="alert" className="portal-match-org-form__hint portal-match-org-form__hint--error">
                {coverUploadErr}
              </p>
            : coverUploadOk ?
              <p className="portal-match-org-form__hint portal-match-org-form__hint--ok">{p.matchOrgCoverSaved}</p>
            : null}
          </div>
        : (
          <p className="portal-match-org-form__hint">{p.matchOrgCoverHintNew}</p>
        )}

        <section className="portal-match-org-form__section" aria-labelledby="match-org-catalog-heading">
          <h2 id="match-org-catalog-heading" className="portal-match-org-form__section-heading">
            {p.matchOrgSectionCatalogHeading}
          </h2>

          <div className="portal-match-org-form__cols-2">
            <label className="portal-match-org-form__field">
              <span className="portal-match-org-form__label portal-match-org-form__label--squads-panel">
                {p.matchOrgFieldEventKind}
              </span>
              <select
                className="portal-match-org-form__control portal-match-org-form__control--select"
                value={draft.match_event_kind}
                onChange={(e) => {
                  const next = e.target.value as MatchDraft['match_event_kind']
                  const nextProfile = getMatchEventKindProfile(next || null)
                  setDraft((d) => ({
                    ...d,
                    match_event_kind: next,
                    discipline: nextProfile.showDisciplineOnCard ? d.discipline : '',
                    ps_match_level: nextProfile.showPsLevelField ? d.ps_match_level : '',
                    programme_stages_enabled: nextProfile.showProgrammeStagesToggle
                      ? nextProfile.defaultProgrammeStagesEnabled
                      : true,
                  }))
                }}
              >
                <option value="">{p.matchOrgEventKindUnset}</option>
                <option value="training">{p.matchEventKindTraining}</option>
                <option value="match">{p.matchEventKindMatch}</option>
                <option value="classification">{p.matchEventKindClassification}</option>
                <option value="seminar">{p.matchEventKindSeminar}</option>
              </select>
            </label>

            {eventKindProfile.showDisciplineOnCard ?
              <label className="portal-match-org-form__field">
                <span className="portal-match-org-form__label portal-match-org-form__label--squads-panel">
                  {p.matchOrgFieldDiscipline}
                </span>
                <select
                  className="portal-match-org-form__control portal-match-org-form__control--select"
                  value={draft.discipline}
                  required
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      discipline: e.target.value as MatchDraft['discipline'],
                    }))
                  }
                >
                  <option value="">{p.matchOrgDisciplineUnset}</option>
                  {WEAPON_CLASS_ORDER.map((id) => (
                    <option key={id} value={id}>
                      {weaponClassLabel(id, locale === 'uk' ? 'uk' : 'en')}
                    </option>
                  ))}
                </select>
              </label>
            : (
              <p className="portal-match-org-form__hint">{p.matchOrgDisciplineSeminarHint}</p>
            )}

            {eventKindProfile.showPsLevelField ?
              <label className="portal-match-org-form__field">
                <span className="portal-match-org-form__label portal-match-org-form__label--squads-panel">{p.matchOrgFieldPsLevel}</span>
                <select
                  className="portal-match-org-form__control portal-match-org-form__control--select"
                  value={draft.ps_match_level}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      ps_match_level: e.target.value as MatchDraft['ps_match_level'],
                    }))
                  }
                >
                  <option value="">{p.matchOrgPsLevelUnset}</option>
                  <option value="L1">{p.matchPsLevelL1}</option>
                  <option value="L2">{p.matchPsLevelL2}</option>
                  <option value="L3">{p.matchPsLevelL3}</option>
                  <option value="L4">{p.matchPsLevelL4}</option>
                  <option value="L5">{p.matchPsLevelL5}</option>
                </select>
              </label>
            : null}
          </div>

          {eventKindProfile.showProgrammeStagesToggle ?
            <label className="portal-match-org-form__checkbox">
              <input
                type="checkbox"
                checked={draft.programme_stages_enabled}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, programme_stages_enabled: e.target.checked }))
                }
              />
              <span>{p.matchOrgFieldProgrammeStages}</span>
            </label>
          : null}
        </section>

        <section className="portal-match-org-form__section" aria-labelledby="match-org-plan-heading">
          <h2 id="match-org-plan-heading" className="portal-match-org-form__section-heading">
            {p.matchOrgSectionPlanHeading}
          </h2>

          <div
            className={
              draft.prematch_enabled ?
                'portal-match-org-form__plan-grid portal-match-org-form__plan-grid--prematch'
              : 'portal-match-org-form__plan-grid'
            }
          >
            <label
              className="portal-match-org-form__plan-label portal-match-org-form__plan-lbl--shooters portal-match-org-form__label--squads-panel"
              htmlFor="match-org-inp-shooters-main"
            >
              {p.matchOrgFieldShootersMain}
            </label>
            <label
              className="portal-match-org-form__plan-label portal-match-org-form__plan-lbl--squads portal-match-org-form__label--squads-panel"
              htmlFor="match-org-inp-planned-main"
            >
              {p.matchOrgFieldPlannedMainSquads}
            </label>

            <span
              id="match-org-lbl-derived-total-shooters"
              className="portal-match-org-form__plan-lbl--capacity portal-match-org-form__label--squads-panel"
            >
              {p.matchOrgFieldDerivedTotalShooters}
            </span>

            <input
              id="match-org-inp-shooters-main"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              className="portal-match-org-form__plan-inp-main-shooters portal-match-org-form__control portal-match-org-form__control--number"
              value={
                planQtyStr.shooters_main !== undefined ?
                  planQtyStr.shooters_main
                : String(draft.shooters_per_main_squad)
              }
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, '')
                setPlanQtyStr((s) => ({ ...s, shooters_main: raw }))
                if (raw.trim() === '') return
                const n = Math.floor(Number(raw))
                if (Number.isFinite(n) && n >= 1) {
                  setDraft((d) => ({ ...d, shooters_per_main_squad: n }))
                }
              }}
              onBlur={() => {
                setPlanQtyStr((s) => {
                  if (s.shooters_main === undefined) return s
                  const raw = s.shooters_main
                  setDraft((d) => ({
                    ...d,
                    shooters_per_main_squad: parsePlanQty(raw, d.shooters_per_main_squad),
                  }))
                  const next = { ...s }
                  delete next.shooters_main
                  return next
                })
              }}
            />

            <input
              id="match-org-inp-planned-main"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              className="portal-match-org-form__plan-inp-main-squads portal-match-org-form__control portal-match-org-form__control--number"
              value={
                planQtyStr.planned_main !== undefined ?
                  planQtyStr.planned_main
                : String(draft.planned_main_squad_count)
              }
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, '')
                setPlanQtyStr((s) => ({ ...s, planned_main: raw }))
                if (raw.trim() === '') return
                const n = Math.floor(Number(raw))
                if (Number.isFinite(n) && n >= 1) {
                  setDraft((d) => ({ ...d, planned_main_squad_count: n }))
                }
              }}
              onBlur={() => {
                setPlanQtyStr((s) => {
                  if (s.planned_main === undefined) return s
                  const raw = s.planned_main
                  setDraft((d) => ({
                    ...d,
                    planned_main_squad_count: parsePlanQty(raw, d.planned_main_squad_count),
                  }))
                  const next = { ...s }
                  delete next.planned_main
                  return next
                })
              }}
            />

            <input
              id="match-org-inp-derived-total-shooters"
              readOnly
              tabIndex={-1}
              type="number"
              inputMode="numeric"
              aria-labelledby="match-org-lbl-derived-total-shooters"
              aria-live="polite"
              title={derivedCapacityFull}
              className="portal-match-org-form__plan-inp-derived portal-match-org-form__control portal-match-org-form__control--number"
              value={derivedCompetitorLimit}
            />

            <label className="portal-match-org-form__checkbox portal-match-org-form__checkbox--plan-row portal-match-org-form__plan-chk-prem">
              <input
                type="checkbox"
                checked={draft.prematch_enabled}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    prematch_enabled: e.target.checked,
                    planned_prematch_squad_count:
                      e.target.checked ? Math.max(1, d.planned_prematch_squad_count) : 0,
                  }))
                }
              />
              <span>{p.matchOrgFieldPrematch}</span>
            </label>

            {draft.prematch_enabled ?
              <>
                <label
                  className="portal-match-org-form__plan-label portal-match-org-form__plan-lbl--prematch-shooters portal-match-org-form__label--squads-panel"
                  htmlFor="match-org-inp-shooters-prematch"
                >
                  {p.matchOrgFieldShootersPrematch}
                </label>
                <label
                  className="portal-match-org-form__plan-label portal-match-org-form__plan-lbl--prematch-squads portal-match-org-form__label--squads-panel"
                  htmlFor="match-org-inp-prematch-squads"
                >
                  {p.matchOrgFieldPlannedPrematchSquads}
                </label>
                <input
                  id="match-org-inp-shooters-prematch"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  className="portal-match-org-form__plan-inp-prematch-shooters portal-match-org-form__control portal-match-org-form__control--number"
                  value={
                    planQtyStr.shooters_prematch !== undefined ?
                      planQtyStr.shooters_prematch
                    : String(draft.shooters_per_prematch_squad)
                  }
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '')
                    setPlanQtyStr((s) => ({ ...s, shooters_prematch: raw }))
                    if (raw.trim() === '') return
                    const n = Math.floor(Number(raw))
                    if (Number.isFinite(n) && n >= 1) {
                      setDraft((d) => ({ ...d, shooters_per_prematch_squad: n }))
                    }
                  }}
                  onBlur={() => {
                    setPlanQtyStr((s) => {
                      if (s.shooters_prematch === undefined) return s
                      const raw = s.shooters_prematch
                      setDraft((d) => ({
                        ...d,
                        shooters_per_prematch_squad: parsePlanQty(raw, d.shooters_per_prematch_squad),
                      }))
                      const next = { ...s }
                      delete next.shooters_prematch
                      return next
                    })
                  }}
                />
                <input
                  id="match-org-inp-prematch-squads"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  className="portal-match-org-form__plan-inp-prematch-squads portal-match-org-form__control portal-match-org-form__control--number"
                  value={
                    planQtyStr.planned_prematch !== undefined ?
                      planQtyStr.planned_prematch
                    : String(Math.max(1, draft.planned_prematch_squad_count || 1))
                  }
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '')
                    setPlanQtyStr((s) => ({ ...s, planned_prematch: raw }))
                    if (raw.trim() === '') return
                    const n = Math.floor(Number(raw))
                    if (Number.isFinite(n) && n >= 1) {
                      setDraft((d) => ({ ...d, planned_prematch_squad_count: n }))
                    }
                  }}
                  onBlur={() => {
                    setPlanQtyStr((s) => {
                      if (s.planned_prematch === undefined) return s
                      const raw = s.planned_prematch
                      setDraft((d) => ({
                        ...d,
                        planned_prematch_squad_count: parsePlanQty(
                          raw,
                          Math.max(1, d.planned_prematch_squad_count || 1),
                        ),
                      }))
                      const next = { ...s }
                      delete next.planned_prematch
                      return next
                    })
                  }}
                />
              </>
            : null}
          </div>
        </section>

        <section className="portal-match-org-form__section" aria-labelledby="match-org-pub-heading">
          <h2 id="match-org-pub-heading" className="portal-match-org-form__section-heading">
            {p.matchOrgSectionPublishHeading}
          </h2>

          <label className="portal-match-org-form__field">
            <span className="portal-match-org-form__label">{p.matchOrgFieldDescription}</span>
            <textarea
              ref={descriptionRef}
              id="match-org-description"
              rows={6}
              className="portal-match-org-form__control portal-match-org-form__control--textarea"
              aria-describedby="match-org-description-hint"
              value={draft.description_md}
              onChange={(e) => setDraft((d) => ({ ...d, description_md: e.target.value }))}
            />
            <div
              className="portal-match-org-form__bbcode-bar"
              role="toolbar"
              aria-label={p.matchOrgBbcodeToolbarAria}
            >
              <button
                type="button"
                className="portal-btn portal-btn--secondary portal-btn--compact portal-match-org-form__bbcode-btn"
                title={p.matchOrgBbcodeBoldTitle}
                onClick={() => applyDescBbcode('[b]', '[/b]')}
              >
                B
              </button>
              <button
                type="button"
                className="portal-btn portal-btn--secondary portal-btn--compact portal-match-org-form__bbcode-btn"
                title={p.matchOrgBbcodeItalicTitle}
                onClick={() => applyDescBbcode('[i]', '[/i]')}
              >
                I
              </button>
              <button
                type="button"
                className="portal-btn portal-btn--secondary portal-btn--compact portal-match-org-form__bbcode-btn"
                title={p.matchOrgBbcodeUnderlineTitle}
                onClick={() => applyDescBbcode('[u]', '[/u]')}
              >
                U
              </button>
              <button
                type="button"
                className="portal-btn portal-btn--secondary portal-btn--compact portal-match-org-form__bbcode-btn"
                title={p.matchOrgBbcodeUrlTitle}
                onClick={() => applyDescBbcode('[url]', '[/url]', p.matchOrgBbcodeUrlPlaceholder)}
              >
                URL
              </button>
              <button
                type="button"
                className="portal-btn portal-btn--secondary portal-btn--compact portal-match-org-form__bbcode-btn"
                title={p.matchOrgBbcodeQuoteTitle}
                onClick={() => applyDescBbcode('[quote]', '[/quote]')}
              >
                «
              </button>
              <button
                type="button"
                className="portal-btn portal-btn--secondary portal-btn--compact portal-match-org-form__bbcode-btn"
                title={p.matchOrgBbcodeListTitle}
                onClick={() =>
                  applyDescBbcode('[list][*]', '[/list]', p.matchOrgBbcodeListItemPlaceholder)
                }
              >
                •
              </button>
            </div>
            <span id="match-org-description-hint" className="portal-match-org-form__sr-only">
              {p.matchOrgFieldDescriptionHint}
            </span>
          </label>

          <label className="portal-match-org-form__field">
            <span className="portal-match-org-form__label">{p.matchOrgFieldStatus}</span>
            <select
              className="portal-match-org-form__control portal-match-org-form__control--select"
              value={draft.status}
              onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}
            >
              <option value="draft">{p.matchOrgStatusDraft}</option>
              <option value="published">{p.matchOrgStatusPublished}</option>
              <option value="cancelled">{p.matchOrgStatusCancelled}</option>
              <option value="completed">{p.matchOrgStatusCompleted}</option>
            </select>
          </label>

          <label className="portal-match-org-form__field">
            <span className="portal-match-org-form__label">{p.matchOrgFieldParticipantList}</span>
            <select
              className="portal-match-org-form__control portal-match-org-form__control--select portal-match-org-form__control--participant"
              value={draft.participant_list_visibility}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  participant_list_visibility: e.target.value === 'open' ? 'open' : 'closed',
                }))
              }
            >
              <option value="closed">{p.matchOrgParticipantsListClosed}</option>
              <option value="open">{p.matchOrgParticipantsListOpen}</option>
            </select>
          </label>
        </section>

      </form>
      </div>

      {!isNew && validEditId && matchId && showStagesPanel ?
        <div className="portal-match-org-edit__card portal-match-org-edit__card--programme">
          <OrganizerMatchStagesPanel locale={locale} matchId={matchId} p={p} />
        </div>
      : null}
      </div>
      </div>

      {coverCropSrc ?
        <MatchCoverCropModal
          imageSrc={coverCropSrc}
          onCancel={() => {
            setCoverUploadErr(null)
            closeCoverCropModal()
          }}
          onApply={async (jpeg) => {
            setCoverUploadErr(null)
            const ok = await uploadCoverJpegBlob(jpeg)
            if (ok) closeCoverCropModal()
          }}
          remoteError={coverUploadErr}
          p={p}
        />
      : null}
    </div>
  )
}
