import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Locale, MessageTree } from '../../i18n/messages'
import { getSupabase, isSupabaseConfigured } from '../../lib/supabaseClient'
import { formatPortalDate } from '../matches/matchPortalFormat'
import '../PortalHome.css'
import '../PortalMatchesUi.css'
import './AccountParticipantHub.css'

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

const DEFAULT_SELECT = [
  'division',
  'classification_grade',
  'power_factor',
  'region',
  'category',
  'weapon_class',
].join(', ')

export function AccountParticipantHub({
  locale,
  p,
  userId,
  showMatchRegistrations,
}: {
  locale: Locale
  p: Portal
  userId: string
  /** When false (e.g. prod without `VITE_ENABLE_MATCH_PORTAL`), hide match list only — profile form stays. */
  showMatchRegistrations: boolean
}) {
  const configured = isSupabaseConfigured()
  const sb = useMemo(() => (configured ? getSupabase() : null), [configured])

  const [rows, setRows] = useState<MyRegRow[] | undefined>(undefined)
  const [regErr, setRegErr] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const loadRegs = useCallback(async () => {
    if (!sb || !showMatchRegistrations) return
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
  }, [sb, userId, showMatchRegistrations])

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
  const [defRegion, setDefRegion] = useState('')
  const [defCategory, setDefCategory] = useState('')
  const [defWeaponClass, setDefWeaponClass] = useState('')
  const [defLoading, setDefLoading] = useState(true)
  const [defSaving, setDefSaving] = useState(false)
  const [defFeedback, setDefFeedback] = useState<string | null>(null)

  const loadDefaults = useCallback(async () => {
    if (!sb) return
    await Promise.resolve()
    setDefLoading(true)
    setDefFeedback(null)
    const { data, error } = await sb.from('participant_registration_defaults').select(DEFAULT_SELECT).eq('user_id', userId).maybeSingle()

    setDefLoading(false)
    if (error) {
      setDefFeedback(error.message)
      return
    }
    const row = data as {
      division?: string
      classification_grade?: string
      power_factor?: string | null
      region?: string
      category?: string
      weapon_class?: string
    } | null
    if (row) {
      setDefDiv(typeof row.division === 'string' ? row.division : '')
      setDefClass(typeof row.classification_grade === 'string' ? row.classification_grade : '')
      const pf = typeof row.power_factor === 'string' ? row.power_factor.trim().toUpperCase() : ''
      setDefPf(pf === 'MAJOR' || pf === 'MINOR' ? pf : '')
      setDefRegion(typeof row.region === 'string' ? row.region : '')
      setDefCategory(typeof row.category === 'string' ? row.category : '')
      setDefWeaponClass(typeof row.weapon_class === 'string' ? row.weapon_class : '')
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
      region: defRegion.trim(),
      category: defCategory.trim(),
      weapon_class: defWeaponClass.trim(),
    })
    setDefSaving(false)
    if (error) {
      setDefFeedback(error.message)
      return
    }
    setDefFeedback(p.accountParticipantDefaultsSaved)
  }, [
    sb,
    userId,
    defDiv,
    defClass,
    defPf,
    defRegion,
    defCategory,
    defWeaponClass,
    p.accountParticipantDefaultsSaved,
  ])

  function regStatusLabel(s: string): string {
    if (s === 'pending') return p.accountMyRegistrationsStatusPending
    if (s === 'confirmed') return p.accountMyRegistrationsStatusConfirmed
    if (s === 'cancelled') return p.accountMyRegistrationsStatusCancelled
    return s
  }

  if (!configured) return null

  return (
    <div className="portal-account__hub">
      {!showMatchRegistrations ?
        <p className="portal-account__hub-env-hint" role="note">
          {p.accountParticipantMatchPortalOffHint}
        </p>
      : null}

      {showMatchRegistrations ?
        <section className="portal-account__hub-card" aria-labelledby="hub-regs-heading">
          <h4 id="hub-regs-heading" className="portal-account__hub-card-title">
            {p.accountMyRegistrationsHeading}
          </h4>
          {regErr ?
            <p role="alert" className="portal-account__hub-inline-alert">
              {p.accountMyRegistrationsLoadError}: {regErr}
            </p>
          : null}
          {rows === undefined ?
            <p className="portal-account__hub-muted">{p.matchesLoadingDetail}</p>
          : rows.length === 0 ?
            <p className="portal-account__hub-muted">{p.accountMyRegistrationsEmpty}</p>
          :
            <div className="portal-account__hub-table-wrap">
              <table className="portal-account__hub-table">
                <thead>
                  <tr>
                    <th>{p.accountMyRegistrationsColMatch}</th>
                    <th>{p.accountMyRegistrationsColDate}</th>
                    <th>{p.accountMyRegistrationsColStatus}</th>
                    <th>{p.accountMyRegistrationsColActions}</th>
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
                        <td className="portal-account__hub-td-title">
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
                        <td className="portal-account__hub-td-nowrap">{when}</td>
                        <td>{regStatusLabel(r.status)}</td>
                        <td>
                          {m?.status === 'published' ?
                            <Link to={`/${locale}/matches/${m!.id}`} className="portal-account__hub-action-link">
                              {p.accountMyRegistrationsOpenMatch}
                            </Link>
                          : null}
                          {canCancel ?
                            <>
                              {m?.status === 'published' ? ' · ' : null}
                              <button
                                type="button"
                                className="portal-account__link-btn"
                                disabled={busyId === r.id}
                                onClick={() => void cancelReg(r.id)}
                              >
                                {busyId === r.id ? p.accountMyRegistrationsCancelling : p.accountMyRegistrationsCancel}
                              </button>
                            </>
                          : null}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          }
        </section>
      : null}

      <section className="portal-account__hub-card" aria-labelledby="hub-profile-heading">
        <h4 id="hub-profile-heading" className="portal-account__hub-card-title">
          {p.accountParticipantDefaultsHeading}
        </h4>
        <p className="portal-account__hub-card-lead">{p.accountParticipantProfileSectionLead}</p>
        {defLoading ?
          <p className="portal-account__hub-muted">{p.matchesLoadingDetail}</p>
        :
          <form
            className="portal-account__psc-form"
            onSubmit={(ev) => {
              ev.preventDefault()
              void saveDefaults()
            }}
          >
            <div className="portal-account__psc-grid">
              <label className="portal-account__field">
                {p.accountParticipantFieldRegion}
                <input
                  type="text"
                  value={defRegion}
                  onChange={(e) => setDefRegion(e.target.value)}
                  disabled={defSaving}
                  autoComplete="off"
                  placeholder={p.accountParticipantFieldRegionPlaceholder}
                />
              </label>
              <label className="portal-account__field">
                {p.accountParticipantFieldCategory}
                <input
                  type="text"
                  value={defCategory}
                  onChange={(e) => setDefCategory(e.target.value)}
                  disabled={defSaving}
                  autoComplete="off"
                  placeholder={p.accountParticipantFieldCategoryPlaceholder}
                />
                <span className="portal-account__field-hint">{p.accountParticipantFieldCategoryHint}</span>
              </label>
              <label className="portal-account__field">
                {p.accountParticipantFieldWeaponClass}
                <input
                  type="text"
                  value={defWeaponClass}
                  onChange={(e) => setDefWeaponClass(e.target.value)}
                  disabled={defSaving}
                  autoComplete="off"
                  placeholder={p.accountParticipantFieldWeaponPlaceholder}
                />
              </label>
              <label className="portal-account__field">
                {p.matchDetailRegistrationDivision}
                <input
                  type="text"
                  value={defDiv}
                  onChange={(e) => setDefDiv(e.target.value)}
                  disabled={defSaving}
                  autoComplete="off"
                />
              </label>
              <label className="portal-account__field">
                {p.matchDetailRegistrationClass}
                <input
                  type="text"
                  value={defClass}
                  onChange={(e) => setDefClass(e.target.value)}
                  disabled={defSaving}
                  autoComplete="off"
                />
              </label>
              <label className="portal-account__field">
                {p.matchDetailRegistrationPFOptional}
                <select
                  value={defPf}
                  onChange={(e) =>
                    setDefPf(e.target.value === '' ? '' : e.target.value === 'MAJOR' ? 'MAJOR' : 'MINOR')
                  }
                  disabled={defSaving}
                >
                  <option value="">{p.matchDetailRegistrationPFNone}</option>
                  <option value="MAJOR">{p.matchDetailRegistrationPFMajor}</option>
                  <option value="MINOR">{p.matchDetailRegistrationPFMinor}</option>
                </select>
              </label>
            </div>
            {defFeedback ?
              <p role="status" className="portal-account__hub-feedback">
                {defFeedback}
              </p>
            : null}
            <button type="submit" className="portal-btn portal-btn--secondary portal-account__hub-save" disabled={defSaving}>
              {defSaving ? p.accountParticipantDefaultsSaving : p.accountParticipantDefaultsSave}
            </button>
          </form>
        }
      </section>
    </div>
  )
}
