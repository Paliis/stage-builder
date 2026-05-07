import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSupabase } from '../../lib/supabaseClient'
import type { MessageTree } from '../../i18n/messages'
import { parseStageProjectJson } from '../../domain/stageProjectFile'
import { resolveSharePublishedTitle } from '../../domain/sharePublishedTitle'
import { payloadToProjectText } from '../../share/payloadToProjectText'
import { extractShareViewId } from './extractShareViewId'
import {
  programmeListDisplayTitles,
  programmeSnapshotTitleRaw,
} from './matchPortalProgrammeDisplay'

type Portal = MessageTree['portal']

export type OrganizerMatchStagesPanelProps = {
  locale: string
  matchId: string
  p: Portal
}

type StageLinkRow = {
  id: string
  sort_order: number
  share_stage_id: string
  share_group_id: string | null
  snapshot_meta: Record<string, unknown> | null
}

export function OrganizerMatchStagesPanel({ locale, matchId, p }: OrganizerMatchStagesPanelProps) {
  const sb = useMemo(() => getSupabase(), [])
  const [rows, setRows] = useState<StageLinkRow[] | undefined>(undefined)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [paste, setPaste] = useState('')
  const [addBusy, setAddBusy] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [refreshAllBusy, setRefreshAllBusy] = useState(false)
  const [busyById, setBusyById] = useState<Record<string, 'refresh' | 'delete' | 'move' | undefined>>({})

  const reload = useCallback(async () => {
    setLoadError(null)
    const { data, error } = await sb
      .from('match_stage_links')
      .select('id, sort_order, share_stage_id, share_group_id, snapshot_meta')
      .eq('match_id', matchId)
      .order('sort_order', { ascending: true })

    if (error) {
      setLoadError(
        error.message.includes('column')
          ? `${error.message} (${p.matchDetailApplyMigrationHint})`
          : error.message,
      )
      setRows([])
      return
    }
    setRows(
      (data ?? []).map((r) => ({
        ...r,
        snapshot_meta:
          typeof r.snapshot_meta === 'object' && r.snapshot_meta !== null
            ? (r.snapshot_meta as Record<string, unknown>)
            : null,
      })) as StageLinkRow[],
    )
  }, [matchId, sb, p.matchDetailApplyMigrationHint])

  useEffect(() => {
    void reload()
  }, [reload])

  const setRowBusyKind = useCallback((id: string, kind: 'refresh' | 'delete' | 'move' | undefined) => {
    setBusyById((prev) => {
      const next = { ...prev }
      if (kind === undefined) delete next[id]
      else next[id] = kind
      return next
    })
  }, [])

  const interpretRefreshResult = useCallback(
    (data: unknown, rpcError: { message: string } | null): string | null => {
      if (rpcError) return rpcError.message
      const o = data as Record<string, unknown> | null
      if (!o?.ok) {
        const err = typeof o?.error === 'string' ? o.error : 'unknown'
        if (err === 'no_share_group') return p.matchOrgStagesErrNoShareGroup
        if (err === 'no_latest_share') return p.matchOrgStagesErrNoLatestShare
        return p.matchOrgStagesErrorGeneric
      }
      return null
    },
    [p],
  )

  const runRefreshRpc = useCallback(
    async (linkId: string): Promise<string | null> => {
      const { data, error } = await sb.rpc('organizer_refresh_match_stage_link_latest', {
        p_link_id: linkId,
      })
      return interpretRefreshResult(data, error)
    },
    [sb, interpretRefreshResult],
  )

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault()
    setAddError(null)
    const id = extractShareViewId(paste)
    if (!id) {
      setAddError(p.matchOrgStagesInvalidPaste)
      return
    }

    setAddBusy(true)
    try {
      const { data: shareRow, error: rpcErr } = await sb.rpc('fetch_shared_stage', { lookup_id: id })
      if (rpcErr) {
        setAddError(rpcErr.message)
        return
      }
      if (shareRow == null || (typeof shareRow === 'object' && shareRow !== null && !('payload' in shareRow))) {
        setAddError(p.matchOrgStagesNotFound)
        return
      }
      const row = shareRow as Record<string, unknown>
      if (typeof row.mode === 'string' && row.mode !== 'view') {
        setAddError(p.matchOrgStagesNotViewMode)
        return
      }
      const shareId = typeof row.id === 'string' ? row.id : id
      let linkedTitle = ''
      try {
        const text = payloadToProjectText(row.payload)
        if (text) {
          const parsed = parseStageProjectJson(text)
          if (parsed.ok) {
            linkedTitle = resolveSharePublishedTitle(parsed.data.stage, parsed.data.briefing)
          }
        }
      } catch {
        /* ignore malformed payload */
      }
      const titleFallback = typeof row.title === 'string' ? row.title : ''
      const title = linkedTitle || titleFallback
      const groupIdRaw = row.share_group_id
      const shareGroupId = typeof groupIdRaw === 'string' ? groupIdRaw : null

      const ordered = [...(rows ?? [])].sort((a, b) => a.sort_order - b.sort_order)
      const nextOrder =
        ordered.length === 0 ? 0 : Math.max(...ordered.map((x) => x.sort_order)) + 1

      const exists = ordered.some((x) => x.share_stage_id === shareId)
      if (exists) {
        setAddError(p.matchOrgStagesDuplicate)
        return
      }

      const { error: insErr } = await sb.from('match_stage_links').insert({
        match_id: matchId,
        sort_order: nextOrder,
        share_stage_id: shareId,
        share_group_id: shareGroupId,
        snapshot_meta: {
          title_snapshot: title,
          linked_at: new Date().toISOString(),
        },
      })

      if (insErr) {
        setAddError(insErr.message)
        return
      }
      setPaste('')
      await reload()
    } finally {
      setAddBusy(false)
    }
  }

  async function refreshRow(linkId: string) {
    setAddError(null)
    setRowBusyKind(linkId, 'refresh')
    try {
      const errMsg = await runRefreshRpc(linkId)
      if (errMsg) {
        setAddError(errMsg)
        return
      }
      await reload()
    } finally {
      setRowBusyKind(linkId, undefined)
    }
  }

  async function refreshAllRows() {
    const list = [...(rows ?? [])].sort((a, b) => a.sort_order - b.sort_order)
    if (list.length === 0) return
    setAddError(null)
    setRefreshAllBusy(true)
    try {
      const failures: string[] = []
      for (const r of list) {
        const errMsg = await runRefreshRpc(r.id)
        if (errMsg) {
          failures.push(`${programmeSnapshotTitleRaw(r)}: ${errMsg}`)
        }
      }
      setAddError(failures.length > 0 ? failures.join('\n') : null)
      await reload()
    } finally {
      setRefreshAllBusy(false)
    }
  }

  async function removeRow(linkId: string) {
    setAddError(null)
    setRowBusyKind(linkId, 'delete')
    try {
      const { error } = await sb.from('match_stage_links').delete().eq('id', linkId)
      if (error) setAddError(error.message)
      else await reload()
    } finally {
      setRowBusyKind(linkId, undefined)
    }
  }

  async function moveRow(linkId: string, direction: -1 | 1) {
    const ordered = [...(rows ?? [])].sort((a, b) => a.sort_order - b.sort_order)
    const i = ordered.findIndex((x) => x.id === linkId)
    const j = i + direction
    if (i < 0 || j < 0 || j >= ordered.length) return

    setRowBusyKind(linkId, 'move')
    const a = ordered[i]!
    const b = ordered[j]!
    const oa = a.sort_order
    const ob = b.sort_order
    const temp = 900000 + Math.floor(Math.random() * 90000)

    try {
      const r1 = await sb.from('match_stage_links').update({ sort_order: temp }).eq('id', a.id)
      if (r1.error) {
        setAddError(r1.error.message)
        return
      }
      const r2 = await sb.from('match_stage_links').update({ sort_order: oa }).eq('id', b.id)
      if (r2.error) {
        setAddError(r2.error.message)
        await reload()
        return
      }
      const r3 = await sb.from('match_stage_links').update({ sort_order: ob }).eq('id', a.id)
      if (r3.error) {
        setAddError(r3.error.message)
        await reload()
        return
      }
      await reload()
    } finally {
      setRowBusyKind(linkId, undefined)
    }
  }

  const ordered = [...(rows ?? [])].sort((a, b) => a.sort_order - b.sort_order)
  const displayTitles = programmeListDisplayTitles(ordered, p)

  const anyRowBusy = Object.keys(busyById).length > 0

  return (
    <section style={{ marginTop: '2rem', maxWidth: '42rem' }} aria-labelledby="match-stages-heading">
      <h2 id="match-stages-heading" className="portal-home__hero-title" style={{ fontSize: '1.1rem', margin: '0 0 0.5rem' }}>
        {p.matchOrgStagesHeading}
      </h2>

      <p style={{ margin: '0 0 0.75rem', fontSize: '0.88rem', lineHeight: 1.55, opacity: 0.92 }}>
        {p.matchOrgStagesIntro}{' '}
        <Link to="/stage-builder" target="_blank" rel="noreferrer">
          {p.matchOrgStagesOpenEditor}
        </Link>
      </p>

      <form onSubmit={(e) => void handleAdd(e)} style={{ marginBottom: '1rem' }}>
        <label htmlFor="match-stage-paste" style={{ display: 'block', fontSize: '0.86rem', fontWeight: 600, marginBottom: '0.35rem' }}>
          {p.matchOrgStagesPasteLabel}
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'stretch' }}>
          <input
            id="match-stage-paste"
            type="text"
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            placeholder={p.matchOrgStagesPastePlaceholder}
            autoComplete="off"
            spellCheck={false}
            disabled={addBusy}
            style={{
              flex: '1 1 14rem',
              minWidth: 0,
              font: 'inherit',
              fontSize: '0.86rem',
              padding: '0.45rem 0.55rem',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text)',
            }}
          />
          <button
            type="submit"
            className="portal-btn portal-btn--primary portal-btn--compact"
            disabled={addBusy || !paste.trim()}
          >
            {addBusy ? p.matchOrgStagesAdding : p.matchOrgStagesAdd}
          </button>
        </div>
      </form>

      {ordered.length > 0 ? (
        <div style={{ marginBottom: '0.75rem' }}>
          <button
            type="button"
            className="portal-btn portal-btn--secondary portal-btn--compact"
            disabled={refreshAllBusy || addBusy || anyRowBusy}
            onClick={() => void refreshAllRows()}
          >
            {refreshAllBusy ? p.matchOrgStagesRefreshAllBusy : p.matchOrgStagesRefreshAll}
          </button>
        </div>
      ) : null}

      {addError ? (
        <p
          role="alert"
          style={{ margin: '0 0 0.75rem', fontSize: '0.86rem', color: '#991b1b', whiteSpace: 'pre-line' }}
        >
          {addError}
        </p>
      ) : null}

      {loadError ? (
        <p role="alert" style={{ margin: '0 0 1rem', fontSize: '0.86rem' }}>
          {p.matchesLoadError}: {loadError}
        </p>
      ) : null}

      {ordered.length === 0 && rows !== undefined && !loadError ?
        <p style={{ margin: '0 0 1rem', fontSize: '0.88rem', opacity: 0.9 }}>{p.matchOrgStagesEmpty}</p>
      : null}

      {ordered.length > 0 ?
        <div className="portal-match-org-stages-table-wrap">
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.82rem',
          }}
        >
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
              <th style={{ padding: '0.35rem 0.4rem', width: '3rem' }}>#</th>
              <th style={{ padding: '0.35rem 0.4rem' }}>{p.matchOrgStagesColTitle}</th>
              <th style={{ padding: '0.35rem 0.4rem' }}>{p.matchOrgStagesColShareId}</th>
              <th style={{ padding: '0.35rem 0.4rem' }}>{p.matchOrgStagesColActions}</th>
            </tr>
          </thead>
          <tbody>
            {ordered.map((r, idx) => {
              const busy = busyById[r.id]
              return (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--border)', verticalAlign: 'top' }}>
                  <td style={{ padding: '0.45rem 0.4rem', opacity: 0.95 }}>{idx + 1}</td>
                  <td style={{ padding: '0.45rem 0.4rem' }}>{displayTitles[idx]}</td>
                  <td style={{ padding: '0.45rem 0.4rem', wordBreak: 'break-all' }}>
                    <a href={`/v/${encodeURIComponent(r.share_stage_id)}?lang=${locale}`} target="_blank" rel="noreferrer">
                      {p.matchOrgStagesViewLink}
                    </a>
                    <span style={{ opacity: 0.6 }}> ({r.share_stage_id})</span>
                  </td>
                  <td style={{ padding: '0.45rem 0.4rem' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      <button
                        type="button"
                        className="portal-btn portal-btn--secondary portal-btn--compact"
                        disabled={busy !== undefined || idx === 0}
                        onClick={() => void moveRow(r.id, -1)}
                      >
                        {p.matchOrgStagesMoveUp}
                      </button>
                      <button
                        type="button"
                        className="portal-btn portal-btn--secondary portal-btn--compact"
                        disabled={busy !== undefined || idx === ordered.length - 1}
                        onClick={() => void moveRow(r.id, 1)}
                      >
                        {p.matchOrgStagesMoveDown}
                      </button>
                      <button
                        type="button"
                        className="portal-btn portal-btn--secondary portal-btn--compact"
                        disabled={busy !== undefined}
                        onClick={() => void refreshRow(r.id)}
                      >
                        {busy === 'refresh' ? p.matchOrgStagesRefreshing : p.matchOrgStagesRefreshLatest}
                      </button>
                      <button
                        type="button"
                        className="portal-btn portal-btn--secondary portal-btn--compact"
                        disabled={busy !== undefined}
                        onClick={() => void removeRow(r.id)}
                      >
                        {p.matchOrgStagesRemove}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        </div>
      : null}
    </section>
  )
}
