import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
} from 'react'
import { useStore } from 'zustand/react'
import { useShallow } from 'zustand/react/shallow'
import { SessionDraftPersist } from './application/SessionDraftPersist'
import { clearSessionDraftStorage } from './application/sessionDraft'
import { useBriefingStore } from './application/briefingStore'
import { useStageStore } from './application/stageStore'
import { computeMinRounds, countStageTargetUnits } from './domain/computeMinRounds'
import type { PlacementMode } from './domain/placementMode'
import { centroidOfEntities, shiftClonesForPaste } from './domain/planClipboard'
import type { Prop, PropType, StageCategory, Target, TargetType } from './domain/models'
import { ALL_TARGET_TYPES } from './domain/weaponClass'
import { FIELD_GROUND_COVER_3D_VALUES, type FieldGroundCover3d } from './domain/fieldGround3d'
import {
  clampFieldDimensions,
  clampVec2ToField,
  FIELD_SIZE_PRESETS,
  GRID_SNAP_M,
  snapVec2,
  STAGE_CARD_UI_DEPTH_FACTOR,
} from './domain/field'
import { canClosePolyline } from './domain/penaltyZones'
import { fieldResizeChangesEntities } from './domain/fieldResizeImpact'
import {
  buildStageProjectFile,
  parseStageProjectJson,
  serializeStageProject,
  suggestedStageProjectFileName,
} from './domain/stageProjectFile'
import { summarizeTargets } from './domain/targetSummary'
import { useI18n } from './i18n/useI18n'
import { formatTemplate } from './i18n/format'
import { defaultStageBriefing, type BriefingPdfLabels } from './domain/stageBriefing'
import { StageBuilderToolbar } from './presentation/components/StageBuilderToolbar'
import { type StageCanvasHandle, StageCanvas } from './presentation/components/StageCanvas'
import { StageMinimap } from './presentation/components/StageMinimap'
import type { CameraMode3D, StageView3DHandle } from './presentation/components/StageView3D'
import type { WorldViewportRect } from './presentation/lib/viewTransform'
import { PwaUpdateBanner } from './presentation/components/PwaUpdateBanner'
import { SharePublishDialog } from './presentation/components/SharePublishDialog'
import { usePwaInstall } from './presentation/hooks/usePwaInstall'
import './App.css'

const StageView3DLazy = lazy(() =>
  import('./presentation/components/StageView3D').then((m) => ({ default: m.StageView3D })),
)

const ONBOARDING_LS_KEY = 'stage-builder-onboarding-collapsed'

function parseFieldSizeInputMeters(raw: string): number | null {
  const t = raw.trim().replace(',', '.')
  if (t === '') return null
  const v = parseFloat(t)
  return Number.isFinite(v) ? v : null
}

export type AppProps = {
  /** Opened via `/v/:shareId` — scene and briefing are read-only. */
  shareReadOnly?: boolean
}

export default function App({ shareReadOnly = false }: AppProps) {
  const readOnly = shareReadOnly
  const { locale, setLocale, t, tree } = useI18n()
  const { canInstall, promptInstall } = usePwaInstall()

  const name = useStageStore((s) => s.name)
  const weaponClass = useStageStore((s) => s.weaponClass)
  const targets = useStageStore((s) => s.targets)
  const props = useStageStore((s) => s.props)
  const addTarget = useStageStore((s) => s.addTarget)
  const addProp = useStageStore((s) => s.addProp)
  const setTargetPosition = useStageStore((s) => s.setTargetPosition)
  const setPropPosition = useStageStore((s) => s.setPropPosition)
  const setTargetRotation = useStageStore((s) => s.setTargetRotation)
  const setPropRotation = useStageStore((s) => s.setPropRotation)
  const setPropGeometry = useStageStore((s) => s.setPropGeometry)
  const removeTarget = useStageStore((s) => s.removeTarget)
  const setTargetMetalRectSideCm = useStageStore((s) => s.setTargetMetalRectSideCm)
  const removeProp = useStageStore((s) => s.removeProp)
  const fieldSizeM = useStageStore((s) => s.fieldSizeM)
  const fieldGroundCover3d = useStageStore((s) => s.fieldGroundCover3d)
  const setFieldGroundCover3d = useStageStore((s) => s.setFieldGroundCover3d)
  const setFieldSizeM = useStageStore((s) => s.setFieldSizeM)
  const replaceStageState = useStageStore((s) => s.replaceStageState)
  const resetSceneToDefaults = useStageStore((s) => s.resetSceneToDefaults)
  const pasteCloneEntities = useStageStore((s) => s.pasteCloneEntities)
  const penaltyZoneSet = useStageStore((s) => s.penaltyZoneSet)
  const addPenaltyClosedRing = useStageStore((s) => s.addPenaltyClosedRing)

  const briefing = useBriefingStore(
    useShallow((s) => ({
      documentTitle: s.documentTitle,
      exerciseType: s.exerciseType,
      targetsDescription: s.targetsDescription,
      recommendedShots: s.recommendedShots,
      allowedAmmo: s.allowedAmmo,
      maxPoints: s.maxPoints,
      startSignal: s.startSignal,
      readyCondition: s.readyCondition,
      startPosition: s.startPosition,
      procedure: s.procedure,
      safetyAngles: s.safetyAngles,
    })),
  )
  const setBriefing = useBriefingStore((s) => s.setBriefing)

  const minRounds = useMemo(() => computeMinRounds(targets), [targets])
  const targetUnits = useMemo(() => countStageTargetUnits(targets), [targets])
  const allowedTargetTypes = useMemo<TargetType[]>(() => [...ALL_TARGET_TYPES], [])

  const view3dRef = useRef<StageView3DHandle>(null)
  const planCanvasRef = useRef<StageCanvasHandle>(null)
  const projectFileInputRef = useRef<HTMLInputElement>(null)
  const onboardingDialogRef = useRef<HTMLDialogElement>(null)
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d')
  const [planViewportWorld, setPlanViewportWorld] = useState<WorldViewportRect | null>(null)
  const [camera3d, setCamera3d] = useState<CameraMode3D>('overview')
  const [pdfBusy, setPdfBusy] = useState(false)
  const [onboardingCollapsed] = useState(() => {
    try {
      return localStorage.getItem(ONBOARDING_LS_KEY) === '1'
    } catch {
      return false
    }
  })
  const [onboardingShownOnce, setOnboardingShownOnce] = useState(false)
  const [toolbarDrawerOpen, setToolbarDrawerOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sharePublishOpen, setSharePublishOpen] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const [measureToolActive, setMeasureToolActive] = useState(false)
  const [placementMode, setPlacementMode] = useState<PlacementMode>(null)
  /** Вершини полілінії під час режиму штрафної зони (до замикання). */
  const [penaltyDraftVertices, setPenaltyDraftVertices] = useState<{ x: number; y: number }[]>([])
  /** Вершини, зняті Ctrl+Z під час чернетки контуру — для повтору (Ctrl+Y) перед історією сцени. */
  const [penaltyDraftRedoStack, setPenaltyDraftRedoStack] = useState<{ x: number; y: number }[]>([])
  const clearPenaltyContourDraft = useCallback(() => {
    setPenaltyDraftVertices([])
    setPenaltyDraftRedoStack([])
  }, [])

  const canUndo = useStore(useStageStore.temporal, (s) => s.pastStates.length > 0)
  const canRedo = useStore(useStageStore.temporal, (s) => s.futureStates.length > 0)
  const canUndoPlan =
    canUndo ||
    (placementMode?.kind === 'penaltyZoneContour' && penaltyDraftVertices.length > 0)
  const canRedoPlan =
    canRedo ||
    (placementMode?.kind === 'penaltyZoneContour' && penaltyDraftRedoStack.length > 0)
  const runUndo = useCallback(() => {
    if (placementMode?.kind === 'penaltyZoneContour' && penaltyDraftVertices.length > 0) {
      const last = penaltyDraftVertices[penaltyDraftVertices.length - 1]!
      setPenaltyDraftVertices((prev) => prev.slice(0, -1))
      setPenaltyDraftRedoStack((r) => [...r, last])
      return
    }
    useStageStore.temporal.getState().undo()
  }, [placementMode, penaltyDraftVertices])
  const runRedo = useCallback(() => {
    if (placementMode?.kind === 'penaltyZoneContour' && penaltyDraftRedoStack.length > 0) {
      const next = penaltyDraftRedoStack[penaltyDraftRedoStack.length - 1]!
      setPenaltyDraftRedoStack((r) => r.slice(0, -1))
      setPenaltyDraftVertices((prev) => [...prev, next])
      return
    }
    useStageStore.temporal.getState().redo()
  }, [placementMode, penaltyDraftRedoStack])

  const [layoutNarrow, setLayoutNarrow] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 52rem)').matches : false,
  )
  const [marqueeModeActive, setMarqueeModeActive] = useState(false)
  const [planSelectionSummary, setPlanSelectionSummary] = useState({ empty: true, count: 0 })
  const [hasPlanClipboard, setHasPlanClipboard] = useState(false)
  const internalClipboardRef = useRef<{ targets: Target[]; props: Prop[] } | null>(null)
  const [selectionSheetOpen, setSelectionSheetOpen] = useState(false)

  /** Чернетка тексту в полях розміру поля (щоб можна було вводити з клавіатури без миттєвого clamp). */
  const [fieldWidthDraft, setFieldWidthDraft] = useState<string | null>(null)
  const [fieldHeightDraft, setFieldHeightDraft] = useState<string | null>(null)
  const fieldWidthInputFocusedRef = useRef(false)
  const fieldHeightInputFocusedRef = useRef(false)

  useEffect(() => {
    if (!fieldWidthInputFocusedRef.current) setFieldWidthDraft(null)
    else setFieldWidthDraft(String(fieldSizeM.x))
  }, [fieldSizeM.x])

  useEffect(() => {
    if (!fieldHeightInputFocusedRef.current) setFieldHeightDraft(null)
    else setFieldHeightDraft(String(fieldSizeM.y))
  }, [fieldSizeM.y])

  useEffect(() => {
    if (!readOnly) return
    setPlacementMode(null)
    clearPenaltyContourDraft()
    setMarqueeModeActive(false)
    setMeasureToolActive(false)
    setMobileMenuOpen(false)
    setHasPlanClipboard(false)
    internalClipboardRef.current = null
  }, [readOnly, clearPenaltyContourDraft])

  useEffect(() => {
    if (!measureToolActive) planCanvasRef.current?.clearMeasure()
  }, [measureToolActive])

  useEffect(() => {
    if (planSelectionSummary.empty) setSelectionSheetOpen(false)
  }, [planSelectionSummary.empty])

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 52rem)')
    const update = () => setLayoutNarrow(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  /** Спільна «ширша» картка для 2D і 3D (лише CSS-пропорції). */
  const stageCardDisplayH = fieldSizeM.y / STAGE_CARD_UI_DEPTH_FACTOR

  const pdfLabels: BriefingPdfLabels = useMemo(
    () => ({
      exerciseType: tree.pdf.rowExerciseType,
      targets: tree.pdf.rowTargets,
      recommendedShots: tree.pdf.rowRecommendedShots,
      allowedAmmo: tree.pdf.rowAllowedAmmo,
      maxPoints: tree.pdf.rowMaxPoints,
      startSignal: tree.pdf.rowStartSignal,
      readyCondition: tree.pdf.rowReadyCondition,
      startPosition: tree.pdf.rowStartPosition,
      procedure: tree.pdf.rowProcedure,
      safetyAngles: tree.pdf.rowSafetyAngles,
    }),
    [tree],
  )

  const categoryLabel = (c: StageCategory) => t(`briefing.category.${c}`)

  const trySetFieldSizeM = useCallback(
    (raw: { x: number; y: number }) => {
      const next = clampFieldDimensions(raw.x, raw.y)
      if (next.x === fieldSizeM.x && next.y === fieldSizeM.y) return
      const hasEntities =
        targets.length > 0 || props.length > 0 || penaltyZoneSet.polygons.length > 0
      if (
        hasEntities &&
        fieldResizeChangesEntities(targets, props, next.x, next.y) &&
        !window.confirm(tree.toolbar.fieldResizeConfirm)
      ) {
        return
      }
      setFieldSizeM(next)
    },
    [
      fieldSizeM.x,
      fieldSizeM.y,
      targets,
      props,
      penaltyZoneSet.polygons.length,
      setFieldSizeM,
      tree.toolbar.fieldResizeConfirm,
    ],
  )

  const saveStageProject = useCallback(() => {
    const file = buildStageProjectFile({
      stage: { name, weaponClass, fieldSizeM, fieldGroundCover3d, targets, props, penaltyZoneSet },
      briefing: { ...briefing },
    })
    const json = serializeStageProject(file)
    const fname = suggestedStageProjectFileName(name, briefing.documentTitle)
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fname
    a.click()
    URL.revokeObjectURL(url)
  }, [name, weaponClass, fieldSizeM, fieldGroundCover3d, targets, props, penaltyZoneSet, briefing])

  const shareProjectRoot = useMemo(
    () =>
      buildStageProjectFile({
        stage: { name, weaponClass, fieldSizeM, fieldGroundCover3d, targets, props, penaltyZoneSet },
        briefing: { ...briefing },
      }),
    [name, weaponClass, fieldSizeM, fieldGroundCover3d, targets, props, penaltyZoneSet, briefing],
  )

  const onProjectFileSelected = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0]
      e.target.value = ''
      if (!f) return
      const reader = new FileReader()
      reader.onload = () => {
        const text = String(reader.result ?? '')
        const res = parseStageProjectJson(text)
        if (!res.ok) {
          const key =
            res.errorKey === 'invalidJson'
              ? 'project.loadErrorJson'
              : res.errorKey === 'invalidVersion'
                ? 'project.loadErrorVersion'
                : 'project.loadErrorShape'
          window.alert(t(key))
          return
        }
        replaceStageState(res.data.stage)
        setBriefing(res.data.briefing)
      }
      reader.readAsText(f, 'UTF-8')
    },
    [replaceStageState, setBriefing, t],
  )

  const handleClearExercise = useCallback(() => {
    if (!window.confirm(t('project.clearConfirm'))) return
    const temporal = useStageStore.temporal.getState()
    temporal.pause()
    resetSceneToDefaults()
    setBriefing(defaultStageBriefing())
    temporal.clear()
    temporal.resume()
    clearSessionDraftStorage()
    setMobileMenuOpen(false)
    setPlacementMode(null)
    clearPenaltyContourDraft()
    setMarqueeModeActive(false)
    setHasPlanClipboard(false)
    internalClipboardRef.current = null
  }, [resetSceneToDefaults, setBriefing, t, setMobileMenuOpen, clearPenaltyContourDraft])

  const applySceneToBriefing = () => {
    setBriefing({
      targetsDescription: summarizeTargets(targets, locale),
      recommendedShots: String(minRounds),
    })
  }

  useEffect(() => {
    if (viewMode !== '2d') setPlanViewportWorld(null)
  }, [viewMode])

  useEffect(() => {
    if (viewMode === '3d') {
      setMeasureToolActive(false)
      setPlacementMode(null)
      setMarqueeModeActive(false)
    }
  }, [viewMode])

  useEffect(() => {
    if (marqueeModeActive) {
      setMeasureToolActive(false)
      setPlacementMode(null)
    }
  }, [marqueeModeActive])

  useEffect(() => {
    if (measureToolActive) setMarqueeModeActive(false)
  }, [measureToolActive])

  useEffect(() => {
    if (placementMode) setMarqueeModeActive(false)
  }, [placementMode])

  useEffect(() => {
    if (readOnly) return
    if (viewMode !== '2d') return
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'KeyM' || e.repeat) return
      const el = e.target
      if (el instanceof HTMLElement && el.closest('input, textarea, select, [contenteditable="true"]'))
        return
      e.preventDefault()
      setPlacementMode(null)
      setMeasureToolActive((v) => !v)
    }
    window.addEventListener('keydown', onKey, { passive: false })
    return () => window.removeEventListener('keydown', onKey)
  }, [viewMode, readOnly])

  useEffect(() => {
    if (readOnly) return
    if (viewMode !== '2d') return
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Escape' || e.repeat) return
      const el = e.target
      if (el instanceof HTMLElement && el.closest('input, textarea, select, [contenteditable="true"]')) return
      if (marqueeModeActive) {
        e.preventDefault()
        setMarqueeModeActive(false)
        return
      }
      if (!placementMode) return
      e.preventDefault()
      clearPenaltyContourDraft()
      setPlacementMode(null)
    }
    window.addEventListener('keydown', onKey, { passive: false })
    return () => window.removeEventListener('keydown', onKey)
  }, [viewMode, placementMode, marqueeModeActive, clearPenaltyContourDraft, readOnly])

  const formatMeasureDistance = useCallback(
    (m: number) => formatTemplate(tree.view.measureDistanceMeters, { m: m.toFixed(2) }),
    [tree.view.measureDistanceMeters],
  )

  const armTargetPlacement = useCallback((type: TargetType, isNoShoot = false) => {
    setMeasureToolActive(false)
    clearPenaltyContourDraft()
    setPlacementMode((prev) =>
      prev?.kind === 'target' && prev.type === type && prev.isNoShoot === isNoShoot
        ? null
        : { kind: 'target', type, isNoShoot },
    )
  }, [clearPenaltyContourDraft])

  const armPropPlacement = useCallback((type: PropType) => {
    setMeasureToolActive(false)
    clearPenaltyContourDraft()
    setPlacementMode((prev) =>
      prev?.kind === 'prop' && prev.type === type ? null : { kind: 'prop', type },
    )
  }, [clearPenaltyContourDraft])

  const armPenaltyContour = useCallback(() => {
    setMeasureToolActive(false)
    clearPenaltyContourDraft()
    setPlacementMode((prev) =>
      prev?.kind === 'penaltyZoneContour' ? null : { kind: 'penaltyZoneContour' },
    )
  }, [clearPenaltyContourDraft])

  const handlePlacementWorldClick = useCallback(
    (p: { x: number; y: number }) => {
      if (!placementMode) return
      if (placementMode.kind === 'penaltyZoneContour') {
        const clamped = clampVec2ToField({ ...p }, 1, fieldSizeM.x, fieldSizeM.y)
        const snapped = snapVec2(clamped, GRID_SNAP_M)
        if (penaltyDraftVertices.length >= 2 && canClosePolyline(penaltyDraftVertices, snapped)) {
          const ring = [...penaltyDraftVertices]
          if (ring.length >= 3) {
            addPenaltyClosedRing(ring)
            clearPenaltyContourDraft()
            if (layoutNarrow) setPlacementMode(null)
            return
          }
        }
        setPenaltyDraftRedoStack([])
        setPenaltyDraftVertices((prev) => [...prev, snapped])
        return
      }
      if (placementMode.kind === 'target') {
        addTarget(placementMode.type, placementMode.isNoShoot, p)
      } else {
        addProp(placementMode.type, undefined, p)
      }
      if (layoutNarrow) setPlacementMode(null)
    },
    [
      placementMode,
      penaltyDraftVertices,
      fieldSizeM.x,
      fieldSizeM.y,
      addTarget,
      addProp,
      addPenaltyClosedRing,
      layoutNarrow,
      clearPenaltyContourDraft,
    ],
  )

  const runCopySelection = useCallback(() => {
    const snap = planCanvasRef.current?.getSelectionForCopy()
    if (!snap || (snap.targets.length === 0 && snap.props.length === 0)) return
    internalClipboardRef.current = snap
    setHasPlanClipboard(true)
    void (async () => {
      try {
        await navigator.clipboard.writeText(
          JSON.stringify({ v: 1, targets: snap.targets, props: snap.props }),
        )
      } catch {
        /* ignore */
      }
    })()
  }, [])

  const runPasteSelection = useCallback(() => {
    const clip = internalClipboardRef.current
    if (!clip || (clip.targets.length === 0 && clip.props.length === 0)) return
    if (viewMode !== '2d') return
    const anchor =
      planCanvasRef.current?.getSpawnCenterWorld() ?? {
        x: fieldSizeM.x / 2,
        y: fieldSizeM.y / 2,
      }
    const c = centroidOfEntities(clip.targets, clip.props)
    const shifted = shiftClonesForPaste(
      clip.targets,
      clip.props,
      { x: anchor.x - c.x, y: anchor.y - c.y },
      fieldSizeM.x,
      fieldSizeM.y,
    )
    pasteCloneEntities(shifted.targets, shifted.props)
  }, [fieldSizeM.x, fieldSizeM.y, pasteCloneEntities, viewMode])

  useEffect(() => {
    if (readOnly) return
    if (viewMode !== '2d') return
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return
      if (e.code !== 'KeyC' && e.code !== 'KeyV') return
      const el = e.target
      if (el instanceof HTMLElement && el.closest('input, textarea, select, [contenteditable="true"]')) return
      if (e.code === 'KeyC') {
        e.preventDefault()
        runCopySelection()
      } else {
        e.preventDefault()
        runPasteSelection()
      }
    }
    window.addEventListener('keydown', onKey, { passive: false })
    return () => window.removeEventListener('keydown', onKey)
  }, [viewMode, runCopySelection, runPasteSelection, readOnly])

  const handleExportPdf = async () => {
    setPdfBusy(true)
    try {
      let snap: string | null = null
      if (viewMode === '3d') {
        await new Promise<void>((r) => requestAnimationFrame(() => r()))
        await new Promise<void>((r) => requestAnimationFrame(() => r()))
        snap = view3dRef.current?.capturePngDataUrl() ?? null
      }
      const safeName = `${briefing.documentTitle.replace(/[\\/:*?"<>|]/g, '').slice(0, 80) || 'briefing'}.pdf`
      const { exportBriefingPdf } = await import('./presentation/lib/exportBriefingPdf')
      await exportBriefingPdf({
        snapshotDataUrl: snap,
        briefing: { ...briefing },
        pdf: {
          labels: pdfLabels,
          categoryLabel,
          emptyCell: tree.common.dash,
          sceneAlt: tree.pdf.sceneAlt,
          noSnapshot: tree.pdf.noSnapshot,
          imageLoadError: tree.pdf.imageLoadError,
          generatedBy: tree.pdfBranding.generatedBy,
        },
        fileName: safeName,
      })
    } catch (e) {
      console.error(e)
      window.alert(e instanceof Error ? e.message : tree.common.exportFail)
    } finally {
      setPdfBusy(false)
    }
  }


  const autoGrow = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [])

  const autoGrowRef = useCallback((el: HTMLTextAreaElement) => {
    requestAnimationFrame(() => {
      el.style.height = 'auto'
      el.style.height = `${el.scrollHeight}px`
    })
  }, [])

  const dismissOnboarding = useCallback(() => {
    try {
      localStorage.setItem(ONBOARDING_LS_KEY, '1')
    } catch {
      /* приватний режим / недоступне сховище */
    }
    onboardingDialogRef.current?.close()
    setOnboardingShownOnce(true)
  }, [])

  const openOnboarding = useCallback(() => {
    onboardingDialogRef.current?.showModal()
  }, [])

  useEffect(() => {
    if (!onboardingCollapsed && !onboardingShownOnce) {
      onboardingDialogRef.current?.showModal()
      setOnboardingShownOnce(true)
    }
  }, [onboardingCollapsed, onboardingShownOnce])

  useEffect(() => {
    if (!mobileMenuOpen) return
    const handleClick = (e: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false)
      }
    }
    document.addEventListener('pointerdown', handleClick)
    return () => document.removeEventListener('pointerdown', handleClick)
  }, [mobileMenuOpen])

  useEffect(() => {
    const inFormField = (t: EventTarget | null) =>
      t instanceof HTMLElement && t.closest('input, textarea, select, [contenteditable="true"]') !== null

    const handleKeyDown = (e: KeyboardEvent) => {
      if (readOnly) return
      if (inFormField(e.target)) return
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ' && !e.shiftKey) {
        e.preventDefault()
        runUndo()
      } else if (
        ((e.ctrlKey || e.metaKey) && e.code === 'KeyY') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === 'KeyZ')
      ) {
        e.preventDefault()
        runRedo()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [runUndo, runRedo, readOnly])

  const viewControlsRow = (
    <div className="app__view-row">
      <div className="app__viewtabs" role="tablist" aria-label={tree.view.tabsAria}>
        <button
          type="button"
          role="tab"
          aria-selected={viewMode === '2d'}
          className={viewMode === '2d' ? 'is-active' : ''}
          onClick={() => setViewMode('2d')}
        >
          {tree.view.plan2d}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={viewMode === '3d'}
          className={viewMode === '3d' ? 'is-active' : ''}
          onClick={() => setViewMode('3d')}
        >
          {tree.view.visual3d}
        </button>
      </div>
      <div className="app__undo-redo" role="group" aria-label={tree.view.undoRedoGroupAria}>
        <button
          type="button"
          className="app__undo-redo-btn"
          aria-label={tree.view.undoPlan}
          title={tree.view.undoPlanTitle}
          disabled={readOnly || !canUndoPlan}
          onClick={runUndo}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 7v6h6" />
            <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
          </svg>
        </button>
        <button
          type="button"
          className="app__undo-redo-btn"
          aria-label={tree.view.redoPlan}
          title={tree.view.redoPlanTitle}
          disabled={readOnly || !canRedoPlan}
          onClick={runRedo}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 7v6h-6" />
            <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
          </svg>
        </button>
      </div>
      <label className="app__field-size" title={tree.toolbar.fieldSizeHint}>
        <span className="app__field-size-label">{tree.toolbar.fieldSizeLabel}</span>
        <div className="app__field-size-controls">
          <div className="app__field-size-inputs">
            <input
              type="text"
              className="app__field-size-input"
              inputMode="decimal"
              autoComplete="off"
              aria-label={tree.toolbar.fieldSizeWidthAria}
              readOnly={readOnly}
              value={fieldWidthDraft ?? String(fieldSizeM.x)}
              onFocus={() => {
                fieldWidthInputFocusedRef.current = true
                setFieldWidthDraft(String(fieldSizeM.x))
              }}
              onChange={(e) => {
                setFieldWidthDraft(e.target.value)
              }}
              onBlur={() => {
                fieldWidthInputFocusedRef.current = false
                const v = parseFieldSizeInputMeters(fieldWidthDraft ?? '')
                setFieldWidthDraft(null)
                if (v !== null) trySetFieldSizeM({ x: v, y: fieldSizeM.y })
              }}
            />
            <span className="app__field-size-times" aria-hidden="true">
              ×
            </span>
            <input
              type="text"
              className="app__field-size-input"
              inputMode="decimal"
              autoComplete="off"
              aria-label={tree.toolbar.fieldSizeLengthAria}
              readOnly={readOnly}
              value={fieldHeightDraft ?? String(fieldSizeM.y)}
              onFocus={() => {
                fieldHeightInputFocusedRef.current = true
                setFieldHeightDraft(String(fieldSizeM.y))
              }}
              onChange={(e) => {
                setFieldHeightDraft(e.target.value)
              }}
              onBlur={() => {
                fieldHeightInputFocusedRef.current = false
                const v = parseFieldSizeInputMeters(fieldHeightDraft ?? '')
                setFieldHeightDraft(null)
                if (v !== null) trySetFieldSizeM({ x: fieldSizeM.x, y: v })
              }}
            />
            <span className="app__field-size-unit" aria-hidden="true">
              m
            </span>
          </div>
          <select
            className="app__field-size-presets"
            aria-label={tree.toolbar.fieldSizePresetsAria}
            disabled={readOnly}
            value=""
            onChange={(e) => {
              const val = e.target.value
              if (!val) return
              const [w, h] = val.split('x').map(Number)
              trySetFieldSizeM({ x: w, y: h })
              e.currentTarget.selectedIndex = 0
            }}
          >
            <option value="">{tree.toolbar.fieldSizePresetsPlaceholder}</option>
            {FIELD_SIZE_PRESETS.map((p) => (
              <option key={p.id} value={`${p.widthM}x${p.heightM}`}>
                {formatTemplate(tree.toolbar.fieldSizeOption, { w: p.widthM, h: p.heightM })}
              </option>
            ))}
          </select>
        </div>
      </label>
      {viewMode === '3d' && (
        <>
          <div className="app__camtabs" role="group" aria-label={tree.view.camAria}>
            <button
              type="button"
              className={camera3d === 'overview' ? 'is-active' : ''}
              onClick={() => setCamera3d('overview')}
            >
              {tree.view.camOverview}
            </button>
            <button
              type="button"
              className={camera3d === 'shooter' ? 'is-active' : ''}
              onClick={() => setCamera3d('shooter')}
            >
              {tree.view.camShooter}
            </button>
            <button
              type="button"
              className={camera3d === 'pdf' ? 'is-active' : ''}
              title={tree.view.camPdfTitle}
              onClick={() => setCamera3d('pdf')}
            >
              {tree.view.camPdf}
            </button>
          </div>
          <label className="app__ground-cover">
            <span className="app__ground-cover-label">{tree.view.groundCoverLabel}</span>
            <select
              aria-label={tree.view.groundCoverAria}
              disabled={readOnly}
              value={fieldGroundCover3d}
              onChange={(e) => setFieldGroundCover3d(e.target.value as FieldGroundCover3d)}
            >
              {FIELD_GROUND_COVER_3D_VALUES.map((id) => (
                <option key={id} value={id}>
                  {id === 'earth'
                    ? tree.view.groundEarth
                    : id === 'grass'
                      ? tree.view.groundGrass
                      : tree.view.groundSand}
                </option>
              ))}
            </select>
          </label>
        </>
      )}
    </div>
  )

  const toolbarProps = {
    tree,
    name,
    allowedTargetTypes,
    placementMode,
    layoutNarrow,
    readOnly,
    onArmTarget: armTargetPlacement,
    onArmProp: armPropPlacement,
    onArmPenaltyContour: armPenaltyContour,
  }

  const mainStageStyle = {
    '--stage-card-w': fieldSizeM.x,
    '--stage-card-h': stageCardDisplayH,
  } as CSSProperties

  const isStagingSite = import.meta.env.VITE_SITE_ENV === 'staging'

  return (
    <div className="app">
      {isStagingSite ? (
        <div className="app__staging-ribbon" role="status">
          {tree.app.stagingRibbon}
        </div>
      ) : null}
      <PwaUpdateBanner />
      {!readOnly ? <SessionDraftPersist /> : null}
      <header className="app__header">
        <div className="app__header-inner">
          <div className="app__header-top-row">
            <h1 className="app__title-heading">{tree.app.title}</h1>
            <div className="app__header-actions">
              <div className="app__lang" role="group" aria-label={tree.common.langSwitcher}>
                <button
                  type="button"
                  className={locale === 'uk' ? 'is-active' : ''}
                  onClick={() => setLocale('uk')}
                  lang="uk"
                >
                  {tree.common.langUk}
                </button>
                <button
                  type="button"
                  className={locale === 'en' ? 'is-active' : ''}
                  onClick={() => setLocale('en')}
                  lang="en"
                >
                  {tree.common.langEn}
                </button>
              </div>
              <div
                className="app__buttons app__header-file-buttons"
                role="group"
                aria-label={tree.project.fileGroupAria}
                title={tree.project.hint}
              >
                <button
                  type="button"
                  className="app__btn-secondary"
                  disabled={readOnly}
                  onClick={saveStageProject}
                >
                  {tree.project.save}
                </button>
                <button
                  type="button"
                  className="app__btn-secondary"
                  disabled={readOnly}
                  onClick={() => projectFileInputRef.current?.click()}
                >
                  {tree.project.open}
                </button>
                <button
                  type="button"
                  className="app__btn-secondary"
                  disabled={readOnly}
                  title={tree.share.publishButton}
                  onClick={() => setSharePublishOpen(true)}
                >
                  {tree.share.publishButton}
                </button>
                <button type="button" className="app__btn-secondary app__btn-help" onClick={openOnboarding} title={tree.app.onboardingReopen}>
                  ?
                </button>
                <input
                  ref={projectFileInputRef}
                  type="file"
                  className="app__sr-only"
                  accept=".stage.json,.json,application/json"
                  aria-hidden
                  tabIndex={-1}
                  disabled={readOnly}
                  onChange={onProjectFileSelected}
                />
              </div>
              {/* Mobile overflow menu */}
              <div className="app__mobile-menu" ref={mobileMenuRef}>
                <button
                  type="button"
                  className="app__mobile-menu-toggle"
                  onClick={() => setMobileMenuOpen((v) => !v)}
                  aria-expanded={mobileMenuOpen}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
                    <circle cx="9" cy="3" r="1.5" />
                    <circle cx="9" cy="9" r="1.5" />
                    <circle cx="9" cy="15" r="1.5" />
                  </svg>
                </button>
                {mobileMenuOpen && (
                  <div className="app__mobile-menu-dropdown">
                    <button
                      type="button"
                      disabled={readOnly}
                      onClick={() => {
                        saveStageProject()
                        setMobileMenuOpen(false)
                      }}
                    >
                      {tree.project.save}
                    </button>
                    <button
                      type="button"
                      disabled={readOnly}
                      onClick={() => {
                        projectFileInputRef.current?.click()
                        setMobileMenuOpen(false)
                      }}
                    >
                      {tree.project.open}
                    </button>
                    <button
                      type="button"
                      disabled={readOnly}
                      onClick={() => {
                        setSharePublishOpen(true)
                        setMobileMenuOpen(false)
                      }}
                    >
                      {tree.share.publishButton}
                    </button>
                    <button type="button" onClick={() => { openOnboarding(); setMobileMenuOpen(false) }}>
                      {tree.app.onboardingReopen}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <dialog ref={onboardingDialogRef} className="app__onboarding-dialog">
        <button type="button" className="app__onboarding-close" onClick={dismissOnboarding} aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M4 4l10 10M14 4L4 14" />
          </svg>
        </button>
        <h2 className="app__onboarding-title">{tree.app.onboardingTitle}</h2>
        <p className="app__onboarding-lead">{tree.app.onboardingLead}</p>
        <ul className="app__onboarding-benefits">
          {tree.app.onboardingBenefits.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
        <h3 className="app__onboarding-how">{tree.app.onboardingHowTitle}</h3>
        <div className="app__onboarding-sections">
          {([1, 2, 3, 4, 5, 6] as const).map((n) => (
            <div key={n} className="app__onboarding-section">
              <h3 className="app__onboarding-sh">{tree.app[`onboardingS${n}Title`]}</h3>
              <p className="app__onboarding-sp">{tree.app[`onboardingS${n}Text`]}</p>
            </div>
          ))}
        </div>
        <div className="app__onboarding-bottom">
          {canInstall ? (
            <button type="button" className="app__onboarding-install" onClick={() => void promptInstall()}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 15V3"/><path d="m8 11 4 4 4-4"/><path d="M20 21H4"/></svg>
              {tree.pwa.installButton}
              <span className="app__onboarding-install-hint">{tree.pwa.installHint}</span>
            </button>
          ) : null}
          <p className="app__onboarding-note">{tree.app.onboardingNote}</p>
          <button type="button" className="app__onboarding-cta" onClick={dismissOnboarding}>
            {tree.app.onboardingCta}
          </button>
        </div>
      </dialog>

      <SharePublishDialog
        open={sharePublishOpen}
        onClose={() => setSharePublishOpen(false)}
        tree={tree}
        locale={locale}
        projectRoot={shareProjectRoot}
      />

      <div className="app__view-controls-strip">
        <div className="app__view-controls-row">
          {viewControlsRow}
          <div className="app__stats app__stats--toolbar" aria-live="polite">
            <span className="app__stat">
              <span className="app__stat-label">{tree.stats.targets}</span>
              <strong className="app__stat-value">{targetUnits}</strong>
            </span>
            <span className="app__stat app__stat--min">
              <span className="app__stat-label">{tree.stats.minRounds}</span>
              <strong className="app__stat-value">{minRounds}</strong>
            </span>
          </div>
        </div>
      </div>

      <div className="app__plan-workspace">
        <div className="app__plan-workspace-cluster" style={mainStageStyle}>
          <div
            className={`app__toolbar-drawer${toolbarDrawerOpen ? ' is-open' : ''}`}
            onClick={(e) => { if (e.target === e.currentTarget) setToolbarDrawerOpen(false) }}
          >
            <StageBuilderToolbar {...toolbarProps} className="app__toolbar app__plan-rail" />
          </div>
          <div className="app__plan-main">
            <div className="app__plan-stage-stack">
              <main className="app__main app__main--stage-card">
                <div className="app__stats-float" aria-live="polite">
                  <span>{tree.stats.targets}: <strong>{targetUnits}</strong></span>
                  <span>{tree.stats.minRounds}: <strong>{minRounds}</strong></span>
                </div>
                {viewMode === '2d' ? (
                  <div className="app__plan-map-shell">
                    {placementMode?.kind === 'penaltyZoneContour' &&
                    penaltyDraftVertices.length > 0 ? (
                      <div className="app__penalty-draft-banner" role="status" aria-live="polite">
                        {tree.toolbar.penaltyContourUnclosed}
                      </div>
                    ) : null}
                    <StageCanvas
                      ref={planCanvasRef}
                      readOnly={readOnly}
                      targets={targets}
                      props={props}
                      onMoveTarget={setTargetPosition}
                      onMoveProp={setPropPosition}
                      onRotateTarget={setTargetRotation}
                      onRotateProp={setPropRotation}
                      onSetPropGeometry={setPropGeometry}
                      onDeleteTarget={removeTarget}
                      onDeleteProp={removeProp}
                      onSetTargetMetalRectSideCm={setTargetMetalRectSideCm}
                      onViewportWorldChange={setPlanViewportWorld}
                      measureToolActive={measureToolActive}
                      formatMeasureDistance={formatMeasureDistance}
                      placementArmed={!readOnly && placementMode !== null}
                      onPlacementWorldClick={handlePlacementWorldClick}
                      marqueeModeActive={marqueeModeActive}
                      onPlanSelectionChange={setPlanSelectionSummary}
                      onSelectionLongPress={() => setSelectionSheetOpen(true)}
                      penaltyDraftVertices={
                        placementMode?.kind === 'penaltyZoneContour' ? penaltyDraftVertices : null
                      }
                    />
                    <div className="app__plan-map-actions" role="toolbar" aria-label={tree.view.planMapActionsAria}>
                      <button
                        type="button"
                        className={`app__plan-map-action-btn${marqueeModeActive ? ' is-active' : ''}`}
                        aria-pressed={marqueeModeActive}
                        aria-label={tree.view.marqueeMode}
                        title={tree.view.marqueeModeTitle}
                        disabled={readOnly}
                        onClick={() => {
                          setMarqueeModeActive((v) => !v)
                        }}
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <path d="M9 9h6v6H9z" strokeDasharray="2 2" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="app__plan-map-action-btn"
                        aria-label={tree.view.copySelection}
                        title={tree.view.copySelectionTitle}
                        disabled={readOnly || planSelectionSummary.empty}
                        onClick={runCopySelection}
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <rect x="9" y="9" width="13" height="13" rx="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="app__plan-map-action-btn"
                        aria-label={tree.view.pasteSelection}
                        title={tree.view.pasteSelectionTitle}
                        disabled={readOnly || !hasPlanClipboard}
                        onClick={runPasteSelection}
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                          <rect x="8" y="2" width="8" height="4" rx="1" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className={`app__plan-map-action-btn${measureToolActive ? ' is-active' : ''}`}
                        aria-pressed={measureToolActive}
                        aria-label={tree.view.measureTool}
                        title={tree.view.measureToolTitle}
                        onClick={() => {
                          setPlacementMode(null)
                          setMeasureToolActive((v) => !v)
                        }}
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M3 18h18" />
                          <path d="M5 18v-3M8 18V9M11 18v-2M14 18V7M17 18v-4M20 18v-2" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="app__plan-map-action-btn app__plan-map-action-btn--remove"
                        aria-label={tree.view.deleteSelection}
                        title={tree.view.deleteSelectionTitle}
                        disabled={readOnly || planSelectionSummary.empty}
                        onClick={() => planCanvasRef.current?.deleteSelection()}
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M18 6 6 18" />
                          <path d="m6 6 12 12" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="app__plan-map-action-btn app__plan-map-action-btn--danger"
                        disabled={readOnly}
                        onClick={handleClearExercise}
                        aria-label={t('project.clearAria')}
                        title={tree.project.clearConfirm}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          <line x1="10" x2="10" y1="11" y2="17" />
                          <line x1="14" x2="14" y1="11" y2="17" />
                        </svg>
                      </button>
                    </div>
                    <StageMinimap
                      fieldWidthM={fieldSizeM.x}
                      fieldHeightM={fieldSizeM.y}
                      targets={targets}
                      props={props}
                      viewportWorld={planViewportWorld}
                      ariaLabel={tree.view.minimapAria}
                      onWorldPick={(wx, wy) => planCanvasRef.current?.centerOnWorldPoint(wx, wy)}
                    />
                  </div>
                ) : (
                  <div className="app__stage-print-frame">
                    <Suspense
                      fallback={
                        <div className="app__view-3d-suspense" role="status" aria-live="polite">
                          {tree.view.loading3d}
                        </div>
                      }
                    >
                      <StageView3DLazy ref={view3dRef} targets={targets} props={props} cameraMode={camera3d} />
                    </Suspense>
                  </div>
                )}
              </main>
            </div>
          </div>
        </div>
      </div>

      {selectionSheetOpen ? (
        <div
          className="app__selection-sheet-backdrop"
          role="presentation"
          onClick={() => setSelectionSheetOpen(false)}
        >
          <div
            className="app__selection-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="selection-sheet-title"
            onClick={(e) => e.stopPropagation()}
          >
            <p id="selection-sheet-title" className="app__selection-sheet__title">
              {tree.view.selectionSheetTitle}
            </p>
            <p className="app__selection-sheet__hint">{tree.view.selectionSheetHint}</p>
            <button
              type="button"
              className="app__selection-sheet__btn app__selection-sheet__btn--primary"
              disabled={planSelectionSummary.empty}
              onClick={() => {
                planCanvasRef.current?.deleteSelection()
                setSelectionSheetOpen(false)
              }}
            >
              {tree.view.deleteSelection}
            </button>
            <button
              type="button"
              className="app__selection-sheet__btn"
              disabled={planSelectionSummary.empty}
              onClick={() => {
                runCopySelection()
                setSelectionSheetOpen(false)
              }}
            >
              {tree.view.selectionSheetCopy}
            </button>
            <button
              type="button"
              className="app__selection-sheet__btn app__selection-sheet__btn--ghost"
              onClick={() => setSelectionSheetOpen(false)}
            >
              {tree.view.selectionSheetDismiss}
            </button>
          </div>
        </div>
      ) : null}

      <details className="app__briefing">
        <summary>{tree.briefing.summary}</summary>

        <div className="app__briefing-autofill">
          <button
            type="button"
            className="app__btn-secondary app__btn-autofill"
            disabled={readOnly}
            onClick={applySceneToBriefing}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
            {tree.briefing.applyFromScene}
          </button>
        </div>

        <div className="app__briefing-grid">
          <label className="app__field">
            {tree.briefing.documentTitle}
            <input
              readOnly={readOnly}
              value={briefing.documentTitle}
              onChange={(e) => setBriefing({ documentTitle: e.target.value })}
            />
          </label>
          <label className="app__field">
            {tree.briefing.exerciseType}
            <select
              disabled={readOnly}
              value={briefing.exerciseType}
              onChange={(e) => setBriefing({ exerciseType: e.target.value as StageCategory })}
            >
              <option value="short">{t('briefing.category.short')}</option>
              <option value="medium">{t('briefing.category.medium')}</option>
              <option value="long">{t('briefing.category.long')}</option>
            </select>
          </label>
          <label className="app__field app__field--wide">
            {tree.briefing.targetsText}
            <textarea
              readOnly={readOnly}
              rows={1}
              value={briefing.targetsDescription}
              onChange={(e) => { autoGrow(e); setBriefing({ targetsDescription: e.target.value }) }}
              ref={(el) => { if (el) autoGrowRef(el) }}
            />
          </label>
          <label className="app__field">
            {tree.briefing.recommendedShots}
            <input
              readOnly={readOnly}
              value={briefing.recommendedShots}
              onChange={(e) => setBriefing({ recommendedShots: e.target.value })}
            />
          </label>
          <label className="app__field app__field--wide">
            {tree.briefing.allowedAmmo}
            <textarea
              readOnly={readOnly}
              rows={1}
              value={briefing.allowedAmmo}
              onChange={(e) => { autoGrow(e); setBriefing({ allowedAmmo: e.target.value }) }}
              ref={(el) => { if (el) autoGrowRef(el) }}
            />
          </label>
          <label className="app__field">
            {tree.briefing.maxPoints}
            <input
              readOnly={readOnly}
              value={briefing.maxPoints}
              onChange={(e) => setBriefing({ maxPoints: e.target.value })}
            />
          </label>
          <label className="app__field">
            {tree.briefing.startSignal}
            <input
              readOnly={readOnly}
              value={briefing.startSignal}
              onChange={(e) => setBriefing({ startSignal: e.target.value })}
            />
          </label>
          <label className="app__field app__field--wide">
            {tree.briefing.readyCondition}
            <textarea
              readOnly={readOnly}
              rows={1}
              value={briefing.readyCondition}
              onChange={(e) => { autoGrow(e); setBriefing({ readyCondition: e.target.value }) }}
              ref={(el) => { if (el) autoGrowRef(el) }}
            />
          </label>
          <label className="app__field app__field--wide">
            {tree.briefing.startPosition}
            <textarea
              readOnly={readOnly}
              rows={1}
              value={briefing.startPosition}
              onChange={(e) => { autoGrow(e); setBriefing({ startPosition: e.target.value }) }}
              ref={(el) => { if (el) autoGrowRef(el) }}
            />
          </label>
          <label className="app__field app__field--wide">
            {tree.briefing.procedure}
            <textarea
              readOnly={readOnly}
              rows={1}
              value={briefing.procedure}
              onChange={(e) => { autoGrow(e); setBriefing({ procedure: e.target.value }) }}
              ref={(el) => { if (el) autoGrowRef(el) }}
            />
          </label>
          <label className="app__field">
            {tree.briefing.safetyAngles}
            <input
              readOnly={readOnly}
              value={briefing.safetyAngles}
              onChange={(e) => setBriefing({ safetyAngles: e.target.value })}
            />
          </label>
        </div>

        <div className="app__briefing-export">
          <button type="button" className="app__btn-export" disabled={pdfBusy} onClick={() => void handleExportPdf()}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z"/><path d="M12 11v6"/><path d="m9 14 3 3 3-3"/></svg>
            {pdfBusy ? tree.briefing.downloadPdfBusy : tree.briefing.downloadPdf}
          </button>
          <p className="app__briefing-hint">
            {tree.briefing.hintBefore} <strong>{tree.briefing.hintEm}</strong>
            {tree.briefing.hintAfter}
          </p>
        </div>
      </details>

      <footer className="app__footer">
        <div className="app__footer-card">
          <h3 className="app__footer-heading">{tree.footer.feedbackHeading}</h3>
          <p className="app__footer-text">{tree.footer.feedbackText}</p>
          <div className="app__footer-links">
            <a href="mailto:parshencevdenis@gmail.com" className="app__footer-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              {tree.footer.feedbackEmail}
            </a>
            <a href="https://t.me/denysparshentsev" target="_blank" rel="noopener noreferrer" className="app__footer-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M11.944 0A12 12 0 1 0 24 12.056A12.013 12.013 0 0 0 11.944 0Zm5.654 8.22l-1.7 8.013c-.127.6-.468.748-.95.466l-2.624-1.934l-1.266 1.218a.659.659 0 0 1-.527.257l.188-2.674l4.871-4.4c.212-.188-.046-.293-.328-.105l-6.02 3.79l-2.594-.81c-.564-.176-.575-.564.118-.835l10.14-3.91c.47-.17.882.113.692.924Z"/></svg>
              {tree.footer.feedbackTelegram}
            </a>
          </div>
        </div>
        <div className="app__footer-card">
          <h3 className="app__footer-heading">{tree.footer.supportHeading}</h3>
          <p className="app__footer-text">{tree.footer.supportText}</p>
          <div className="app__footer-links">
            <a href="https://send.monobank.ua/jar/2gUdnYvDXy" target="_blank" rel="noopener noreferrer" className="app__footer-link app__footer-link--accent">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
              {tree.footer.supportLink}
            </a>
          </div>
        </div>
        {canInstall && (
          <div className="app__footer-card app__footer-card--install">
            <h3 className="app__footer-heading">{tree.footer.installHeading}</h3>
            <p className="app__footer-text">{tree.footer.installText}</p>
            <div className="app__footer-links">
              <button type="button" className="app__footer-link app__footer-link--accent app__btn-pwa-install" onClick={() => void promptInstall()}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 15V3"/><path d="m8 11 4 4 4-4"/><path d="M20 21H4"/></svg>
                {tree.footer.installButton}
              </button>
            </div>
          </div>
        )}
      </footer>

      <button
        type="button"
        className="app__toolbar-drawer-toggle"
        onClick={() => setToolbarDrawerOpen((v) => !v)}
        aria-expanded={toolbarDrawerOpen}
        aria-label={toolbarDrawerOpen ? tree.app.toolbarDrawerClose : tree.app.toolbarDrawerOpen}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <rect x="2" y="3" width="7" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <rect x="11" y="3" width="7" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.15" />
        </svg>
        <span className="app__toolbar-drawer-toggle-label">
          {toolbarDrawerOpen ? tree.app.toolbarDrawerClose : tree.app.toolbarDrawerOpen}
        </span>
      </button>
    </div>
  )
}
