import { useCallback, useEffect, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useParams } from 'react-router-dom'
import { useI18n } from '../../i18n/useI18n'
import type { MessageTree } from '../../i18n/messages'
import { getSupabase, isSupabaseConfigured } from '../../lib/supabaseClient'
import { useSupabaseSession } from '../useSupabaseSession'
import { useOrganizerSelfServiceProfile } from '../useOrganizerSelfServiceProfile'
import { MATCH_ID_UUID_RE } from './matchPortalUuid'
import { sortSquadsPrematchFirst } from './matchSquadsSort'
import { OrganizerMatchRosterBoard } from './OrganizerMatchRosterBoard'
import { OrganizerMatchInactivePanel } from './OrganizerMatchInactivePanel'
import { formatSquadLabelNumberOnly } from './matchPortalSquadDisplay'
import {
  portalMatchRegLabelClass,
  portalMatchRegRowClass,
  portalMatchRegSelectClass,
} from './matchPortalRegStatusUi'
import '../PortalHome.css'
import '../PortalMatchesUi.css'

type Portal = MessageTree['portal']

type RosterRpcRow = {
  registration_id: string
  competitor_user_id: string
  display_name: string | null
  squad_id: string
  squad_label: string
  squad_phase: string
  squad_sort_order: number
  squad_capacity: number
  status: string
  division: string
  registration_created_at?: string | null
}

type SquadPick = {
  id: string
  label: string
  squad_phase: string
  sort_order: number
  capacity: number
}

function countsActiveStatuses(status: string) {
  return status === 'pending' || status === 'confirmed'
}

function squadPhaseLabel(p: Portal, phase: string) {
  if (phase === 'prematch') return p.matchOrgSquadsPhasePrematch
  return p.matchOrgSquadsPhaseMain
}

function registrationStatusLabel(p: Portal, status: string) {
  if (status === 'pending') return p.matchDetailRegistrationStatusPending
  if (status === 'confirmed') return p.matchDetailRegistrationStatusConfirmed
  if (status === 'cancelled') return p.matchDetailRegistrationStatusCancelled
  return status
}

/** Occupancy on `squadId` given pending picks; the row being edited resolves to `editingEffectiveSquad` (dropdown value). */
function countOnSquadForLabel(
  rosterList: RosterRpcRow[],
  pending: Record<string, string>,
  squadId: string,
  editingRegId: string,
  editingEffectiveSquad: string,
): number {
  let n = 0
  for (const row of rosterList) {
    if (!countsActiveStatuses(row.status)) continue
    const sid =
      row.registration_id === editingRegId ?
        editingEffectiveSquad
      : (pending[row.registration_id] ?? row.squad_id)
    if (sid === squadId) n++
  }
  return n
}

function countActiveAssignments(
  rosterList: RosterRpcRow[],
  pending: Record<string, string>,
  squadId: string,
): number {
  let n = 0
  for (const row of rosterList) {
    if (!countsActiveStatuses(row.status)) continue
    const sid = pending[row.registration_id] ?? row.squad_id
    if (sid === squadId) n++
  }
  return n
}

function countOnSquad(
  rosterList: RosterRpcRow[],
  pending: Record<string, string>,
  squadId: string,
  movingRegId: string,
  movingTarget: string,
): number {
  let n = 0
  for (const row of rosterList) {
    if (!countsActiveStatuses(row.status)) continue
    const sid =
      row.registration_id === movingRegId ? movingTarget : (pending[row.registration_id] ?? row.squad_id)
    if (sid === squadId) n++
  }
  return n
}

/** Middle breadcrumb label: cap length so trash titles do not span the whole row; full text stays on `title`. */
const BREADCRUMB_MATCH_TITLE_MAX = 50

function truncateBreadcrumbMiddle(text: string, maxChars: number): string {
  const t = text.trim()
  const chars = Array.from(t)
  if (chars.length <= maxChars) return t
  return `${chars.slice(0, Math.max(0, maxChars - 1)).join('')}…`
}

function validSquadsForRegistration(
  reg: RosterRpcRow,
  rosterList: RosterRpcRow[],
  allSquads: SquadPick[],
  pending: Record<string, string>,
): SquadPick[] {
  if (!countsActiveStatuses(reg.status)) {
    const one = allSquads.find((s) => s.id === reg.squad_id)
    return one ? [one] : []
  }

  return allSquads.filter(
    (opt) =>
      countOnSquad(rosterList, pending, opt.id, reg.registration_id, opt.id) <= opt.capacity,
  )
}

export function OrganizerMatchRegistrationsPage() {
  const { locale, tree } = useI18n()
  const p = tree.portal
  const configured = isSupabaseConfigured()
  const { loading: sessionLoading, user } = useSupabaseSession()
  const { loading: organizerProfileLoading, profile: organizerProfile, moderationNote } =
    useOrganizerSelfServiceProfile(user?.id)
  const { matchId } = useParams<{ matchId: string }>()
  const validId = Boolean(matchId && MATCH_ID_UUID_RE.test(matchId))

  const [matchTitle, setMatchTitle] = useState<string | null>(null)
  const [squads, setSquads] = useState<SquadPick[] | undefined>(undefined)
  const [roster, setRoster] = useState<RosterRpcRow[] | undefined>(undefined)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [pendingSquad, setPendingSquad] = useState<Record<string, string>>({})
  const [statusDraft, setStatusDraft] = useState<Record<string, 'pending' | 'confirmed'>>({})
  const [saveRegId, setSaveRegId] = useState<string | null>(null)
  const [saveTableBusy, setSaveTableBusy] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [rosterView, setRosterView] = useState<'table' | 'board'>('table')

  const reload = useCallback(async () => {
    if (!configured || !user?.id || !validId || !matchId || organizerProfile !== 'active') return
    await Promise.resolve()
    setLoadError(null)
    const sb = getSupabase()

    const { data: matchRow, error: mErr } = await sb
      .from('matches')
      .select('id, title, organizer_id')
      .eq('id', matchId)
      .maybeSingle()
    if (mErr || !matchRow || matchRow.organizer_id !== user.id) {
      setLoadError(p.matchOrgEditNotFound)
      setSquads([])
      setRoster([])
      return
    }
    setMatchTitle(matchRow.title ?? '')

    const { data: sq, error: sErr } = await sb
      .from('match_squads')
      .select('id, label, squad_phase, sort_order, capacity')
      .eq('match_id', matchId)
      .order('sort_order', { ascending: true })

    if (sErr) {
      setLoadError(sErr.message)
      setSquads([])
      setRoster([])
      return
    }
    setSquads(sortSquadsPrematchFirst((sq ?? []) as SquadPick[]))

    const { data: rx, error: rErr } = await sb.rpc('fetch_organizer_match_registration_roster', {
      p_match_id: matchId,
    })
    if (rErr) {
      setLoadError(rErr.message)
      setRoster([])
      return
    }
    setRoster((rx ?? []) as RosterRpcRow[])
    setPendingSquad({})
  }, [configured, user, validId, matchId, p.matchOrgEditNotFound, organizerProfile])

  useEffect(() => {
    if (roster === undefined) return
    setStatusDraft(() => {
      const m: Record<string, 'pending' | 'confirmed'> = {}
      for (const r of roster) {
        if (!countsActiveStatuses(r.status)) continue
        m[r.registration_id] = r.status === 'confirmed' ? 'confirmed' : 'pending'
      }
      return m
    })
  }, [roster])

  useEffect(() => {
    if (organizerProfileLoading || organizerProfile !== 'active') return
    queueMicrotask(() => void reload())
  }, [reload, organizerProfileLoading, organizerProfile])

  const rosterList = useMemo(() => roster ?? [], [roster])

  const tableHasUnsavedDrafts = useMemo(() => {
    for (const reg of rosterList) {
      if (!countsActiveStatuses(reg.status)) continue
      const squadNext = pendingSquad[reg.registration_id] ?? reg.squad_id
      const statusStored = reg.status === 'confirmed' ? 'confirmed' : 'pending'
      const statusNext = statusDraft[reg.registration_id] ?? statusStored
      if (squadNext !== reg.squad_id || statusNext !== statusStored) return true
    }
    return false
  }, [rosterList, pendingSquad, statusDraft])

  const rosterActiveBoard = useMemo(
    () => rosterList.filter((r) => countsActiveStatuses(r.status)),
    [rosterList],
  )
  const rosterInactiveBoard = useMemo(
    () => rosterList.filter((r) => !countsActiveStatuses(r.status)),
    [rosterList],
  )

  async function saveReg(registrationId: string, nextSquadId: string) {
    setSaveError(null)
    if (!configured || !user?.id || !matchId) return
    const sb = getSupabase()
    setSaveRegId(registrationId)
    const { error } = await sb
      .from('match_registrations')
      .update({ squad_id: nextSquadId })
      .eq('id', registrationId)
      .eq('match_id', matchId)
    setSaveRegId(null)
    if (error) {
      setSaveError(error.message)
      return
    }
    setPendingSquad((prev) => {
      const n = { ...prev }
      delete n[registrationId]
      return n
    })
    await reload()
  }

  async function saveTablePage() {
    setSaveError(null)
    if (!configured || !user?.id || !matchId || roster === undefined || roster.length === 0) return

    type StatusPatch = {
      squad_id?: string
      status?: 'pending' | 'confirmed'
      confirmed_at?: string | null
      confirmed_by?: string | null
    }

    const rowsToPersist: RosterRpcRow[] = []
    for (const reg of rosterList) {
      if (!countsActiveStatuses(reg.status)) continue
      const squadNext = pendingSquad[reg.registration_id] ?? reg.squad_id
      const statusStored = reg.status === 'confirmed' ? 'confirmed' : 'pending'
      const statusNext = statusDraft[reg.registration_id] ?? statusStored
      if (squadNext !== reg.squad_id || statusNext !== statusStored) {
        rowsToPersist.push(reg)
      }
    }
    if (rowsToPersist.length === 0) return

    const sb = getSupabase()
    setSaveTableBusy(true)

    for (const reg of rowsToPersist) {
      const squadNext = pendingSquad[reg.registration_id] ?? reg.squad_id
      const statusStored = reg.status === 'confirmed' ? 'confirmed' : 'pending'
      const statusNext = statusDraft[reg.registration_id] ?? statusStored

      const patch: StatusPatch = {}
      if (squadNext !== reg.squad_id) {
        patch.squad_id = squadNext
      }
      if (statusNext !== statusStored) {
        if (statusNext === 'confirmed') {
          patch.status = 'confirmed'
          patch.confirmed_at = new Date().toISOString()
          patch.confirmed_by = user.id
        } else {
          patch.status = 'pending'
          patch.confirmed_at = null
          patch.confirmed_by = null
        }
      }

      const { error } = await sb
        .from('match_registrations')
        .update(patch)
        .eq('id', reg.registration_id)
        .eq('match_id', matchId)
      if (error) {
        setSaveError(error.message)
        setSaveTableBusy(false)
        return
      }
    }

    setSaveTableBusy(false)
    await reload()
  }

  const inactiveBlock = useMemo(() => ({ padding: '0.35rem 0.45rem', opacity: 0.85 }), [])

  if (!configured) {
    return (
      <div className="portal-home">
        <Helmet>
          <title>{p.matchOrgRosterHelmet}</title>
        </Helmet>
        <p>{p.matchesSupabaseUnset}</p>
      </div>
    )
  }

  if (sessionLoading) {
    return (
      <div className="portal-home">
        <Helmet>
          <title>{p.matchOrgRosterHelmet}</title>
        </Helmet>
        <p>{p.myMatchesLoading}</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="portal-home">
        <Helmet>
          <title>{p.matchOrgRosterHelmet}</title>
        </Helmet>
        <p>{p.myMatchesNeedSignIn}</p>
      </div>
    )
  }

  if (!validId) {
    return (
      <div className="portal-home">
        <Helmet>
          <title>{p.matchOrgRosterHelmet}</title>
        </Helmet>
        <p role="alert">{p.matchOrgEditBadId}</p>
      </div>
    )
  }

  if (organizerProfileLoading) {
    return (
      <div className="portal-home">
        <Helmet>
          <title>{p.matchOrgRosterHelmet}</title>
        </Helmet>
        <p>{p.matchesLoadingDetail}</p>
      </div>
    )
  }

  if (organizerProfile !== 'active') {
    return (
      <div className="portal-home">
        <Helmet>
          <title>{p.matchOrgRosterHelmet}</title>
        </Helmet>
        <header className="portal-home__hero" style={{ marginBottom: '1rem' }}>
          <h1 className="portal-home__hero-title">{p.matchOrgRosterHeading}</h1>
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

  return (
    <div className="portal-home">
      <Helmet>
        <title>{p.matchOrgRosterHelmet}</title>
      </Helmet>

      <nav
        className="portal-page-context portal-roster-page__breadcrumbs"
        aria-label={p.portalBreadcrumbAria}
      >
        <ol className="portal-breadcrumbs">
          <li>
            <Link to={`/${locale}/matches/my`}>{p.myMatchesTitle}</Link>
          </li>
          {matchId && matchTitle?.trim() ?
            <li className="portal-breadcrumbs__trail portal-breadcrumbs__trail--stretch">
              <Link to={`/${locale}/matches/my/${matchId}`} title={matchTitle}>
                <span className="portal-breadcrumbs__ellipsis">
                  {truncateBreadcrumbMiddle(matchTitle, BREADCRUMB_MATCH_TITLE_MAX)}
                </span>
              </Link>
            </li>
          : null}
          <li className="portal-breadcrumbs__current">{p.matchOrgRosterHeading}</li>
        </ol>
      </nav>

      <header className="portal-home__hero portal-roster-page__hero">
        <h1
          className="portal-home__hero-title portal-match-title-hero-wrap portal-match-title-hero-wrap--clamp-2"
          title={matchTitle?.trim() ? matchTitle : undefined}
        >
          {matchTitle ?? p.matchOrgRosterHeading}
        </h1>
        <p className="portal-roster-page__lead">{p.matchOrgRosterLead}</p>
      </header>

      {loadError ? <p role="alert">{loadError}</p> : null}

      {saveError ? <p role="alert">{saveError}</p> : null}

      {roster === undefined || squads === undefined ?
        <p>{p.myMatchesLoading}</p>
      : roster.length === 0 ?
        <p>{p.matchOrgRosterEmpty}</p>
      : (
        <>
          <div
            className={
              rosterView === 'board' ? 'portal-roster-page__sheet portal-roster-page__sheet--board'
              : 'portal-roster-page__sheet'
            }
          >
            <div className="portal-roster-toolbar">
              <div
                className="portal-roster-toolbar__tabs"
                role="tablist"
                aria-label={locale === 'uk' ? 'Вигляд списку заявок' : 'Registration list view'}
              >
                <button
                  type="button"
                  role="tab"
                  className="portal-roster-tab"
                  aria-selected={rosterView === 'table'}
                  onClick={() => setRosterView('table')}
                >
                  {p.matchOrgRosterViewTable}
                </button>
                <button
                  type="button"
                  role="tab"
                  className="portal-roster-tab"
                  aria-selected={rosterView === 'board'}
                  onClick={() => {
                    setPendingSquad({})
                    setRosterView('board')
                  }}
                >
                  {p.matchOrgRosterViewBoard}
                </button>
              </div>

              {rosterView === 'table' ?
                <div className="portal-roster-toolbar__actions">
                  <button
                    type="button"
                    className={
                      tableHasUnsavedDrafts && !saveTableBusy ? 'portal-btn portal-btn--primary portal-btn--compact'
                      : 'portal-btn portal-btn--secondary portal-btn--compact'
                    }
                    disabled={!tableHasUnsavedDrafts || saveTableBusy}
                    style={saveTableBusy ? { cursor: 'wait' } : undefined}
                    onClick={() => void saveTablePage()}
                  >
                    {saveTableBusy ? p.matchOrgRosterSaving : p.matchOrgRosterSavePage}
                  </button>
                </div>
              : null}
            </div>

            {rosterView === 'board' ?
            squads.length > 0 ?
              <OrganizerMatchRosterBoard
                locale={locale}
                p={p}
                squads={squads}
                rosterActive={rosterActiveBoard}
                inactiveRegistrations={rosterInactiveBoard}
                savingRegId={saveRegId}
                squadPhaseLabel={(phase) => squadPhaseLabel(p, phase)}
                registrationStatusLabel={(status) => registrationStatusLabel(p, status)}
                displayShooterName={(reg) => displayName(reg)}
                activeCountForSquad={(squadId) => countActiveAssignments(rosterList, pendingSquad, squadId)}
                countAfterHypotheticalMove={(movingRegId, targetSquadId, countedSquadId) =>
                  countOnSquad(rosterList, pendingSquad, countedSquadId, movingRegId, targetSquadId)
                }
                onMoveRegistration={async (registrationId, targetSquadId) =>
                  saveReg(registrationId, targetSquadId)
                }
              />
          : <p style={{ marginTop: '1rem' }}>{p.matchOrgSquadsAutoEmpty}</p>
          : null}

          {rosterView === 'table' ?
            <>
              <div className="portal-roster-page__table-scroll">
          <table style={{ borderCollapse: 'collapse', fontSize: '0.92rem', width: '100%' }}>
            <thead>
              <tr>
                <th
                  scope="col"
                  style={{ textAlign: 'left', padding: '0.45rem 0.55rem', borderBottom: '1px solid var(--border)' }}
                >
                  {p.matchOrgRosterColName}
                </th>
                <th
                  scope="col"
                  style={{ textAlign: 'left', padding: '0.45rem 0.55rem', borderBottom: '1px solid var(--border)' }}
                >
                  {p.matchOrgRosterColDivision}
                </th>
                <th
                  scope="col"
                  style={{ textAlign: 'left', padding: '0.45rem 0.55rem', borderBottom: '1px solid var(--border)' }}
                >
                  {p.matchOrgRosterColStatus}
                </th>
                <th
                  scope="col"
                  style={{ textAlign: 'left', padding: '0.45rem 0.55rem', borderBottom: '1px solid var(--border)' }}
                >
                  {p.matchOrgRosterColSquad}
                </th>
              </tr>
            </thead>
            <tbody>
              {roster.map((reg) => {
                const currentPick = pendingSquad[reg.registration_id] ?? reg.squad_id
                const options = squads ? validSquadsForRegistration(reg, rosterList, squads, pendingSquad) : []

                const inactive = !countsActiveStatuses(reg.status)
                const controlsLocked = inactive || saveTableBusy

                const statusStored = reg.status === 'confirmed' ? 'confirmed' : 'pending'
                const statusControlValue =
                  inactive ? statusStored : (statusDraft[reg.registration_id] ?? statusStored)

                const rowCue = portalMatchRegRowClass(inactive, reg.status, statusControlValue)

                return (
                  <tr key={reg.registration_id} className={rowCue}>
                    <td style={{ padding: '0.45rem 0.55rem', borderBottom: '1px solid var(--border)' }}>
                      {displayName(reg)}
                    </td>
                    <td style={{ padding: '0.45rem 0.55rem', borderBottom: '1px solid var(--border)' }}>
                      {reg.division}
                    </td>
                    <td
                      style={{
                        padding: '0.45rem 0.55rem',
                        borderBottom: '1px solid var(--border)',
                        minWidth: '10rem',
                        verticalAlign: 'top',
                      }}
                    >
                      {inactive ?
                        <span className={portalMatchRegLabelClass(reg.status)} style={{ fontSize: '0.88rem' }}>
                          {registrationStatusLabel(p, reg.status)}
                        </span>
                      : (
                        <>
                          <label
                            htmlFor={`reg-status-${reg.registration_id}`}
                            style={{
                              position: 'absolute',
                              width: '1px',
                              height: '1px',
                              padding: 0,
                              margin: '-1px',
                              overflow: 'hidden',
                              clip: 'rect(0,0,0,0)',
                              whiteSpace: 'nowrap',
                              border: 0,
                            }}
                          >
                            {p.matchOrgRosterColStatus}
                          </label>
                          <select
                            id={`reg-status-${reg.registration_id}`}
                            aria-label={p.matchOrgRosterColStatus}
                            disabled={controlsLocked}
                            value={statusControlValue}
                            onChange={(e) => {
                              const v = e.target.value as 'pending' | 'confirmed'
                              setStatusDraft((prev) => ({
                                ...prev,
                                [reg.registration_id]: v,
                              }))
                            }}
                            className={portalMatchRegSelectClass(statusControlValue)}
                            style={{
                              width: '100%',
                              maxWidth: '14rem',
                              padding: '0.35rem 0.45rem',
                              fontSize: '0.86rem',
                              borderRadius: '6px',
                            }}
                          >
                            <option value="pending">{p.matchOrgRosterStatusOptionPending}</option>
                            <option value="confirmed">{p.matchOrgRosterStatusOptionConfirmed}</option>
                          </select>
                        </>
                      )}
                    </td>
                    <td style={{ padding: '0.45rem 0.55rem', borderBottom: '1px solid var(--border)', minWidth: '12rem' }}>
                      {inactive ?
                        <span style={inactiveBlock} title={reg.squad_label}>
                          {formatSquadLabelNumberOnly(reg.squad_label)} ({squadPhaseLabel(p, reg.squad_phase)})
                        </span>
                      : options.length === 0 ?
                        <span role="alert">{p.matchOrgRosterNoFreeSlot}</span>
                      : (
                        <select
                          aria-label={p.matchOrgRosterColSquad}
                          value={
                            options.some((o) => o.id === currentPick) ? currentPick : (options[0]?.id ?? currentPick)
                          }
                          disabled={inactive || controlsLocked}
                          onChange={(e) =>
                            setPendingSquad((prev) => ({
                              ...prev,
                              [reg.registration_id]: e.target.value,
                            }))
                          }
                          style={{
                            width: '100%',
                            maxWidth: '22rem',
                            padding: '0.35rem 0.45rem',
                            borderRadius: '6px',
                            border: '1px solid var(--border)',
                            background: 'var(--btn-bg)',
                            color: 'var(--text)',
                          }}
                        >
                          {options.map((opt) => {
                            const taken = countOnSquadForLabel(
                              rosterList,
                              pendingSquad,
                              opt.id,
                              reg.registration_id,
                              currentPick,
                            )
                            return (
                              <option key={opt.id} value={opt.id} title={opt.label}>
                                {formatSquadLabelNumberOnly(opt.label)} ({squadPhaseLabel(p, opt.squad_phase)}) — {taken}/{opt.capacity}
                              </option>
                            )
                          })}
                        </select>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
            </div>
            </>
          : null}
          </div>
        </>
      )}
    </div>
  )
}

function displayName(reg: RosterRpcRow): string {
  const n = (reg.display_name ?? '').trim()
  if (n) return n
  return `${reg.competitor_user_id.slice(0, 8)}…`
}
