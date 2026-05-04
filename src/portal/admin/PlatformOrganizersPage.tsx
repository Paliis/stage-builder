import { useCallback, useEffect, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n/useI18n'
import { getSupabase, isSupabaseConfigured } from '../../lib/supabaseClient'
import { useSupabaseSession } from '../useSupabaseSession'
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

type FilterMode = 'all' | 'applications' | 'pending_all'

const MOD_NOTE_MAX = 600

function normalizeStatus(s: string): OrganizerStatus | null {
  if (s === 'pending' || s === 'active' || s === 'blocked') return s
  return null
}

function isApplicationPending(row: OrganizerRow): boolean {
  return normalizeStatus(row.organizer_status) === 'pending' && Number(row.matches_count) === 0
}

function sortRows(a: OrganizerRow, b: OrganizerRow): number {
  const appA = isApplicationPending(a)
  const appB = isApplicationPending(b)
  if (appA !== appB) return appA ? -1 : 1
  return (a.email ?? '').localeCompare(b.email ?? '', undefined, { sensitivity: 'base' })
}

function CellEllipsis({ text, emptyLabel }: { text: string | null | undefined; emptyLabel: string }) {
  const s = typeof text === 'string' ? text.trim() : ''
  if (!s.length) return <span className="portal-org-admin__cell-empty">{emptyLabel}</span>
  return (
    <div className="portal-org-admin__cell-clamp" title={s}>
      {s}
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

  const filteredRows = useMemo(() => {
    return rows
      .filter((row) => {
        const st = normalizeStatus(row.organizer_status)
        if (filterMode === 'applications') return isApplicationPending(row)
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

  const rowIsDirty = (row: OrganizerRow): boolean => {
    const { saved, selected, moderationDraft, moderationSaved } = deriveUiState(row)
    if (selected !== saved) return true
    if (selected === 'blocked' && moderationDraft.trim() !== moderationSaved) return true
    return false
  }

  const onSaveRow = async (row: OrganizerRow) => {
    if (!configured) return
    if (!rowIsDirty(row)) return
    const { selected, moderationDraft } = deriveUiState(row)

    const moderationTrim = moderationDraft.trim()
    if (moderationTrim.length > MOD_NOTE_MAX) {
      setSaveError(p.organizersModerationNoteTooLong)
      return
    }

    setSaveError(null)
    setSavingId(row.user_id)
    const sb = getSupabase()

    const { error } = await sb.rpc('platform_set_match_organizer_status', {
      p_target_user: row.user_id,
      p_status: selected,
      p_moderation_note: selected === 'blocked' ? moderationTrim || null : null,
    })

    setSavingId(null)
    if (error) {
      setSaveError(error.message)
      return
    }

    await loadRows()
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

  if (sessionLoading || adminLoading) {
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
    return (
      <div className="portal-home">
        <Helmet>
          <title>{p.organizersAdminHelmetTitle}</title>
        </Helmet>
        <p>{p.organizersNeedSignIn}</p>
        <nav className="portal-page-context portal-page-context--solo-link" aria-label={p.portalBreadcrumbAria}>
          <Link to={`/${locale}`}>{p.organizersBackHome}</Link>
        </nav>
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
    <div className="portal-home">
      <Helmet>
        <title>{p.organizersAdminHelmetTitle}</title>
      </Helmet>
      <nav className="portal-page-context portal-page-context--solo-link" aria-label={p.portalBreadcrumbAria}>
        <Link to={`/${locale}`}>{p.organizersBackHome}</Link>
      </nav>
      <div className="portal-home__hero">
        <h1 className="portal-home__hero-title">{p.organizersAdminTitle}</h1>
        <p className="portal-org-admin__intro">{p.organizersAdminIntro}</p>
      </div>

      {listError ? (
        <p role="alert">
          {p.organizersLoadError}: {listError}
        </p>
      ) : null}
      {saveError ? (
        <p role="alert">
          {p.organizersLoadError}: {saveError}
        </p>
      ) : null}

      <div className="portal-org-admin__filters" role="group" aria-label="Filter">
        {(
          [
            ['all', p.organizersFilterAll],
            ['applications', p.organizersFilterApplications],
            ['pending_all', p.organizersFilterPendingAll],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={
              filterMode === key ? 'portal-org-admin__filter portal-org-admin__filter--on' : 'portal-org-admin__filter'
            }
            onClick={() => setFilterMode(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="portal-org-admin">
        <table className="portal-org-admin__table">
          <thead>
            <tr>
              <th>{p.organizersColEmail}</th>
              <th>{p.organizersColDisplayName}</th>
              <th>{p.organizersColMatches}</th>
              <th>{p.organizersColBadge}</th>
              <th>{p.organizersColContact}</th>
              <th>{p.organizersColPastMatches}</th>
              <th>{p.organizersColStatus}</th>
              <th>{p.organizersColModeration}</th>
              <th aria-label={p.organizersSave} />
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => {
              const saved = normalizeStatus(row.organizer_status) ?? 'pending'
              const { selected, moderationDraft, moderationSaved } = deriveUiState(row)
              const dirty = rowIsDirty(row)
              const busy = savingId === row.user_id
              const badge =
                normalizeStatus(row.organizer_status) === 'pending' && Number(row.matches_count) === 0 ?
                  p.organizersBadgeApplication
                : normalizeStatus(row.organizer_status) === 'pending' && Number(row.matches_count) > 0 ?
                  p.organizersBadgePendingExtra
                : '—'

              return (
                <tr key={row.user_id}>
                  <td>{row.email ?? '—'}</td>
                  <td>{row.display_name?.trim() ? row.display_name : '—'}</td>
                  <td>{Number(row.matches_count)}</td>
                  <td>
                    <span className="portal-org-admin__badge">{badge}</span>
                  </td>
                  <td className="portal-org-admin__cell-wide">
                    <CellEllipsis text={row.organizer_application_contact} emptyLabel={p.organizersApplicationEmpty} />
                  </td>
                  <td className="portal-org-admin__cell-wide">
                    <CellEllipsis
                      text={row.organizer_application_past_matches}
                      emptyLabel={p.organizersApplicationEmpty}
                    />
                  </td>
                  <td>
                    <select
                      className="portal-org-admin__select"
                      value={selected}
                      onChange={(e) => {
                        const v = normalizeStatus(e.target.value)
                        if (!v) return
                        setSaveError(null)
                        setSelectByUser((prev) => ({ ...prev, [row.user_id]: v }))
                        if (v === 'blocked') {
                          const prevNote =
                            normalizeStatus(row.organizer_status) === 'blocked' ?
                              (typeof row.organizer_moderation_note === 'string' ? row.organizer_moderation_note : '')
                                .trim()
                            : ''
                          setModerationDraftByUser((prev) => ({
                            ...prev,
                            [row.user_id]: prev[row.user_id] ?? prevNote,
                          }))
                        }
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
                  <td className="portal-org-admin__note-cell">
                    {selected === 'blocked' ?
                      <textarea
                        className="portal-org-admin__textarea"
                        rows={2}
                        maxLength={MOD_NOTE_MAX}
                        value={moderationDraft}
                        onChange={(e) => {
                          setSaveError(null)
                          setModerationDraftByUser((prev) => ({ ...prev, [row.user_id]: e.target.value }))
                        }}
                        placeholder={p.organizersModerationNotePlaceholder}
                        aria-label={p.organizersModerationNoteLabel}
                      />
                    : saved === 'blocked' && moderationSaved ?
                      <div className="portal-org-admin__note-readonly" title={moderationSaved}>
                        {moderationSaved}
                      </div>
                    : (
                      <span className="portal-org-admin__cell-empty">{p.organizersApplicationEmpty}</span>
                    )}
                  </td>
                  <td className="portal-org-admin__actions">
                    <button
                      type="button"
                      className="portal-org-admin__save-btn"
                      disabled={!dirty || busy}
                      onClick={() => void onSaveRow(row)}
                    >
                      {busy ? p.organizersSaving : p.organizersSave}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
