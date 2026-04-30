import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatTemplate } from '../../i18n/format'
import { getSupabase } from '../../lib/supabaseClient'
import type { MessageTree } from '../../i18n/messages'
import { sortSquadsPrematchFirst } from './matchSquadsSort'

type Portal = MessageTree['portal']

export type OrganizerMatchSquadsPanelProps = {
  locale: string
  matchId: string
  p: Portal
  prematchEnabled: boolean
  plannedMainSquads: number
  plannedPrematchSquads: number
  shootersPerMainSquad: number
  shootersPerPrematchSquad: number
}

type SquadRow = {
  id: string
  label: string
  sort_order: number
  capacity: number
  squad_phase: 'main' | 'prematch'
}

export function OrganizerMatchSquadsPanel({
  locale,
  matchId,
  p,
  prematchEnabled,
  plannedMainSquads,
  plannedPrematchSquads,
  shootersPerMainSquad,
  shootersPerPrematchSquad,
}: OrganizerMatchSquadsPanelProps) {
  const sb = useMemo(() => getSupabase(), [])
  const [rows, setRows] = useState<SquadRow[] | undefined>(undefined)
  const [takenMap, setTakenMap] = useState<Record<string, number>>({})
  const [loadError, setLoadError] = useState<string | null>(null)
  const [regBreakdown, setRegBreakdown] = useState<{ pending: number; confirmed: number } | undefined>(undefined)

  const plannedCapacity =
    plannedMainSquads * shootersPerMainSquad +
    (prematchEnabled ? plannedPrematchSquads * shootersPerPrematchSquad : 0)

  const reload = useCallback(async () => {
    setLoadError(null)
    setRegBreakdown(undefined)
    const { data: squads, error: sErr } = await sb
      .from('match_squads')
      .select('id, label, sort_order, capacity, squad_phase')
      .eq('match_id', matchId)
      .order('sort_order', { ascending: true })

    if (sErr) {
      setLoadError(sErr.message.includes('column') ? `${sErr.message} (${p.matchDetailApplyMigrationHint})` : sErr.message)
      setRows([])
      setRegBreakdown(undefined)
      return
    }

    const list = sortSquadsPrematchFirst((squads ?? []) as SquadRow[])
    setRows(list)

    const { data: regs, error: rErr } = await sb
      .from('match_registrations')
      .select('squad_id, status')
      .eq('match_id', matchId)

    if (rErr || !regs) {
      setTakenMap({})
      setRegBreakdown({ pending: 0, confirmed: 0 })
      return
    }

    let pendingN = 0
    let confirmedN = 0
    const map: Record<string, number> = {}
    for (const r of regs as { squad_id: string; status: string }[]) {
      if (r.status === 'pending') pendingN++
      else if (r.status === 'confirmed') confirmedN++
      if (r.status !== 'pending' && r.status !== 'confirmed') continue
      map[r.squad_id] = (map[r.squad_id] ?? 0) + 1
    }
    setTakenMap(map)
    setRegBreakdown({ pending: pendingN, confirmed: confirmedN })
  }, [matchId, sb, p.matchDetailApplyMigrationHint])

  useEffect(() => {
    void reload()
  }, [reload])

  const counts = useMemo(() => {
    const main = rows?.filter((r) => r.squad_phase !== 'prematch').length ?? 0
    const prematch = rows?.filter((r) => r.squad_phase === 'prematch').length ?? 0
    return { main, prematch }
  }, [rows])

  return (
    <section style={{ marginTop: '2rem', maxWidth: '42rem' }} aria-labelledby="match-squads-heading">
      <h2 id="match-squads-heading" className="portal-home__hero-title" style={{ fontSize: '1.1rem', margin: '0 0 0.5rem' }}>
        {p.matchOrgSquadsHeading}
      </h2>

      <p style={{ margin: '0 0 0.75rem', fontSize: '0.88rem', lineHeight: 1.55, opacity: 0.92 }}>
        {p.matchOrgSquadsDerivedIntro}
      </p>

      <p style={{ margin: '0 0 0.85rem', fontSize: '0.9rem' }}>
        {formatTemplate(p.matchOrgSquadsDerivedCapacityLine, {
          mainSq: plannedMainSquads,
          mainShoot: shootersPerMainSquad,
          prematchPart: prematchEnabled
            ? formatTemplate(' + {{preSq}}×{{preShoot}}', {
                preSq: plannedPrematchSquads,
                preShoot: shootersPerPrematchSquad,
              })
            : '',
          planned: plannedCapacity,
        })}
      </p>

      <p style={{ margin: '0 0 1rem' }}>
        <Link to={`/${locale}/matches/my/${matchId}/roster`}>{p.matchOrgRosterManageLink}</Link>
      </p>

      {rows !== undefined && regBreakdown !== undefined ?
        regBreakdown.pending > 0 || regBreakdown.confirmed > 0 ?
          <p style={{ margin: '0 0 1rem', fontSize: '0.88rem', lineHeight: 1.55, opacity: 0.95 }}>
            {formatTemplate(p.matchOrgRegistrationsSummary, {
              pending: regBreakdown.pending,
              confirmed: regBreakdown.confirmed,
            })}
          </p>
        : <p style={{ margin: '0 0 1rem', fontSize: '0.88rem', opacity: 0.9 }}>{p.matchOrgRegistrationsNoneYet}</p>
      : null}

      <ul style={{ margin: '0 0 1rem', paddingLeft: '1.25rem', fontSize: '0.86rem', lineHeight: 1.55, opacity: 0.94 }}>
        <li>
          {formatTemplate(p.matchOrgSquadsPlannedMainLine, {
            current: counts.main,
            planned: plannedMainSquads,
          })}
        </li>
        {prematchEnabled ?
          <li>
            {formatTemplate(p.matchOrgSquadsPlannedPrematchLine, {
              current: counts.prematch,
              planned: plannedPrematchSquads,
            })}
          </li>
        : null}
      </ul>

      {loadError ?
        <p role="alert">
          {p.matchesLoadError}: {loadError}
        </p>
      : rows === undefined ?
        <p>{p.myMatchesLoading}</p>
      : rows.length === 0 ?
        <p style={{ margin: '0 0 0.85rem', fontSize: '0.95rem' }}>{p.matchOrgSquadsAutoEmpty}</p>
      : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', fontSize: '0.92rem', width: '100%' }}>
            <thead>
              <tr>
                <th scope="col" style={{ textAlign: 'left', padding: '0.45rem 0.55rem', borderBottom: '1px solid var(--border)' }}>
                  {p.matchOrgSquadsColPhase}
                </th>
                <th scope="col" style={{ textAlign: 'left', padding: '0.45rem 0.55rem', borderBottom: '1px solid var(--border)' }}>
                  {p.matchOrgSquadsColLabel}
                </th>
                <th scope="col" style={{ textAlign: 'left', padding: '0.45rem 0.55rem', borderBottom: '1px solid var(--border)' }}>
                  {p.matchOrgSquadsColCapacity}
                </th>
                <th scope="col" style={{ textAlign: 'left', padding: '0.45rem 0.55rem', borderBottom: '1px solid var(--border)' }}>
                  {p.matchOrgSquadsColTaken}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td style={{ padding: '0.45rem 0.55rem', borderBottom: '1px solid var(--border)' }}>
                    {r.squad_phase === 'prematch' ? p.matchOrgSquadsPhasePrematch : p.matchOrgSquadsPhaseMain}
                  </td>
                  <td style={{ padding: '0.45rem 0.55rem', borderBottom: '1px solid var(--border)' }}>{r.label}</td>
                  <td style={{ padding: '0.45rem 0.55rem', borderBottom: '1px solid var(--border)' }}>{r.capacity}</td>
                  <td style={{ padding: '0.45rem 0.55rem', borderBottom: '1px solid var(--border)' }}>{takenMap[r.id] ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
