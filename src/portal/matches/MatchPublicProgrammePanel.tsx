import { useEffect, useState } from 'react'

import type { MatchProgrammeStatsBundle } from '../../domain/matchProgrammeStats'
import type { StageCategory } from '../../domain/models'
import { formatTemplate } from '../../i18n/format'
import type { MessageTree } from '../../i18n/messages'
import { useI18n } from '../../i18n/useI18n'
import { programmeStatsTableHeaders } from './matchProgrammeStatsTableHeaders'

type ProgrammeStageLink = {
  sort_order: number
  share_stage_id: string | null
}

type Props = {
  locale: string
  matchId: string
  stages: ProgrammeStageLink[]
  displayTitles: string[]
  p: MessageTree['portal']
  /** When false, parent renders download control in section header. */
  showToolbar?: boolean
}

function StatsTh({ full, short }: { full: string; short: string }) {
  return (
    <>
      <span className="portal-match-public-programme-stats-table__th-full">{full}</span>
      <span className="portal-match-public-programme-stats-table__th-short" aria-hidden="true">
        {short}
      </span>
    </>
  )
}

type StatsState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; data: MatchProgrammeStatsBundle }
  | { status: 'error'; message: string }

function categoryLabel(
  categories: { short: string; medium: string; long: string },
  type: StageCategory,
): string {
  if (type === 'short') return categories.short
  if (type === 'medium') return categories.medium
  return categories.long
}

function cellCount(n: number): string {
  return n > 0 ? String(n) : '—'
}

export function MatchPublicProgrammePanel({
  locale,
  matchId,
  stages,
  displayTitles,
  p,
  showToolbar = true,
}: Props) {
  const { tree } = useI18n()
  const categories = tree.briefing.category
  const locUi = locale === 'uk' ? 'uk' : 'en'
  const colHeaders = programmeStatsTableHeaders(p, locUi)
  const [stats, setStats] = useState<StatsState>({ status: 'idle' })

  useEffect(() => {
    let cancelled = false
    setStats({ status: 'loading' })

    const url = `/api/match-programme-stats?matchId=${encodeURIComponent(matchId)}`
    void fetch(url)
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null
          throw new Error(body?.error ?? res.statusText)
        }
        return res.json() as Promise<MatchProgrammeStatsBundle>
      })
      .then((data) => {
        if (!cancelled) setStats({ status: 'ready', data })
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setStats({
            status: 'error',
            message: e instanceof Error ? e.message : String(e),
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [matchId])

  const rowByOrder = new Map(
    stats.status === 'ready' ? stats.data.rows.map((r) => [r.sortOrder, r] as const) : [],
  )

  function stageTitleCell(lnk: ProgrammeStageLink, idx: number) {
    const sid = lnk.share_stage_id?.trim()
    const title = displayTitles[idx]!
    if (!sid) return title
    return (
      <a
        href={`/v/${encodeURIComponent(sid)}?lang=${locale}`}
        target="_blank"
        rel="noopener noreferrer"
        className="portal-match-public-programme-stats-table__stage-link"
      >
        {title}
      </a>
    )
  }

  return (
    <div className="portal-match-public-detail__programme-layout">
      {showToolbar ?
        <div className="portal-match-public-detail__programme-stats-toolbar">
          <button type="button" className="portal-btn portal-btn--secondary" disabled>
            {p.matchDetailProgrammeStatsDownloadSoon}
          </button>
        </div>
      : null}

      {stats.status === 'loading' ?
        <>
          <p className="portal-match-public-detail__muted portal-match-public-detail__programme-status">
            {p.matchDetailProgrammeStatsLoading}
          </p>
          <ol className="portal-match-public-detail__programme portal-match-public-detail__programme-list">
            {stages.map((lnk, idx) => (
              <li key={`${lnk.share_stage_id ?? ''}-${lnk.sort_order}-${idx}`}>{stageTitleCell(lnk, idx)}</li>
            ))}
          </ol>
        </>
      : stats.status === 'error' ?
        <>
          <p role="alert" className="portal-match-public-detail__muted portal-match-public-detail__programme-status">
            {p.matchesLoadError}: {stats.message}
          </p>
          <ol className="portal-match-public-detail__programme portal-match-public-detail__programme-list">
            {stages.map((lnk, idx) => (
              <li key={`${lnk.share_stage_id ?? ''}-${lnk.sort_order}-${idx}`}>{stageTitleCell(lnk, idx)}</li>
            ))}
          </ol>
        </>
      : stats.status === 'ready' ?
        <div className="portal-match-public-detail__table-scroll portal-match-public-detail__data-table-wrap portal-match-public-detail__programme-table-wrap">
          <table className="portal-match-public-participants-table portal-match-public-programme-stats-table">
            <caption className="portal-shell__sr-only">{p.matchDetailProgrammeStatsCaption}</caption>
            <thead>
              <tr>
                <th scope="col" className="portal-match-public-programme-stats-table__stage">
                  <StatsTh full={colHeaders[0]!.full} short={colHeaders[0]!.short} />
                </th>
                <th scope="col" className="portal-match-public-programme-stats-table__type">
                  <StatsTh full={colHeaders[1]!.full} short={colHeaders[1]!.short} />
                </th>
                <th scope="col" className="portal-match-public-programme-stats-table__num">
                  <StatsTh full={colHeaders[2]!.full} short={colHeaders[2]!.short} />
                </th>
                <th scope="col" className="portal-match-public-programme-stats-table__num">
                  <StatsTh full={colHeaders[3]!.full} short={colHeaders[3]!.short} />
                </th>
                <th scope="col" className="portal-match-public-programme-stats-table__num">
                  <StatsTh full={colHeaders[4]!.full} short={colHeaders[4]!.short} />
                </th>
                <th scope="col" className="portal-match-public-programme-stats-table__num">
                  <StatsTh full={colHeaders[5]!.full} short={colHeaders[5]!.short} />
                </th>
                <th scope="col" className="portal-match-public-programme-stats-table__num">
                  <StatsTh full={colHeaders[6]!.full} short={colHeaders[6]!.short} />
                </th>
                <th scope="col" className="portal-match-public-programme-stats-table__ammo">
                  <StatsTh full={colHeaders[7]!.full} short={colHeaders[7]!.short} />
                </th>
                <th scope="col" className="portal-match-public-programme-stats-table__num">
                  <StatsTh full={colHeaders[8]!.full} short={colHeaders[8]!.short} />
                </th>
                <th scope="col" className="portal-match-public-programme-stats-table__num">
                  <StatsTh full={colHeaders[9]!.full} short={colHeaders[9]!.short} />
                </th>
                <th scope="col" className="portal-match-public-programme-stats-table__num">
                  <StatsTh full={colHeaders[10]!.full} short={colHeaders[10]!.short} />
                </th>
              </tr>
            </thead>
            <tbody>
              {stages.map((lnk, idx) => {
                const row = rowByOrder.get(lnk.sort_order)
                if (!row) {
                  return (
                    <tr key={`missing-${lnk.sort_order}-${idx}`}>
                      <th scope="row" className="portal-match-public-programme-stats-table__stage">
                        {stageTitleCell(lnk, idx)}
                      </th>
                      <td colSpan={10}>—</td>
                    </tr>
                  )
                }
                const t = row.targets
                return (
                  <tr key={`stat-${lnk.sort_order}-${idx}`}>
                    <th scope="row" className="portal-match-public-programme-stats-table__stage">
                      {stageTitleCell(lnk, idx)}
                    </th>
                    <td className="portal-match-public-programme-stats-table__type">
                      {categoryLabel(categories, row.exerciseType)}
                    </td>
                    <td className="portal-match-public-programme-stats-table__num">{cellCount(t.paper)}</td>
                    <td className="portal-match-public-programme-stats-table__num">{cellCount(t.metalPlates)}</td>
                    <td className="portal-match-public-programme-stats-table__num">{cellCount(t.ceramic)}</td>
                    <td className="portal-match-public-programme-stats-table__num">{cellCount(t.poppers)}</td>
                    <td className="portal-match-public-programme-stats-table__num">{cellCount(t.miniPoppers)}</td>
                    <td className="portal-match-public-programme-stats-table__ammo">{row.ammoLabel}</td>
                    <td className="portal-match-public-programme-stats-table__num">{row.shots}</td>
                    <td className="portal-match-public-programme-stats-table__num">{row.points}</td>
                    <td className="portal-match-public-programme-stats-table__num">
                      {formatTemplate(p.matchDetailProgrammeStatsPercentValue, {
                        value: String(row.matchPercent),
                      })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="portal-match-public-programme-stats-table__total-row">
                <th scope="row" className="portal-match-public-programme-stats-table__stage">
                  {p.matchDetailProgrammeStatsRowTotal}
                </th>
                <td className="portal-match-public-programme-stats-table__type" />
                <td className="portal-match-public-programme-stats-table__num">
                  {cellCount(stats.data.totals.paper)}
                </td>
                <td className="portal-match-public-programme-stats-table__num">
                  {cellCount(stats.data.totals.metalPlates)}
                </td>
                <td className="portal-match-public-programme-stats-table__num">
                  {cellCount(stats.data.totals.ceramic)}
                </td>
                <td className="portal-match-public-programme-stats-table__num">
                  {cellCount(stats.data.totals.poppers)}
                </td>
                <td className="portal-match-public-programme-stats-table__num">
                  {cellCount(stats.data.totals.miniPoppers)}
                </td>
                <td className="portal-match-public-programme-stats-table__ammo" />
                <td className="portal-match-public-programme-stats-table__num">{stats.data.totals.shots}</td>
                <td className="portal-match-public-programme-stats-table__num">{stats.data.totals.points}</td>
                <td className="portal-match-public-programme-stats-table__num">
                  {formatTemplate(p.matchDetailProgrammeStatsPercentValue, { value: '100' })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      : (
        <ol className="portal-match-public-detail__programme portal-match-public-detail__programme-list">
          {stages.map((lnk, idx) => (
            <li key={`${lnk.share_stage_id ?? ''}-${lnk.sort_order}-${idx}`}>{stageTitleCell(lnk, idx)}</li>
          ))}
        </ol>
      )}
    </div>
  )
}
