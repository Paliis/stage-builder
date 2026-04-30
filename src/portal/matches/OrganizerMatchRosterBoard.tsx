import { useMemo, useState } from 'react'
import type { Locale, MessageTree } from '../../i18n/messages'

type Portal = MessageTree['portal']

export type OrganizerRosterReg = {
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
}

type SquadPick = {
  id: string
  label: string
  squad_phase: string
  sort_order: number
  capacity: number
}

export type OrganizerMatchRosterBoardProps = {
  p: Portal
  locale: Locale
  squads: SquadPick[]
  /** pending + confirmed registrations (shown in columns, draggable). */
  rosterActive: OrganizerRosterReg[]
  inactiveRegistrations: OrganizerRosterReg[]
  savingRegId: string | null
  onMoveRegistration: (registrationId: string, targetSquadId: string) => Promise<void>
  squadPhaseLabel: (phase: string) => string
  registrationStatusLabel: (status: string) => string
  displayShooterName: (reg: OrganizerRosterReg) => string
  /** Active (pending|confirmed) count currently assigned to the squad after pending table edits (board clears pending — usually DB state). */
  activeCountForSquad: (squadId: string) => number
  /** Hypothetical count on `countedSquadId` after moving registration to `targetSquadId`. */
  countAfterHypotheticalMove: (movingRegId: string, targetSquadId: string, countedSquadId: string) => number
}

const DND_MIME = 'application/x-stagebuilder-reg-id'

export function OrganizerMatchRosterBoard({
  p,
  locale,
  squads,
  rosterActive,
  inactiveRegistrations,
  savingRegId,
  onMoveRegistration,
  squadPhaseLabel,
  registrationStatusLabel,
  displayShooterName,
  activeCountForSquad,
  countAfterHypotheticalMove,
}: OrganizerMatchRosterBoardProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [blockedDrop, setBlockedDrop] = useState(false)

  const regsBySquad = useMemo(() => {
    const m = new Map<string, OrganizerRosterReg[]>()
    for (const s of squads) m.set(s.id, [])
    for (const r of rosterActive) {
      const list = m.get(r.squad_id) ?? []
      list.push(r)
      m.set(r.squad_id, list)
    }
    const loc = locale === 'uk' ? 'uk' : 'en'
    for (const [, list] of m) {
      list.sort((a, b) => {
        const na = displayShooterName(a).toLowerCase()
        const nb = displayShooterName(b).toLowerCase()
        const byName = na.localeCompare(nb, loc, { sensitivity: 'base' })
        if (byName !== 0) return byName
        const ta = a.registration_created_at ?? ''
        const tb = b.registration_created_at ?? ''
        return ta.localeCompare(tb)
      })
    }
    return m
  }, [rosterActive, squads, locale, displayShooterName])

  /** True if dropping here would assign to a different squad AND capacity allows it. */
  function allowsHypotheticalMoveOnto(target: SquadPick, draggedId: string | null): boolean {
    if (!draggedId) return false
    const reg = rosterActive.find((r) => r.registration_id === draggedId)
    if (!reg || reg.squad_id === target.id) return false
    return (
      countAfterHypotheticalMove(draggedId, target.id, target.id) <= target.capacity
    )
  }

  async function dropOnSquad(e: React.DragEvent, target: SquadPick) {
    e.preventDefault()
    setBlockedDrop(false)
    const draggedId = e.dataTransfer.getData(DND_MIME)
    setDraggingId(null)
    if (!draggedId) return
    const reg = rosterActive.find((r) => r.registration_id === draggedId)
    if (!reg || reg.squad_id === target.id) return
    if (!allowsHypotheticalMoveOnto(target, draggedId)) {
      setBlockedDrop(true)
      window.setTimeout(() => setBlockedDrop(false), 2000)
      return
    }
    await onMoveRegistration(draggedId, target.id)
  }

  const colStyle = (highlight: boolean, warn: boolean): React.CSSProperties => ({
    flex: '0 0 min(13rem, 85vw)',
    minWidth: '11rem',
    maxHeight: 'min(72vh, 880px)',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '10px',
    border:
      warn ? '2px solid var(--destructive-text, #b00020)'
      : highlight ? '2px solid var(--text-h, #2563eb)'
      : '1px solid var(--border)',
    background: 'var(--btn-bg)',
    overflow: 'hidden',
  })

  return (
    <div style={{ marginTop: '1rem' }}>
      <p style={{ margin: '0 0 0.85rem', fontSize: '0.88rem', lineHeight: 1.55, opacity: 0.9 }}>
        {p.matchOrgRosterBoardHint}
      </p>

      {blockedDrop ? (
        <p role="alert" style={{ margin: '0 0 0.75rem', fontSize: '0.9rem' }}>
          {p.matchOrgRosterBoardSquadFull}
        </p>
      ) : null}

      <div
        role="region"
        aria-label={p.matchOrgRosterViewBoard}
        style={{
          display: 'flex',
          flexWrap: 'nowrap',
          gap: '0.75rem',
          overflowX: 'auto',
          paddingBottom: '0.35rem',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {squads.map((sq) => {
          const regs = regsBySquad.get(sq.id) ?? []
          const dragged = draggingId
          const canDropHere =
            dragged !== null && allowsHypotheticalMoveOnto(sq, dragged)
          const sourceReg =
            dragged ? rosterActive.find((r) => r.registration_id === dragged) : undefined
          const showWarn =
            dragged !== null &&
            Boolean(sourceReg && sourceReg.squad_id !== sq.id) &&
            !allowsHypotheticalMoveOnto(sq, dragged)

          return (
            <section
              key={sq.id}
              style={colStyle(canDropHere, !!(dragged !== null && showWarn))}
              onDragOver={(e) => {
                if (!draggingId) return
                e.preventDefault()
                e.dataTransfer.dropEffect = allowsHypotheticalMoveOnto(sq, draggingId) ? 'move' : 'none'
              }}
              onDrop={(e) => void dropOnSquad(e, sq)}
            >
              <header
                style={{
                  padding: '0.5rem 0.65rem',
                  borderBottom: '1px solid var(--border)',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  lineHeight: 1.35,
                  flexShrink: 0,
                }}
              >
                <div>{sq.label}</div>
                <div style={{ fontWeight: 400, fontSize: '0.8rem', opacity: 0.88 }}>
                  {squadPhaseLabel(sq.squad_phase)} · {activeCountForSquad(sq.id)}/{sq.capacity}
                </div>
              </header>
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '0.45rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.45rem',
                  minHeight: '4rem',
                }}
              >
                {regs.map((reg) => (
                  <article
                    key={reg.registration_id}
                    draggable={savingRegId !== reg.registration_id}
                    onDragStart={(e) => {
                      e.dataTransfer.setData(DND_MIME, reg.registration_id)
                      e.dataTransfer.effectAllowed = 'move'
                      setDraggingId(reg.registration_id)
                    }}
                    onDragEnd={() => setDraggingId(null)}
                    style={{
                      padding: '0.5rem 0.55rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      background:
                        draggingId === reg.registration_id ?
                          'var(--portal-card-bg-muted, transparent)'
                        : 'var(--btn-bg)',
                      opacity:
                        savingRegId === reg.registration_id ? 0.55 : draggingId === reg.registration_id ? 0.75 : 1,
                      cursor: savingRegId === reg.registration_id ? 'wait' : 'grab',
                      fontSize: '0.84rem',
                      lineHeight: 1.4,
                      boxShadow: draggingId === reg.registration_id ? '0 2px 8px rgba(0,0,0,0.12)' : undefined,
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{displayShooterName(reg)}</div>
                    <div style={{ opacity: 0.92, marginTop: '0.2rem', fontSize: '0.8rem' }}>
                      {reg.division}
                      {reg.classification_grade ?
                        <>
                          {' '}
                          ({reg.classification_grade})
                        </>
                      : null}
                    </div>
                    <div style={{ opacity: 0.82, marginTop: '0.2rem', fontSize: '0.76rem' }}>
                      {registrationStatusLabel(reg.status)}
                    </div>
                  </article>
                ))}

                {regs.length === 0 ?
                  <div
                    style={{
                      padding: '0.85rem 0.5rem',
                      textAlign: 'center',
                      fontSize: '0.82rem',
                      opacity: 0.65,
                      border: '1px dashed var(--border)',
                      borderRadius: '8px',
                    }}
                  >
                    {p.matchOrgRosterBoardEmptyColumn}
                  </div>
                : null}
              </div>

              <footer
                style={{
                  padding: '0.35rem 0.5rem',
                  borderTop: '1px solid var(--border)',
                  fontSize: '0.76rem',
                  opacity: 0.85,
                  flexShrink: 0,
                  textAlign: 'center',
                }}
              >
                {activeCountForSquad(sq.id)}/{sq.capacity}
              </footer>
            </section>
          )
        })}
      </div>

      {inactiveRegistrations.length === 0 ? null : (
        <div style={{ marginTop: '1.75rem', maxWidth: '42rem' }}>
          <h2 className="portal-home__hero-title" style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>
            {p.matchOrgRosterInactiveHeading}
          </h2>
          <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.88rem', lineHeight: 1.6 }}>
            {inactiveRegistrations.map((reg) => (
              <li key={reg.registration_id}>
                {displayShooterName(reg)} — {registrationStatusLabel(reg.status)} ({reg.squad_label})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
