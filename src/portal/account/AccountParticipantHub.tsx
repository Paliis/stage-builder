import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Locale, MessageTree } from '../../i18n/messages'
import { getSupabase, isSupabaseConfigured } from '../../lib/supabaseClient'
import { isValidParticipantPhone } from '../../lib/isValidParticipantPhone'
import { formatPortalDate } from '../matches/matchPortalFormat'
import {
  resolveShooterCategoriesForStorage,
  SHOOTER_CATEGORIES,
  WEAPON_CLASS_ORDER,
  divisionsForWeapon,
  isValidDivisionForWeapon,
  weaponClassLabel,
} from '../shooterProfileCatalog'
import { dispatchParticipantAvatarUpdated } from '../useParticipantAvatarUrl'
import { AvatarCropModal } from './AvatarCropModal'
import '../PortalHome.css'
import '../PortalMatchesUi.css'
import { portalMatchRegLabelClass } from '../matches/matchPortalRegStatusUi'
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
  'phone',
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

  const withdrawReg = useCallback(
    async (id: string) => {
      if (!sb) return
      setBusyId(id)
      setRegErr(null)
      const { data: ok, error } = await sb.rpc('withdraw_my_match_registration', {
        p_registration_id: id,
      })
      setBusyId(null)
      if (error) {
        setRegErr(error.message)
        return
      }
      if (!ok) {
        setRegErr(p.matchDetailRegistrationWithdrawFailed)
        await loadRegs()
        return
      }
      await loadRegs()
    },
    [sb, userId, loadRegs, p.matchDetailRegistrationWithdrawFailed],
  )

  const [defDiv, setDefDiv] = useState('')
  const [defPf, setDefPf] = useState<'MAJOR' | 'MINOR'>('MAJOR')
  const [defRegion, setDefRegion] = useState('')
  const [defCategories, setDefCategories] = useState<string[]>([])
  const [defWeaponClass, setDefWeaponClass] = useState('')
  const [defFirstName, setDefFirstName] = useState('')
  const [defLastName, setDefLastName] = useState('')
  const [defPhone, setDefPhone] = useState('')
  const [defAvatarUrl, setDefAvatarUrl] = useState('')
  const [avatarBusy, setAvatarBusy] = useState(false)
  const [avatarErr, setAvatarErr] = useState<string | null>(null)
  const [avatarCropSrc, setAvatarCropSrc] = useState<string | null>(null)
  const avatarCropUrlRef = useRef<string | null>(null)
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
      phone?: string
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
      setDefPf(pf === 'MAJOR' || pf === 'MINOR' ? pf : 'MAJOR')
      setDefRegion(typeof row.region === 'string' ? row.region : '')
      setDefCategories(normalizeCategoryList(row.categories))
      setDefFirstName(typeof row.first_name === 'string' ? row.first_name : '')
      setDefLastName(typeof row.last_name === 'string' ? row.last_name : '')
      setDefPhone(typeof row.phone === 'string' ? row.phone : '')
      setDefAvatarUrl(typeof row.avatar_url === 'string' ? row.avatar_url : '')
    } else {
      setDefWeaponClass('')
      setDefDiv('')
      setDefPf('MAJOR')
      setDefRegion('')
      setDefCategories([])
      setDefFirstName('')
      setDefLastName('')
      setDefPhone('')
      setDefAvatarUrl('')
    }
  }, [sb, userId, p])

  const clearAvatarCropUrl = useCallback(() => {
    if (avatarCropUrlRef.current) {
      URL.revokeObjectURL(avatarCropUrlRef.current)
      avatarCropUrlRef.current = null
    }
    setAvatarCropSrc(null)
  }, [])

  useEffect(() => {
    return () => {
      if (avatarCropUrlRef.current) {
        URL.revokeObjectURL(avatarCropUrlRef.current)
        avatarCropUrlRef.current = null
      }
    }
  }, [])

  const openAvatarCrop = useCallback(
    (file: File | null) => {
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
      clearAvatarCropUrl()
      const url = URL.createObjectURL(file)
      avatarCropUrlRef.current = url
      setAvatarCropSrc(url)
    },
    [sb, p, clearAvatarCropUrl],
  )

  const uploadAvatarJpeg = useCallback(
    async (jpegBlob: Blob) => {
      if (!sb) return
      setAvatarBusy(true)
      setAvatarErr(null)
      try {
        const objectPath = `${userId}/avatar-${Date.now()}.jpg`
        const { error: upErr } = await sb.storage.from('participant-avatars').upload(objectPath, jpegBlob, {
          upsert: false,
          contentType: 'image/jpeg',
        })
        if (upErr) {
          setAvatarErr(mapParticipantStorageError(upErr.message, p))
          return
        }
        const { data: pub } = sb.storage.from('participant-avatars').getPublicUrl(objectPath)
        setDefAvatarUrl(pub.publicUrl)
        dispatchParticipantAvatarUpdated(pub.publicUrl)
        clearAvatarCropUrl()
      } catch {
        setAvatarErr(p.accountParticipantAvatarErrCrop)
      } finally {
        setAvatarBusy(false)
      }
    },
    [sb, userId, p, clearAvatarCropUrl],
  )

  useEffect(() => {
    queueMicrotask(() => void loadDefaults())
  }, [loadDefaults])

  const saveDefaults = useCallback(async () => {
    if (!sb) return
    setDefSaving(true)
    setDefFeedback(null)
    const fn = defFirstName.trim()
    const ln = defLastName.trim()
    const phoneTrimAcc = defPhone.trim()
    if (!fn || !ln) {
      setDefSaving(false)
      setDefFeedback(p.matchDetailRegistrationNameRequired)
      return
    }
    if (!isValidParticipantPhone(phoneTrimAcc)) {
      setDefSaving(false)
      setDefFeedback(p.accountParticipantPhoneInvalid)
      return
    }
    const wc = defWeaponClass.trim()
    if (!wc || !(WEAPON_CLASS_ORDER as readonly string[]).includes(wc)) {
      setDefSaving(false)
      setDefFeedback(p.accountParticipantWeaponClassRequired)
      return
    }
    const divTrim = defDiv.trim()
    if (!isValidDivisionForWeapon(wc, divTrim)) {
      setDefSaving(false)
      setDefFeedback(p.accountParticipantDivisionRequired)
      return
    }
    if (defCategories.length === 0) {
      setDefSaving(false)
      setDefFeedback(p.accountParticipantCategoryRequired)
      return
    }

    const { error } = await sb.from('participant_registration_defaults').upsert({
      user_id: userId,
      division: divTrim,
      classification_grade: '',
      power_factor: defPf,
      phone: phoneTrimAcc,
      region: defRegion.trim(),
      categories: resolveShooterCategoriesForStorage(defCategories),
      weapon_class: wc,
      first_name: fn,
      last_name: ln,
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
    defPhone,
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
    <>
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
                <thead className="portal-account__hub-table-head">
                  <tr>
                    <th>{p.accountMyRegistrationsColMatch}</th>
                    <th className="portal-account__hub-th-date">{p.accountMyRegistrationsColDate}</th>
                    <th className="portal-account__hub-th-status">{p.accountMyRegistrationsColStatus}</th>
                    <th className="portal-account__hub-th-actions">{p.accountMyRegistrationsColActions}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const m = r.matches
                    const title = m?.title?.trim() || p.accountMyRegistrationsMatchUnavailable
                    const when = m?.starts_at ? formatPortalDate(m.starts_at, locale) : '—'
                    const canWithdraw = r.status === 'pending' || r.status === 'confirmed'
                    return (
                      <tr key={r.id}>
                        <td
                          className="portal-account__hub-td-title"
                          data-label={p.accountMyRegistrationsColMatch}
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
                        <td className="portal-account__hub-td-nowrap" data-label={p.accountMyRegistrationsColDate}>
                          {when}
                        </td>
                        <td className="portal-account__hub-td-status" data-label={p.accountMyRegistrationsColStatus}>
                          <span className={`${portalMatchRegLabelClass(r.status)} portal-account__hub-status`}>
                            {regStatusLabel(r.status)}
                          </span>
                        </td>
                        <td
                          className="portal-account__hub-td-actions"
                          data-label={p.accountMyRegistrationsColActions}
                        >
                          {canWithdraw ?
                            <div className="portal-account__hub-table-actions">
                              <button
                                type="button"
                                className="portal-btn portal-btn--secondary portal-btn--compact"
                                disabled={busyId === r.id}
                                onClick={() => void withdrawReg(r.id)}
                              >
                                {busyId === r.id ?
                                  r.status === 'confirmed' ?
                                    p.accountMyRegistrationsWithdrawing
                                  : p.accountMyRegistrationsCancelling
                                : r.status === 'confirmed' ?
                                  p.accountMyRegistrationsWithdraw
                                : p.accountMyRegistrationsCancel}
                              </button>
                            </div>
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
                <span className="portal-account__field-label">{p.accountParticipantFieldFirstName}</span>
                <input
                  type="text"
                  required
                  value={defFirstName}
                  onChange={(e) => setDefFirstName(e.target.value)}
                  disabled={defSaving}
                  autoComplete="given-name"
                />
              </label>
              <label className="portal-account__field">
                <span className="portal-account__field-label">{p.accountParticipantFieldLastName}</span>
                <input
                  type="text"
                  required
                  value={defLastName}
                  onChange={(e) => setDefLastName(e.target.value)}
                  disabled={defSaving}
                  autoComplete="family-name"
                />
              </label>
              <label className="portal-account__field">
                <span className="portal-account__field-label">{p.accountParticipantFieldPhone}</span>
                <input
                  type="tel"
                  required
                  maxLength={28}
                  value={defPhone}
                  onChange={(e) => setDefPhone(e.target.value)}
                  disabled={defSaving}
                  autoComplete="tel"
                />
              </label>
              <label className="portal-account__field">
                <span className="portal-account__field-label">{p.accountParticipantFieldRegion}</span>
                <input
                  type="text"
                  value={defRegion}
                  onChange={(e) => setDefRegion(e.target.value)}
                  disabled={defSaving}
                  autoComplete="address-level1"
                  placeholder={p.accountParticipantFieldRegionPlaceholder}
                />
              </label>
              <div className="portal-account__avatar-row portal-account__psc-grid--full">
                <span className="portal-account__field-label portal-account__avatar-label">
                  {p.accountParticipantAvatarLabel}
                </span>
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
                      disabled={defSaving || avatarBusy || !!avatarCropSrc}
                      onChange={(e) => {
                        const f = e.target.files?.[0] ?? null
                        e.target.value = ''
                        openAvatarCrop(f)
                      }}
                    />
                    <button
                      type="button"
                      className="portal-btn portal-btn--secondary portal-btn--compact portal-account__avatar-btn"
                      disabled={defSaving || avatarBusy || !!avatarCropSrc}
                      onClick={() => avatarInputRef.current?.click()}
                    >
                      {avatarBusy ? p.accountParticipantAvatarUploading : p.accountParticipantAvatarChange}
                    </button>
                    {defAvatarUrl ?
                      <button
                        type="button"
                        className="portal-btn portal-btn--ghost portal-btn--compact"
                        disabled={defSaving || avatarBusy || !!avatarCropSrc}
                        onClick={() => {
                          setDefAvatarUrl('')
                          setAvatarErr(null)
                          dispatchParticipantAvatarUpdated('')
                        }}
                      >
                        {p.accountParticipantAvatarRemove}
                      </button>
                    : null}
                  </div>
                </div>
                {avatarErr && !avatarCropSrc ?
                  <p role="alert" className="portal-account__avatar-error">
                    {avatarErr}
                  </p>
                : null}
                <p className="portal-account__field-hint portal-account__avatar-crop-hint">
                  {p.accountParticipantAvatarCropHint}
                </p>
              </div>
              <label className="portal-account__field">
                <span className="portal-account__field-label">{p.accountParticipantFieldWeaponClass}</span>
                <select
                  required
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
                <span className="portal-account__field-label">{p.matchDetailRegistrationDivision}</span>
                <select
                  required
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
                <span className="portal-account__field-label">{p.matchDetailRegistrationPowerFactor}</span>
                <select
                  value={defPf}
                  onChange={(e) =>
                    setDefPf(e.target.value === 'MAJOR' ? 'MAJOR' : 'MINOR')
                  }
                  disabled={defSaving}
                >
                  <option value="MAJOR">{p.matchDetailRegistrationPFMajor}</option>
                  <option value="MINOR">{p.matchDetailRegistrationPFMinor}</option>
                </select>
              </label>
              <fieldset className="portal-account__categories-fieldset" aria-required="true">
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
            </div>
            {defFeedback ?
              <p role="status" className="portal-account__hub-feedback">
                {defFeedback}
              </p>
            : null}
            <button type="submit" className="portal-btn portal-btn--primary portal-account__hub-save" disabled={defSaving}>
              {defSaving ? p.accountParticipantDefaultsSaving : p.accountParticipantDefaultsSave}
            </button>
          </form>
        }
      </section>
    </div>
    {avatarCropSrc ?
      <AvatarCropModal
        imageSrc={avatarCropSrc}
        onCancel={clearAvatarCropUrl}
        onApply={(blob) => uploadAvatarJpeg(blob)}
        remoteError={avatarErr}
        p={p}
      />
    : null}
    </>
  )
}
