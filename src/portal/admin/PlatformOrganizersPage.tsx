import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, Navigate } from 'react-router-dom'
import { useI18n } from '../../i18n/useI18n'
import { getSupabase, isSupabaseConfigured } from '../../lib/supabaseClient'
import { useSupabaseSession } from '../useSupabaseSession'
import '../PortalMatchesUi.css'
import '../PortalHome.css'
import './PlatformOrganizersPage.css'

type OrganizerStatus = 'pending' | 'active' | 'blocked'

type OrganizerRow = {
  user_id: string
  email: string | null
  display_name: string | null
  organizer_status: string
  matches_count: number
  organizer_application_contact?: string | null
  organizer_application_past_matches?: string | null
  organizer_moderation_note?: string | null
}

type FilterMode = 'all' | 'pending_all'

const MOD_NOTE_MAX = 600

function normalizeStatus(s: string): OrganizerStatus | null {
  if (s === 'pending' || s === 'active' || s === 'blocked') return s
  return null
}

function sortRows(a: OrganizerRow, b: OrganizerRow): number {
  return (a.email ?? '').localeCompare(b.email ?? '', undefined, { sensitivity: 'base' })
}

function OrganizerCandidateApplicationCell({
  contact,
  pastMatches,
  emptyLabel,
  contactCaption,
  pastCaption,
}: {
  contact: string | null | undefined
  pastMatches: string | null | undefined
  emptyLabel: string
  contactCaption: string
  pastCaption: string
}) {
  const c = typeof contact === 'string' ? contact.trim() : ''
  const pm = typeof pastMatches === 'string' ? pastMatches.trim() : ''
  if (!c.length && !pm.length) return <span className="portal-org-admin__cell-empty">{emptyLabel}</span>
  return (
    <div className="portal-org-admin__candidate-stack">
      {c.length ?
        <div className="portal-org-admin__candidate-chunk">
          <div className="portal-org-admin__candidate-caption">{contactCaption}</div>
          <div className="portal-org-admin__candidate-body">{c}</div>
        </div>
      : null}
      {pm.length ?
        <div className="portal-org-admin__candidate-chunk">
          <div className="portal-org-admin__candidate-caption">{pastCaption}</div>
          <div className="portal-org-admin__candidate-body">{pm}</div>
        </div>
      : null}
    </div>
  )
}

export function PlatformOrganizersPage() {
  const { locale, tree } = useI18n()
  const p = tree.portal
  const configured = isSupabaseConfigured()
  const { loading: sessionLoading, user } = useSupabaseSession()
  const [adminLoading, setAdminLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [rows, setRows] = useState<OrganizerRow[]>([])
  const [listError, setListError] = useState<string | null>(null)
  const [selectByUser, setSelectByUser] = useState<Record<string, OrganizerStatus>>({})
  const [moderationDraftByUser, setModerationDraftByUser] = useState<Record<string, string>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [filterMode, setFilterMode] = useState<FilterMode>('all')
  const moderationSaveTimers = useRef<Record<string, number>>({})

  const loadRows = useCallback(async () => {
    if (!configured) return
    await Promise.resolve()
    const sb = getSupabase()
    setListError(null)
    const { data, error } = await sb.rpc('platform_list_match_organizers')
    if (error) {
      setListError(error.message)
      setRows([])
      setModerationDraftByUser({})
      return
    }
    const list = (data ?? []) as OrganizerRow[]
    list.sort(sortRows)
    setRows(list)
    setSelectByUser({})

    const nextDraft: Record<string, string> = {}
    for (const r of list) {
      if (normalizeStatus(r.organizer_status) !== 'blocked') continue
      nextDraft[r.user_id] =
        typeof r.organizer_moderation_note === 'string' ? r.organizer_moderation_note.trim() : ''
    }
    setModerationDraftByUser(nextDraft)
  }, [configured])

  useEffect(() => {
    if (!configured || sessionLoading) return
    if (!user?.id) {
      queueMicrotask(() => {
        setAdminLoading(false)
        setIsAdmin(false)
      })
      return
    }
    let cancelled = false
    const sb = getSupabase()
    void (async () => {
      const { data, error } = await sb.rpc('platform_is_platform_admin')
      if (cancelled) return
      if (error) {
        setListError(error.message)
        setIsAdmin(false)
        setAdminLoading(false)
        return
      }
      setIsAdmin(Boolean(data))
      setAdminLoading(false)
      if (data) await loadRows()
    })()
    return () => {
      cancelled = true
    }
  }, [configured, sessionLoading, user?.id, loadRows])

  useEffect(() => {
    return () => {
      for (const id of Object.keys(moderationSaveTimers.current)) {
        window.clearTimeout(moderationSaveTimers.current[id])
      }
      moderationSaveTimers.current = {}
    }
  }, [])

  const filteredRows = useMemo(() => {
    return rows
      .filter((row) => {
        const st = normalizeStatus(row.organizer_status)
        if (filterMode === 'pending_all') return st === 'pending'
        return true
      })
      .slice()
      .sort(sortRows)
  }, [rows, filterMode])

  const statusLabel = (s: OrganizerStatus) =>
    s === 'pending' ? p.organizersStatusPending
    : s === 'active' ? p.organizersStatusActive
    : p.organizersStatusBlocked

  const deriveUiState = (
    row: OrganizerRow,
  ): {
    saved: OrganizerStatus
    selected: OrganizerStatus
    moderationDraft: string
    moderationSaved: string
  } => {
    const saved = normalizeStatus(row.organizer_status) ?? 'pending'
    const selected = selectByUser[row.user_id] ?? saved
    const moderationSaved =
      normalizeStatus(row.organizer_status) === 'blocked' ?
        (typeof row.organizer_moderation_note === 'string' ? row.organizer_moderation_note : '').trim()
      : ''

    const moderationDraft =
      moderationDraftByUser[row.user_id] !== undefined ?
        moderationDraftByUser[row.user_id]
      : selected === 'blocked' ?
        moderationSaved
      : ''

    return { saved, selected, moderationDraft, moderationSaved }
  }

  const persistOrganizer = useCallback(
    async (userId: string, nextStatus: OrganizerStatus, noteWhenBlocked: string) => {
      if (!configured) return
      const moderationTrim = noteWhenBlocked.trim()
      if (nextStatus === 'blocked' && moderationTrim.length > MOD_NOTE_MAX) {
        setSaveError(p.organizersModerationNoteTooLong)
        return
      }
      setSaveError(null)
      setSavingId(userId)
      const sb = getSupabase()
      const { error } = await sb.rpc('platform_set_match_organizer_status', {
        p_target_user: userId,
        p_status: nextStatus,
        p_moderation_note: nextStatus === 'blocked' ? moderationTrim || null : null,
      })
      setSavingId(null)
      if (error) {
        setSaveError(error.message)
        return
      }
      await loadRows()
    },
    [configured, loadRows, p.organizersModerationNoteTooLong],
  )

  const clearModerationDebounce = (userId: string) => {
    const t = moderationSaveTimers.current[userId]
    if (t !== undefined) {
      window.clearTimeout(t)
      delete moderationSaveTimers.current[userId]
    }
  }

  const scheduleModerationNotePersist = (userId: string, draft: string) => {
    clearModerationDebounce(userId)
    moderationSaveTimers.current[userId] = window.setTimeout(() => {
      delete moderationSaveTimers.current[userId]
      void persistOrganizer(userId, 'blocked', draft)
    }, 480)
  }

  if (!configured) {
    return (
      <div className="portal-home">
        <Helmet>
          <title>{p.organizersAdminHelmetTitle}</title>
        </Helmet>
        <p>{p.matchesSupabaseUnset}</p>
        <nav className="portal-page-context portal-page-context--solo-link" aria-label={p.portalBreadcrumbAria}>
          <Link to={`/${locale}`}>{p.organizersBackHome}</Link>
        </nav>
      </div>
    )
  }

  if (sessionLoading) {
    return (
      <div className="portal-home">
        <Helmet>
          <title>{p.organizersAdminHelmetTitle}</title>
        </Helmet>
        <p>{p.organizersLoading}</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate replace to={`/${locale}/account?mode=signup`} />
  }

  if (adminLoading) {
    return (
      <div className="portal-home">
        <Helmet>
          <title>{p.organizersAdminHelmetTitle}</title>
        </Helmet>
        <p>{p.organizersLoading}</p>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="portal-home">
        <Helmet>
          <title>{p.organizersAdminHelmetTitle}</title>
        </Helmet>
        <p role="alert">{p.organizersForbidden}</p>
        <nav className="portal-page-context portal-page-context--solo-link" aria-label={p.portalBreadcrumbAria}>
          <Link to={`/${locale}`}>{p.organizersBackHome}</Link>
        </nav>
      </div>
    )
  }

  return (
    <div className="portal-home portal-org-admin-page">
      <Helmet>
        <title>{p.organizersAdminHelmetTitle}</title>
      </Helmet>
      <nav className="portal-page-context portal-page-context--solo-link" aria-label={p.portalBreadcrumbAria}>
        <Link to={`/${locale}`}>{p.organizersBackHome}</Link>
      </nav>

      <section className="portal-org-admin__surface" aria-labelledby="portal-org-admin-heading">
        <header className="portal-home__hero portal-org-admin__hero">
          <h1 id="portal-org-admin-heading" className="portal-home__hero-title">
            {p.organizersAdminTitle}
          </h1>
          <p className="portal-org-admin__intro">{p.organizersAdminIntro}</p>
        </header>

        {listError || saveError ?
          <div className="portal-org-admin__alerts">
            {listError ?
              <p className="portal-org-admin__alert portal-org-admin__alert--error" role="alert">
                {p.organizersLoadError}: {listError}
              </p>
            : null}
            {saveError ?
              <p className="portal-org-admin__alert portal-org-admin__alert--error" role="alert">
                {p.organizersLoadError}: {saveError}
              </p>
            : null}
          </div>
        : null}

        <div className="portal-org-admin__filters" role="group" aria-label={p.organizersFiltersAria}>
          {(
            [
              ['all', p.organizersFilterAll],
              ['pending_all', p.organizersFilterPendingAll],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={
                filterMode === key ?
                  'portal-btn portal-btn--compact portal-btn--secondary portal-org-admin__filter-chip--active'
                : 'portal-btn portal-btn--compact portal-btn--secondary'
              }
              onClick={() => setFilterMode(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="portal-org-admin__table-shell">
          <table className="portal-org-admin__table">
            <thead>
              <tr>
                <th className="portal-org-admin__col-email">{p.organizersColEmail}</th>
                <th className="portal-org-admin__col-name">{p.organizersColDisplayName}</th>
                <th className="portal-org-admin__col-status">{p.organizersColStatus}</th>
                <th className="portal-org-admin__col-contact">{p.organizersColContact}</th>
                <th className="portal-org-admin__col-mod">{p.organizersColModeration}</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => {
                const saved = normalizeStatus(row.organizer_status) ?? 'pending'
                const { selected, moderationDraft, moderationSaved } = deriveUiState(row)
                const busy = savingId === row.user_id
                const prevBlockedNote =
                  saved === 'blocked' ?
                    (typeof row.organizer_moderation_note === 'string' ? row.organizer_moderation_note : '').trim()
                  : ''

                return (
                  <tr key={row.user_id} aria-busy={busy}>
                    <td className="portal-org-admin__col-email">{row.email ?? '—'}</td>
                    <td className="portal-org-admin__col-name">
                      {row.display_name?.trim() ? row.display_name : '—'}
                    </td>
                    <td className="portal-org-admin__col-status">
                      <select
                        className="portal-org-admin__select"
                        value={selected}
                        disabled={busy}
                        onChange={(e) => {
                          const v = normalizeStatus(e.target.value)
                          if (!v) return
                          setSaveError(null)
                          clearModerationDebounce(row.user_id)
                          const prevDraft = moderationDraftByUser[row.user_id]
                          const noteForBlocked =
                            v === 'blocked' ? (prevDraft !== undefined ? prevDraft : prevBlockedNote) : ''
                          if (v === 'blocked') {
                            setModerationDraftByUser((prev) => ({
                              ...prev,
                              [row.user_id]: noteForBlocked,
                            }))
                          } else {
                            setModerationDraftByUser((prev) => {
                              const next = { ...prev }
                              delete next[row.user_id]
                              return next
                            })
                          }
                          setSelectByUser((prev) => ({ ...prev, [row.user_id]: v }))
                          void persistOrganizer(row.user_id, v, v === 'blocked' ? noteForBlocked : '')
                        }}
                        aria-label={p.organizersColStatus}
                      >
                        {(['pending', 'active', 'blocked'] as const).map((opt) => (
                          <option key={opt} value={opt}>
                            {statusLabel(opt)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="portal-org-admin__col-contact">
                      <OrganizerCandidateApplicationCell
                        contact={row.organizer_application_contact}
                        pastMatches={row.organizer_application_past_matches}
                        emptyLabel={p.organizersApplicationEmpty}
                        contactCaption={p.organizersCandidateAppContactCaption}
                        pastCaption={p.organizersCandidateAppPastCaption}
                      />
                    </td>
                    <td className="portal-org-admin__note-cell portal-org-admin__col-mod">
                      {selected === 'blocked' ?
                        <textarea
                          className="portal-org-admin__textarea"
                          rows={2}
                          maxLength={MOD_NOTE_MAX}
                          value={moderationDraft}
                          disabled={busy}
                          onChange={(e) => {
                            const val = e.target.value
                            setSaveError(null)
                            setModerationDraftByUser((prev) => ({ ...prev, [row.user_id]: val }))
                            scheduleModerationNotePersist(row.user_id, val)
                          }}
                          onBlur={(e) => {
                            clearModerationDebounce(row.user_id)
                            if (selected !== 'blocked') return
                            const d = e.currentTarget.value
                            if (d.trim() === prevBlockedNote.trim()) return
                            void persistOrganizer(row.user_id, 'blocked', d)
                          }}
                          placeholder={p.organizersModerationNotePlaceholder}
                          aria-label={p.organizersModerationNoteLabel}
                        />
                      : saved === 'blocked' && moderationSaved ?
                        <div className="portal-org-admin__note-readonly" title={moderationSaved}>
                          {moderationSaved}
                        </div>
                      : (
                        <p className="portal-org-admin__mod-hint">{p.organizersModerationUnavailableHint}</p>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
