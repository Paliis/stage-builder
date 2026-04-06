import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
} from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useBriefingStore } from './application/briefingStore'
import { useStageStore } from './application/stageStore'
import { computeMinRounds, countStageTargetUnits } from './domain/computeMinRounds'
import type { PropType, StageCategory, TargetType } from './domain/models'
import { ALL_TARGET_TYPES } from './domain/weaponClass'
import { FIELD_SIZE_PRESETS, STAGE_CARD_UI_DEPTH_FACTOR } from './domain/field'
import {
  buildStageProjectFile,
  parseStageProjectJson,
  serializeStageProject,
  suggestedStageProjectFileName,
} from './domain/stageProjectFile'
import { summarizeTargets } from './domain/targetSummary'
import { useI18n } from './i18n/useI18n'
import { formatTemplate } from './i18n/format'
import type { BriefingPdfLabels } from './domain/stageBriefing'
import { exportBriefingPdf } from './presentation/lib/exportBriefingPdf'
import { StageBuilderToolbar } from './presentation/components/StageBuilderToolbar'
import { type StageCanvasHandle, StageCanvas } from './presentation/components/StageCanvas'
import { StageMinimap } from './presentation/components/StageMinimap'
import { type CameraMode3D, type StageView3DHandle, StageView3D } from './presentation/components/StageView3D'
import type { WorldViewportRect } from './presentation/lib/viewTransform'
import './App.css'

const ONBOARDING_LS_KEY = 'stage-builder-onboarding-collapsed'

export default function App() {
  const { locale, setLocale, t, tree } = useI18n()

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
  const setFieldSizeM = useStageStore((s) => s.setFieldSizeM)
  const replaceStageState = useStageStore((s) => s.replaceStageState)

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
  const mobileMenuRef = useRef<HTMLDivElement>(null)

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

  const saveStageProject = useCallback(() => {
    const file = buildStageProjectFile({
      stage: { name, weaponClass, fieldSizeM, targets, props },
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
  }, [name, weaponClass, fieldSizeM, targets, props, briefing])

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

  const applySceneToBriefing = () => {
    setBriefing({
      targetsDescription: summarizeTargets(targets, locale),
      recommendedShots: String(minRounds),
    })
  }

  useEffect(() => {
    if (viewMode !== '2d') setPlanViewportWorld(null)
  }, [viewMode])

  const handleAddTarget = useCallback(
    (type: TargetType, isNoShoot?: boolean) => {
      const hint = viewMode === '2d' ? planCanvasRef.current?.getSpawnCenterWorld() ?? undefined : undefined
      addTarget(type, isNoShoot, hint)
    },
    [viewMode, addTarget],
  )

  const handleAddProp = useCallback(
    (type: PropType) => {
      const hint = viewMode === '2d' ? planCanvasRef.current?.getSpawnCenterWorld() ?? undefined : undefined
      addProp(type, undefined, hint)
    },
    [viewMode, addProp],
  )

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
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement
      if (isInput) return
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        useStageStore.temporal.getState().undo()
      } else if (
        ((e.ctrlKey || e.metaKey) && e.key === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')
      ) {
        e.preventDefault()
        useStageStore.temporal.getState().redo()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

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
      <label className="app__field-size">
        <span className="app__field-size-label">{tree.toolbar.fieldSizeLabel}</span>
        <select
          value={`${fieldSizeM.x}x${fieldSizeM.y}`}
          title={tree.toolbar.fieldSizeHint}
          onChange={(e) => {
            const [w, h] = e.target.value.split('x').map(Number)
            setFieldSizeM({ x: w, y: h })
          }}
        >
          {!FIELD_SIZE_PRESETS.some(
            (p) => p.widthM === fieldSizeM.x && p.heightM === fieldSizeM.y,
          ) ? (
            <option value={`${fieldSizeM.x}x${fieldSizeM.y}`}>
              {formatTemplate(tree.toolbar.fieldSizeOption, { w: fieldSizeM.x, h: fieldSizeM.y })}
            </option>
          ) : null}
          {FIELD_SIZE_PRESETS.map((p) => (
            <option key={p.id} value={`${p.widthM}x${p.heightM}`}>
              {formatTemplate(tree.toolbar.fieldSizeOption, { w: p.widthM, h: p.heightM })}
            </option>
          ))}
        </select>
      </label>
      {viewMode === '3d' && (
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
        </div>
      )}
    </div>
  )

  const toolbarProps = {
    tree,
    name,
    allowedTargetTypes,
    onAddTarget: handleAddTarget,
    onAddProp: handleAddProp,
  }

  const mainStageStyle = {
    '--stage-card-w': fieldSizeM.x,
    '--stage-card-h': stageCardDisplayH,
  } as CSSProperties

  return (
    <div className="app">
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
                <button type="button" className="app__btn-secondary" onClick={saveStageProject}>
                  {tree.project.save}
                </button>
                <button
                  type="button"
                  className="app__btn-secondary"
                  onClick={() => projectFileInputRef.current?.click()}
                >
                  {tree.project.open}
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
                    <button type="button" onClick={() => { saveStageProject(); setMobileMenuOpen(false) }}>
                      {tree.project.save}
                    </button>
                    <button type="button" onClick={() => { projectFileInputRef.current?.click(); setMobileMenuOpen(false) }}>
                      {tree.project.open}
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
        <h2 className="app__onboarding-title">{tree.app.onboardingTitle}</h2>
        <p className="app__onboarding-lead">{tree.app.onboardingLead}</p>
        <ul className="app__onboarding-list">
          <li>{tree.app.onboardingP1}</li>
          <li>{tree.app.onboardingP2}</li>
          <li>{tree.app.onboardingP3}</li>
          <li>{tree.app.onboardingP4}</li>
          <li>{tree.app.onboardingP5}</li>
        </ul>

        <h3 className="app__onboarding-subtitle">{tree.view.controlsDetails}</h3>
        <div className="app__onboarding-controls">
          <p><strong>Plan 2D:</strong> {tree.view.plan2dControls}</p>
          <p>{tree.view.plan2dControlsDetail}</p>
          <p><strong>3D:</strong> {tree.view.threeDControls}</p>
          <p>{tree.view.threeDControlsDetail}</p>
        </div>

        <div className="app__onboarding-actions">
          <button type="button" className="app__onboarding-dismiss" onClick={dismissOnboarding}>
            {tree.app.onboardingDismiss}
          </button>
        </div>
      </dialog>

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
                    <StageCanvas
                      ref={planCanvasRef}
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
                    />
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
                    <StageView3D ref={view3dRef} targets={targets} props={props} cameraMode={camera3d} />
                  </div>
                )}
              </main>
            </div>
          </div>
        </div>
      </div>

      <details className="app__briefing">
        <summary>{tree.briefing.summary}</summary>
        <div className="app__briefing-grid">
          <label className="app__field">
            {tree.briefing.documentTitle}
            <input
              value={briefing.documentTitle}
              onChange={(e) => setBriefing({ documentTitle: e.target.value })}
            />
          </label>
          <label className="app__field">
            {tree.briefing.exerciseType}
            <select
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
              rows={2}
              value={briefing.targetsDescription}
              onChange={(e) => setBriefing({ targetsDescription: e.target.value })}
            />
          </label>
          <label className="app__field">
            {tree.briefing.recommendedShots}
            <input
              value={briefing.recommendedShots}
              onChange={(e) => setBriefing({ recommendedShots: e.target.value })}
            />
          </label>
          <label className="app__field app__field--wide">
            {tree.briefing.allowedAmmo}
            <textarea
              rows={2}
              value={briefing.allowedAmmo}
              onChange={(e) => setBriefing({ allowedAmmo: e.target.value })}
            />
          </label>
          <label className="app__field">
            {tree.briefing.maxPoints}
            <input value={briefing.maxPoints} onChange={(e) => setBriefing({ maxPoints: e.target.value })} />
          </label>
          <label className="app__field">
            {tree.briefing.startSignal}
            <input
              value={briefing.startSignal}
              onChange={(e) => setBriefing({ startSignal: e.target.value })}
            />
          </label>
          <label className="app__field app__field--wide">
            {tree.briefing.readyCondition}
            <textarea
              rows={2}
              value={briefing.readyCondition}
              onChange={(e) => setBriefing({ readyCondition: e.target.value })}
            />
          </label>
          <label className="app__field app__field--wide">
            {tree.briefing.startPosition}
            <textarea
              rows={3}
              value={briefing.startPosition}
              onChange={(e) => setBriefing({ startPosition: e.target.value })}
            />
          </label>
          <label className="app__field app__field--wide">
            {tree.briefing.procedure}
            <textarea
              rows={3}
              value={briefing.procedure}
              onChange={(e) => setBriefing({ procedure: e.target.value })}
            />
          </label>
          <label className="app__field">
            {tree.briefing.safetyAngles}
            <input
              value={briefing.safetyAngles}
              onChange={(e) => setBriefing({ safetyAngles: e.target.value })}
            />
          </label>
        </div>
        <div className="app__briefing-actions">
          <button type="button" className="app__btn-secondary" onClick={applySceneToBriefing}>
            {tree.briefing.applyFromScene}
          </button>
          <button type="button" disabled={pdfBusy} onClick={() => void handleExportPdf()}>
            {pdfBusy ? tree.briefing.downloadPdfBusy : tree.briefing.downloadPdf}
          </button>
        </div>
        <p className="app__briefing-hint">
          {tree.briefing.hintBefore} <strong>{tree.briefing.hintEm}</strong>
          {tree.briefing.hintAfter}
        </p>
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
