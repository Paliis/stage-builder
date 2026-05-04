import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Locale, MessageTree } from '../../i18n/messages'
import { getSupabase, isSupabaseConfigured } from '../../lib/supabaseClient'
import { formatPortalDate } from '../matches/matchPortalFormat'
import {
  resolveShooterCategoriesForStorage,
  SHOOTER_CATEGORIES,
  WEAPON_CLASS_ORDER,
  divisionsForWeapon,
  isValidDivisionForWeapon,
  weaponClassLabel,
} from '../shooterProfileCatalog'
import '../PortalHome.css'
import '../PortalMatchesUi.css'
import './AccountParticipantHub.css'

type Portal = MessageTree['portal']

const CATEGORY_IDS = new Set(SHOOTER_CATEGORIES.map((c) => c.id))
const CATEGORY_ORDER = new Map(SHOOTER_CATEGORIES.map((c, i) => [c.id, i]))

function normalizeCategoryList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((x): x is string => typeof x === 'string' && CATEGORY_IDS.has(x))
}

function sortCategoryIds(ids: string[]): string[] {
  return [...new Set(ids)].sort((a, b) => (CATEGORY_ORDER.get(a) ?? 99) - (CATEGORY_ORDER.get(b) ?? 99))
}

function mapParticipantDbError(raw: string, p: Portal): string {
  const l = raw.toLowerCase()
  if (l.includes('does not exist') || l.includes('schema cache')) {
    return p.accountParticipantErrDbOutdated
  }
  return p.accountParticipantErrGeneric
}

function mapParticipantStorageError(raw: string, p: Portal): string {
  const l = raw.toLowerCase()
  if (l.includes('bucket not found')) return p.accountParticipantErrStorage
  if (l.includes('storage') && l.includes('not found')) return p.accountParticipantErrStorage
  return p.accountParticipantErrGeneric
}

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

const AVATAR_MAX_BYTES = 2 * 1024 * 1024

const DEFAULT_SELECT = [
  'division',
  'power_factor',
  'region',
  'categories',
  'weapon_class',
  'first_name',
  'last_name',
  'avatar_url',
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
  const [defPf, setDefPf] = useState<'MAJOR' | 'MINOR' | ''>('')
  const [defRegion, setDefRegion] = useState('')
  const [defCategories, setDefCategories] = useState<string[]>([])
  const [defWeaponClass, setDefWeaponClass] = useState('')
  const [defFirstName, setDefFirstName] = useState('')
  const [defLastName, setDefLastName] = useState('')
  const [defAvatarUrl, setDefAvatarUrl] = useState('')
  const [avatarBusy, setAvatarBusy] = useState(false)
  const [avatarErr, setAvatarErr] = useState<string | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)
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
      setDefFeedback(mapParticipantDbError(error.message, p))
      return
    }
    const row = data as {
      division?: string
      power_factor?: string | null
      region?: string
      categories?: string[] | null
      weapon_class?: string
      first_name?: string
      last_name?: string
      avatar_url?: string
    } | null
    if (row) {
      const rawWc = row.weapon_class
      const wc =
        typeof rawWc === 'string' && (WEAPON_CLASS_ORDER as readonly string[]).includes(rawWc) ? rawWc : ''
      setDefWeaponClass(wc)
      const rawDiv = typeof row.division === 'string' ? row.division : ''
      setDefDiv(wc && isValidDivisionForWeapon(wc, rawDiv) ? rawDiv : '')
      const pf = typeof row.power_factor === 'string' ? row.power_factor.trim().toUpperCase() : ''
      setDefPf(pf === 'MAJOR' || pf === 'MINOR' ? pf : '')
      setDefRegion(typeof row.region === 'string' ? row.region : '')
      setDefCategories(normalizeCategoryList(row.categories))
      setDefFirstName(typeof row.first_name === 'string' ? row.first_name : '')
      setDefLastName(typeof row.last_name === 'string' ? row.last_name : '')
      setDefAvatarUrl(typeof row.avatar_url === 'string' ? row.avatar_url : '')
    }
  }, [sb, userId, p])

  const pickAvatarFile = useCallback(
    async (file: File | null) => {
      if (!file || !sb) return
      setAvatarErr(null)
      const okTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
      if (!okTypes.includes(file.type)) {
        setAvatarErr(p.accountParticipantAvatarErrType)
        return
      }
      if (file.size > AVATAR_MAX_BYTES) {
        setAvatarErr(p.accountParticipantAvatarErrSize)
        return
      }
      setAvatarBusy(true)
      try {
        const ext =
          file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
        const objectPath = `${userId}/avatar-${Date.now()}.${ext}`
        const { error: upErr } = await sb.storage.from('participant-avatars').upload(objectPath, file, {
          upsert: false,
          contentType:
            file.type === 'image/jpg' || file.type === 'image/jpeg' ? 'image/jpeg' : file.type,
        })
        if (upErr) {
          setAvatarErr(mapParticipantStorageError(upErr.message, p))
          return
        }
        const { data: pub } = sb.storage.from('participant-avatars').getPublicUrl(objectPath)
        setDefAvatarUrl(pub.publicUrl)
      } finally {
        setAvatarBusy(false)
      }
    },
    [sb, userId, p],
  )

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
      classification_grade: '',
      power_factor: defPf === '' ? null : defPf,
      region: defRegion.trim(),
      categories: resolveShooterCategoriesForStorage(defCategories),
      weapon_class: defWeaponClass.trim(),
      first_name: defFirstName.trim(),
      last_name: defLastName.trim(),
      avatar_url: defAvatarUrl.trim(),
    })
    setDefSaving(false)
    if (error) {
      setDefFeedback(mapParticipantDbError(error.message, p))
      return
    }
    setDefFeedback(p.accountParticipantDefaultsSaved)
  }, [
    sb,
    userId,
    defDiv,
    defPf,
    defRegion,
    defCategories,
    defWeaponClass,
    defFirstName,
    defLastName,
    defAvatarUrl,
    p,
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
            <p className="portal-account__hub-muted">
              {p.accountMyRegistrationsEmptyBeforeMatchesLink}
              <Link className="portal-account__hub-inline-link" to={`/${locale}/matches`}>
                {p.navMatches}
              </Link>
              {p.accountMyRegistrationsEmptyAfterMatchesLink}
            </p>
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
        {p.accountParticipantProfileSectionLead.trim() ?
          <p className="portal-account__hub-card-lead">{p.accountParticipantProfileSectionLead}</p>
        : null}
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
                {p.accountParticipantFieldFirstName}
                <input
                  type="text"
                  value={defFirstName}
                  onChange={(e) => setDefFirstName(e.target.value)}
                  disabled={defSaving}
                  autoComplete="given-name"
                />
              </label>
              <label className="portal-account__field">
                {p.accountParticipantFieldLastName}
                <input
                  type="text"
                  value={defLastName}
                  onChange={(e) => setDefLastName(e.target.value)}
                  disabled={defSaving}
                  autoComplete="family-name"
                />
              </label>
              <div className="portal-account__avatar-row portal-account__psc-grid--full">
                <span className="portal-account__field portal-account__avatar-label">{p.accountParticipantAvatarLabel}</span>
                <div className="portal-account__avatar-controls">
                  {defAvatarUrl ?
                    <img
                      className="portal-account__avatar-preview"
                      src={defAvatarUrl}
                      alt=""
                      width={72}
                      height={72}
                    />
                  : (
                    <div className="portal-account__avatar-placeholder" aria-hidden />
                  )}
                  <div className="portal-account__avatar-actions">
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/jpg"
                      className="portal-account__avatar-file"
                      disabled={defSaving || avatarBusy}
                      onChange={(e) => {
                        const f = e.target.files?.[0] ?? null
                        e.target.value = ''
                        void pickAvatarFile(f)
                      }}
                    />
                    <button
                      type="button"
                      className="portal-btn portal-btn--secondary portal-account__avatar-btn"
                      disabled={defSaving || avatarBusy}
                      onClick={() => avatarInputRef.current?.click()}
                    >
                      {avatarBusy ? p.accountParticipantAvatarUploading : p.accountParticipantAvatarChange}
                    </button>
                    {defAvatarUrl ?
                      <button
                        type="button"
                        className="portal-account__link-btn"
                        disabled={defSaving || avatarBusy}
                        onClick={() => {
                          setDefAvatarUrl('')
                          setAvatarErr(null)
                        }}
                      >
                        {p.accountParticipantAvatarRemove}
                      </button>
                    : null}
                  </div>
                </div>
                {avatarErr ?
                  <p role="alert" className="portal-account__avatar-error">
                    {avatarErr}
                  </p>
                : null}
              </div>
              <fieldset className="portal-account__categories-fieldset">
                <legend className="portal-account__categories-legend">{p.accountParticipantFieldCategory}</legend>
                <div className="portal-account__categories-grid" role="group">
                  {SHOOTER_CATEGORIES.map((c) => {
                    const checked = defCategories.includes(c.id)
                    const lab = locale === 'en' ? c.labelEn : c.labelUk
                    return (
                      <label key={c.id} className="portal-account__check">
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={defSaving}
                          onChange={() => {
                            setDefCategories((prev) =>
                              checked ? prev.filter((x) => x !== c.id) : sortCategoryIds([...prev, c.id]),
                            )
                          }}
                        />
                        {lab}
                      </label>
                    )
                  })}
                </div>
              </fieldset>
              <label className="portal-account__field">
                {p.accountParticipantFieldWeaponClass}
                <select
                  value={defWeaponClass}
                  onChange={(e) => {
                    const v = e.target.value
                    setDefWeaponClass(v)
                    setDefDiv((d) => (v && isValidDivisionForWeapon(v, d) ? d : ''))
                  }}
                  disabled={defSaving}
                >
                  <option value="">{p.accountParticipantOptionNotSelected}</option>
                  {WEAPON_CLASS_ORDER.map((id) => (
                    <option key={id} value={id}>
                      {weaponClassLabel(id, locale)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="portal-account__field">
                {p.matchDetailRegistrationDivision}
                <select
                  value={defDiv}
                  onChange={(e) => setDefDiv(e.target.value)}
                  disabled={defSaving || !defWeaponClass}
                >
                  <option value="">{p.accountParticipantOptionNotSelected}</option>
                  {divisionsForWeapon(defWeaponClass).map((d) => (
                    <option key={d.id} value={d.id}>
                      {locale === 'en' ? d.labelEn : d.labelUk}
                    </option>
                  ))}
                </select>
                {!defWeaponClass && p.accountParticipantDivisionSelectWeaponFirst ?
                  <span className="portal-account__field-hint">{p.accountParticipantDivisionSelectWeaponFirst}</span>
                : null}
              </label>
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
