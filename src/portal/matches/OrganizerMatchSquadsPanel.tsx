import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { getSupabase } from '../../lib/supabaseClient'
import { formatTemplate } from '../../i18n/format'
import type { MessageTree } from '../../i18n/messages'

type Portal = MessageTree['portal']

export type OrganizerMatchSquadsPanelProps = {
  matchId: string
  p: Portal
  prematchEnabled: boolean
  plannedMainSquads: number
  plannedPrematchSquads: number
}

type SquadRow = {
  id: string
  label: string
  sort_order: number
  capacity: number
  squad_phase: 'main' | 'prematch'
}

export function OrganizerMatchSquadsPanel({
  matchId,
  p,
  prematchEnabled,
  plannedMainSquads,
  plannedPrematchSquads,
}: OrganizerMatchSquadsPanelProps) {
  const sb = useMemo(() => getSupabase(), [])
  const [rows, setRows] = useState<SquadRow[] | undefined>(undefined)
  const [takenMap, setTakenMap] = useState<Record<string, number>>({})
  const [loadError, setLoadError] = useState<string | null>(null)

  const [newLabel, setNewLabel] = useState('')
  const [newCap, setNewCap] = useState(18)
  const [newPhase, setNewPhase] = useState<'main' | 'prematch'>('main')
  const [mutating, setMutating] = useState(false)
  const [mutErr, setMutErr] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoadError(null)
    const { data: squads, error: sErr } = await sb
      .from('match_squads')
      .select('id, label, sort_order, capacity, squad_phase')
      .eq('match_id', matchId)
      .order('sort_order', { ascending: true })

    if (sErr) {
      setLoadError(sErr.message.includes('column') ? `${sErr.message} (${p.matchDetailApplyMigrationHint})` : sErr.message)
      setRows([])
      return
    }

    const list = (squads ?? []) as SquadRow[]
    setRows(list)

    const { data: regs, error: rErr } = await sb
      .from('match_registrations')
      .select('squad_id, status')
      .eq('match_id', matchId)

    if (rErr || !regs) {
      setTakenMap({})
      return
    }

    const map: Record<string, number> = {}
    for (const r of regs as { squad_id: string; status: string }[]) {
      if (r.status !== 'pending' && r.status !== 'confirmed') continue
      map[r.squad_id] = (map[r.squad_id] ?? 0) + 1
    }
    setTakenMap(map)
  }, [matchId, sb, p.matchDetailApplyMigrationHint])

  useEffect(() => {
    void reload()
  }, [reload])

  useEffect(() => {
    if (!prematchEnabled && newPhase === 'prematch') setNewPhase('main')
  }, [prematchEnabled, newPhase])

  const counts = useMemo(() => {
    const main = rows?.filter((r) => r.squad_phase !== 'prematch').length ?? 0
    const prematch = rows?.filter((r) => r.squad_phase === 'prematch').length ?? 0
    return { main, prematch }
  }, [rows])

  async function handleAdd(ev: FormEvent) {
    ev.preventDefault()
    setMutErr(null)
    const label = newLabel.trim()
    if (!label) return
    const cap = Number(newCap)
    if (!Number.isFinite(cap) || cap < 1) {
      setMutErr(p.matchOrgSquadCapacityInvalid)
      return
    }
    if (!prematchEnabled && newPhase === 'prematch') {
      setMutErr(p.matchOrgPlannedPrematchInvalid)
      return
    }

    const nextOrder =
      rows?.length ? Math.max(...rows.map((r) => r.sort_order), -1) + 1 : 0
    const phaseInsert = prematchEnabled && newPhase === 'prematch' ? 'prematch' : 'main'

    setMutating(true)
    const { error } = await sb.from('match_squads').insert({
      match_id: matchId,
      label,
      capacity: Math.floor(cap),
      sort_order: nextOrder,
      squad_phase: phaseInsert,
    })
    setMutating(false)
    if (error) {
      setMutErr(error.message)
      return
    }
    setNewLabel('')
    setNewCap(18)
    await reload()
  }

  async function handleDelete(id: string) {
    setMutErr(null)
    const taken = takenMap[id] ?? 0
    if (taken > 0) {
      setMutErr(p.matchOrgSquadHasRegistrations)
      return
    }
    setMutating(true)
    const { error } = await sb.from('match_squads').delete().eq('id', id)
    setMutating(false)
    if (error) {
      setMutErr(error.message.includes('foreign key') ? p.matchOrgSquadHasRegistrations : error.message)
      return
    }
    await reload()
  }

  return (
    <section style={{ marginTop: '2rem', maxWidth: '42rem' }} aria-labelledby="match-squads-heading">
      <h2 id="match-squads-heading" className="portal-home__hero-title" style={{ fontSize: '1.1rem', margin: '0 0 0.5rem' }}>
        {p.matchOrgSquadsHeading}
      </h2>
      <p style={{ margin: '0 0 0.75rem', fontSize: '0.88rem', lineHeight: 1.55, opacity: 0.92 }}>
        {p.matchOrgSquadsIntro}
      </p>

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
        <p role="alert">{p.matchesLoadError}: {loadError}</p>
      : rows === undefined ?
        <p>{p.myMatchesLoading}</p>
      : rows.length === 0 ?
        <p style={{ margin: '0 0 0.85rem', fontSize: '0.95rem' }}>{p.matchOrgSquadsEmpty}</p>
      : <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
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
                <th scope="col" style={{ padding: '0.45rem 0.55rem', borderBottom: '1px solid var(--border)' }} aria-hidden />
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
                  <td style={{ padding: '0.45rem 0.55rem', borderBottom: '1px solid var(--border)' }}>
                    <button
                      type="button"
                      disabled={mutating || (takenMap[r.id] ?? 0) > 0}
                      onClick={() => void handleDelete(r.id)}
                    >
                      {p.matchOrgSquadsDelete}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      }

      <form
        onSubmit={(e) => void handleAdd(e)}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.65rem',
          alignItems: 'flex-end',
          fontSize: '0.92rem',
        }}
      >
        {prematchEnabled ?
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {p.matchOrgSquadsColPhase}
            <select
              value={newPhase}
              onChange={(e) => setNewPhase(e.target.value === 'prematch' ? 'prematch' : 'main')}
              disabled={mutating}
              style={{
                padding: '0.35rem 0.45rem',
                borderRadius: '6px',
                border: '1px solid var(--border)',
              }}
            >
              <option value="main">{p.matchOrgSquadsPhaseMain}</option>
              <option value="prematch">{p.matchOrgSquadsPhasePrematch}</option>
            </select>
          </label>
        : null}
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {p.matchOrgSquadsNewLabel}
          <input type="text" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} disabled={mutating} style={{ padding: '0.35rem 0.45rem', minWidth: '10rem' }} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {p.matchOrgSquadsNewCapacity}
          <input
            type="number"
            min={1}
            value={newCap}
            onChange={(e) => setNewCap(Number(e.target.value) || 1)}
            disabled={mutating}
            style={{ padding: '0.35rem 0.45rem', width: '5.5rem' }}
          />
        </label>
        <button type="submit" disabled={mutating}>
          {p.matchOrgSquadsAdd}
        </button>
      </form>

      {mutErr ? <p role="alert" style={{ margin: '0.65rem 0 0', fontSize: '0.9rem' }}>{mutErr}</p> : null}
    </section>
  )
}
