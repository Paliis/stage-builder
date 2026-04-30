import { describe, expect, test } from 'vitest'
import {
  buildCalendarCells,
  filterPublishedMatchesForHub,
  matchSearchQuery,
  mondayFirstWeekdayIndex,
  normalizeSearchQuery,
  type PubMatchRow,
} from './matchPortalBrowseUtils'

function rowAtLocal(y: number, month0: number, day: number, title: string): PubMatchRow {
  return {
    id: `${title}-${day}`,
    title,
    starts_at: new Date(y, month0, day, 11, 0, 0).toISOString(),
    location_label: null,
  }
}

describe('matchPortalBrowseUtils', () => {
  test('normalizeSearchQuery trims and lowercases', () => {
    expect(normalizeSearchQuery('  Foo  ')).toBe('foo')
  })

  test('matchSearchQuery matches title and location substring', () => {
    const r: PubMatchRow = {
      id: '1',
      title: 'Seed Match',
      starts_at: new Date().toISOString(),
      location_label: 'Kyiv polygon',
    }
    expect(matchSearchQuery(r, 'seed')).toBe(true)
    expect(matchSearchQuery(r, 'polygon')).toBe(true)
    expect(matchSearchQuery(r, 'minsk')).toBe(false)
  })

  test('filterPublishedMatchesForHub applies date range', () => {
    const rows: PubMatchRow[] = [
      rowAtLocal(2026, 4, 10, 'A'), // May
      rowAtLocal(2026, 4, 14, 'B'),
      rowAtLocal(2026, 5, 1, 'C'), // June
    ]
    const inMay = filterPublishedMatchesForHub(rows, {
      queryNorm: '',
      dateFrom: '2026-05-01',
      dateTo: '2026-05-31',
      selectedDay: null,
    })
    expect(inMay.map((x) => x.title).sort()).toEqual(['A', 'B'])
  })

  test('filterPublishedMatchesForHub applies search plus range', () => {
    const rows: PubMatchRow[] = [rowAtLocal(2026, 4, 10, 'Alpha'), rowAtLocal(2026, 4, 14, 'Beta')]
    const filtered = filterPublishedMatchesForHub(rows, {
      queryNorm: normalizeSearchQuery('Beta'),
      dateFrom: '2026-05-01',
      dateTo: '2026-05-31',
      selectedDay: null,
    })
    expect(filtered.map((x) => x.title)).toEqual(['Beta'])
  })

  test('filterPublishedMatchesForHub selects a single calendar day', () => {
    const rows: PubMatchRow[] = [rowAtLocal(2026, 4, 10, 'A'), rowAtLocal(2026, 4, 14, 'B')]
    const filtered = filterPublishedMatchesForHub(rows, {
      queryNorm: '',
      dateFrom: null,
      dateTo: null,
      selectedDay: '2026-05-14',
    })
    expect(filtered.map((x) => x.title)).toEqual(['B'])
  })

  test('mondayFirstWeekdayIndex: Friday 2026-05-01 => 4', () => {
    expect(mondayFirstWeekdayIndex(new Date(2026, 4, 1))).toBe(4)
  })

  test('buildCalendarCells pads May 2026 and contains 31 days', () => {
    const cells = buildCalendarCells(2026, 4)
    expect(cells.length % 7).toBe(0)
    const days = cells.filter((c) => c.kind === 'day').map((c) => c.day)
    expect(days.length).toBe(31)
    expect(days).toContain(1)
    expect(days).toContain(31)
  })
})
