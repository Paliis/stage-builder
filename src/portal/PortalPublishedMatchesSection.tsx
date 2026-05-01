import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatTemplate } from '../i18n/format'
import type { Locale } from '../i18n/messages'
import { useI18n } from '../i18n/useI18n'
import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient'
import { formatPortalDate } from './matches/matchPortalFormat'
import {
  buildCalendarCells,
  buildCountsByLocalDay,
  filterPublishedMatchesForHub,
  localDateKeyFromDate,
  normalizeSearchQuery,
  type PubMatchRow,
} from './matches/matchPortalBrowseUtils'
import { isMatchPortalEnabled } from './featureFlags'
import './PortalHome.css'
import './PortalMatchHub.css'

function weekdayShortLabels(locale: Locale): string[] {
  const loc = locale === 'uk' ? 'uk-UA' : 'en-GB'
  const fmt = new Intl.DateTimeFormat(loc, { weekday: 'short' })
  const out: string[] = []
  for (let i = 0; i < 7; i++) {
    out.push(fmt.format(new Date(2024, 0, 1 + i)))
  }
  return out
}

function formatMonthYearTitle(locale: Locale, year: number, monthIndex: number): string {
  const loc = locale === 'uk' ? 'uk-UA' : 'en-GB'
  return new Intl.DateTimeFormat(loc, { month: 'long', year: 'numeric' }).format(new Date(year, monthIndex, 1))
}

/** Published match catalog hub section — used at `/:locale/matches` (not the portal tool launcher). */
export function PortalPublishedMatchesSection() {
  const { locale, tree } = useI18n()
  const p = tree.portal
  const configured = isSupabaseConfigured()
  const sb = useMemo(() => (configured ? getSupabase() : null), [configured])

  const [allRows, setAllRows] = useState<PubMatchRow[] | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)

  const [searchInput, setSearchInput] = useState('')
  const deferredSearch = useDeferredValue(searchInput)
  const queryNorm = useMemo(() => normalizeSearchQuery(deferredSearch), [deferredSearch])

  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const dateFromNorm = dateFrom.trim() || null
  const dateToNorm = dateTo.trim() || null

  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const [{ y: calY, m: calM }, setCalendarMonth] = useState(() => {
    const d = new Date()
    return { y: d.getFullYear(), m: d.getMonth() }
  })

  const matchPortalOn = isMatchPortalEnabled()

  const load = useCallback(async () => {
    if (!sb || !matchPortalOn) return
    await Promise.resolve()
    setError(null)
    const start = new Date()
    start.setUTCHours(0, 0, 0, 0)
    const { data, error: qErr } = await sb
      .from('matches')
      .select('id, title, starts_at, location_label')
      .eq('status', 'published')
      .gte('starts_at', start.toISOString())
      .order('starts_at', { ascending: true })
      .limit(500)
    if (qErr) {
      setError(qErr.message)
      setAllRows([])
      return
    }
    setAllRows((data ?? []) as PubMatchRow[])
  }, [sb, matchPortalOn])

  useEffect(() => {
    if (!configured || !matchPortalOn) return
    queueMicrotask(() => void load())
  }, [configured, load, matchPortalOn])

  const rowsForCalendar = useMemo(
    () =>
      filterPublishedMatchesForHub(allRows ?? [], {
        queryNorm,
        dateFrom: dateFromNorm,
        dateTo: dateToNorm,
        selectedDay: null,
      }),
    [allRows, queryNorm, dateFromNorm, dateToNorm],
  )

  const countsByDay = useMemo(() => buildCountsByLocalDay(rowsForCalendar), [rowsForCalendar])

  const filteredList = useMemo(
    () =>
      filterPublishedMatchesForHub(allRows ?? [], {
        queryNorm,
        dateFrom: dateFromNorm,
        dateTo: dateToNorm,
        selectedDay,
      }),
    [allRows, queryNorm, dateFromNorm, dateToNorm, selectedDay],
  )

  const calendarCells = useMemo(() => buildCalendarCells(calY, calM), [calY, calM])
  const dowLabels = useMemo(() => weekdayShortLabels(locale), [locale])
  const monthTitle = useMemo(() => formatMonthYearTitle(locale, calY, calM), [locale, calY, calM])
  const todayKey = localDateKeyFromDate(new Date())

  const clearFilters = useCallback(() => {
    setSearchInput('')
    setDateFrom('')
    setDateTo('')
    setSelectedDay(null)
    const d = new Date()
    setCalendarMonth({ y: d.getFullYear(), m: d.getMonth() })
  }, [])

  if (!matchPortalOn || !configured) return null

  const hasActiveFilters =
    searchInput.trim() !== '' || dateFromNorm !== null || dateToNorm !== null || selectedDay !== null

  return (
    <section className="portal-home__matches-published" aria-labelledby="portal-published-matches">
      <h1 id="portal-published-matches" className="portal-home__matches-published-title">
        {p.portalPublishedMatchesHeading}
      </h1>
      <p className="portal-home__matches-published-lead">{p.portalPublishedMatchesLead}</p>

      <div className="portal-match-hub__toolbar">
        <div className="portal-match-hub__search-row">
          <label>
            <span className="portal-match-hub__sr-only">{p.portalMatchesHubSearchAria}</span>
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={p.portalMatchesHubSearchPlaceholder}
              autoComplete="off"
              spellCheck={false}
            />
          </label>
        </div>
        <div className="portal-match-hub__filters-row">
          <label>
            {p.portalMatchesHubDateFrom}
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </label>
          <label>
            {p.portalMatchesHubDateTo}
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </label>
          <label>
            {p.portalMatchesHubMonthJumpLabel}
            <input
              type="month"
              value={`${calY}-${String(calM + 1).padStart(2, '0')}`}
              onChange={(e) => {
                const v = e.target.value
                if (!v) return
                const [ys, ms] = v.split('-').map(Number)
                if (!Number.isFinite(ys) || !Number.isFinite(ms)) return
                setCalendarMonth({ y: ys, m: ms - 1 })
              }}
            />
          </label>
          <button type="button" className="portal-match-hub__clear-btn" onClick={clearFilters}>
            {p.portalMatchesHubClearFilters}
          </button>
        </div>
      </div>

      {error ?
        <p role="alert" className="portal-home__matches-published-error">
          {p.portalPublishedMatchesLoadError}: {error}
        </p>
      : allRows === undefined ?
        <p className="portal-home__matches-published-empty">{p.matchesLoadingDetail}</p>
      : allRows !== undefined && allRows.length === 0 && !error ?
        <p className="portal-home__matches-published-empty">{p.portalPublishedMatchesEmpty}</p>
      : (
        <div className="portal-match-hub__layout">
          <div className="portal-match-hub__calendar-panel">
            <div className="portal-match-hub__calendar-head">
              <p className="portal-match-hub__calendar-month-title">{monthTitle}</p>
              <div className="portal-match-hub__calendar-nav">
                <button
                  type="button"
                  aria-label={p.portalMatchesHubCalendarPrevAria}
                  onClick={() =>
                    setCalendarMonth(({ y, m }) => {
                      const nm = m - 1
                      if (nm < 0) return { y: y - 1, m: 11 }
                      return { y, m: nm }
                    })
                  }
                >
                  ‹
                </button>
                <button
                  type="button"
                  aria-label={p.portalMatchesHubCalendarNextAria}
                  onClick={() =>
                    setCalendarMonth(({ y, m }) => {
                      const nm = m + 1
                      if (nm > 11) return { y: y + 1, m: 0 }
                      return { y, m: nm }
                    })
                  }
                >
                  ›
                </button>
              </div>
            </div>
            <ul className="portal-match-hub__calendar-grid" role="list" aria-label={p.portalMatchesHubCalendarAria}>
              {dowLabels.map((label) => (
                <li key={label} className="portal-match-hub__calendar-dow">
                  {label}
                </li>
              ))}
              {calendarCells.map((cell, idx) => {
                if (cell.kind === 'empty') {
                  return <li key={`e-${idx}`} />
                }
                const n = countsByDay[cell.dateKey] ?? 0
                const isToday = cell.dateKey === todayKey
                const isSel = selectedDay === cell.dateKey
                const aria = formatTemplate(p.portalMatchesHubDayButtonAria, { date: cell.dateKey })
                return (
                  <li key={cell.dateKey}>
                    <button
                      type="button"
                      className={`portal-match-hub__calendar-day${isToday ? ' portal-match-hub__calendar-day--today' : ''}${isSel ? ' portal-match-hub__calendar-day--selected' : ''}${n === 0 ? ' portal-match-hub__calendar-day--muted' : ''}`}
                      aria-label={aria}
                      aria-pressed={isSel}
                      disabled={n === 0}
                      onClick={() => setSelectedDay((prev) => (prev === cell.dateKey ? null : cell.dateKey))}
                    >
                      {cell.day}
                      {n > 0 ? <span className="portal-match-hub__calendar-dot" aria-hidden /> : null}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="portal-match-hub__list-panel">
            {filteredList.length === 0 ?
              <p className="portal-home__matches-published-empty" role="status">
                {hasActiveFilters ? p.portalMatchesHubNoMatchesFiltered : p.portalPublishedMatchesEmpty}
              </p>
            :
              <ul className="portal-home__matches-published-list">
                {filteredList.map((m) => (
                  <li key={m.id} className="portal-home__matches-published-item">
                    <span className="portal-home__matches-published-item-meta">
                      <time dateTime={m.starts_at}>{formatPortalDate(m.starts_at, locale)}</time>
                      {m.location_label?.trim() ?
                        <>
                          {' · '}
                          {m.location_label.trim()}
                        </>
                      : null}
                    </span>
                    <span className="portal-home__matches-published-item-body">
                      <Link to={`/${locale}/matches/${m.id}`} className="portal-home__matches-published-link">
                        {m.title.trim() || '—'}
                      </Link>
                      <span className="portal-home__matches-published-cta" aria-hidden>
                        {' →'}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            }
          </div>
        </div>
      )}
    </section>
  )
}
