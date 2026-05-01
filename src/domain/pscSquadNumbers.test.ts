import { describe, expect, it } from 'vitest'

import { buildSquadIdToPsShSqdMap, prematchSquadDisplayStart } from './pscSquadNumbers'

describe('pscSquadNumbers', () => {
  it('bumps prematch label start when there are many squads', () => {
    expect(prematchSquadDisplayStart(10)).toBe(11)
    expect(prematchSquadDisplayStart(11)).toBe(22)
  })

  it('maps main first (1-based display ↔ sh_sqd) then prematch with high-number labels', () => {
    const m = buildSquadIdToPsShSqdMap([
      { id: 'prem0', sort_order: 0, squad_phase: 'prematch' },
      { id: 'mainB', sort_order: 10, squad_phase: 'main' },
      { id: 'mainA', sort_order: 0, squad_phase: 'main' },
    ])
    expect(m.get('mainA')).toBe(0)
    expect(m.get('mainB')).toBe(1)
    expect(m.get('prem0')).toBe(11 - 1)
  })

  it('uses label start 22 when total squad rows exceed 10', () => {
    const rows = [
      ...Array.from({ length: 11 }, (_, i) => ({
        id: `m${i}`,
        sort_order: i,
        squad_phase: 'main' as const,
      })),
      { id: 'p0', sort_order: 0, squad_phase: 'prematch' as const },
    ]
    expect(prematchSquadDisplayStart(rows.length)).toBe(22)
    const m = buildSquadIdToPsShSqdMap(rows)
    expect(m.get('p0')).toBe(22 - 1)
  })
})
