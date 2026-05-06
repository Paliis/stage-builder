import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useI18n } from '../../i18n/useI18n'
import { formatTemplate } from '../../i18n/format'
import { getSupabase, isSupabaseConfigured } from '../../lib/supabaseClient'
import { useSupabaseSession } from '../useSupabaseSession'
import { useOrganizerSelfServiceProfile } from '../useOrganizerSelfServiceProfile'
import { MATCH_ID_UUID_RE } from './matchPortalUuid'
import { OrganizerMatchStagesPanel } from './OrganizerMatchStagesPanel'
import { OrganizerMatchSquadsPanel } from './OrganizerMatchSquadsPanel'
import { organizerSquadSyncErrorMessage } from './organizerSquadSyncErrorMessage'
import { OrganizerMatchInactivePanel } from './OrganizerMatchInactivePanel'
import { MatchCoverCropModal } from './MatchCoverCropModal'
import { cropRectRegionToJpeg, measureImageNaturalSize } from '../cropPixelsToJpeg'
import { isMatchEventKind, isPsMatchLevel } from '../../domain/matchTaxonomy'
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
  match_event_kind: '' | 'training' | 'match' | 'classification'
  ps_match_level: '' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5'
  status: string
  participant_list_visibility: 'open' | 'closed'
  prematch_enabled: boolean
  planned_main_squad_count: number
  planned_prematch_squad_count: number
  shooters_per_main_squad: number
  shooters_per_prematch_squad: number
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
    ps_match_level: '',
    status: 'draft',
    participant_list_visibility: 'closed',
    prematch_enabled: false,
    planned_main_squad_count: 8,
    planned_prematch_squad_count: 2,
    shooters_per_main_squad: 18,
    shooters_per_prematch_squad: 18,
  }))
  const [saveError, setSaveError] = useState<string | null>(null)
  const [squadSyncBanner, setSquadSyncBanner] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [pscBusy, setPscBusy] = useState(false)
  const [pscErr, setPscErr] = useState<string | null>(null)
  const [coverUploadErr, setCoverUploadErr] = useState<string | null>(null)
  const coverCropObjectUrlRef = useRef<string | null>(null)
  const [coverCropSrc, setCoverCropSrc] = useState<string | null>(null)

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
      setDraft({
        title: '',
        description_md: '',
        starts_at_local: defaultStartsLocal(),
        location_label: '',
        cover_image_url: '',
        match_event_kind: '',
        ps_match_level: '',
        status: 'draft',
        participant_list_visibility: 'closed',
        prematch_enabled: false,
        planned_main_squad_count: 8,
        planned_prematch_squad_count: 2,
        shooters_per_main_squad: 18,
        shooters_per_prematch_squad: 18,
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
        'id, title, description_md, starts_at, location_label, cover_image_url, match_event_kind, ps_match_level, status, participant_list_visibility, organizer_id, prematch_enabled, planned_main_squad_count, planned_prematch_squad_count, shooters_per_main_squad, shooters_per_prematch_squad',
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
          location_label: data.location_label ?? '',
          cover_image_url: typeof data.cover_image_url === 'string' ? data.cover_image_url : '',
          match_event_kind:
            typeof data.match_event_kind === 'string' && isMatchEventKind(data.match_event_kind)
              ? data.match_event_kind
              : '',
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
        })
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
    const msg = (location.state as { squadSyncWarning?: string } | null)?.squadSyncWarning
    if (typeof msg === 'string' && msg.trim()) setSquadSyncBanner(msg.trim())
  }, [location.state])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaveError(null)
    if (!configured || !user?.id || saving) return
    if (organizerProfile !== 'active') return
    const title = draft.title.trim()
    if (!title) {
      setSaveError(p.matchOrgTitleRequired)
      return
    }
    const plannedMain = Math.floor(Number(draft.planned_main_squad_count))
    if (!Number.isFinite(plannedMain) || plannedMain < 1) {
      setSaveError(p.matchOrgPlannedMainInvalid)
      return
    }
    let plannedPrematch = Math.floor(Number(draft.planned_prematch_squad_count))
    if (!draft.prematch_enabled) {
      plannedPrematch = 0
    } else if (!Number.isFinite(plannedPrematch) || plannedPrematch < 1) {
      setSaveError(p.matchOrgPlannedPrematchInvalid)
      return
    }

    const shootersMain = Math.floor(Number(draft.shooters_per_main_squad))
    if (!Number.isFinite(shootersMain) || shootersMain < 1) {
      setSaveError(p.matchOrgShootersInvalid)
      return
    }
    let shootersPrematch = Math.floor(Number(draft.shooters_per_prematch_squad))
    if (!draft.prematch_enabled) {
      shootersPrematch = Math.max(1, shootersPrematch)
    } else if (!Number.isFinite(shootersPrematch) || shootersPrematch < 1) {
      setSaveError(p.matchOrgShootersInvalid)
      return
    }

    const row = {
      organizer_id: user.id,
      title,
      description_md: draft.description_md.trim() ? draft.description_md : null,
      starts_at: isoFromDatetimeLocal(draft.starts_at_local),
      location_label: draft.location_label.trim() ? draft.location_label.trim() : null,
      cover_image_url: draft.cover_image_url.trim() ? draft.cover_image_url.trim() : null,
      discipline: 'shotgun' as const,
      status: draft.status,
      participant_list_visibility: draft.participant_list_visibility,
      match_event_kind:
        draft.match_event_kind && isMatchEventKind(draft.match_event_kind)
          ? draft.match_event_kind
          : null,
      ps_match_level:
        draft.ps_match_level && isPsMatchLevel(draft.ps_match_level) ? draft.ps_match_level : null,
      ps_match_subtype: 'ipsc',
      prematch_enabled: draft.prematch_enabled,
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
    setDraft((d) => ({ ...d, cover_image_url: pub.publicUrl }))
    return true
  }

  async function handleCoverFileChange(e: ChangeEvent<HTMLInputElement>) {
    setCoverUploadErr(null)
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
          const blob = await cropRectRegionToJpeg(url, { x: 0, y: 0, width, height })
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

  const derivedCompetitorLimit =
    draft.planned_main_squad_count * draft.shooters_per_main_squad +
    (draft.prematch_enabled ? draft.planned_prematch_squad_count * draft.shooters_per_prematch_squad : 0)

  return (
    <div className="portal-home">
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

      {squadSyncBanner ?
        <div className="portal-match-org-form__alert portal-match-org-form__alert--above-form" role="alert">
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

      <section className="portal-match-org-quick" aria-label={p.matchOrgQuickActionsAria}>
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
              className="portal-btn portal-btn--ghost portal-btn--compact portal-match-org-quick__btn"
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

        {!isNew && validEditId && matchId ?
          <p className="portal-match-org-quick__psc-hint">{p.matchOrgExportPscHint}</p>
        : null}
      </section>

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
            value={draft.location_label}
            onChange={(e) => setDraft((d) => ({ ...d, location_label: e.target.value }))}
          />
        </label>

        {!isNew && validEditId ?
          <div className="portal-match-org-form__cover-block">
            <span className="portal-match-org-form__label">{p.matchOrgFieldCoverImage}</span>
            {draft.cover_image_url.trim() ?
              <div className="portal-match-org-form__cover-row">
                <img
                  src={draft.cover_image_url.trim()}
                  alt=""
                  className="portal-match-org-form__cover-preview"
                />
                <button
                  type="button"
                  className="portal-btn portal-btn--secondary portal-btn--compact"
                  disabled={saving || Boolean(coverCropSrc)}
                  onClick={() => {
                    setCoverUploadErr(null)
                    setDraft((d) => ({ ...d, cover_image_url: '' }))
                  }}
                >
                  {p.matchOrgCoverRemove}
                </button>
              </div>
            : null}
            <label className="portal-match-org-form__cover-upload">
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                disabled={saving || Boolean(coverCropSrc)}
                onChange={(e) => void handleCoverFileChange(e)}
                style={{ display: 'none' }}
              />
              <span className="portal-btn portal-btn--secondary portal-btn--compact">{p.matchOrgCoverUpload}</span>
            </label>
            {coverUploadErr ?
              <p role="alert" className="portal-match-org-form__hint portal-match-org-form__hint--error">
                {coverUploadErr}
              </p>
            : null}
          </div>
        : (
          <p className="portal-match-org-form__hint">{p.matchOrgCoverHintNew}</p>
        )}

        <section className="portal-match-org-form__section" aria-labelledby="match-org-catalog-heading">
          <h2 id="match-org-catalog-heading" className="portal-match-org-form__section-heading">
            {p.matchOrgSectionCatalogHeading}
          </h2>
          <p className="portal-match-org-form__hint portal-match-org-form__hint--section">{p.matchOrgTaxonomyOptionalLead}</p>

          <label className="portal-match-org-form__field">
            <span className="portal-match-org-form__label">{p.matchOrgFieldEventKind}</span>
            <select
              className="portal-match-org-form__control portal-match-org-form__control--select"
              value={draft.match_event_kind}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  match_event_kind: e.target.value as MatchDraft['match_event_kind'],
                }))
              }
            >
              <option value="">{p.matchOrgEventKindUnset}</option>
              <option value="training">{p.matchEventKindTraining}</option>
              <option value="match">{p.matchEventKindMatch}</option>
              <option value="classification">{p.matchEventKindClassification}</option>
            </select>
          </label>

          <label className="portal-match-org-form__field">
            <span className="portal-match-org-form__label">{p.matchOrgFieldPsLevel}</span>
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
        </section>

        <section className="portal-match-org-form__section" aria-labelledby="match-org-plan-heading">
          <h2 id="match-org-plan-heading" className="portal-match-org-form__section-heading">
            {p.matchOrgSectionPlanHeading}
          </h2>

          <label className="portal-match-org-form__field portal-match-org-form__field--narrow">
            <span className="portal-match-org-form__label">{p.matchOrgFieldShootersMain}</span>
            <input
              type="number"
              min={1}
              required
              className="portal-match-org-form__control portal-match-org-form__control--number"
              value={draft.shooters_per_main_squad}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  shooters_per_main_squad: Math.max(1, Number(e.target.value) || 1),
                }))
              }
            />
          </label>

          <label className="portal-match-org-form__checkbox">
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

          <label className="portal-match-org-form__field portal-match-org-form__field--narrow">
            <span className="portal-match-org-form__label">{p.matchOrgFieldPlannedMainSquads}</span>
            <input
              type="number"
              min={1}
              required
              className="portal-match-org-form__control portal-match-org-form__control--number"
              value={draft.planned_main_squad_count}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  planned_main_squad_count: Math.max(1, Number(e.target.value) || 1),
                }))
              }
            />
          </label>

          {draft.prematch_enabled ?
            <>
              <label className="portal-match-org-form__field portal-match-org-form__field--narrow">
                <span className="portal-match-org-form__label">{p.matchOrgFieldPlannedPrematchSquads}</span>
                <input
                  type="number"
                  min={1}
                  required
                  className="portal-match-org-form__control portal-match-org-form__control--number"
                  value={draft.planned_prematch_squad_count || 1}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      planned_prematch_squad_count: Math.max(1, Number(e.target.value) || 1),
                    }))
                  }
                />
              </label>

              <label className="portal-match-org-form__field portal-match-org-form__field--narrow">
                <span className="portal-match-org-form__label">{p.matchOrgFieldShootersPrematch}</span>
                <input
                  type="number"
                  min={1}
                  required
                  className="portal-match-org-form__control portal-match-org-form__control--number"
                  value={draft.shooters_per_prematch_squad}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      shooters_per_prematch_squad: Math.max(1, Number(e.target.value) || 1),
                    }))
                  }
                />
              </label>
            </>
          : null}

          <p className="portal-match-org-form__capacity">
            {formatTemplate(p.matchOrgDerivedCapacityLine, { total: String(derivedCompetitorLimit) })}
          </p>
        </section>

        <section className="portal-match-org-form__section" aria-labelledby="match-org-pub-heading">
          <h2 id="match-org-pub-heading" className="portal-match-org-form__section-heading">
            {p.matchOrgSectionPublishHeading}
          </h2>

          <label className="portal-match-org-form__field">
            <span className="portal-match-org-form__label">{p.matchOrgFieldDescription}</span>
            <textarea
              id="match-org-description"
              rows={6}
              className="portal-match-org-form__control portal-match-org-form__control--textarea"
              aria-describedby="match-org-description-hint"
              value={draft.description_md}
              onChange={(e) => setDraft((d) => ({ ...d, description_md: e.target.value }))}
            />
          </label>
          <p id="match-org-description-hint" className="portal-match-org-form__hint">
            {p.matchOrgFieldDescriptionHint}
          </p>

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

          <div className="portal-match-org-form__footnotes">
            <p className="portal-match-org-form__hint">{p.matchOrgParticipantsListFootnote}</p>
            <p className="portal-match-org-form__hint">{p.matchOrgDisciplineShotgunNote}</p>
          </div>
        </section>

      </form>

        {!isNew && validEditId && matchId ?
        <>
          <OrganizerMatchStagesPanel locale={locale} matchId={matchId} p={p} />
          <OrganizerMatchSquadsPanel
            locale={locale}
            matchId={matchId}
            p={p}
            prematchEnabled={draft.prematch_enabled}
            plannedMainSquads={draft.planned_main_squad_count}
            plannedPrematchSquads={draft.planned_prematch_squad_count}
            shootersPerMainSquad={draft.shooters_per_main_squad}
            shootersPerPrematchSquad={draft.shooters_per_prematch_squad}
          />
        </>
      : null}
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
