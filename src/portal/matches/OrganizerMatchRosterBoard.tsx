import { useMemo, useState } from 'react'
import type { Locale, MessageTree } from '../../i18n/messages'

import '../PortalMatchesUi.css'
import { formatSquadLabelNumberOnly } from './matchPortalSquadDisplay'
import { portalMatchRegCardCueClass, portalMatchRegLabelClass } from './matchPortalRegStatusUi'

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
  phone: string
  weapon_details: string
  competitor_region: string
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

  return (
    <div className="portal-roster-board">
      <p className="portal-roster-board__hint">{p.matchOrgRosterBoardHint}</p>

      {blockedDrop ? (
        <p role="alert" className="portal-roster-board__alert">
          {p.matchOrgRosterBoardSquadFull}
        </p>
      ) : null}

      <div role="region" aria-label={p.matchOrgRosterViewBoard} className="portal-roster-board__strip">
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

          const squadSlotsForBody = Math.min(Math.max(sq.capacity, 4), 24)

          return (
            <section
              key={sq.id}
              className={`portal-roster-board__column${
                canDropHere ? ' portal-roster-board__column--drop-ok'
                : dragged !== null && showWarn ? ' portal-roster-board__column--drop-warn'
                : ''
              }`}
              style={{ ['--squad-capacity-slots' as string]: String(squadSlotsForBody) }}
              onDragOver={(e) => {
                if (!draggingId) return
                e.preventDefault()
                e.dataTransfer.dropEffect = allowsHypotheticalMoveOnto(sq, draggingId) ? 'move' : 'none'
              }}
              onDrop={(e) => void dropOnSquad(e, sq)}
            >
              <header className="portal-roster-board__column-head">
                <div title={sq.label}>{formatSquadLabelNumberOnly(sq.label)}</div>
                <div className="portal-roster-board__column-meta">
                  {squadPhaseLabel(sq.squad_phase)} · {activeCountForSquad(sq.id)}/{sq.capacity}
                </div>
              </header>
              <div className="portal-roster-board__column-body">
                {regs.map((reg) => {
                  const saving = savingRegId === reg.registration_id
                  const isDrag = draggingId === reg.registration_id
                  const divLine = reg.division

                  const tone: 'pending' | 'confirmed' | null =
                    reg.status === 'confirmed' ? 'confirmed'
                    : reg.status === 'pending' ? 'pending'
                    : null

                  return (
                    <article
                      key={reg.registration_id}
                      aria-label={`${displayShooterName(reg)}, ${divLine}, ${registrationStatusLabel(reg.status)}`}
                      className={`portal-roster-board-card${
                        tone ? ` ${portalMatchRegCardCueClass(tone)}` : ''
                      }${isDrag ? ' portal-roster-board-card--dragging' : ''}${
                        saving ? ' portal-roster-board-card--saving' : ''
                      }`}
                      draggable={!saving}
                      onDragStart={(e) => {
                        e.dataTransfer.setData(DND_MIME, reg.registration_id)
                        e.dataTransfer.effectAllowed = 'move'
                        setDraggingId(reg.registration_id)
                      }}
                      onDragEnd={() => setDraggingId(null)}
                    >
                      <div className="portal-roster-board-card__main">
                        <div className="portal-roster-board-card__name" title={displayShooterName(reg)}>
                          {displayShooterName(reg)}
                        </div>
                        <div className="portal-roster-board-card__division" title={divLine}>
                          {divLine}
                        </div>
                        <div
                          className="portal-roster-board-card__extra"
                          title={
                            [reg.phone?.trim(), reg.competitor_region?.trim(), reg.weapon_details?.trim()]
                              .filter(Boolean)
                              .join(' · ') || undefined
                          }
                        >
                          {(reg.phone ?? '').trim() ?
                            <span className="portal-roster-board-card__phone">{reg.phone.trim()}</span>
                          : null}
                          {(reg.competitor_region ?? '').trim() || (reg.weapon_details ?? '').trim() ?
                            <span className="portal-roster-board-card__meta">
                              {[reg.competitor_region?.trim(), reg.weapon_details?.trim()].filter(Boolean).join(' · ')}
                            </span>
                          : null}
                        </div>
                      </div>
                      {tone ? null : (
                        <div className="portal-roster-board-card__other-status">
                          <span className={portalMatchRegLabelClass(reg.status)}>
                            {registrationStatusLabel(reg.status)}
                          </span>
                        </div>
                      )}
                    </article>
                  )
                })}

                {regs.length === 0 ?
                  <div className="portal-roster-board__empty">{p.matchOrgRosterBoardEmptyColumn}</div>
                : null}
              </div>

              <footer className="portal-roster-board__column-foot">
                {activeCountForSquad(sq.id)}/{sq.capacity}
              </footer>
            </section>
          )
        })}
      </div>

      {inactiveRegistrations.length === 0 ? null : (
        <div className="portal-roster-board__inactive">
          <h2 className="portal-home__hero-title" style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>
            {p.matchOrgRosterInactiveHeading}
          </h2>
          <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.88rem', lineHeight: 1.6 }}>
            {inactiveRegistrations.map((reg) => (
              <li key={reg.registration_id} title={reg.squad_label}>
                {displayShooterName(reg)} —{' '}
                <span className={portalMatchRegLabelClass(reg.status)}>{registrationStatusLabel(reg.status)}</span> (
                {formatSquadLabelNumberOnly(reg.squad_label)})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
