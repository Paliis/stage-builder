import { useEffect, useState } from 'react'

import {
  parsePublicMatchParticipantSummary,
  summaryRowTotal,
  summaryTotals,
  type MatchParticipantSummary,
} from '../../domain/matchParticipantSummary'
import { sortMatchParticipantSummary } from './matchParticipantSummarySort'
import type { MessageTree } from '../../i18n/messages'
import { getSupabase } from '../../lib/supabaseClient'
import { categoryLabel, divisionLabel, parseMatchDiscipline } from '../shooterProfileCatalog'

type Props = {
  matchId: string
  locale: string
  p: MessageTree['portal']
}

type LoadState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; data: MatchParticipantSummary }
  | { status: 'error'; message: string }
  | { status: 'hidden' }

function cellCount(n: number): string {
  return n > 0 ? String(n) : '—'
}

export function MatchPublicParticipantSummary({ matchId, locale, p }: Props) {
  const locUi = locale === 'uk' ? 'uk' : 'en'
  const [state, setState] = useState<LoadState>({ status: 'idle' })

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading' })
    const sb = getSupabase()
    void sb
      .rpc('fetch_public_match_participant_summary', { p_match_id: matchId })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          setState({ status: 'error', message: error.message })
          return
        }
        const parsed = parsePublicMatchParticipantSummary(data)
        if (!parsed) {
          setState({ status: 'hidden' })
          return
        }
        setState({ status: 'ready', data: sortMatchParticipantSummary(parsed) })
      })
    return () => {
      cancelled = true
    }
  }, [matchId])

  if (state.status === 'loading' || state.status === 'idle') {
    return <p className="portal-match-public-detail__muted">{p.matchDetailParticipantsSummaryLoading}</p>
  }
  if (state.status === 'error') {
    return (
      <p role="alert" className="portal-match-public-detail__muted">
        {p.matchesLoadError}: {state.message}
      </p>
    )
  }
  if (state.status === 'hidden') return null

  const weaponId = parseMatchDiscipline(state.data.discipline)
  const divTotals = summaryTotals(state.data.byDivision)
  const catTotals = summaryTotals(state.data.byCategory)
  const hasAny = divTotals.total > 0 || catTotals.total > 0
  if (!hasAny) return null

  return (
    <div className="portal-match-public-detail__participant-summary">
      {state.data.byDivision.length > 0 ?
        <section
          className="portal-match-public-detail__participant-summary-block"
          aria-labelledby="match-participants-summary-division"
        >
          <h3 id="match-participants-summary-division" className="portal-match-public-detail__subsection-title">
            {p.matchDetailParticipantsSummaryByDivision}
          </h3>
          <div className="portal-match-public-detail__table-scroll">
            <table className="portal-match-public-detail__table portal-match-public-detail__summary-table">
              <thead>
                <tr>
                  <th scope="col">{p.matchDetailParticipantsSummaryColLabel}</th>
                  <th scope="col">{p.matchDetailParticipantsSummaryColConfirmed}</th>
                  <th scope="col">{p.matchDetailParticipantsSummaryColPending}</th>
                  <th scope="col">{p.matchDetailParticipantsSummaryColTotal}</th>
                </tr>
              </thead>
              <tbody>
                {state.data.byDivision.map((row) => (
                  <tr key={row.division}>
                    <th scope="row">
                      {weaponId ?
                        divisionLabel(weaponId, row.division, locUi)
                      : row.division}
                    </th>
                    <td>{cellCount(row.confirmed)}</td>
                    <td>{cellCount(row.pending)}</td>
                    <td>{summaryRowTotal(row)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row">{p.matchDetailParticipantsSummaryRowTotal}</th>
                  <td>{divTotals.confirmed}</td>
                  <td>{divTotals.pending}</td>
                  <td>{divTotals.total}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      : null}

      {state.data.byCategory.length > 0 ?
        <section
          className="portal-match-public-detail__participant-summary-block"
          aria-labelledby="match-participants-summary-category"
        >
          <h3 id="match-participants-summary-category" className="portal-match-public-detail__subsection-title">
            {p.matchDetailParticipantsSummaryByCategory}
          </h3>
          <div className="portal-match-public-detail__table-scroll">
            <table className="portal-match-public-detail__table portal-match-public-detail__summary-table">
              <thead>
                <tr>
                  <th scope="col">{p.matchDetailParticipantsSummaryColLabel}</th>
                  <th scope="col">{p.matchDetailParticipantsSummaryColConfirmed}</th>
                  <th scope="col">{p.matchDetailParticipantsSummaryColPending}</th>
                  <th scope="col">{p.matchDetailParticipantsSummaryColTotal}</th>
                </tr>
              </thead>
              <tbody>
                {state.data.byCategory.map((row) => (
                  <tr key={row.category}>
                    <th scope="row">{categoryLabel(row.category, locUi)}</th>
                    <td>{cellCount(row.confirmed)}</td>
                    <td>{cellCount(row.pending)}</td>
                    <td>{summaryRowTotal(row)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row">{p.matchDetailParticipantsSummaryRowTotal}</th>
                  <td>{catTotals.confirmed}</td>
                  <td>{catTotals.pending}</td>
                  <td>{catTotals.total}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      : null}
    </div>
  )
}
