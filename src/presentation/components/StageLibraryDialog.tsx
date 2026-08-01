import { useCallback, useEffect, useId, useRef, useState } from 'react'
import {
  deleteUserStage,
  listUserStages,
  loadUserStage,
  renameUserStage,
  saveUserStage,
  USER_STAGE_TITLE_MAX,
  type UserStageErrorKey,
  type UserStageRecord,
  type UserStageSummary,
} from '../../application/userStagesLibrary'
import type { StageBriefing } from '../../domain/stageBriefing'
import type { StageProjectSnapshot } from '../../domain/stageProjectFile'
import { formatTemplate } from '../../i18n/format'
import type { Locale, MessageTree } from '../../i18n/messages'

export type StageLibraryDialogProps = {
  open: boolean
  onClose: () => void
  tree: MessageTree
  locale: Locale
  signedIn: boolean
  supabaseConfigured: boolean
  /** Поточний запис бібліотеки, якщо вправу вже зберігали в цій сесії. */
  currentStageId: string | null
  stage: StageProjectSnapshot
  briefing: StageBriefing
  onSaved: (summary: UserStageSummary) => void
  onRenamed: (summary: UserStageSummary) => void
  onOpened: (record: UserStageRecord) => void
  /** Резервний шлях повз хмару: файл `.stage.json`. */
  onExportFile: () => void
  onImportFile: () => void
}

export function StageLibraryDialog({
  open,
  onClose,
  tree,
  locale,
  signedIn,
  supabaseConfigured,
  currentStageId,
  stage,
  briefing,
  onSaved,
  onRenamed,
  onOpened,
  onExportFile,
  onImportFile,
}: StageLibraryDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const lib = tree.library
  const [title, setTitle] = useState('')
  const [rows, setRows] = useState<UserStageSummary[]>([])
  const [listLoading, setListLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [errorKey, setErrorKey] = useState<UserStageErrorKey | null>(null)
  const [savedFlash, setSavedFlash] = useState(false)

  const canUseCloud = supabaseConfigured && signedIn

  const errorText =
    errorKey === null
      ? null
      : errorKey === 'notConfigured'
        ? lib.notConfigured
        : errorKey === 'notSignedIn'
          ? lib.signInRequired
          : errorKey === 'invalidTitle'
            ? lib.errorInvalidTitle
            : errorKey === 'invalidPayload'
              ? lib.errorInvalidPayload
              : errorKey === 'notFound'
                ? lib.errorNotFound
                : lib.errorNetwork

  const refresh = useCallback(async () => {
    setListLoading(true)
    const res = await listUserStages()
    setListLoading(false)
    if (!res.ok) {
      setErrorKey(res.errorKey)
      return
    }
    setRows(res.data)
  }, [])

  useEffect(() => {
    const d = dialogRef.current
    if (!d) return
    if (!open) {
      d.close()
      return
    }
    setErrorKey(null)
    setSavedFlash(false)
    setTitle(stage.name)
    d.showModal()
    if (canUseCloud) void refresh()
    else setRows([])
    // Значення полів беремо на момент відкриття діалогу.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const flashSaved = useCallback(() => {
    setSavedFlash(true)
    window.setTimeout(() => setSavedFlash(false), 2000)
  }, [])

  const save = useCallback(
    async (id: string | null) => {
      setErrorKey(null)
      setBusy(true)
      const res = await saveUserStage({ id, title, stage, briefing })
      setBusy(false)
      if (!res.ok) {
        setErrorKey(res.errorKey)
        return
      }
      onSaved(res.data)
      flashSaved()
      void refresh()
    },
    [briefing, flashSaved, onSaved, refresh, stage, title],
  )

  const openStage = useCallback(
    async (row: UserStageSummary) => {
      if (!window.confirm(formatTemplate(lib.openConfirm, { title: row.title }))) return
      setErrorKey(null)
      setBusy(true)
      const res = await loadUserStage(row.id)
      setBusy(false)
      if (!res.ok) {
        setErrorKey(res.errorKey)
        return
      }
      onOpened(res.data)
      onClose()
    },
    [lib.openConfirm, onClose, onOpened],
  )

  const rename = useCallback(
    async (row: UserStageSummary) => {
      const next = window.prompt(lib.renamePrompt, row.title)
      if (next === null) return
      setErrorKey(null)
      setBusy(true)
      const res = await renameUserStage(row.id, next)
      setBusy(false)
      if (!res.ok) {
        setErrorKey(res.errorKey)
        return
      }
      if (res.data.id === currentStageId) onRenamed(res.data)
      void refresh()
    },
    [currentStageId, lib.renamePrompt, onRenamed, refresh],
  )

  const remove = useCallback(
    async (row: UserStageSummary) => {
      if (!window.confirm(formatTemplate(lib.deleteConfirm, { title: row.title }))) return
      setErrorKey(null)
      setBusy(true)
      const res = await deleteUserStage(row.id)
      setBusy(false)
      if (!res.ok) {
        setErrorKey(res.errorKey)
        return
      }
      void refresh()
    },
    [lib.deleteConfirm, refresh],
  )

  const formatUpdatedAt = (iso: string) => {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    return formatTemplate(lib.updatedAt, {
      date: d.toLocaleString(locale === 'uk' ? 'uk-UA' : 'en-GB', {
        dateStyle: 'short',
        timeStyle: 'short',
      }),
    })
  }

  return (
    <dialog
      ref={dialogRef}
      className="app__onboarding-dialog app__stage-library-dialog"
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
    >
      <button
        type="button"
        className="app__onboarding-close"
        onClick={onClose}
        aria-label={lib.close}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M4 4l10 10M14 4L4 14" />
        </svg>
      </button>
      <h2 className="app__onboarding-title" id={titleId}>
        {lib.title}
      </h2>
      <p className="app__stage-library-intro">{lib.intro}</p>

      {!supabaseConfigured ? (
        <p className="app__stage-library-notice">{lib.notConfigured}</p>
      ) : !signedIn ? (
        <p className="app__stage-library-notice">
          {lib.signInRequired}{' '}
          <a href={`/${locale}/account`} target="_blank" rel="noreferrer">
            {lib.signInLink}
          </a>
        </p>
      ) : (
        <>
          <div className="app__stage-library-save">
            <label className="app__stage-library-name">
              <span>{lib.nameLabel}</span>
              <input
                type="text"
                value={title}
                maxLength={USER_STAGE_TITLE_MAX}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
            <div className="app__stage-library-save-actions">
              {currentStageId ? (
                <button
                  type="button"
                  className="app__btn-secondary"
                  disabled={busy}
                  onClick={() => void save(currentStageId)}
                >
                  {busy ? lib.saving : lib.update}
                </button>
              ) : null}
              <button
                type="button"
                className="app__btn-secondary"
                disabled={busy}
                onClick={() => void save(null)}
              >
                {busy ? lib.saving : lib.saveAsNew}
              </button>
            </div>
          </div>

          {savedFlash ? (
            <p className="app__stage-library-saved" role="status">
              {lib.saved}
            </p>
          ) : null}

          {listLoading ? (
            <p className="app__stage-library-notice">{lib.loading}</p>
          ) : rows.length === 0 ? (
            <p className="app__stage-library-notice">{lib.empty}</p>
          ) : (
            <ul className="app__stage-library-list" aria-label={lib.listAria}>
              {rows.map((row) => (
                <li
                  key={row.id}
                  className={
                    row.id === currentStageId
                      ? 'app__stage-library-row is-current'
                      : 'app__stage-library-row'
                  }
                >
                  <div className="app__stage-library-row-main">
                    <span className="app__stage-library-row-title">{row.title}</span>
                    <span className="app__stage-library-row-meta">
                      {formatUpdatedAt(row.updatedAt)}
                    </span>
                  </div>
                  <div className="app__stage-library-row-actions">
                    <button
                      type="button"
                      className="app__btn-secondary"
                      disabled={busy}
                      onClick={() => void openStage(row)}
                    >
                      {lib.open}
                    </button>
                    <button
                      type="button"
                      className="app__btn-secondary"
                      disabled={busy}
                      onClick={() => void rename(row)}
                    >
                      {lib.rename}
                    </button>
                    <button
                      type="button"
                      className="app__btn-secondary"
                      disabled={busy}
                      onClick={() => void remove(row)}
                    >
                      {lib.remove}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {errorText ? (
        <p className="app__stage-library-error" role="alert">
          {errorText}
        </p>
      ) : null}

      <div className="app__stage-library-file">
        <p className="app__stage-library-file-hint">{tree.project.hint}</p>
        <div className="app__stage-library-file-actions">
          <button type="button" className="app__btn-secondary" onClick={onImportFile}>
            {tree.project.open}
          </button>
          <button type="button" className="app__btn-secondary" onClick={onExportFile}>
            {tree.project.save}
          </button>
        </div>
      </div>

      <div className="app__share-publish-footer">
        <button type="button" className="app__onboarding-cta" onClick={onClose}>
          {lib.close}
        </button>
      </div>
    </dialog>
  )
}
