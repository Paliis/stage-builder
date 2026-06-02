import { useEffect, useState } from 'react'

import type { MatchProgrammeStatsBundle } from '../../domain/matchProgrammeStats'
import type { StageCategory } from '../../domain/models'
import { formatTemplate } from '../../i18n/format'
import type { MessageTree } from '../../i18n/messages'
import { useI18n } from '../../i18n/useI18n'

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
}: Props) {
  const { tree } = useI18n()
  const categories = tree.briefing.category
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

  return (
    <div className="portal-match-public-detail__programme-layout">
      <ol className="portal-match-public-detail__programme portal-match-public-detail__programme-list">
        {stages.map((lnk, idx) => {
          const sid = lnk.share_stage_id?.trim()
          const title = displayTitles[idx]!
          return (
            <li key={`${sid ?? ''}-${lnk.sort_order}-${idx}`}>
              {sid ?
                <a
                  href={`/v/${encodeURIComponent(sid)}?lang=${locale}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {title}
                </a>
              : title}
            </li>
          )
        })}
      </ol>

      <div className="portal-match-public-detail__programme-stats">
        <div className="portal-match-public-detail__programme-stats-toolbar">
          <button type="button" className="portal-btn portal-btn--secondary" disabled>
            {p.matchDetailProgrammeStatsDownloadSoon}
          </button>
        </div>

        {stats.status === 'loading' ?
          <p className="portal-match-public-detail__muted">{p.matchDetailProgrammeStatsLoading}</p>
        : stats.status === 'error' ?
          <p role="alert" className="portal-match-public-detail__muted">
            {p.matchesLoadError}: {stats.message}
          </p>
        : stats.status === 'ready' ?
          <div className="portal-match-public-detail__table-scroll">
            <table className="portal-match-public-detail__table portal-match-public-detail__programme-stats-table">
              <caption className="portal-shell__sr-only">{p.matchDetailProgrammeStatsCaption}</caption>
              <thead>
                <tr>
                  <th scope="col">{p.matchDetailProgrammeStatsColStage}</th>
                  <th scope="col">{p.matchDetailProgrammeStatsColType}</th>
                  <th scope="col">{p.matchDetailProgrammeStatsColPaper}</th>
                  <th scope="col">{p.matchDetailProgrammeStatsColMetal}</th>
                  <th scope="col">{p.matchDetailProgrammeStatsColCeramic}</th>
                  <th scope="col">{p.matchDetailProgrammeStatsColPopper}</th>
                  <th scope="col">{p.matchDetailProgrammeStatsColMiniPopper}</th>
                  <th scope="col">{p.matchDetailProgrammeStatsColAmmo}</th>
                  <th scope="col">{p.matchDetailProgrammeStatsColShots}</th>
                  <th scope="col">{p.matchDetailProgrammeStatsColPoints}</th>
                  <th scope="col">{p.matchDetailProgrammeStatsColPercent}</th>
                </tr>
              </thead>
              <tbody>
                {stages.map((lnk, idx) => {
                  const row = rowByOrder.get(lnk.sort_order)
                  const title = displayTitles[idx]!
                  if (!row) {
                    return (
                      <tr key={`missing-${lnk.sort_order}-${idx}`}>
                        <th scope="row">{title}</th>
                        <td colSpan={10}>—</td>
                      </tr>
                    )
                  }
                  const t = row.targets
                  return (
                    <tr key={`stat-${lnk.sort_order}-${idx}`}>
                      <th scope="row">{title}</th>
                      <td>{categoryLabel(categories, row.exerciseType)}</td>
                      <td>{cellCount(t.paper)}</td>
                      <td>{cellCount(t.metalPlates)}</td>
                      <td>{cellCount(t.ceramic)}</td>
                      <td>{cellCount(t.poppers)}</td>
                      <td>{cellCount(t.miniPoppers)}</td>
                      <td>{row.ammoLabel}</td>
                      <td>{row.shots}</td>
                      <td>{row.points}</td>
                      <td>
                        {formatTemplate(p.matchDetailProgrammeStatsPercentValue, {
                          value: String(row.matchPercent),
                        })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row">{p.matchDetailProgrammeStatsRowTotal}</th>
                  <td />
                  <td>{cellCount(stats.data.totals.paper)}</td>
                  <td>{cellCount(stats.data.totals.metalPlates)}</td>
                  <td>{cellCount(stats.data.totals.ceramic)}</td>
                  <td>{cellCount(stats.data.totals.poppers)}</td>
                  <td>{cellCount(stats.data.totals.miniPoppers)}</td>
                  <td />
                  <td>{stats.data.totals.shots}</td>
                  <td>{stats.data.totals.points}</td>
                  <td>
                    {formatTemplate(p.matchDetailProgrammeStatsPercentValue, { value: '100' })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        : null}
      </div>
    </div>
  )
}
