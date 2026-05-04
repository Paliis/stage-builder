import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Locale, MessageTree } from '../../i18n/messages'
import { getSupabase, isSupabaseConfigured } from '../../lib/supabaseClient'
import { formatPortalDate } from '../matches/matchPortalFormat'
import '../PortalHome.css'
import '../PortalMatchesUi.css'

type Portal = MessageTree['portal']

type MatchNested = {
  id: string
  title: string
  starts_at: string
  location_label?: string | null
  status: string
} | null

type MyRegRow = {
  id: string
  match_id: string
  status: string
  created_at: string
  matches: MatchNested
}

export function AccountParticipantHub({
  locale,
  p,
  userId,
}: {
  locale: Locale
  p: Portal
  userId: string
}) {
  const configured = isSupabaseConfigured()
  const sb = useMemo(() => (configured ? getSupabase() : null), [configured])

  const [rows, setRows] = useState<MyRegRow[] | undefined>(undefined)
  const [regErr, setRegErr] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const loadRegs = useCallback(async () => {
    if (!sb) return
    await Promise.resolve()
    setRegErr(null)
    const { data, error } = await sb
      .from('match_registrations')
      .select(
        `
        id,
        match_id,
        status,
        created_at,
        matches ( id, title, starts_at, location_label, status )
      `,
      )
      .eq('competitor_user_id', userId)
      .order('created_at', { ascending: false })
    if (error) {
      setRegErr(error.message)
      setRows([])
      return
    }
    setRows((data ?? []) as unknown as MyRegRow[])
  }, [sb, userId])

  useEffect(() => {
    queueMicrotask(() => void loadRegs())
  }, [loadRegs])

  const cancelReg = useCallback(
    async (id: string) => {
      if (!sb) return
      setBusyId(id)
      setRegErr(null)
      const { error } = await sb.from('match_registrations').update({ status: 'cancelled' }).eq('id', id).eq('competitor_user_id', userId)
      setBusyId(null)
      if (error) {
        setRegErr(error.message)
        return
      }
      await loadRegs()
    },
    [sb, userId, loadRegs],
  )

  const [defDiv, setDefDiv] = useState('')
  const [defClass, setDefClass] = useState('')
  const [defPf, setDefPf] = useState<'MAJOR' | 'MINOR' | ''>('')
  const [defLoading, setDefLoading] = useState(true)
  const [defSaving, setDefSaving] = useState(false)
  const [defFeedback, setDefFeedback] = useState<string | null>(null)

  const loadDefaults = useCallback(async () => {
    if (!sb) return
    await Promise.resolve()
    setDefLoading(true)
    setDefFeedback(null)
    const { data, error } = await sb.from('participant_registration_defaults').select('division, classification_grade, power_factor').eq('user_id', userId).maybeSingle()

    setDefLoading(false)
    if (error) {
      setDefFeedback(error.message)
      return
    }
    const row = data as { division?: string; classification_grade?: string; power_factor?: string | null } | null
    if (row) {
      setDefDiv(typeof row.division === 'string' ? row.division : '')
      setDefClass(typeof row.classification_grade === 'string' ? row.classification_grade : '')
      const pf = typeof row.power_factor === 'string' ? row.power_factor.trim().toUpperCase() : ''
      setDefPf(pf === 'MAJOR' || pf === 'MINOR' ? pf : '')
    }
  }, [sb, userId])

  useEffect(() => {
    queueMicrotask(() => void loadDefaults())
  }, [loadDefaults])

  const saveDefaults = useCallback(async () => {
    if (!sb) return
    setDefSaving(true)
    setDefFeedback(null)
    const { error } = await sb.from('participant_registration_defaults').upsert({
      user_id: userId,
      division: defDiv.trim(),
      classification_grade: defClass.trim(),
      power_factor: defPf === '' ? null : defPf,
    })
    setDefSaving(false)
    if (error) {
      setDefFeedback(error.message)
      return
    }
    setDefFeedback(p.accountParticipantDefaultsSaved)
  }, [sb, userId, defDiv, defClass, defPf, p.accountParticipantDefaultsSaved])

  function regStatusLabel(s: string): string {
    if (s === 'pending') return p.accountMyRegistrationsStatusPending
    if (s === 'confirmed') return p.accountMyRegistrationsStatusConfirmed
    if (s === 'cancelled') return p.accountMyRegistrationsStatusCancelled
    return s
  }

  if (!configured) return null

  return (
    <div className="portal-account__hub">
      <h4 style={{ margin: '0 0 0.45rem', fontSize: '0.97rem', fontWeight: 700, color: 'var(--text-h)' }}>
        {p.accountMyRegistrationsHeading}
      </h4>
      {regErr ?
        <p role="alert" style={{ margin: '0 0 0.65rem', fontSize: '0.88rem' }}>
          {p.accountMyRegistrationsLoadError}: {regErr}
        </p>
      : null}
      {rows === undefined ?
        <p style={{ margin: '0 0 1rem', fontSize: '0.9rem' }}>{p.matchesLoadingDetail}</p>
      : rows.length === 0 ?
        <p style={{ margin: '0 0 1rem', fontSize: '0.92rem', lineHeight: 1.5 }}>{p.accountMyRegistrationsEmpty}</p>
      :
        <div style={{ overflowX: 'auto', margin: '0 0 1.1rem' }}>
          <table style={{ borderCollapse: 'collapse', fontSize: '0.875rem', width: '100%', minWidth: '18rem' }}>
            <thead>
              <tr>
                <th style={{ padding: '0.45rem 0.5rem', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                  {p.accountMyRegistrationsColMatch}
                </th>
                <th style={{ padding: '0.45rem 0.5rem', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                  {p.accountMyRegistrationsColDate}
                </th>
                <th style={{ padding: '0.45rem 0.5rem', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                  {p.accountMyRegistrationsColStatus}
                </th>
                <th style={{ padding: '0.45rem 0.5rem', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                  {p.accountMyRegistrationsColActions}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const m = r.matches
                const title = m?.title?.trim() || p.accountMyRegistrationsMatchUnavailable
                const when = m?.starts_at ? formatPortalDate(m.starts_at, locale) : '—'
                const canCancel = r.status === 'pending'
                return (
                  <tr key={r.id}>
                    <td
                      style={{
                        padding: '0.45rem 0.5rem',
                        borderBottom: '1px solid var(--border)',
                        verticalAlign: 'top',
                        maxWidth: '14rem',
                      }}
                    >
                      {m?.status === 'published' ?
                        <Link
                          className="portal-match-title-ellipsis"
                          title={m?.title?.trim() || ''}
                          to={`/${locale}/matches/${m.id}`}
                        >
                          {title}
                        </Link>
                      : (
                        <span className="portal-match-title-ellipsis" title={title}>
                          {title}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '0.45rem 0.5rem', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
                      {when}
                    </td>
                    <td style={{ padding: '0.45rem 0.5rem', borderBottom: '1px solid var(--border)' }}>
                      {regStatusLabel(r.status)}
                    </td>
                    <td style={{ padding: '0.45rem 0.5rem', borderBottom: '1px solid var(--border)' }}>
                      {m?.status === 'published' ?
                        <Link to={`/${locale}/matches/${m!.id}`} style={{ marginRight: '0.55rem', fontWeight: 650 }}>
                          {p.accountMyRegistrationsOpenMatch}
                        </Link>
                      : null}
                      {canCancel ?
                        <button
                          type="button"
                          className="portal-account__link-btn"
                          disabled={busyId === r.id}
                          onClick={() => void cancelReg(r.id)}
                        >
                          {busyId === r.id ? p.accountMyRegistrationsCancelling : p.accountMyRegistrationsCancel}
                        </button>
                      : null}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      }

      <h4 style={{ margin: '0.35rem 0 0.45rem', fontSize: '0.97rem', fontWeight: 700, color: 'var(--text-h)' }}>
        {p.accountParticipantDefaultsHeading}
      </h4>
      <p style={{ margin: '0 0 0.6rem', fontSize: '0.88rem', lineHeight: 1.52 }}>{p.accountParticipantDefaultsLead}</p>
      {defLoading ?
        <p style={{ fontSize: '0.88rem' }}>{p.matchesLoadingDetail}</p>
      :
        <form
          onSubmit={(ev) => {
            ev.preventDefault()
            void saveDefaults()
          }}
          style={{ display: 'grid', gap: '0.55rem', maxWidth: '22rem', fontSize: '0.9rem' }}
        >
          <label style={{ display: 'grid', gap: '0.25rem' }}>
            {p.matchDetailRegistrationDivision}
            <input
              type="text"
              value={defDiv}
              onChange={(e) => setDefDiv(e.target.value)}
              disabled={defSaving}
              autoComplete="off"
            />
          </label>
          <label style={{ display: 'grid', gap: '0.25rem' }}>
            {p.matchDetailRegistrationClass}
            <input
              type="text"
              value={defClass}
              onChange={(e) => setDefClass(e.target.value)}
              disabled={defSaving}
              autoComplete="off"
            />
          </label>
          <label style={{ display: 'grid', gap: '0.25rem' }}>
            {p.matchDetailRegistrationPFOptional}
            <select
              value={defPf}
              onChange={(e) =>
                setDefPf(e.target.value === '' ? '' : e.target.value === 'MAJOR' ? 'MAJOR' : 'MINOR')
              }
              disabled={defSaving}
              style={{ padding: '0.35rem', borderRadius: '6px', border: '1px solid var(--border)', maxWidth: '12rem' }}
            >
              <option value="">{p.matchDetailRegistrationPFNone}</option>
              <option value="MAJOR">{p.matchDetailRegistrationPFMajor}</option>
              <option value="MINOR">{p.matchDetailRegistrationPFMinor}</option>
            </select>
          </label>
          {defFeedback ?
            <p role="status" style={{ margin: 0, fontSize: '0.86rem', whiteSpace: 'pre-wrap' }}>
              {defFeedback}
            </p>
          : null}
          <button type="submit" className="portal-shell__account-sign-out" style={{ width: 'fit-content', marginTop: '0.15rem' }} disabled={defSaving}>
            {defSaving ? p.accountParticipantDefaultsSaving : p.accountParticipantDefaultsSave}
          </button>
        </form>
      }
    </div>
  )
}
