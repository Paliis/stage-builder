import { useCallback, useEffect, useState } from 'react'
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
}

function normalizeStatus(s: string): OrganizerStatus | null {
  if (s === 'pending' || s === 'active' || s === 'blocked') return s
  return null
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
  const [savingId, setSavingId] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const loadRows = useCallback(async () => {
    if (!configured) return
    const sb = getSupabase()
    setListError(null)
    const { data, error } = await sb.rpc('platform_list_match_organizers')
    if (error) {
      setListError(error.message)
      setRows([])
      return
    }
    const list = (data ?? []) as OrganizerRow[]
    list.sort((a, b) => (a.email ?? '').localeCompare(b.email ?? '', undefined, { sensitivity: 'base' }))
    setRows(list)
    setSelectByUser({})
  }, [configured])

  useEffect(() => {
    if (!configured || sessionLoading) return
    if (!user?.id) {
      setAdminLoading(false)
      setIsAdmin(false)
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

  const statusLabel = (s: OrganizerStatus) =>
    s === 'pending' ? p.organizersStatusPending
    : s === 'active' ? p.organizersStatusActive
    : p.organizersStatusBlocked

  const onSave = async (row: OrganizerRow) => {
    const server = normalizeStatus(row.organizer_status) ?? 'pending'
    const next = selectByUser[row.user_id] ?? server
    if (next === server) return
    if (!configured) return
    setSaveError(null)
    setSavingId(row.user_id)
    const sb = getSupabase()
    const { error } = await sb.rpc('platform_set_match_organizer_status', {
      p_target_user: row.user_id,
      p_status: next,
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
        <p>
          <Link to={`/${locale}`}>{p.organizersBackHome}</Link>
        </p>
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
        <p>
          <Link to={`/${locale}`}>{p.organizersBackHome}</Link>
        </p>
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
        <p>
          <Link to={`/${locale}`}>{p.organizersBackHome}</Link>
        </p>
      </div>
    )
  }

  return (
    <div className="portal-home">
      <Helmet>
        <title>{p.organizersAdminHelmetTitle}</title>
      </Helmet>
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

      <div className="portal-org-admin">
        <table className="portal-org-admin__table">
          <thead>
            <tr>
              <th>{p.organizersColEmail}</th>
              <th>{p.organizersColDisplayName}</th>
              <th>{p.organizersColMatches}</th>
              <th>{p.organizersColStatus}</th>
              <th aria-label={p.organizersSave} />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const saved = normalizeStatus(row.organizer_status) ?? 'pending'
              const current = selectByUser[row.user_id] ?? saved
              const dirty = current !== saved
              const busy = savingId === row.user_id
              return (
                <tr key={row.user_id}>
                  <td>{row.email ?? '—'}</td>
                  <td>{row.display_name?.trim() ? row.display_name : '—'}</td>
                  <td>{Number(row.matches_count)}</td>
                  <td>
                    <select
                      className="portal-org-admin__select"
                      value={current}
                      onChange={(e) => {
                        const v = normalizeStatus(e.target.value)
                        if (!v) return
                        setSaveError(null)
                        setSelectByUser((prev) => ({ ...prev, [row.user_id]: v }))
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
                  <td className="portal-org-admin__actions">
                    <button
                      type="button"
                      className="portal-org-admin__save-btn"
                      disabled={!dirty || busy}
                      onClick={() => void onSave(row)}
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

      <p>
        <Link to={`/${locale}`}>{p.organizersBackHome}</Link>
      </p>
    </div>
  )
}
