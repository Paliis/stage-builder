import { type FormEvent, useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useI18n } from '../../i18n/useI18n'
import { formatTemplate } from '../../i18n/format'
import { getSupabase, isSupabaseConfigured } from '../../lib/supabaseClient'
import { useSupabaseSession } from '../useSupabaseSession'
import { MATCH_ID_UUID_RE } from './matchPortalUuid'
import { OrganizerMatchSquadsPanel } from './OrganizerMatchSquadsPanel'
import { organizerSquadSyncErrorMessage } from './organizerSquadSyncErrorMessage'
import '../PortalHome.css'

type MatchDraft = {
  title: string
  description_md: string
  starts_at_local: string
  location_label: string
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
        'id, title, description_md, starts_at, location_label, status, participant_list_visibility, organizer_id, prematch_enabled, planned_main_squad_count, planned_prematch_squad_count, shooters_per_main_squad, shooters_per_prematch_squad',
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
  ])

  useEffect(() => {
    const msg = (location.state as { squadSyncWarning?: string } | null)?.squadSyncWarning
    if (typeof msg === 'string' && msg.trim()) setSquadSyncBanner(msg.trim())
  }, [location.state])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaveError(null)
    if (!configured || !user?.id || saving) return
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
      discipline: 'shotgun' as const,
      status: draft.status,
      participant_list_visibility: draft.participant_list_visibility,
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

  if (!configured) {
    return (
      <div className="portal-home">
        <Helmet>
          <title>{p.myMatchesHelmet}</title>
        </Helmet>
        <p>{p.matchesSupabaseUnset}</p>
        <Link to={`/${locale}/matches/my`}>{p.matchOrgBackList}</Link>
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
        <Link to={`/${locale}/matches/my`}>{p.matchOrgBackList}</Link>
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
        <p>
          <Link to={`/${locale}/matches/my`}>{p.matchOrgBackList}</Link>
        </p>
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

      <p style={{ margin: '0 0 1rem' }}>
        <Link to={`/${locale}/matches/my`}>{p.matchOrgBackList}</Link>
      </p>

      <header className="portal-home__hero">
        <h1 className="portal-home__hero-title">{pageTitle}</h1>
      </header>

      {squadSyncBanner ?
        <p role="alert" style={{ margin: '0 0 1rem', maxWidth: '32rem', fontSize: '0.9rem' }}>
          {formatTemplate(p.matchOrgSquadSyncBanner, { detail: squadSyncBanner })}
          <button
            type="button"
            onClick={() => setSquadSyncBanner(null)}
            style={{
              marginLeft: '0.75rem',
              padding: '0.2rem 0.45rem',
              cursor: 'pointer',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'var(--btn-bg)',
              color: 'var(--text)',
            }}
          >
            {p.matchOrgSquadSyncBannerDismiss}
          </button>
        </p>
      : null}

      <form
        onSubmit={(e) => void handleSubmit(e)}
        style={{ maxWidth: '32rem', display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.95rem' }}
      >
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span>{p.matchOrgFieldTitle}</span>
          <input
            type="text"
            required
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            autoComplete="off"
            style={{
              padding: '0.4rem 0.5rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border)',
              background: 'var(--btn-bg)',
              color: 'var(--text)',
            }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span>{p.matchOrgFieldStarts}</span>
          <input
            type="datetime-local"
            required
            value={draft.starts_at_local}
            onChange={(e) => setDraft((d) => ({ ...d, starts_at_local: e.target.value }))}
            style={{
              padding: '0.4rem 0.5rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border)',
              background: 'var(--btn-bg)',
              color: 'var(--text)',
            }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span>{p.matchOrgFieldLocation}</span>
          <input
            type="text"
            value={draft.location_label}
            onChange={(e) => setDraft((d) => ({ ...d, location_label: e.target.value }))}
            style={{
              padding: '0.4rem 0.5rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border)',
              background: 'var(--btn-bg)',
              color: 'var(--text)',
            }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span>{p.matchOrgFieldShootersMain}</span>
          <input
            type="number"
            min={1}
            required
            value={draft.shooters_per_main_squad}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                shooters_per_main_squad: Math.max(1, Number(e.target.value) || 1),
              }))
            }
            style={{
              padding: '0.4rem 0.5rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border)',
              background: 'var(--btn-bg)',
              color: 'var(--text)',
              maxWidth: '8rem',
            }}
          />
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={draft.prematch_enabled}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                prematch_enabled: e.target.checked,
                planned_prematch_squad_count: e.target.checked ? Math.max(1, d.planned_prematch_squad_count) : 0,
              }))
            }
            style={{ width: '1rem', height: '1rem' }}
          />
          <span>{p.matchOrgFieldPrematch}</span>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span>{p.matchOrgFieldPlannedMainSquads}</span>
          <input
            type="number"
            min={1}
            required
            value={draft.planned_main_squad_count}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                planned_main_squad_count: Math.max(1, Number(e.target.value) || 1),
              }))
            }
            style={{
              padding: '0.4rem 0.5rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border)',
              background: 'var(--btn-bg)',
              color: 'var(--text)',
              maxWidth: '8rem',
            }}
          />
        </label>

        {draft.prematch_enabled ?
          <>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span>{p.matchOrgFieldPlannedPrematchSquads}</span>
              <input
                type="number"
                min={1}
                required
                value={draft.planned_prematch_squad_count || 1}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    planned_prematch_squad_count: Math.max(1, Number(e.target.value) || 1),
                  }))
                }
                style={{
                  padding: '0.4rem 0.5rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border)',
                  background: 'var(--btn-bg)',
                  color: 'var(--text)',
                  maxWidth: '8rem',
                }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <span>{p.matchOrgFieldShootersPrematch}</span>
              <input
                type="number"
                min={1}
                required
                value={draft.shooters_per_prematch_squad}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    shooters_per_prematch_squad: Math.max(1, Number(e.target.value) || 1),
                  }))
                }
                style={{
                  padding: '0.4rem 0.5rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border)',
                  background: 'var(--btn-bg)',
                  color: 'var(--text)',
                  maxWidth: '8rem',
                }}
              />
            </label>
          </>
        : null}

        <p style={{ margin: 0, fontSize: '0.92rem', lineHeight: 1.5 }}>
          {formatTemplate(p.matchOrgDerivedCapacityLine, { total: String(derivedCompetitorLimit) })}
        </p>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span>{p.matchOrgFieldDescription}</span>
          <textarea
            rows={6}
            value={draft.description_md}
            onChange={(e) => setDraft((d) => ({ ...d, description_md: e.target.value }))}
            style={{
              padding: '0.45rem 0.5rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border)',
              background: 'var(--btn-bg)',
              color: 'var(--text)',
              fontFamily: 'inherit',
              resize: 'vertical',
            }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span>{p.matchOrgFieldStatus}</span>
          <select
            value={draft.status}
            onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}
            style={{
              padding: '0.4rem 0.5rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border)',
              background: 'var(--btn-bg)',
              color: 'var(--text)',
              maxWidth: '14rem',
            }}
          >
            <option value="draft">{p.matchOrgStatusDraft}</option>
            <option value="published">{p.matchOrgStatusPublished}</option>
            <option value="cancelled">{p.matchOrgStatusCancelled}</option>
            <option value="completed">{p.matchOrgStatusCompleted}</option>
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span>{p.matchOrgFieldParticipantList}</span>
          <select
            value={draft.participant_list_visibility}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                participant_list_visibility: e.target.value === 'open' ? 'open' : 'closed',
              }))
            }
            style={{
              padding: '0.4rem 0.5rem',
              borderRadius: '0.5rem',
              border: '1px solid var(--border)',
              background: 'var(--btn-bg)',
              color: 'var(--text)',
              maxWidth: '14rem',
            }}
          >
            <option value="closed">{p.matchOrgParticipantsListClosed}</option>
            <option value="open">{p.matchOrgParticipantsListOpen}</option>
          </select>
        </label>

        <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.9 }}>
          {p.matchOrgParticipantListFootnote}
        </p>

        <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.9 }}>
          {p.matchOrgDisciplineShotgunNote}
        </p>

        {saveError ? (
          <p role="alert" style={{ margin: 0 }}>
            {saveError}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={saving}
          style={{
            alignSelf: 'flex-start',
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            border: '1px solid var(--border)',
            background: 'var(--text-h)',
            color: 'var(--btn-bg)',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? p.matchOrgSaveSaving : p.matchOrgSave}
        </button>

        {!isNew && draft.status === 'published' ? (
          <p style={{ margin: 0 }}>
            <Link to={`/${locale}/matches/${matchId}`}>{p.myMatchesViewPublic}</Link>
          </p>
        ) : null}
      </form>

        {!isNew && validEditId && matchId ?
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
      : null}
    </div>
  )
}
