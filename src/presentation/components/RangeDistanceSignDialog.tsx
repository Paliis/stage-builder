import { useCallback, useMemo, useState } from 'react'
import { GRID_SNAP_M, snapMeters } from '../../domain/field'
import {
  RANGE_DISTANCE_SIGN_LABEL_MAX,
  RANGE_DISTANCE_SIGN_LABEL_MIN,
} from '../../domain/rangeDistanceSigns'
import { formatTemplate } from '../../i18n/format'
import type { MessageTree } from '../../i18n/messages'

export type RangeDistanceSignDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  fieldHeightM: number
  onConfirm: (edgePositionYM: number, labelM: number) => void
  tree: MessageTree
}

export function RangeDistanceSignDialog({
  open,
  onOpenChange,
  fieldHeightM,
  onConfirm,
  tree,
}: RangeDistanceSignDialogProps) {
  const [labelDraft, setLabelDraft] = useState('300')
  const [edgeYDraft, setEdgeYDraft] = useState(() =>
    String(snapMeters(fieldHeightM * 0.5, GRID_SNAP_M)),
  )

  const labelValid = useMemo(() => {
    const raw = labelDraft.trim().replace(',', '.')
    const n = parseInt(raw, 10)
    if (raw !== String(n)) return false
    return Number.isFinite(n) && n >= RANGE_DISTANCE_SIGN_LABEL_MIN && n <= RANGE_DISTANCE_SIGN_LABEL_MAX
  }, [labelDraft])

  const edgeYValid = useMemo(() => {
    const raw = edgeYDraft.trim().replace(',', '.')
    const y = parseFloat(raw)
    if (!Number.isFinite(y)) return false
    return y >= 0 && y <= fieldHeightM
  }, [edgeYDraft, fieldHeightM])

  const formValid = labelValid && edgeYValid

  const handleConfirm = useCallback(() => {
    if (!formValid) return
    const rawY = edgeYDraft.trim().replace(',', '.')
    const y = parseFloat(rawY)
    const rawL = labelDraft.trim().replace(',', '.')
    const n = parseInt(rawL, 10)
    onConfirm(y, n)
    onOpenChange(false)
  }, [formValid, edgeYDraft, labelDraft, onConfirm, onOpenChange])

  if (!open) return null

  return (
    <div
      className="app__modal-center-backdrop"
      role="presentation"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="app__modal-center-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="range-sign-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <p id="range-sign-dialog-title" className="app__selection-sheet__title">
          {tree.view.rangeDistanceSignDialogTitle}
        </p>
        <p className="app__selection-sheet__hint">{tree.view.rangeDistanceSignDialogHint}</p>
        <label className="app__field">
          {tree.view.rangeDistanceSignLabelField}
          <input
            type="text"
            inputMode="numeric"
            maxLength={3}
            value={labelDraft}
            onChange={(e) => setLabelDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && formValid) {
                e.preventDefault()
                handleConfirm()
              }
            }}
            autoFocus
          />
        </label>
        <label className="app__field">
          {tree.view.rangeDistanceSignEdgeField}
          <input
            type="text"
            inputMode="decimal"
            value={edgeYDraft}
            onChange={(e) => setEdgeYDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && formValid) {
                e.preventDefault()
                handleConfirm()
              }
            }}
          />
        </label>
        <p className="app__modal-center-card__field-hint">
          {formatTemplate(tree.view.rangeDistanceSignEdgeHint, { max: String(fieldHeightM) })}
        </p>
        <button
          type="button"
          className="app__selection-sheet__btn app__selection-sheet__btn--primary"
          disabled={!formValid}
          onClick={handleConfirm}
        >
          {tree.view.rangeDistanceSignConfirm}
        </button>
        <button
          type="button"
          className="app__selection-sheet__btn app__selection-sheet__btn--ghost"
          onClick={() => onOpenChange(false)}
        >
          {tree.view.rangeDistanceSignCancel}
        </button>
      </div>
    </div>
  )
}
