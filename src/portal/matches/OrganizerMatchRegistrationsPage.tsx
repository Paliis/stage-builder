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
  classification_grade: string | null
  registration_created_at?: string | null
  /** From roster RPC (`payment_note`), optional until migration applied. */
  payment_note?: string | null
  payment_received?: boolean
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

function paymentNoteDirtyVsServer(reg: RosterRpcRow, draft: Record<string, string>): boolean {
  const d = (draft[reg.registration_id] ?? '').trim()
  const s = (reg.payment_note ?? '').trim()
  return d !== s
}

function paymentReceivedDirtyVsServer(reg: RosterRpcRow, draft: Record<string, boolean>): boolean {
  const d = !!(draft[reg.registration_id] ?? false)
  const s = !!(reg.payment_received ?? false)
  return d !== s
}

function paymentFieldsDirtyVsServer(
  reg: RosterRpcRow,
  noteDraft: Record<string, string>,
  receivedDraft: Record<string, boolean>,
): boolean {
  return paymentNoteDirtyVsServer(reg, noteDraft) || paymentReceivedDirtyVsServer(reg, receivedDraft)
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
  const [paymentNoteDraft, setPaymentNoteDraft] = useState<Record<string, string>>({})
  const [paymentReceivedDraft, setPaymentReceivedDraft] = useState<Record<string, boolean>>({})
  const [saveRegId, setSaveRegId] = useState<string | null>(null)
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
    setPaymentNoteDraft(() => {
      const m: Record<string, string> = {}
      for (const r of roster) {
        m[r.registration_id] = r.payment_note ?? ''
      }
      return m
    })
    setPaymentReceivedDraft(() => {
      const m: Record<string, boolean> = {}
      for (const r of roster) {
        m[r.registration_id] = !!(r.payment_received ?? false)
      }
      return m
    })
  }, [roster])

  useEffect(() => {
    if (organizerProfileLoading || organizerProfile !== 'active') return
    queueMicrotask(() => void reload())
  }, [reload, organizerProfileLoading, organizerProfile])

  const rosterList = useMemo(() => roster ?? [], [roster])

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

  async function confirmReg(registrationId: string) {
    setSaveError(null)
    if (!configured || !user?.id || !matchId) return
    const sb = getSupabase()
    setSaveRegId(registrationId)
    const noteRaw = (paymentNoteDraft[registrationId] ?? '').trim()
    const paid = !!(paymentReceivedDraft[registrationId] ?? false)

    const { error } = await sb
      .from('match_registrations')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        confirmed_by: user.id,
        payment_note: noteRaw.length > 0 ? noteRaw : null,
        payment_received: paid,
      })
      .eq('id', registrationId)
      .eq('match_id', matchId)
      .eq('status', 'pending')
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

  async function savePaymentFieldsReg(registrationId: string) {
    setSaveError(null)
    if (!configured || !matchId) return
    const noteRaw = (paymentNoteDraft[registrationId] ?? '').trim()
    const paid = !!(paymentReceivedDraft[registrationId] ?? false)
    const sb = getSupabase()
    setSaveRegId(registrationId)
    const { error } = await sb
      .from('match_registrations')
      .update({
        payment_note: noteRaw.length > 0 ? noteRaw : null,
        payment_received: paid,
      })
      .eq('id', registrationId)
      .eq('match_id', matchId)
      .eq('status', 'confirmed')
    setSaveRegId(null)
    if (error) {
      setSaveError(error.message)
      return
    }
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

      <nav className="portal-page-context" aria-label={p.portalBreadcrumbAria}>
        <ol className="portal-breadcrumbs">
          <li>
            <Link to={`/${locale}/matches/my`}>{p.myMatchesTitle}</Link>
          </li>
          {matchId && matchTitle?.trim() ?
            <li>
              <Link to={`/${locale}/matches/my/${matchId}`} title={matchTitle}>
                <span className="portal-breadcrumbs__ellipsis">{matchTitle}</span>
              </Link>
            </li>
          : null}
          <li className="portal-breadcrumbs__current">{p.matchOrgRosterHeading}</li>
        </ol>
      </nav>

      <header className="portal-home__hero">
        <h1 className="portal-home__hero-title portal-match-title-hero-wrap">
          {matchTitle ?? p.matchOrgRosterHeading}
        </h1>
        <p style={{ margin: '0.55rem 0 0', fontSize: '0.92rem', opacity: 0.92 }}>{p.matchOrgRosterLead}</p>
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
            role="tablist"
            aria-label={locale === 'uk' ? 'Вигляд списку заявок' : 'Registration list view'}
            style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1.1rem', alignItems: 'center' }}
          >
            <button
              type="button"
              role="tab"
              aria-selected={rosterView === 'table'}
              onClick={() => setRosterView('table')}
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: '8px',
                border:
                  rosterView === 'table' ? '2px solid var(--text-h)' : '1px solid var(--border)',
                background: rosterView === 'table' ? 'var(--text-h)' : 'var(--btn-bg)',
                color: rosterView === 'table' ? 'var(--btn-bg)' : 'var(--text)',
                cursor: 'pointer',
                fontWeight: rosterView === 'table' ? 600 : 400,
              }}
            >
              {p.matchOrgRosterViewTable}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={rosterView === 'board'}
              onClick={() => {
                setPendingSquad({})
                setRosterView('board')
              }}
              style={{
                padding: '0.4rem 0.75rem',
                borderRadius: '8px',
                border:
                  rosterView === 'board' ? '2px solid var(--text-h)' : '1px solid var(--border)',
                background: rosterView === 'board' ? 'var(--text-h)' : 'var(--btn-bg)',
                color: rosterView === 'board' ? 'var(--btn-bg)' : 'var(--text)',
                cursor: 'pointer',
                fontWeight: rosterView === 'board' ? 600 : 400,
              }}
            >
              {p.matchOrgRosterViewBoard}
            </button>
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
                paymentNoteDraft={paymentNoteDraft}
                paymentReceivedDraft={paymentReceivedDraft}
                onPaymentReceivedChange={(id, paid) =>
                  setPaymentReceivedDraft((prev) => ({
                    ...prev,
                    [id]: paid,
                  }))
                }
                onPaymentNoteChange={(id, note) =>
                  setPaymentNoteDraft((prev) => ({
                    ...prev,
                    [id]: note,
                  }))
                }
                squadPhaseLabel={(phase) => squadPhaseLabel(p, phase)}
                registrationStatusLabel={(status) => registrationStatusLabel(p, status)}
                displayShooterName={(reg) => displayName(reg)}
                activeCountForSquad={(squadId) => countActiveAssignments(rosterList, pendingSquad, squadId)}
                countAfterHypotheticalMove={(movingRegId, targetSquadId, countedSquadId) =>
                  countOnSquad(rosterList, pendingSquad, countedSquadId, movingRegId, targetSquadId)
                }
                onConfirmPending={async (registrationId) => {
                  await confirmReg(registrationId)
                }}
                onSavePaymentNote={async (registrationId) => {
                  await savePaymentFieldsReg(registrationId)
                }}
                onMoveRegistration={async (registrationId, targetSquadId) =>
                  saveReg(registrationId, targetSquadId)
                }
              />
          : <p style={{ marginTop: '1rem' }}>{p.matchOrgSquadsAutoEmpty}</p>
          : null}

          {rosterView === 'table' ?
            <div style={{ overflowX: 'auto', marginTop: '1rem', maxWidth: 'min(58rem, 100%)' }}>
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
                  {p.matchOrgRosterColPayment}
                </th>
                <th
                  scope="col"
                  style={{ textAlign: 'left', padding: '0.45rem 0.55rem', borderBottom: '1px solid var(--border)' }}
                >
                  {p.matchOrgRosterColSquad}
                </th>
                <th
                  scope="col"
                  style={{ textAlign: 'left', padding: '0.45rem 0.55rem', borderBottom: '1px solid var(--border)' }}
                >
                  {p.matchOrgRosterColActions}
                </th>
              </tr>
            </thead>
            <tbody>
              {roster.map((reg) => {
                const currentPick = pendingSquad[reg.registration_id] ?? reg.squad_id
                const options = squads ? validSquadsForRegistration(reg, rosterList, squads, pendingSquad) : []

                const dirty = currentPick !== reg.squad_id
                const inactive = !countsActiveStatuses(reg.status)

                return (
                  <tr key={reg.registration_id}>
                    <td style={{ padding: '0.45rem 0.55rem', borderBottom: '1px solid var(--border)' }}>
                      {displayName(reg)}
                    </td>
                    <td style={{ padding: '0.45rem 0.55rem', borderBottom: '1px solid var(--border)' }}>
                      {reg.division}
                      {reg.classification_grade ?
                        <>
                          {' '}
                          <span style={{ opacity: 0.85 }}>({reg.classification_grade})</span>
                        </>
                      : null}
                    </td>
                    <td style={{ padding: '0.45rem 0.55rem', borderBottom: '1px solid var(--border)' }}>
                      {registrationStatusLabel(p, reg.status)}
                    </td>
                    <td
                      style={{
                        padding: '0.45rem 0.55rem',
                        borderBottom: '1px solid var(--border)',
                        minWidth: '11rem',
                        verticalAlign: 'top',
                      }}
                    >
                      {inactive ?
                        <div style={{ fontSize: '0.82rem', lineHeight: 1.45 }}>
                          <div>
                            <span style={{ opacity: 0.78 }}>{p.matchOrgRosterPaymentReceived}: </span>
                            {(reg.payment_received ?? false) ?
                              p.matchOrgRosterPaymentYes
                            : p.matchOrgRosterPaymentNo}
                          </div>
                          {(reg.payment_note ?? '').trim() ?
                            <div style={{ marginTop: '0.35rem', opacity: 0.9 }}>
                              {(reg.payment_note ?? '').trim()}
                            </div>
                          : null}
                        </div>
                      : (
                        <>
                          <div style={{ marginBottom: '0.45rem' }}>
                            <label
                              htmlFor={`pay-received-${reg.registration_id}`}
                              style={{
                                display: 'block',
                                fontSize: '0.76rem',
                                opacity: 0.88,
                                marginBottom: '0.22rem',
                              }}
                            >
                              {p.matchOrgRosterPaymentReceived}
                            </label>
                            <select
                              id={`pay-received-${reg.registration_id}`}
                              aria-label={p.matchOrgRosterPaymentReceived}
                              disabled={saveRegId === reg.registration_id}
                              value={(paymentReceivedDraft[reg.registration_id] ?? false) ? 'yes' : 'no'}
                              onChange={(e) =>
                                setPaymentReceivedDraft((prev) => ({
                                  ...prev,
                                  [reg.registration_id]: e.target.value === 'yes',
                                }))
                              }
                              style={{
                                maxWidth: '12rem',
                                width: '100%',
                                padding: '0.3rem 0.45rem',
                                fontSize: '0.84rem',
                                borderRadius: '6px',
                                border: '1px solid var(--border)',
                                background: 'var(--btn-bg)',
                                color: 'var(--text)',
                              }}
                            >
                              <option value="no">{p.matchOrgRosterPaymentNo}</option>
                              <option value="yes">{p.matchOrgRosterPaymentYes}</option>
                            </select>
                          </div>
                          <label
                            htmlFor={`pay-note-${reg.registration_id}`}
                            style={{
                              display: 'block',
                              fontSize: '0.76rem',
                              opacity: 0.88,
                              marginBottom: '0.22rem',
                            }}
                          >
                            {p.matchOrgRosterColPaymentNote}
                          </label>
                          <textarea
                            id={`pay-note-${reg.registration_id}`}
                            rows={3}
                            aria-label={p.matchOrgRosterColPaymentNote}
                            placeholder={p.matchOrgRosterPaymentNotePlaceholder}
                            disabled={saveRegId === reg.registration_id}
                            value={paymentNoteDraft[reg.registration_id] ?? ''}
                            onChange={(e) =>
                              setPaymentNoteDraft((prev) => ({
                                ...prev,
                                [reg.registration_id]: e.target.value,
                              }))
                            }
                            style={{
                              width: '100%',
                              maxWidth: '22rem',
                              boxSizing: 'border-box',
                              padding: '0.35rem 0.45rem',
                              fontSize: '0.84rem',
                              lineHeight: 1.4,
                              borderRadius: '6px',
                              border: '1px solid var(--border)',
                              background: 'var(--btn-bg)',
                              color: 'var(--text)',
                              fontFamily: 'inherit',
                              resize: 'vertical',
                              minHeight: '3.35rem',
                            }}
                          />
                          {reg.status === 'confirmed'
                          && paymentFieldsDirtyVsServer(reg, paymentNoteDraft, paymentReceivedDraft) ?
                            <div style={{ marginTop: '0.35rem' }}>
                              <button
                                type="button"
                                disabled={saveRegId === reg.registration_id}
                                onClick={() => void savePaymentFieldsReg(reg.registration_id)}
                                style={{
                                  padding: '0.3rem 0.6rem',
                                  borderRadius: '6px',
                                  border: '1px solid var(--border)',
                                  background: 'var(--text-h)',
                                  color: 'var(--btn-bg)',
                                  cursor: saveRegId === reg.registration_id ? 'wait' : 'pointer',
                                  fontSize: '0.82rem',
                                }}
                              >
                                {saveRegId === reg.registration_id ?
                                  p.matchOrgRosterSaving
                                : p.matchOrgRosterSavePaymentNote}
                              </button>
                            </div>
                          : null}
                        </>
                      )}
                    </td>
                    <td style={{ padding: '0.45rem 0.55rem', borderBottom: '1px solid var(--border)', minWidth: '12rem' }}>
                      {inactive ?
                        <span style={inactiveBlock}>
                          {reg.squad_label} ({squadPhaseLabel(p, reg.squad_phase)})
                        </span>
                      : options.length === 0 ?
                        <span role="alert">{p.matchOrgRosterNoFreeSlot}</span>
                      : (
                        <select
                          aria-label={p.matchOrgRosterColSquad}
                          value={
                            options.some((o) => o.id === currentPick) ? currentPick : (options[0]?.id ?? currentPick)
                          }
                          disabled={inactive}
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
                              <option key={opt.id} value={opt.id}>
                                {opt.label} ({squadPhaseLabel(p, opt.squad_phase)}) — {taken}/{opt.capacity}
                              </option>
                            )
                          })}
                        </select>
                      )}
                    </td>
                    <td
                      style={{
                        padding: '0.45rem 0.55rem',
                        borderBottom: '1px solid var(--border)',
                        verticalAlign: 'top',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-start' }}>
                        {reg.status === 'pending' ?
                          <button
                            type="button"
                            disabled={saveRegId === reg.registration_id}
                            onClick={() => void confirmReg(reg.registration_id)}
                            style={{
                              padding: '0.35rem 0.65rem',
                              borderRadius: '6px',
                              border: '1px solid var(--border)',
                              background: 'var(--btn-bg)',
                              color: 'var(--text)',
                              cursor: saveRegId === reg.registration_id ? 'wait' : 'pointer',
                              fontSize: '0.86rem',
                            }}
                          >
                            {saveRegId === reg.registration_id ?
                              p.matchOrgRosterSaving
                            : p.matchOrgRosterConfirm}
                          </button>
                        : null}
                        <button
                          type="button"
                          disabled={
                            inactive || !dirty || saveRegId === reg.registration_id || options.length === 0
                          }
                          onClick={() => void saveReg(reg.registration_id, currentPick)}
                          style={{
                            padding: '0.35rem 0.65rem',
                            borderRadius: '6px',
                            border: '1px solid var(--border)',
                            background: 'var(--text-h)',
                            color: 'var(--btn-bg)',
                            cursor: 'pointer',
                          }}
                        >
                          {saveRegId === reg.registration_id ?
                            p.matchOrgRosterSaving
                          : p.matchOrgRosterApply}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
            </div>
          : null}
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
