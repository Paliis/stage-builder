import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import {
  listUserStages,
  loadUserStage,
  type UserStageSummary,
} from '../../application/userStagesLibrary'
import {
  buildProgrammeBriefingStoragePath,
  isAcceptedProgrammeBriefingPdf,
  MATCH_PROGRAMME_BRIEFINGS_BUCKET,
  PROGRAMME_BRIEFING_PDF_MAX_BYTES,
} from '../../domain/matchProgrammeBriefingPdf'
import { Link } from 'react-router-dom'
import { formatTemplate } from '../../i18n/format'
import { getSupabase } from '../../lib/supabaseClient'
import type { MessageTree } from '../../i18n/messages'
import { parseStageProjectJson } from '../../domain/stageProjectFile'
import { resolveSharePublishedTitle } from '../../domain/sharePublishedTitle'
import { payloadToProjectText } from '../../share/payloadToProjectText'
import { weaponClassLabel } from '../shooterProfileCatalog'
import { stageBuilderPath } from '../stageBuilderPath'
import { extractShareViewId } from './extractShareViewId'
import {
  programmeListDisplayTitles,
  programmeSnapshotTitleRaw,
} from './matchPortalProgrammeDisplay'
import {
  formatPortalDateShort,
  matchStagesAvailableFromUtcDate,
} from './matchStagesVisibility'
import {
  buildLibraryLinkSnapshotMeta,
  isShareAlreadyLinked,
  nextMatchStageSortOrder,
  publishViewShareFromProject,
  resolveLibraryLinkTitle,
} from './publishViewShareFromProject'

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
  const [libraryRows, setLibraryRows] = useState<UserStageSummary[] | undefined>(undefined)
  const [libraryLoadError, setLibraryLoadError] = useState<string | null>(null)
  const [selectedLibraryId, setSelectedLibraryId] = useState('')
  const [addBusy, setAddBusy] = useState(false)
  const [libraryAddBusy, setLibraryAddBusy] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const localeCode = locale === 'uk' ? 'uk' : 'en'
  const [refreshAllBusy, setRefreshAllBusy] = useState(false)
  const [busyById, setBusyById] = useState<Record<string, 'delete' | 'move' | undefined>>({})
  const [startsAtIso, setStartsAtIso] = useState<string | null>(null)
  const [visibleDaysBefore, setVisibleDaysBefore] = useState('')
  const [visibleDaysSaved, setVisibleDaysSaved] = useState('')
  const [visibleDaysSaving, setVisibleDaysSaving] = useState(false)
  const [visibleDaysError, setVisibleDaysError] = useState<string | null>(null)
  const [programmePdfUrl, setProgrammePdfUrl] = useState<string | null>(null)
  const [programmePdfFile, setProgrammePdfFile] = useState<File | null>(null)
  const [programmePdfBusy, setProgrammePdfBusy] = useState(false)

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

  const reloadLibrary = useCallback(async () => {
    setLibraryLoadError(null)
    const res = await listUserStages()
    if (!res.ok) {
      setLibraryRows([])
      setLibraryLoadError(
        res.errorKey === 'notSignedIn' ? p.matchOrgStagesLibraryNeedSignIn
        : res.errorKey === 'notConfigured' ? p.matchOrgStagesLibraryUnavailable
        : p.matchOrgStagesLibraryLoadError,
      )
      return
    }
    setLibraryRows(res.data)
    setSelectedLibraryId((prev) => (prev && res.data.some((r) => r.id === prev) ? prev : ''))
  }, [p.matchOrgStagesLibraryLoadError, p.matchOrgStagesLibraryNeedSignIn, p.matchOrgStagesLibraryUnavailable])

  useEffect(() => {
    void reloadLibrary()
  }, [reloadLibrary])

  const reloadVisibilitySetting = useCallback(async () => {
    setVisibleDaysError(null)
    const { data, error } = await sb
      .from('matches')
      .select('starts_at, stages_visible_days_before, programme_briefing_pdf_url')
      .eq('id', matchId)
      .maybeSingle()

    if (error) {
      setVisibleDaysError(
        error.message.includes('column') ?
          `${error.message} (${p.matchDetailApplyMigrationHint})`
        : p.matchOrgStagesVisibleDaysSaveError,
      )
      return
    }

    const starts = typeof data?.starts_at === 'string' ? data.starts_at : null
    setStartsAtIso(starts)

    const rawDays = data?.stages_visible_days_before
    const daysStr =
      rawDays == null || !Number.isFinite(Number(rawDays)) ? '' : String(Math.max(0, Math.floor(Number(rawDays))))
    setVisibleDaysBefore(daysStr)
    setVisibleDaysSaved(daysStr)

    const pdf =
      typeof data?.programme_briefing_pdf_url === 'string' && data.programme_briefing_pdf_url.trim() ?
        data.programme_briefing_pdf_url.trim()
      : null
    setProgrammePdfUrl(pdf)
  }, [matchId, sb, p.matchDetailApplyMigrationHint, p.matchOrgStagesVisibleDaysSaveError])

  useEffect(() => {
    void reloadVisibilitySetting()
  }, [reloadVisibilitySetting])

  const parseVisibleDaysInput = useCallback((raw: string): number | null => {
    const t = raw.trim()
    if (t === '') return null
    const n = Math.floor(Number(t))
    if (!Number.isFinite(n) || n < 0) return null
    return n
  }, [])

  const saveVisibleDaysBefore = useCallback(
    async (raw: string) => {
      const parsed = parseVisibleDaysInput(raw)
      const normalized = parsed == null ? '' : String(parsed)
      if (normalized === visibleDaysSaved) return

      setVisibleDaysSaving(true)
      setVisibleDaysError(null)
      try {
        const { error } = await sb
          .from('matches')
          .update({ stages_visible_days_before: parsed })
          .eq('id', matchId)
        if (error) {
          setVisibleDaysError(
            error.message.includes('column') ?
              `${error.message} (${p.matchDetailApplyMigrationHint})`
            : p.matchOrgStagesVisibleDaysSaveError,
          )
          return
        }
        setVisibleDaysBefore(normalized)
        setVisibleDaysSaved(normalized)
      } finally {
        setVisibleDaysSaving(false)
      }
    },
    [
      matchId,
      parseVisibleDaysInput,
      sb,
      p.matchDetailApplyMigrationHint,
      p.matchOrgStagesVisibleDaysSaveError,
      visibleDaysSaved,
    ],
  )

  const setRowBusyKind = useCallback((id: string, kind: 'delete' | 'move' | undefined) => {
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
      const nextOrder = nextMatchStageSortOrder(ordered)

      if (isShareAlreadyLinked(ordered, shareId)) {
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

  const mapPublishError = useCallback(
    (error: 'rateLimited' | 'tooLarge' | 'notConfigured' | 'network' | 'generic', detail?: string) => {
      if (error === 'rateLimited') return p.matchOrgStagesLibraryPublishRateLimited
      if (error === 'tooLarge') return p.matchOrgStagesLibraryPublishTooLarge
      if (error === 'notConfigured') return p.matchOrgStagesLibraryPublishNotConfigured
      if (error === 'network') return p.matchOrgStagesLibraryPublishNetwork
      return detail?.trim() ? detail : p.matchOrgStagesErrorGeneric
    },
    [p],
  )

  const handleAddFromLibrary = async (e: FormEvent) => {
    e.preventDefault()
    setAddError(null)
    if (!selectedLibraryId) {
      setAddError(p.matchOrgStagesLibraryPickRequired)
      return
    }

    const selectedSummary = (libraryRows ?? []).find((r) => r.id === selectedLibraryId)
    const libraryTitle = (selectedSummary?.title ?? '').trim()

    setLibraryAddBusy(true)
    try {
      const loaded = await loadUserStage(selectedLibraryId)
      if (!loaded.ok) {
        setAddError(
          loaded.errorKey === 'notFound' ? p.matchOrgStagesLibraryNotFound
          : loaded.errorKey === 'notSignedIn' ? p.matchOrgStagesLibraryNeedSignIn
          : p.matchOrgStagesLibraryLoadError,
        )
        await reloadLibrary()
        return
      }

      // Guard against a stale select value if the library list was refreshed mid-click.
      if (loaded.data.id !== selectedLibraryId) {
        setAddError(p.matchOrgStagesLibraryLoadError)
        return
      }

      const published = await publishViewShareFromProject(loaded.data.project, localeCode)
      if (!published.ok) {
        setAddError(mapPublishError(published.error, published.detail))
        return
      }

      // Prefer the library row title the organiser just picked — briefing/stage.name often
      // differs (rename in «Мої вправи» does not rewrite the payload heading).
      const title = resolveLibraryLinkTitle({
        libraryTitle: libraryTitle || loaded.data.title,
        stageName: loaded.data.project.stage.name,
        briefingDocumentTitle: loaded.data.project.briefing.documentTitle,
      })

      const ordered = [...(rows ?? [])].sort((a, b) => a.sort_order - b.sort_order)
      if (isShareAlreadyLinked(ordered, published.id)) {
        setAddError(p.matchOrgStagesDuplicate)
        return
      }

      const { error: insErr } = await sb.from('match_stage_links').insert({
        match_id: matchId,
        sort_order: nextMatchStageSortOrder(ordered),
        share_stage_id: published.id,
        share_group_id: published.shareGroupId,
        snapshot_meta: buildLibraryLinkSnapshotMeta({
          title,
          userStageId: loaded.data.id,
        }),
      })

      if (insErr) {
        setAddError(insErr.message)
        return
      }
      setSelectedLibraryId('')
      await reload()
    } finally {
      setLibraryAddBusy(false)
    }
  }

  const handleUploadProgrammePdf = async (e: FormEvent) => {
    e.preventDefault()
    setAddError(null)
    if (!programmePdfFile) {
      setAddError(p.matchOrgProgrammePdfRequired)
      return
    }
    if (!isAcceptedProgrammeBriefingPdf(programmePdfFile)) {
      setAddError(p.matchOrgProgrammePdfInvalid)
      return
    }
    if (programmePdfFile.size > PROGRAMME_BRIEFING_PDF_MAX_BYTES) {
      setAddError(p.matchOrgProgrammePdfTooLarge)
      return
    }

    setProgrammePdfBusy(true)
    try {
      const {
        data: { user },
        error: authErr,
      } = await sb.auth.getUser()
      if (authErr || !user?.id) {
        setAddError(authErr?.message ?? p.matchOrgStagesErrorGeneric)
        return
      }

      const objectPath = buildProgrammeBriefingStoragePath(user.id, matchId)
      const { error: upErr } = await sb.storage.from(MATCH_PROGRAMME_BRIEFINGS_BUCKET).upload(objectPath, programmePdfFile, {
        upsert: true,
        contentType: 'application/pdf',
      })
      if (upErr) {
        setAddError(upErr.message)
        return
      }
      const { data: pub } = sb.storage.from(MATCH_PROGRAMME_BRIEFINGS_BUCKET).getPublicUrl(objectPath)
      const { error: dbErr } = await sb
        .from('matches')
        .update({
          programme_briefing_pdf_url: pub.publicUrl,
          programme_briefing_pdf_storage_path: objectPath,
        })
        .eq('id', matchId)
      if (dbErr) {
        setAddError(dbErr.message)
        return
      }
      setProgrammePdfUrl(pub.publicUrl)
      setProgrammePdfFile(null)
    } finally {
      setProgrammePdfBusy(false)
    }
  }

  async function removeProgrammePdf() {
    setAddError(null)
    setProgrammePdfBusy(true)
    try {
      const { data: row, error: loadErr } = await sb
        .from('matches')
        .select('programme_briefing_pdf_storage_path')
        .eq('id', matchId)
        .maybeSingle()
      if (loadErr) {
        setAddError(loadErr.message)
        return
      }
      const storagePath =
        typeof row?.programme_briefing_pdf_storage_path === 'string' ?
          row.programme_briefing_pdf_storage_path.trim()
        : ''
      if (storagePath) {
        await sb.storage.from(MATCH_PROGRAMME_BRIEFINGS_BUCKET).remove([storagePath])
      }
      const { error: dbErr } = await sb
        .from('matches')
        .update({
          programme_briefing_pdf_url: null,
          programme_briefing_pdf_storage_path: null,
        })
        .eq('id', matchId)
      if (dbErr) setAddError(dbErr.message)
      else setProgrammePdfUrl(null)
    } finally {
      setProgrammePdfBusy(false)
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
  const stagesBusy = addBusy || libraryAddBusy
  const visibleDaysParsed = parseVisibleDaysInput(visibleDaysBefore)
  const visibleFromPreview = useMemo(() => {
    if (visibleDaysParsed == null || visibleDaysParsed <= 0 || !startsAtIso) return null
    const d = matchStagesAvailableFromUtcDate(startsAtIso, visibleDaysParsed)
    return d ? formatPortalDateShort(d, locale === 'uk' ? 'uk' : 'en') : null
  }, [locale, startsAtIso, visibleDaysParsed])

  return (
    <section className="portal-match-org-stages" aria-labelledby="match-stages-heading">
      <h2 id="match-stages-heading" className="portal-home__hero-title portal-home__hero-title--section">
        {p.matchOrgStagesHeading}
      </h2>

      <div className="portal-match-org-stages-zone" aria-labelledby="match-stages-zone-sb">
        <div className="portal-match-org-stages-zone__head">
          <h3 id="match-stages-zone-sb" className="portal-match-org-stages-zone__title">
            {p.matchOrgStagesZoneSbTitle}
          </h3>
          <Link
            to={stageBuilderPath(locale)}
            target="_blank"
            rel="noreferrer"
            className="portal-match-org-stages-zone__link"
          >
            {p.matchOrgStagesOpenEditor}
          </Link>
        </div>

        <form className="portal-match-org-stages-field" onSubmit={(e) => void handleAddFromLibrary(e)}>
          <label htmlFor="match-stage-library" className="portal-match-org-stages-field-label">
            {p.matchOrgStagesLibraryLabel}
          </label>
          <div className="portal-match-org-stages-field-row">
            <select
              id="match-stage-library"
              className="portal-match-org-stages-text-input"
              value={selectedLibraryId}
              onChange={(e) => setSelectedLibraryId(e.target.value)}
              disabled={stagesBusy || libraryRows === undefined}
            >
              <option value="">
                {libraryRows === undefined ?
                  p.matchOrgStagesLibraryLoading
                : libraryRows.length === 0 ?
                  p.matchOrgStagesLibraryEmpty
                : p.matchOrgStagesLibraryPlaceholder}
              </option>
              {(libraryRows ?? []).map((row) => (
                <option key={row.id} value={row.id}>
                  {row.title || p.matchOrgStagesLibraryUntitled} ·{' '}
                  {weaponClassLabel(row.weaponClass, localeCode)}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="portal-btn portal-btn--primary portal-btn--compact portal-match-org-stages-action"
              disabled={stagesBusy || !selectedLibraryId}
            >
              {libraryAddBusy ? p.matchOrgStagesAdding : p.matchOrgStagesLibraryAdd}
            </button>
          </div>
          {libraryLoadError ?
            <p className="portal-match-org-stages-alert" role="alert">
              {libraryLoadError}
            </p>
          : null}
        </form>

        <form className="portal-match-org-stages-field" onSubmit={(e) => void handleAdd(e)}>
          <label htmlFor="match-stage-paste" className="portal-match-org-stages-field-label">
            {p.matchOrgStagesPasteLabel}
          </label>
          <div className="portal-match-org-stages-field-row">
            <input
              id="match-stage-paste"
              type="text"
              className="portal-match-org-stages-text-input"
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              placeholder={p.matchOrgStagesPastePlaceholder}
              autoComplete="off"
              spellCheck={false}
              disabled={stagesBusy}
            />
            <button
              type="submit"
              className="portal-btn portal-btn--secondary portal-btn--compact portal-match-org-stages-action"
              disabled={stagesBusy || !paste.trim()}
            >
              {addBusy ? p.matchOrgStagesAdding : p.matchOrgStagesAdd}
            </button>
          </div>
        </form>

        {ordered.length > 0 ?
          <div className="portal-match-org-stages-toolbar">
            <button
              type="button"
              className="portal-btn portal-btn--secondary portal-btn--compact"
              disabled={
                refreshAllBusy || stagesBusy || programmePdfBusy || anyRowBusy || visibleDaysSaving
              }
              onClick={() => void refreshAllRows()}
            >
              {refreshAllBusy ? p.matchOrgStagesRefreshAllBusy : p.matchOrgStagesRefreshAll}
            </button>
          </div>
        : null}
      </div>

      <div className="portal-match-org-stages-zone" aria-labelledby="match-stages-zone-pdf">
        <h3 id="match-stages-zone-pdf" className="portal-match-org-stages-zone__title">
          {p.matchOrgStagesZonePdfTitle}
        </h3>
        <p className="portal-match-org-stages-field-hint">{p.matchOrgStagesZonePdfInformer}</p>

        <form className="portal-match-org-stages-field" onSubmit={(e) => void handleUploadProgrammePdf(e)}>
          <label htmlFor="match-programme-pdf" className="portal-match-org-stages-field-label">
            {p.matchOrgProgrammePdfLabel}
          </label>
          <div className="portal-match-org-stages-field-row portal-match-org-stages-field-row--wrap">
            <input
              id="match-programme-pdf"
              type="file"
              accept="application/pdf,.pdf"
              className="portal-match-org-stages-file"
              disabled={programmePdfBusy || stagesBusy}
              onChange={(e) => setProgrammePdfFile(e.target.files?.[0] ?? null)}
            />
            <button
              type="submit"
              className="portal-btn portal-btn--primary portal-btn--compact portal-match-org-stages-action"
              disabled={programmePdfBusy || stagesBusy || !programmePdfFile}
            >
              {programmePdfBusy ?
                p.matchOrgProgrammePdfUploading
              : programmePdfUrl ?
                p.matchOrgProgrammePdfReplace
              :   p.matchOrgProgrammePdfUpload}
            </button>
            {programmePdfUrl ?
              <>
                <a
                  href={programmePdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="portal-btn portal-btn--secondary portal-btn--compact portal-match-org-stages-action"
                >
                  {p.matchOrgProgrammePdfOpen}
                </a>
                <button
                  type="button"
                  className="portal-btn portal-btn--secondary portal-btn--compact portal-match-org-stages-action"
                  disabled={programmePdfBusy || stagesBusy}
                  onClick={() => void removeProgrammePdf()}
                >
                  {p.matchOrgProgrammePdfRemove}
                </button>
              </>
            : null}
          </div>
        </form>
      </div>

      <div className="portal-match-org-stages-zone" aria-labelledby="match-stages-zone-visibility">
        <h3 id="match-stages-zone-visibility" className="portal-match-org-stages-zone__title">
          {p.matchOrgStagesZoneVisibilityTitle}
        </h3>
        <div className="portal-match-org-stages-visibility-row">
          <label className="portal-match-org-stages-visibility-label">
            <span>{p.matchOrgStagesVisibleDaysLabel}</span>
            <input
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              className="portal-match-org-stages-number-input"
              value={visibleDaysBefore}
              onChange={(e) => {
                setVisibleDaysError(null)
                setVisibleDaysBefore(e.target.value)
              }}
              onBlur={() => void saveVisibleDaysBefore(visibleDaysBefore)}
              placeholder={p.matchOrgStagesVisibleDaysPlaceholder}
              disabled={visibleDaysSaving || stagesBusy || refreshAllBusy || programmePdfBusy}
              aria-describedby="match-stages-visible-days-hint"
            />
          </label>
          {visibleDaysSaving ?
            <span className="portal-match-org-stages-meta">{p.matchOrgStagesVisibleDaysSaving}</span>
          : visibleFromPreview ?
            <span className="portal-match-org-stages-meta">
              {formatTemplate(p.matchOrgStagesVisibleFromPreview, { date: visibleFromPreview })}
            </span>
          : null}
        </div>
        <p id="match-stages-visible-days-hint" className="portal-match-org-stages-field-hint">
          {p.matchOrgStagesVisibleDaysHint}
        </p>
        {visibleDaysError ?
          <p className="portal-match-org-stages-alert" role="alert">
            {visibleDaysError}
          </p>
        : null}
      </div>

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

      {(ordered.length > 0 || (rows !== undefined && !loadError)) ?
        <div className="portal-match-org-stages-linked-list">
          <h3 className="portal-match-org-stages-linked-list__title">{p.matchOrgStagesLinkedListHeading}</h3>
          {ordered.length === 0 ?
            <p style={{ margin: '0 0 1rem', fontSize: '0.88rem', opacity: 0.9 }}>{p.matchOrgStagesEmpty}</p>
          : null}
        </div>
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
