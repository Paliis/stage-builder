import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type PointerEvent,
} from 'react'
import { useStageStore } from '../../application/stageStore'
import { CERAMIC_FACE_RGBA } from '../../domain/ceramicPlateSpec'
import type { MetalPlateRectSideCm, Prop, Target } from '../../domain/models'
import {
  cooperTunnelPenaltyPlankOffsetsXM,
  faultLineEndPointsWorld,
  faultLineGeometryAfterStretch,
  faultLinePoseForRotateAboutNegEnd,
  faultLineWithLength,
  FAULT_LINE_SECTION_M,
  isShieldWithPortFamily,
  propOutlineWorld,
  movingPlatformDeckOutlineWorld,
  propPortHoleWorld,
  SEESAW_PIPE_RADIUS_M,
  SHIELD_FRAME_SECTION_M,
} from '../../domain/propGeometry'
import {
  isPaperTargetType,
  isSquareSteelPlateTargetType,
  popper2DDrawSpec,
  targetFootprintWorld,
  targetMetalPedestalWorld,
  targetRenderPolygonWorld,
  targetsDrawOrder,
} from '../../domain/targetSpecs'
import { swinger2DDrawSpecWorld, type Swinger2DDrawSpec } from '../../domain/swingerGeometry'
import { parseSafetyAngles, isTargetInSafetyZone, type SafetyAngles } from '../../domain/safetyAngles'
import { useBriefingStore } from '../../application/briefingStore'
import {
  clampVec2ToField,
  DEFAULT_FIELD_HEIGHT_M,
  DEFAULT_FIELD_WIDTH_M,
  GRID_SNAP_M,
  snapMeters,
  snapVec2,
  PROP_PLACEMENT_SNAP_M,
  TARGET_PLACEMENT_SNAP_M,
} from '../../domain/field'
import {
  applyZoomAtWorldPoint,
  buildStageViewTransform,
  computeWorldViewportRect,
  panCssToCenterWorldPoint,
  screenToWorld,
  spawnCenterWorldFromView,
  wheelZoomAdjust,
  worldToScreen,
  type ViewTransform,
  type WorldViewportRect,
} from '../lib/viewTransform'

const PICK_MARGIN_M = 0.04
/** Мінімальний рух (px), щоб відрізнити панораму від кліку по порожньому полю. */
const EMPTY_PAN_THRESHOLD_PX = 6
const MIN_DRAW_MIN_PX = 14
const TOUCH_PICK_MIN_PX = 26
const EXTRUDE_SCREEN_PX = { dx: 5, dy: 7 }
const HANDLE_OFFSET_M = 0.32
/** 5° — інакше 45° діагональ «лягає» на 40°/50° і краї щитів не сходяться. */
const ROTATION_SNAP_RAD = Math.PI / 36

type Vec2 = { x: number; y: number }

/** Виділення на плані: одне або кілька (рамка за центром об’єкта). */
export type PlanSelectState =
  | { mode: 'none' }
  | { mode: 'single'; kind: 'target' | 'prop'; id: string }
  | { mode: 'multi'; targetIds: string[]; propIds: string[] }

function snapshotEntitiesForCopy(
  planSelect: PlanSelectState,
  targets: readonly Target[],
  props: readonly Prop[],
): { targets: Target[]; props: Prop[] } | null {
  if (planSelect.mode === 'none') return null
  if (planSelect.mode === 'single') {
    if (planSelect.kind === 'target') {
      const t = targets.find((x) => x.id === planSelect.id)
      return t ? { targets: [structuredClone(t)], props: [] } : null
    }
    const p = props.find((x) => x.id === planSelect.id)
    return p ? { targets: [], props: [structuredClone(p)] } : null
  }
  const ts = planSelect.targetIds
    .map((id) => targets.find((t) => t.id === id))
    .filter((x): x is Target => x !== undefined)
  const ps = planSelect.propIds
    .map((id) => props.find((p) => p.id === id))
    .filter((x): x is Prop => x !== undefined)
  if (ts.length === 0 && ps.length === 0) return null
  return { targets: ts.map((t) => structuredClone(t)), props: ps.map((p) => structuredClone(p)) }
}

type MarqueeDragState = {
  pointerId: number
  startSx: number
  startSy: number
  curSx: number
  curSy: number
}

type DragMode =
  | { mode: 'move'; kind: 'target' | 'prop'; id: string; grabOffset: { x: number; y: number } }
  | { mode: 'rotate'; kind: 'target' | 'prop'; id: string }
  | { mode: 'stretchFaultLine'; id: string; anchor: 'neg' | 'pos' }

function collectIdsInWorldRect(
  targets: readonly Target[],
  props: readonly Prop[],
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
): { targetIds: string[]; propIds: string[] } {
  const inR = (p: Vec2) => p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY
  return {
    targetIds: targets.filter((t) => inR(t.position)).map((t) => t.id),
    propIds: props.filter((p) => inR(p.position)).map((p) => p.id),
  }
}

function drawPlanSelectOutlines(
  ctx: CanvasRenderingContext2D,
  tf: ViewTransform,
  targets: readonly Target[],
  props: readonly Prop[],
  planSelect: PlanSelectState,
) {
  const strokeOne = (outline: Vec2[]) => {
    if (outline.length === 0) return
    const scr = outline.map((p) => worldToScreen(p.x, p.y, tf))
    ctx.strokeStyle = 'rgba(79, 70, 229, 0.95)'
    ctx.lineWidth = 2
    ctx.setLineDash([6, 4])
    ctx.beginPath()
    ctx.moveTo(scr[0]!.x, scr[0]!.y)
    for (let i = 1; i < scr.length; i++) ctx.lineTo(scr[i]!.x, scr[i]!.y)
    ctx.closePath()
    ctx.stroke()
    ctx.setLineDash([])
  }

  if (planSelect.mode === 'single') {
    const selT = planSelect.kind === 'target' ? targets.find((x) => x.id === planSelect.id) : undefined
    const selP = planSelect.kind === 'prop' ? props.find((x) => x.id === planSelect.id) : undefined
    let outline: Vec2[] = []
    if (planSelect.kind === 'target' && selT) outline = targetRenderPolygonWorld(selT)
    else if (planSelect.kind === 'prop' && selP) outline = propOutlineWorld(selP)
    strokeOne(outline)

    if (planSelect.kind === 'prop' && selP?.type === 'faultLine') {
      const ends = faultLineEndPointsWorld(selP)
      if (ends) {
        const hr = Math.max(8, 0.18 * tf.pxPerMeter)
        const s = worldToScreen(ends.neg.x, ends.neg.y, tf)
        ctx.fillStyle = '#f97316'
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.55)'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.arc(s.x, s.y, hr, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
      }
    }

    let hw: Vec2 | null = null
    if (planSelect.kind === 'target' && selT) hw = handleWorldPosTarget(selT)
    if (planSelect.kind === 'prop' && selP) hw = handleWorldPosProp(selP)
    if (hw) {
      const hs = worldToScreen(hw.x, hw.y, tf)
      const hr = Math.max(9, 0.22 * tf.pxPerMeter)
      ctx.fillStyle = 'rgba(79, 70, 229, 0.95)'
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(hs.x, hs.y, hr, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = '#ffffff'
      ctx.font = `${Math.round(hr * 1.1)}px system-ui, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('↻', hs.x, hs.y + 0.5)
    }
    return
  }

  if (planSelect.mode === 'multi') {
    for (const id of planSelect.targetIds) {
      const selT = targets.find((x) => x.id === id)
      if (selT) strokeOne(targetRenderPolygonWorld(selT))
    }
    for (const id of planSelect.propIds) {
      const selP = props.find((x) => x.id === id)
      if (selP) strokeOne(propOutlineWorld(selP))
    }
  }
}

type ViewPanDragState = {
  pointerId: number
  startClientX: number
  startClientY: number
  startPanX: number
  startPanY: number
}

type PendingEmptyPan = {
  pointerId: number
  clientX: number
  clientY: number
}

/** Лише кінець «neg»: другий кінець керується ручкою обертання. */
function pickFaultStretchNegEnd(
  wx: number,
  wy: number,
  ends: { neg: Vec2; pos: Vec2 },
  pxPerMeter: number,
): boolean {
  const touch = Math.max(TOUCH_PICK_MIN_PX / Math.max(pxPerMeter, 1e-6), 0.16)
  return Math.hypot(wx - ends.neg.x, wy - ends.neg.y) <= touch
}

function snapAngleRad(r: number): number {
  return Math.round(r / ROTATION_SNAP_RAD) * ROTATION_SNAP_RAD
}

function pointInPolygon(wx: number, wy: number, poly: Vec2[]): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i]!.x
    const yi = poly[i]!.y
    const xj = poly[j]!.x
    const yj = poly[j]!.y
    if (yi > wy !== yj > wy && wx < ((xj - xi) * (wy - yi)) / (yj - yi + 1e-12) + xi) {
      inside = !inside
    }
  }
  return inside
}

function pickTargetAt(
  targets: readonly Target[],
  wx: number,
  wy: number,
  touchPadM: number,
): Target | null {
  const ordered = targetsDrawOrder(targets)
  for (let i = ordered.length - 1; i >= 0; i--) {
    const g = ordered[i]
    if (!g) continue
    const { poly, boundsR } = targetFootprintWorld(g)
    if (pointInPolygon(wx, wy, poly)) return g
    const near =
      Math.hypot(wx - g.position.x, wy - g.position.y) <= boundsR + PICK_MARGIN_M + touchPadM
    if (near) return g
  }
  return null
}

function pickPropAt(props: readonly Prop[], wx: number, wy: number, touchPadM: number): Prop | null {
  for (let i = props.length - 1; i >= 0; i--) {
    const p = props[i]
    if (!p) continue
    if (p.type === 'barrel' || p.type === 'tireStack') {
      const r = Math.min(p.sizeM.x, p.sizeM.y) / 2
      const dx = wx - p.position.x
      const dy = wy - p.position.y
      if (Math.hypot(dx, dy) <= r + PICK_MARGIN_M + touchPadM) return p
      continue
    }
    const hw = p.sizeM.x / 2
    const hh = p.sizeM.y / 2
    const rot = p.rotationRad
    const dx = wx - p.position.x
    const dy = wy - p.position.y
    const c = Math.cos(-rot)
    const s = Math.sin(-rot)
    const lx = dx * c - dy * s
    const ly = dx * s + dy * c
    if (Math.abs(lx) <= hw + PICK_MARGIN_M + touchPadM && Math.abs(ly) <= hh + PICK_MARGIN_M + touchPadM)
      return p
  }
  return null
}

function handleWorldPosTarget(t: Target): Vec2 {
  const rot = t.rotationRad
  const { boundsR } = targetFootprintWorld(t)
  const d = boundsR + HANDLE_OFFSET_M
  return {
    x: t.position.x + Math.cos(rot) * d,
    y: t.position.y + Math.sin(rot) * d,
  }
}

function handleWorldPosProp(p: Prop): Vec2 {
  const rot = p.rotationRad
  if (p.type === 'faultLine') {
    const ends = faultLineEndPointsWorld(p)
    if (!ends) {
      const perpX = -Math.sin(rot)
      const perpY = Math.cos(rot)
      const off = p.sizeM.y / 2 + HANDLE_OFFSET_M
      return { x: p.position.x + perpX * off, y: p.position.y + perpY * off }
    }
    const perpX = -Math.sin(rot)
    const perpY = Math.cos(rot)
    /** Від кінця лінії: далі від осі, щоб клік по ↻ не перехоплювався як розтягування за помаранчеву точку. */
    const off = HANDLE_OFFSET_M + p.sizeM.y * 0.85
    return {
      x: ends.pos.x + perpX * off,
      y: ends.pos.y + perpY * off,
    }
  }
  const hw = p.sizeM.x / 2
  const hh = p.sizeM.y / 2
  const r0 =
    p.type === 'barrel' || p.type === 'tireStack' ? Math.min(hw, hh) : Math.hypot(hw, hh)
  const d = r0 + HANDLE_OFFSET_M
  return {
    x: p.position.x + Math.cos(rot) * d,
    y: p.position.y + Math.sin(rot) * d,
  }
}

function pickHandle(wx: number, wy: number, h: Vec2, pxPerMeter: number): boolean {
  const touch = TOUCH_PICK_MIN_PX / Math.max(pxPerMeter, 1e-6)
  const r = Math.max(0.14, touch)
  const dx = wx - h.x
  const dy = wy - h.y
  return dx * dx + dy * dy <= r * r
}

function targetFill(type: Target['type'], isNoShoot: boolean): string {
  if (isNoShoot) return 'rgba(239, 68, 68, 0.9)'
  if (type === 'ceramicPlate') return CERAMIC_FACE_RGBA
  if (isSquareSteelPlateTargetType(type)) return 'rgba(248, 250, 252, 0.96)'
  if (isPaperTargetType(type)) return 'rgba(255, 255, 255, 0.98)'
  return 'rgba(244, 244, 245, 0.96)'
}

function tracePolygonScreen(ctx: CanvasRenderingContext2D, scr: Vec2[]) {
  if (scr.length === 0) return
  ctx.moveTo(scr[0]!.x, scr[0]!.y)
  for (let i = 1; i < scr.length; i++) {
    const q = scr[i]!
    ctx.lineTo(q.x, q.y)
  }
  ctx.closePath()
}

function drawTargetShape(
  ctx: CanvasRenderingContext2D,
  t: Target,
  tfx: ViewTransform,
  fillStyle: string,
  strokeStyle: string,
  lineWidth: number,
) {
  const poly = targetRenderPolygonWorld(t)
  const scr = poly.map((p) => worldToScreen(p.x, p.y, tfx))
  ctx.beginPath()
  tracePolygonScreen(ctx, scr)
  ctx.fillStyle = fillStyle
  ctx.fill()
  ctx.strokeStyle = strokeStyle
  ctx.lineWidth = lineWidth
  ctx.stroke()
}

function drawSwinger2D(
  ctx: CanvasRenderingContext2D,
  t: Target,
  tf: ViewTransform,
  spec: Swinger2DDrawSpec,
  strokeStyle: string,
  lineWidth: number,
) {
  const metal = '#1e293b'
  const metalDeep = '#0f172a'

  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  for (const [a, b] of spec.baseSegsWorld) {
    const sa = worldToScreen(a.x, a.y, tf)
    const sb = worldToScreen(b.x, b.y, tf)
    ctx.beginPath()
    ctx.moveTo(sa.x, sa.y)
    ctx.lineTo(sb.x, sb.y)
    ctx.strokeStyle = metal
    ctx.lineWidth = Math.max(1.5, lineWidth + 1)
    ctx.stroke()
  }

  const postScr = spec.postWorld.map((p) => worldToScreen(p.x, p.y, tf))
  ctx.beginPath()
  tracePolygonScreen(ctx, postScr)
  ctx.fillStyle = metalDeep
  ctx.fill()
  ctx.strokeStyle = 'rgba(15,23,42,0.55)'
  ctx.lineWidth = 1
  ctx.stroke()

  const barScr = spec.barWorld.map((p) => worldToScreen(p.x, p.y, tf))
  ctx.beginPath()
  tracePolygonScreen(ctx, barScr)
  ctx.fillStyle = metal
  ctx.fill()
  ctx.strokeStyle = 'rgba(15,23,42,0.5)'
  ctx.lineWidth = 1
  ctx.stroke()

  if (spec.counterWorld) {
    const c = worldToScreen(spec.counterWorld.cx, spec.counterWorld.cy, tf)
    const rRef = worldToScreen(spec.counterWorld.cx + spec.counterWorld.r, spec.counterWorld.cy, tf)
    const cr = Math.max(2, Math.hypot(rRef.x - c.x, rRef.y - c.y))
    ctx.beginPath()
    ctx.arc(c.x, c.y, cr, 0, Math.PI * 2)
    ctx.fillStyle = metalDeep
    ctx.fill()
  }

  for (const face of spec.facesWorld) {
    const scr = face.outline.map((p) => worldToScreen(p.x, p.y, tf))
    ctx.beginPath()
    tracePolygonScreen(ctx, scr)
    if (face.isCeramic) {
      ctx.fillStyle = t.isNoShoot ? 'rgba(252, 165, 165, 0.95)' : CERAMIC_FACE_RGBA
    } else {
      ctx.fillStyle = t.isNoShoot ? 'rgba(254, 226, 226, 0.97)' : 'rgba(255, 255, 255, 0.98)'
    }
    ctx.fill()
    ctx.strokeStyle = strokeStyle
    ctx.lineWidth = lineWidth
    ctx.stroke()
  }
  ctx.lineCap = 'butt'
  ctx.lineJoin = 'miter'
}

function drawPopper2D(
  ctx: CanvasRenderingContext2D,
  t: Target,
  tfx: ViewTransform,
  spec: NonNullable<ReturnType<typeof popper2DDrawSpec>>,
  strokeStyle: string,
  lineWidth: number,
) {
  const baseScr = spec.baseWorld.map((p) => worldToScreen(p.x, p.y, tfx))
  ctx.beginPath()
  tracePolygonScreen(ctx, baseScr)
  ctx.fillStyle = t.isNoShoot ? 'rgba(254, 226, 226, 0.97)' : 'rgba(250, 245, 235, 0.98)'
  ctx.fill()

  const hc = worldToScreen(spec.headCenterWorld.x, spec.headCenterWorld.y, tfx)
  const hrRef = worldToScreen(
    spec.headCenterWorld.x + spec.headRadiusM,
    spec.headCenterWorld.y,
    tfx,
  )
  const headR = Math.max(1.5, Math.hypot(hrRef.x - hc.x, hrRef.y - hc.y))
  ctx.beginPath()
  ctx.arc(hc.x, hc.y, headR, 0, Math.PI * 2)
  ctx.fillStyle = t.isNoShoot ? 'rgba(252, 165, 165, 0.94)' : 'rgba(148, 156, 168, 0.9)'
  ctx.fill()

  const outScr = spec.outlineWorld.map((p) => worldToScreen(p.x, p.y, tfx))
  ctx.beginPath()
  tracePolygonScreen(ctx, outScr)
  ctx.strokeStyle = strokeStyle
  ctx.lineWidth = lineWidth
  ctx.stroke()
}

function drawGrid(ctx: CanvasRenderingContext2D, t: ViewTransform) {
  const fw = t.fieldWidthM
  const fh = t.fieldHeightM
  ctx.save()
  ctx.lineWidth = 1
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)'

  for (let x = 0; x <= fw; x += GRID_SNAP_M) {
    const p0 = worldToScreen(x, 0, t)
    const p1 = worldToScreen(x, fh, t)
    ctx.beginPath()
    ctx.moveTo(p0.x, p0.y)
    ctx.lineTo(p1.x, p1.y)
    ctx.stroke()
  }
  for (let y = 0; y <= fh; y += GRID_SNAP_M) {
    const p0 = worldToScreen(0, y, t)
    const p1 = worldToScreen(fw, y, t)
    ctx.beginPath()
    ctx.moveTo(p0.x, p0.y)
    ctx.lineTo(p1.x, p1.y)
    ctx.stroke()
  }

  ctx.strokeStyle = 'rgba(71, 85, 105, 0.9)'
  ctx.lineWidth = 2
  const bl = worldToScreen(0, 0, t)
  const br = worldToScreen(fw, 0, t)
  const tl = worldToScreen(0, fh, t)
  const tr = worldToScreen(fw, fh, t)
  ctx.beginPath()
  ctx.moveTo(bl.x, bl.y)
  ctx.lineTo(br.x, br.y)
  ctx.lineTo(tr.x, tr.y)
  ctx.lineTo(tl.x, tl.y)
  ctx.closePath()
  ctx.stroke()
  ctx.restore()
}

const RULER_TARGET_TICK_PX = 52
/** Базова довжина риски в метрах (при великому зумі); при «вмістити поле» інакше риски бу б ~1–2 px. */
const RULER_TICK_LEN_M = 0.07
const RULER_TICK_MIN_PX_MAJOR = 12
const RULER_TICK_MIN_PX_MINOR = 7
/** Мінімальний крок поділок лінійки (м); далі адаптивно 1, 2, 5… */
const RULER_STEP_CANDIDATES_M = [0.5, 1, 2, 5, 10, 20, 50, 100] as const

function pickRulerStepM(pxPerMeter: number): number {
  const targetM = RULER_TARGET_TICK_PX / Math.max(pxPerMeter, 1e-6)
  for (const s of RULER_STEP_CANDIDATES_M) {
    if (s >= targetM * 0.72) return s
  }
  return 100
}

function formatRulerTickLabel(v: number, step: number): string {
  if (step >= 1) return String(Math.round(v))
  return (Math.round(v * 10) / 10).toFixed(1)
}

function rulerTickLenWorldM(pxPerMeter: number, minPx: number, baseM: number): number {
  return Math.max(baseM, minPx / Math.max(pxPerMeter, 1e-6))
}

/** Смуги лінійки (CSS px) — закріплені на вікні, щоб залишатись видимими при пані та зумі. */
const RULER_VIEW_STRIP_LEFT_PX = 34
const RULER_VIEW_STRIP_BOTTOM_PX = 22

/**
 * Лінійки уздовж лівого та нижнього краю канваса: поділки за видимим діапазоном світу (м),
 * без прив’язки до країв поля на екрані.
 */
function drawViewportFixedRulers(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  tf: ViewTransform,
) {
  const w = canvas.clientWidth
  const h = canvas.clientHeight
  if (w <= 0 || h <= 0) return

  const vw = computeWorldViewportRect(w, h, tf)
  const step = pickRulerStepM(tf.pxPerMeter)
  const minorStep = step >= 1 ? step * 0.5 : 0

  const majorLenM = rulerTickLenWorldM(tf.pxPerMeter, RULER_TICK_MIN_PX_MAJOR, RULER_TICK_LEN_M)
  const minorLenM = rulerTickLenWorldM(tf.pxPerMeter, RULER_TICK_MIN_PX_MINOR, RULER_TICK_LEN_M * 0.55)
  const majorTickPx = majorLenM * tf.pxPerMeter
  const minorTickPx = minorLenM * tf.pxPerMeter

  const stripL = RULER_VIEW_STRIP_LEFT_PX
  const stripB = RULER_VIEW_STRIP_BOTTOM_PX
  const plotTop = 0
  const plotBottom = h - stripB

  ctx.save()

  ctx.fillStyle = 'rgba(248, 250, 252, 0.92)'
  ctx.fillRect(0, plotBottom, w, stripB)
  ctx.fillRect(0, plotTop, stripL, plotBottom)

  ctx.strokeStyle = 'rgba(148, 163, 184, 0.55)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(stripL, 0)
  ctx.lineTo(stripL, plotBottom)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(0, plotBottom)
  ctx.lineTo(w, plotBottom)
  ctx.stroke()

  const fontPx = Math.max(9, Math.min(12, Math.round(10 * Math.sqrt(tf.pxPerMeter / 14))))
  ctx.font = `${fontPx}px system-ui, sans-serif`
  ctx.fillStyle = 'rgba(30, 41, 59, 0.95)'

  const yK0 = Math.floor(vw.minY / step)
  const yK1 = Math.ceil(vw.maxY / step)
  for (let k = yK0; k <= yK1; k++) {
    const yWorld = k * step
    const sy = worldToScreen(0, yWorld, tf).y
    if (sy < plotTop - 40 || sy > plotBottom + 40) continue

    ctx.strokeStyle = 'rgba(51, 65, 85, 0.92)'
    ctx.lineWidth = 1.35
    ctx.beginPath()
    ctx.moveTo(stripL, sy)
    ctx.lineTo(stripL + majorTickPx, sy)
    ctx.stroke()

    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'
    ctx.fillText(formatRulerTickLabel(yWorld, step), stripL - 4, sy)
  }

  if (minorStep > 0) {
    const m0 = Math.floor(vw.minY / minorStep)
    const m1 = Math.ceil(vw.maxY / minorStep)
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.65)'
    ctx.lineWidth = 1
    for (let k = m0; k <= m1; k++) {
      const yWorld = k * minorStep
      if (Math.abs(yWorld / step - Math.round(yWorld / step)) < 1e-6) continue
      const sy = worldToScreen(0, yWorld, tf).y
      if (sy < plotTop - 40 || sy > plotBottom + 40) continue
      ctx.beginPath()
      ctx.moveTo(stripL, sy)
      ctx.lineTo(stripL + minorTickPx, sy)
      ctx.stroke()
    }
  }

  const xK0 = Math.floor(vw.minX / step)
  const xK1 = Math.ceil(vw.maxX / step)
  const yBaseline = plotBottom
  for (let k = xK0; k <= xK1; k++) {
    const xWorld = k * step
    const sx = worldToScreen(xWorld, 0, tf).x
    if (sx < stripL - 40 || sx > w + 40) continue

    ctx.strokeStyle = 'rgba(51, 65, 85, 0.92)'
    ctx.lineWidth = 1.35
    ctx.beginPath()
    ctx.moveTo(sx, yBaseline)
    ctx.lineTo(sx, yBaseline - majorTickPx)
    ctx.stroke()

    if (xWorld > 1e-6) {
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillText(formatRulerTickLabel(xWorld, step), sx, yBaseline + 3)
    }
  }

  if (minorStep > 0) {
    const m0 = Math.floor(vw.minX / minorStep)
    const m1 = Math.ceil(vw.maxX / minorStep)
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.65)'
    ctx.lineWidth = 1
    for (let k = m0; k <= m1; k++) {
      const xWorld = k * minorStep
      const onMajor = Math.abs(xWorld / step - Math.round(xWorld / step)) < 1e-6
      if (onMajor) continue
      const sx = worldToScreen(xWorld, 0, tf).x
      if (sx < stripL - 40 || sx > w + 40) continue
      ctx.beginPath()
      ctx.moveTo(sx, yBaseline)
      ctx.lineTo(sx, yBaseline - minorTickPx)
      ctx.stroke()
    }
  }

  ctx.restore()
}

function drawMeasureOverlay(
  ctx: CanvasRenderingContext2D,
  tf: ViewTransform,
  a: Vec2 | null,
  b: Vec2 | null,
  distanceLabel: string | null,
) {
  ctx.save()
  if (a) {
    const sa = worldToScreen(a.x, a.y, tf)
    const r = Math.max(4, 0.09 * tf.pxPerMeter)
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.95)'
    ctx.fillStyle = 'rgba(251, 191, 36, 0.35)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(sa.x, sa.y, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }
  if (a && b) {
    const sa = worldToScreen(a.x, a.y, tf)
    const sb = worldToScreen(b.x, b.y, tf)
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.95)'
    ctx.lineWidth = 2
    ctx.setLineDash([8, 5])
    ctx.beginPath()
    ctx.moveTo(sa.x, sa.y)
    ctx.lineTo(sb.x, sb.y)
    ctx.stroke()
    ctx.setLineDash([])
    const r = Math.max(4, 0.09 * tf.pxPerMeter)
    ctx.fillStyle = 'rgba(251, 191, 36, 0.35)'
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.95)'
    ctx.beginPath()
    ctx.arc(sb.x, sb.y, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    if (distanceLabel) {
      const mx = (sa.x + sb.x) / 2
      const my = (sa.y + sb.y) / 2
      ctx.font = `${Math.max(11, Math.round(12 * Math.sqrt(tf.pxPerMeter / 14)))}px system-ui, sans-serif`
      const tw = ctx.measureText(distanceLabel).width
      const pad = 6
      ctx.fillStyle = 'rgba(255, 251, 235, 0.96)'
      ctx.strokeStyle = 'rgba(180, 83, 9, 0.55)'
      ctx.lineWidth = 1
      const bx = mx - tw / 2 - pad
      const by = my - 11 - pad
      const bw = tw + pad * 2
      const bh = 22 + pad * 0.5
      ctx.fillRect(bx, by, bw, bh)
      ctx.strokeRect(bx, by, bw, bh)
      ctx.fillStyle = 'rgba(120, 53, 15, 0.98)'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(distanceLabel, mx, my)
    }
  }
  ctx.restore()
}

/** Підказка вузла сітки під курсором при наближенні (світові м вже на кроці GRID_SNAP_M). */
function drawGridSnapCursor(ctx: CanvasRenderingContext2D, tf: ViewTransform, snapped: Vec2) {
  const p = worldToScreen(snapped.x, snapped.y, tf)
  const r = Math.max(6, Math.min(16, 0.14 * tf.pxPerMeter))
  ctx.save()
  ctx.strokeStyle = 'rgba(14, 165, 233, 0.92)'
  ctx.fillStyle = 'rgba(14, 165, 233, 0.18)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(p.x, p.y, Math.max(2.5, r * 0.28), 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(p.x - r, p.y)
  ctx.lineTo(p.x + r, p.y)
  ctx.moveTo(p.x, p.y - r)
  ctx.lineTo(p.x, p.y + r)
  ctx.stroke()
  ctx.font = `${Math.max(10, Math.round(11 * Math.sqrt(tf.pxPerMeter / 12)))}px system-ui, sans-serif`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'bottom'
  const label = `${snapped.x.toFixed(1)} × ${snapped.y.toFixed(1)} m`
  const tw = ctx.measureText(label).width
  const tx = p.x + r + 5
  const ty = p.y - r - 4
  ctx.fillStyle = 'rgba(255, 255, 255, 0.94)'
  ctx.fillRect(tx - 3, ty - 13, tw + 6, 16)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)'
  ctx.fillText(label, tx, ty)
  ctx.restore()
}

function tracePropOutline(ctx: CanvasRenderingContext2D, corners: Vec2[], ox: number, oy: number) {
  const a = corners[0]!
  ctx.moveTo(a.x + ox, a.y + oy)
  for (let i = 1; i < corners.length; i++) {
    const q = corners[i]!
    ctx.lineTo(q.x + ox, q.y + oy)
  }
  ctx.closePath()
}

/** Щит, щит з портом, двері: та сама рамка на плані; сітка / отвір 30×30 / суцільна панель. */
function drawShieldPlan2D(ctx: CanvasRenderingContext2D, p: Prop, tf: ViewTransform) {
  const isDoor = p.type === 'door'
  const withPort = isShieldWithPortFamily(p.type)
  const outline = propOutlineWorld(p)
  const corners = outline.map((q) => worldToScreen(q.x, q.y, tf))
  const holeWorld = withPort ? propPortHoleWorld(p) : null
  const holeScr = holeWorld?.map((q) => worldToScreen(q.x, q.y, tf))
  const { dx, dy } = EXTRUDE_SCREEN_PX

  ctx.beginPath()
  tracePropOutline(ctx, corners, dx, dy)
  ctx.fillStyle = 'rgba(20, 20, 22, 0.93)'
  ctx.fill()

  ctx.beginPath()
  tracePropOutline(ctx, corners, 0, 0)
  if (holeScr && holeScr.length >= 3) {
    tracePropOutline(ctx, holeScr.slice().reverse(), 0, 0)
    ctx.fillStyle = 'rgba(198, 236, 212, 0.46)'
    ctx.fill('evenodd')
  } else if (isDoor) {
    ctx.fillStyle = 'rgba(92, 64, 51, 0.9)'
    ctx.fill()
  } else {
    ctx.fillStyle = 'rgba(198, 236, 212, 0.46)'
    ctx.fill()
  }

  const { x: cx, y: cy } = p.position
  const rot = p.rotationRad
  const hw = p.sizeM.x / 2
  const hh = p.sizeM.y / 2
  const co = Math.cos(rot)
  const si = Math.sin(rot)
  const toW = (lx: number, ly: number) => ({
    x: cx + lx * co - ly * si,
    y: cy + lx * si + ly * co,
  })

  if (!isDoor) {
    ctx.save()
    ctx.beginPath()
    tracePropOutline(ctx, corners, 0, 0)
    if (holeScr && holeScr.length >= 3) {
      tracePropOutline(ctx, holeScr.slice().reverse(), 0, 0)
      ctx.clip('evenodd')
    } else {
      ctx.clip()
    }

    const stepU = 0.052
    ctx.strokeStyle = 'rgba(34, 115, 72, 0.82)'
    ctx.lineWidth = 1
    for (let u = -hw; u <= hw + 1e-6; u += stepU) {
      const A = toW(u, -hh)
      const B = toW(u, hh)
      const sa = worldToScreen(A.x, A.y, tf)
      const sb = worldToScreen(B.x, B.y, tf)
      ctx.beginPath()
      ctx.moveTo(sa.x, sa.y)
      ctx.lineTo(sb.x, sb.y)
      ctx.stroke()
    }
    const stepV = Math.max(hh * 0.22, 0.008)
    for (let v = -hh; v <= hh + 1e-6; v += stepV) {
      const A = toW(-hw, v)
      const B = toW(hw, v)
      const sa = worldToScreen(A.x, A.y, tf)
      const sb = worldToScreen(B.x, B.y, tf)
      ctx.beginPath()
      ctx.moveTo(sa.x, sa.y)
      ctx.lineTo(sb.x, sb.y)
      ctx.stroke()
    }
    ctx.restore()
  }

  if (p.type === 'shieldWithPortDoor' && holeScr && holeScr.length >= 3) {
    ctx.beginPath()
    tracePropOutline(ctx, holeScr, 0, 0)
    ctx.fillStyle = 'rgba(92, 64, 51, 0.92)'
    ctx.fill()
    const mx = holeScr.reduce((a, q) => a + q.x, 0) / holeScr.length
    const my = holeScr.reduce((a, q) => a + q.y, 0) / holeScr.length
    const hr = Math.max(2.2, Math.min(5, 0.034 * tf.pxPerMeter))
    ctx.fillStyle = 'rgba(226, 230, 235, 0.96)'
    ctx.strokeStyle = 'rgba(100, 108, 120, 0.5)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(mx + hr * 0.42, my, hr, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.beginPath()
    ctx.rect(mx - hr * 0.75, my - 1.3, hr * 1.1, 2.6)
    ctx.fill()
    ctx.stroke()
  }

  ctx.beginPath()
  tracePropOutline(ctx, corners, 0, 0)
  ctx.strokeStyle = '#0a0a0a'
  ctx.lineWidth = Math.max(2, Math.min(6.5, SHIELD_FRAME_SECTION_M * tf.pxPerMeter))
  ctx.stroke()

  const fin = Math.min(SHIELD_FRAME_SECTION_M * 0.92, hh * 0.88, hw * 0.22)
  if (fin > 1e-4 && hw > fin * 1.5) {
    const iy = Math.max(1e-4, Math.min(fin * 0.85, hh - 1e-4))
    const inner = [
      toW(-hw + fin, -hh + iy),
      toW(hw - fin, -hh + iy),
      toW(hw - fin, hh - iy),
      toW(-hw + fin, hh - iy),
    ].map((q) => worldToScreen(q.x, q.y, tf))
    ctx.beginPath()
    ctx.moveTo(inner[0]!.x, inner[0]!.y)
    for (let i = 1; i < 4; i++) ctx.lineTo(inner[i]!.x, inner[i]!.y)
    ctx.closePath()
    ctx.strokeStyle = 'rgba(18, 18, 20, 0.92)'
    ctx.lineWidth = 1.15
    ctx.stroke()
  }

  if (holeScr && holeScr.length >= 3) {
    ctx.beginPath()
    tracePropOutline(ctx, holeScr, 0, 0)
    ctx.strokeStyle = '#0a0a0a'
    ctx.lineWidth = Math.max(1.5, SHIELD_FRAME_SECTION_M * tf.pxPerMeter * 0.85)
    ctx.stroke()
  }

  if (isDoor) {
    const hl = toW(hw * 0.52, 0)
    const hs = worldToScreen(hl.x, hl.y, tf)
    const hr = Math.max(2.2, Math.min(5.5, 0.035 * tf.pxPerMeter))
    ctx.beginPath()
    ctx.arc(hs.x, hs.y, hr, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(226, 230, 235, 0.97)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(100, 108, 120, 0.5)'
    ctx.lineWidth = 1
    ctx.stroke()
  }
}

function drawSeesawPlan2D(ctx: CanvasRenderingContext2D, p: Prop, tf: ViewTransform) {
  const outline = propOutlineWorld(p)
  const corners = outline.map((q) => worldToScreen(q.x, q.y, tf))
  const { dx, dy } = EXTRUDE_SCREEN_PX
  ctx.beginPath()
  tracePropOutline(ctx, corners, dx, dy)
  ctx.fillStyle = 'rgba(25, 25, 28, 0.92)'
  ctx.fill()
  ctx.beginPath()
  tracePropOutline(ctx, corners, 0, 0)
  ctx.fillStyle = 'rgba(196, 160, 118, 0.9)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.45)'
  ctx.lineWidth = 1.5
  ctx.stroke()
  const c = worldToScreen(p.position.x, p.position.y, tf)
  const rPx = Math.max(2.2, SEESAW_PIPE_RADIUS_M * tf.pxPerMeter)
  ctx.beginPath()
  ctx.arc(c.x, c.y, rPx, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(100, 108, 118, 0.9)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(30, 34, 42, 0.88)'
  ctx.lineWidth = 1.25
  ctx.stroke()
}

function drawMovingPlatformPlan2D(ctx: CanvasRenderingContext2D, p: Prop, tf: ViewTransform) {
  const outline = propOutlineWorld(p)
  const corners = outline.map((q) => worldToScreen(q.x, q.y, tf))
  const deck = movingPlatformDeckOutlineWorld(p)
  const deckScr = deck?.map((q) => worldToScreen(q.x, q.y, tf)) ?? []
  const { dx, dy } = EXTRUDE_SCREEN_PX
  ctx.beginPath()
  tracePropOutline(ctx, corners, dx, dy)
  ctx.fillStyle = 'rgba(25, 25, 28, 0.92)'
  ctx.fill()
  ctx.beginPath()
  tracePropOutline(ctx, corners, 0, 0)
  ctx.fillStyle = 'rgba(185, 190, 200, 0.48)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.45)'
  ctx.lineWidth = 1.5
  ctx.stroke()
  const pillarR = Math.max(2, 0.055 * tf.pxPerMeter)
  for (const q of outline) {
    const s = worldToScreen(q.x, q.y, tf)
    ctx.beginPath()
    ctx.arc(s.x, s.y, pillarR, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(90, 98, 110, 0.92)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(35, 40, 48, 0.75)'
    ctx.lineWidth = 1
    ctx.stroke()
  }
  if (deckScr.length >= 4) {
    ctx.beginPath()
    tracePropOutline(ctx, deckScr, 0, 0)
    ctx.fillStyle = 'rgba(130, 125, 118, 0.88)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(45, 50, 58, 0.65)'
    ctx.lineWidth = 1
    ctx.stroke()
    for (let i = 0; i < 4; i++) {
      const o = corners[i]!
      const ic = deckScr[i]!
      ctx.beginPath()
      ctx.moveTo(o.x, o.y)
      ctx.lineTo(ic.x, ic.y)
      ctx.strokeStyle = 'rgba(55, 60, 72, 0.55)'
      ctx.lineWidth = 0.9
      ctx.stroke()
    }
  }
}

function drawCooperTunnelPlan2D(ctx: CanvasRenderingContext2D, p: Prop, tf: ViewTransform) {
  const outline = propOutlineWorld(p)
  const corners = outline.map((q) => worldToScreen(q.x, q.y, tf))
  const { dx, dy } = EXTRUDE_SCREEN_PX
  const plankT = 0.045
  const { x: cx, y: cy } = p.position
  const rot = p.rotationRad
  const ux = Math.cos(rot)
  const uy = Math.sin(rot)
  const vx = -Math.sin(rot)
  const vy = Math.cos(rot)
  const hx = p.sizeM.x / 2
  const hz = p.sizeM.y / 2
  const w2 = plankT / 2

  /** Поздовжні рейки по краях ширини (узгоджено з 3D ±hz). */
  const stripPolyWorld = (sign: 1 | -1): Vec2[] => {
    const o = sign * hz
    const bx = cx + vx * o
    const by = cy + vy * o
    return [
      { x: bx - ux * hx - vx * w2, y: by - uy * hx - vy * w2 },
      { x: bx + ux * hx - vx * w2, y: by + uy * hx - vy * w2 },
      { x: bx + ux * hx + vx * w2, y: by + uy * hx + vy * w2 },
      { x: bx - ux * hx + vx * w2, y: by - uy * hx + vy * w2 },
    ]
  }

  ctx.beginPath()
  tracePropOutline(ctx, corners, dx, dy)
  ctx.fillStyle = 'rgba(25, 25, 28, 0.92)'
  ctx.fill()
  ctx.beginPath()
  tracePropOutline(ctx, corners, 0, 0)
  ctx.fillStyle = 'rgba(185, 170, 140, 0.68)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.45)'
  ctx.lineWidth = 1.5
  ctx.stroke()

  for (const sign of [-1, 1] as const) {
    const poly = stripPolyWorld(sign).map((q) => worldToScreen(q.x, q.y, tf))
    ctx.beginPath()
    tracePropOutline(ctx, poly, 0, 0)
    ctx.fillStyle = 'rgba(168, 152, 120, 0.82)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(70, 62, 50, 0.45)'
    ctx.lineWidth = 1
    ctx.stroke()
  }

  const crossHalf = hz + w2
  const penaltyStripWorld = (xAlong: number): Vec2[] => {
    const px = cx + ux * xAlong
    const py = cy + uy * xAlong
    const uu2 = ux * w2
    const uv2 = uy * w2
    const vxh = vx * crossHalf
    const vyh = vy * crossHalf
    return [
      { x: px - vxh - uu2, y: py - vyh - uv2 },
      { x: px + vxh - uu2, y: py + vyh - uv2 },
      { x: px + vxh + uu2, y: py + vyh + uv2 },
      { x: px - vxh + uu2, y: py - vyh + uv2 },
    ]
  }
  for (const xo of cooperTunnelPenaltyPlankOffsetsXM(p)) {
    const poly = penaltyStripWorld(xo).map((q) => worldToScreen(q.x, q.y, tf))
    ctx.beginPath()
    tracePropOutline(ctx, poly, 0, 0)
    ctx.fillStyle = 'rgba(185, 28, 28, 0.88)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(100, 20, 20, 0.65)'
    ctx.lineWidth = 1
    ctx.stroke()
  }
}

/** Узгоджено з StartPosition3D: два «сліди» по локальній осі X пропа. */
function drawStartPositionPlan2D(ctx: CanvasRenderingContext2D, p: Prop, tf: ViewTransform) {
  const sx = p.sizeM.x
  const sy = p.sizeM.y
  const footHalfSpacing = sx * 0.28
  const footLen = sy * 0.42
  const footWid = sx * 0.24
  const rx = (footWid / 2) * tf.pxPerMeter
  const ry = (footLen / 2) * tf.pxPerMeter
  const rot = p.rotationRad
  const { x: cx, y: cy } = p.position
  const c = Math.cos(rot)
  const s = Math.sin(rot)

  for (const sign of [-1, 1] as const) {
    const lx = sign * footHalfSpacing
    const wcx = cx + lx * c
    const wcy = cy + lx * s
    const scr = worldToScreen(wcx, wcy, tf)
    ctx.save()
    ctx.translate(scr.x, scr.y)
    ctx.rotate(rot)
    ctx.beginPath()
    ctx.ellipse(0, 0, Math.max(0.5, rx), Math.max(0.5, ry), 0, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(37, 99, 235, 0.78)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.38)'
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.restore()
  }
}

function drawSafetyZone(
  ctx: CanvasRenderingContext2D,
  tf: ViewTransform,
  startPos: Vec2,
  angles: SafetyAngles,
) {
  const center = worldToScreen(startPos.x, startPos.y, tf)
  const radius = Math.max(tf.fieldWidthM, tf.fieldHeightM) * 2 * tf.pxPerMeter

  const dirAngle = -Math.PI / 2
  const leftEdge = dirAngle - (angles.leftDeg * Math.PI) / 180
  const rightEdge = dirAngle + (angles.rightDeg * Math.PI) / 180

  ctx.save()
  ctx.globalAlpha = 0.10
  ctx.fillStyle = '#22c55e'
  ctx.beginPath()
  ctx.moveTo(center.x, center.y)
  ctx.arc(center.x, center.y, radius, leftEdge, rightEdge, false)
  ctx.closePath()
  ctx.fill()
  ctx.globalAlpha = 1

  ctx.strokeStyle = 'rgba(34, 197, 94, 0.6)'
  ctx.lineWidth = 1.5
  ctx.setLineDash([6, 4])
  ctx.beginPath()
  ctx.moveTo(center.x, center.y)
  ctx.lineTo(
    center.x + Math.cos(leftEdge) * radius,
    center.y + Math.sin(leftEdge) * radius,
  )
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(center.x, center.y)
  ctx.lineTo(
    center.x + Math.cos(rightEdge) * radius,
    center.y + Math.sin(rightEdge) * radius,
  )
  ctx.stroke()
  ctx.setLineDash([])
  ctx.restore()
}

function redraw(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  tf: ViewTransform,
  targets: readonly Target[],
  props: readonly Prop[],
  planSelect: PlanSelectState,
  marqueeScreen: { x1: number; y1: number; x2: number; y2: number } | null,
  gridHoverSnapped: Vec2 | null,
  viewZoom: number,
  safetyAnglesText: string,
  measureA: Vec2 | null,
  measureB: Vec2 | null,
  formatMeasureDistance: (m: number) => string,
) {
  const dpr = window.devicePixelRatio || 1
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight)

  ctx.fillStyle = 'rgba(15, 23, 42, 0.06)'
  const fieldPoly = [
    worldToScreen(0, 0, tf),
    worldToScreen(tf.fieldWidthM, 0, tf),
    worldToScreen(tf.fieldWidthM, tf.fieldHeightM, tf),
    worldToScreen(0, tf.fieldHeightM, tf),
  ]
  ctx.beginPath()
  ctx.moveTo(fieldPoly[0]!.x, fieldPoly[0]!.y)
  for (let i = 1; i < fieldPoly.length; i++) {
    const p = fieldPoly[i]!
    ctx.lineTo(p.x, p.y)
  }
  ctx.closePath()
  ctx.fill()

  drawGrid(ctx, tf)
  drawViewportFixedRulers(ctx, canvas, tf)

  const parsedAngles = parseSafetyAngles(safetyAnglesText)
  const startPosProp = props.find((p) => p.type === 'startPosition')
  if (parsedAngles && startPosProp) {
    drawSafetyZone(ctx, tf, startPosProp.position, parsedAngles)
  }

  const propFaceDepth = (p: Prop) => {
    if (p.type === 'faultLine')
      return { face: 'rgba(249, 115, 22, 0.72)', depth: 'rgba(194, 65, 12, 0.78)' }
    if (p.type === 'door') return { face: 'rgba(92, 64, 51, 0.88)', depth: 'rgba(25, 25, 28, 0.9)' }
    if (
      p.type === 'shield' ||
      p.type === 'shieldDouble' ||
      isShieldWithPortFamily(p.type)
    )
      return { face: 'rgba(198, 236, 212, 0.46)', depth: 'rgba(25, 25, 28, 0.9)' }
    if (p.type === 'barrel') return { face: 'rgba(29, 78, 216, 0.92)', depth: 'rgba(30, 58, 138, 0.96)' }
    if (p.type === 'tireStack') return { face: 'rgba(30, 41, 59, 0.92)', depth: 'rgba(15, 23, 42, 0.96)' }
    if (p.type === 'seesaw') return { face: 'rgba(196, 160, 118, 0.88)', depth: 'rgba(25, 25, 28, 0.9)' }
    if (p.type === 'movingPlatform')
      return { face: 'rgba(185, 190, 200, 0.52)', depth: 'rgba(25, 25, 28, 0.9)' }
    if (p.type === 'cooperTunnel')
      return { face: 'rgba(185, 170, 140, 0.62)', depth: 'rgba(25, 25, 28, 0.9)' }
    return { face: 'rgba(148, 163, 184, 0.94)', depth: 'rgba(71, 85, 105, 0.9)' }
  }

  const traceLoop = (corners: Vec2[], ox: number, oy: number) => {
    const a = corners[0]!
    ctx.moveTo(a.x + ox, a.y + oy)
    for (let i = 1; i < corners.length; i++) {
      const c = corners[i]!
      ctx.lineTo(c.x + ox, c.y + oy)
    }
    ctx.closePath()
  }

  for (const p of props) {
    const outline = propOutlineWorld(p)
    const corners = outline.map((q) => worldToScreen(q.x, q.y, tf))
    const { face, depth } = propFaceDepth(p)
    const { dx, dy } = EXTRUDE_SCREEN_PX

    if (p.type === 'shield' || p.type === 'shieldDouble' || isShieldWithPortFamily(p.type) || p.type === 'door') {
      drawShieldPlan2D(ctx, p, tf)
      continue
    }
    if (p.type === 'seesaw') {
      drawSeesawPlan2D(ctx, p, tf)
      continue
    }
    if (p.type === 'movingPlatform') {
      drawMovingPlatformPlan2D(ctx, p, tf)
      continue
    }
    if (p.type === 'cooperTunnel') {
      drawCooperTunnelPlan2D(ctx, p, tf)
      continue
    }
    if (p.type === 'startPosition') {
      drawStartPositionPlan2D(ctx, p, tf)
      continue
    }

    ctx.beginPath()
    traceLoop(corners, dx, dy)
    ctx.fillStyle = depth
    ctx.fill()

    ctx.beginPath()
    traceLoop(corners, 0, 0)
    ctx.fillStyle = face
    ctx.fill()
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.45)'
    ctx.lineWidth = 1.5
    ctx.stroke()

    if (p.type === 'tireStack') {
      const c = worldToScreen(p.position.x, p.position.y, tf)
      const rPx = (Math.min(p.sizeM.x, p.sizeM.y) / 2) * tf.pxPerMeter
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.65)'
      ctx.lineWidth = 1
      for (let k = 1; k <= 3; k++) {
        const rk = (k / 4) * rPx
        ctx.beginPath()
        ctx.ellipse(c.x, c.y, rk, rk, 0, 0, Math.PI * 2)
        ctx.stroke()
      }
    }
  }

  for (const g of targetsDrawOrder(targets)) {
    const { boundsR } = targetFootprintWorld(g)
    const c = worldToScreen(g.position.x, g.position.y, tf)
    const minPx = Math.max(MIN_DRAW_MIN_PX, boundsR * tf.pxPerMeter * 0.35)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.12)'
    ctx.beginPath()
    ctx.ellipse(c.x, c.y + minPx * 0.42, minPx * 1.05, minPx * 0.34, 0, 0, Math.PI * 2)
    ctx.fill()

    const swSpec = swinger2DDrawSpecWorld(g)
    const ped = swSpec ? null : targetMetalPedestalWorld(g)
    if (ped && ped.length >= 3) {
      const ps = ped.map((p) => worldToScreen(p.x, p.y, tf))
      ctx.beginPath()
      tracePolygonScreen(ctx, ps)
      ctx.fillStyle = 'rgba(55, 42, 32, 0.88)'
      ctx.fill()
      ctx.strokeStyle = 'rgba(28, 22, 18, 0.55)'
      ctx.lineWidth = 1
      ctx.stroke()
    }

    const stroke = g.isNoShoot ? 'rgba(127,29,29,0.88)' : 'rgba(15,23,42,0.5)'
    const popSpec = swSpec ? null : popper2DDrawSpec(g)
    if (swSpec) {
      drawSwinger2D(ctx, g, tf, swSpec, stroke, 2)
    } else if (popSpec) {
      drawPopper2D(ctx, g, tf, popSpec, stroke, 2)
    } else {
      const fill = targetFill(g.type, g.isNoShoot)
      drawTargetShape(ctx, g, tf, fill, stroke, 2)
    }

    if (g.isNoShoot) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      if (swSpec) {
        const lc = worldToScreen(swSpec.labelWorld.x, swSpec.labelWorld.y, tf)
        const fontPx = Math.max(8, Math.min(22, Math.round(0.14 * tf.pxPerMeter)))
        ctx.font = `bold ${fontPx}px system-ui, sans-serif`
        ctx.fillText('NS', lc.x, lc.y)
      } else if (popSpec) {
        const hc = worldToScreen(popSpec.headCenterWorld.x, popSpec.headCenterWorld.y, tf)
        const headRpx = Math.max(3, popSpec.headRadiusM * tf.pxPerMeter)
        const fontPx = Math.max(6, Math.min(20, Math.round(headRpx * 0.72)))
        ctx.font = `bold ${fontPx}px system-ui, sans-serif`
        ctx.fillText('NS', hc.x, hc.y)
      } else {
        ctx.font = `${Math.max(11, Math.round(minPx * 0.75))}px system-ui, sans-serif`
        ctx.fillText('NS', c.x, c.y)
      }
    }

    if (parsedAngles && startPosProp && !isTargetInSafetyZone(g.position, startPosProp.position, parsedAngles)) {
      const poly = targetRenderPolygonWorld(g)
      if (poly.length > 0) {
        const scr = poly.map((pt) => worldToScreen(pt.x, pt.y, tf))
        ctx.save()
        ctx.strokeStyle = 'rgba(220, 38, 38, 0.85)'
        ctx.lineWidth = 3
        ctx.setLineDash([5, 3])
        ctx.beginPath()
        ctx.moveTo(scr[0]!.x, scr[0]!.y)
        for (let k = 1; k < scr.length; k++) ctx.lineTo(scr[k]!.x, scr[k]!.y)
        ctx.closePath()
        ctx.stroke()
        ctx.setLineDash([])

        ctx.fillStyle = 'rgba(220, 38, 38, 0.88)'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'bottom'
        const fontPx = Math.max(9, Math.min(14, Math.round(0.12 * tf.pxPerMeter)))
        ctx.font = `bold ${fontPx}px system-ui, sans-serif`
        ctx.fillText('⚠', c.x, c.y - minPx * 0.6)
        ctx.restore()
      }
    }
  }

  drawPlanSelectOutlines(ctx, tf, targets, props, planSelect)

  if (marqueeScreen) {
    const { x1, y1, x2, y2 } = marqueeScreen
    const l = Math.min(x1, x2)
    const r = Math.max(x1, x2)
    const t = Math.min(y1, y2)
    const b = Math.max(y1, y2)
    ctx.save()
    ctx.fillStyle = 'rgba(79, 70, 229, 0.1)'
    ctx.strokeStyle = 'rgba(79, 70, 229, 0.55)'
    ctx.lineWidth = 1
    ctx.fillRect(l, t, r - l, b - t)
    ctx.strokeRect(l, t, r - l, b - t)
    ctx.restore()
  }

  const measureLabel =
    measureA && measureB
      ? formatMeasureDistance(Math.hypot(measureB.x - measureA.x, measureB.y - measureA.y))
      : null
  drawMeasureOverlay(ctx, tf, measureA, measureB, measureLabel)

  if (gridHoverSnapped && viewZoom > 1.001) {
    drawGridSnapCursor(ctx, tf, gridHoverSnapped)
  }
}

export type StageCanvasProps = {
  targets: readonly Target[]
  props: readonly Prop[]
  onMoveTarget: (id: string, position: { x: number; y: number }) => void
  onMoveProp: (id: string, position: { x: number; y: number }) => void
  onRotateTarget: (id: string, rotationRad: number) => void
  onRotateProp: (id: string, rotationRad: number) => void
  onSetPropGeometry: (id: string, position: { x: number; y: number }, sizeM: { x: number; y: number }) => void
  onDeleteTarget: (id: string) => void
  onDeleteProp: (id: string) => void
  onSetTargetMetalRectSideCm: (id: string, cm: MetalPlateRectSideCm) => void
  /** Під час панорами/зуму — межі видимого фрагменту поля в метрах (для міні-карти). */
  onViewportWorldChange?: (rect: WorldViewportRect) => void
  /** Режим вимірювання відстані (два кліки на плані). */
  measureToolActive: boolean
  /** Формат підпису відстані (м), напр. «12,34 м». */
  formatMeasureDistance: (meters: number) => string
  /** Режим розстановки з тулбару: клік по полю ставить об’єкт (без hit-test). */
  placementArmed: boolean
  onPlacementWorldClick: (world: { x: number; y: number }) => void
  /** Рамка виділення: ЛКМ-тягнення; центр об’єкта всередині прямокутника. */
  marqueeModeActive: boolean
  onPlanSelectionChange?: (summary: { empty: boolean; count: number }) => void
}

export type StageCanvasHandle = {
  /** Центр поточного виду плану в метрах; null якщо канвас ще не готовий. */
  getSpawnCenterWorld: () => { x: number; y: number } | null
  /** Центрує вид на світовій точці (м); при масштабі 1 трохи наближає. координати площадки. */
  centerOnWorldPoint: (worldX: number, worldY: number) => void
  /** Скидає точки вимірювання (виклик з App при вимкненні режиму). */
  clearMeasure: () => void
  /** Знімок виділених сутностей для копіювання (глибокі копії). */
  getSelectionForCopy: () => { targets: Target[]; props: Prop[] } | null
}

const MINIMAP_NAV_ZOOM = 1.42

function viewportRectsClose(a: WorldViewportRect, b: WorldViewportRect, eps = 1e-4): boolean {
  return (
    Math.abs(a.minX - b.minX) < eps &&
    Math.abs(a.maxX - b.maxX) < eps &&
    Math.abs(a.minY - b.minY) < eps &&
    Math.abs(a.maxY - b.maxY) < eps
  )
}

export const StageCanvas = forwardRef<StageCanvasHandle, StageCanvasProps>(function StageCanvas(
  {
  targets,
  props,
  onMoveTarget,
  onMoveProp,
  onRotateTarget,
  onRotateProp,
  onSetPropGeometry,
  onDeleteTarget,
  onDeleteProp,
  onSetTargetMetalRectSideCm,
  onViewportWorldChange,
  measureToolActive,
  formatMeasureDistance,
  placementArmed,
  onPlacementWorldClick,
  marqueeModeActive,
  onPlanSelectionChange,
}: StageCanvasProps,
  ref,
) {
  const fieldSizeM = useStageStore((s) => s.fieldSizeM)
  const fw = fieldSizeM.x
  const fh = fieldSizeM.y
  const faultLineMaxLenM = () => Math.max(fw, fh) * 4
  const safetyAnglesText = useBriefingStore((s) => s.safetyAngles)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const transformRef = useRef<ViewTransform>({
    pxPerMeter: 1,
    padX: 0,
    padY: 0,
    fieldWidthM: DEFAULT_FIELD_WIDTH_M,
    fieldHeightM: DEFAULT_FIELD_HEIGHT_M,
  })
  const dragRef = useRef<DragMode | null>(null)
  const viewZoomRef = useRef(1)
  const viewPanRef = useRef({ x: 0, y: 0 })
  const lastCanvasCssRef = useRef<{ w: number; h: number } | null>(null)
  const pinchMapRef = useRef(new Map<number, { x: number; y: number }>())
  const pinchLastDistRef = useRef(0)
  /** Вузол сітки (світ) під курсором при zoom > 1; оновлюється в onPointerMove без перетягування. */
  const gridHoverRef = useRef<Vec2 | null>(null)
  const viewPanDragRef = useRef<ViewPanDragState | null>(null)
  /** ЛКМ по порожньому полю при zoom: очікування руху — або скасування виділення, або панорама. */
  const pendingEmptyPanRef = useRef<PendingEmptyPan | null>(null)
  const [planSelect, setPlanSelect] = useState<PlanSelectState>({ mode: 'none' })
  const planSelectRef = useRef<PlanSelectState>({ mode: 'none' })
  useEffect(() => {
    planSelectRef.current = planSelect
  }, [planSelect])

  const marqueeDragRef = useRef<MarqueeDragState | null>(null)

  useEffect(() => {
    const c =
      planSelect.mode === 'none'
        ? 0
        : planSelect.mode === 'single'
          ? 1
          : planSelect.targetIds.length + planSelect.propIds.length
    onPlanSelectionChange?.({ empty: c === 0, count: c })
  }, [planSelect, onPlanSelectionChange])
  const [spaceHeld, setSpaceHeld] = useState(false)
  const [isPanningView, setIsPanningView] = useState(false)
  const [measurePoints, setMeasurePoints] = useState<{ a: Vec2 | null; b: Vec2 | null }>({
    a: null,
    b: null,
  })
  const lastReportedViewportRef = useRef<WorldViewportRect | null>(null)
  const onViewportWorldChangeRef = useRef(onViewportWorldChange)
  useEffect(() => {
    onViewportWorldChangeRef.current = onViewportWorldChange
  }, [onViewportWorldChange])

  const repaint = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = Math.max(1, Math.floor(rect.width * dpr))
    canvas.height = Math.max(1, Math.floor(rect.height * dpr))

    const prev = lastCanvasCssRef.current
    if (prev && (prev.w !== rect.width || prev.h !== rect.height)) {
      viewZoomRef.current = 1
      viewPanRef.current = { x: 0, y: 0 }
    }
    lastCanvasCssRef.current = { w: rect.width, h: rect.height }

    transformRef.current = buildStageViewTransform(
      rect.width,
      rect.height,
      viewZoomRef.current,
      viewPanRef.current,
      fw,
      fh,
    )
    const ctx = canvas.getContext('2d')
    const mA = measureToolActive ? measurePoints.a : null
    const mB = measureToolActive ? measurePoints.b : null
    const md = marqueeDragRef.current
    const marqueeScreen = md
      ? { x1: md.startSx, y1: md.startSy, x2: md.curSx, y2: md.curSy }
      : null
    if (ctx)
      redraw(
        ctx,
        canvas,
        transformRef.current,
        targets,
        props,
        planSelect,
        marqueeScreen,
        gridHoverRef.current,
        viewZoomRef.current,
        safetyAnglesText,
        mA,
        mB,
        formatMeasureDistance,
      )

    const t = transformRef.current
    const vp = computeWorldViewportRect(rect.width, rect.height, t)
    const prevVp = lastReportedViewportRef.current
    if (!prevVp || !viewportRectsClose(prevVp, vp)) {
      lastReportedViewportRef.current = vp
      onViewportWorldChangeRef.current?.(vp)
    }
  }, [
    targets,
    props,
    planSelect,
    fw,
    fh,
    safetyAnglesText,
    measurePoints.a,
    measurePoints.b,
    measureToolActive,
    formatMeasureDistance,
  ])

  useImperativeHandle(
    ref,
    () => ({
      getSpawnCenterWorld: () => {
        const canvas = canvasRef.current
        if (!canvas) return null
        const rect = canvas.getBoundingClientRect()
        if (rect.width < 2 || rect.height < 2) return null
        const t = transformRef.current
        if (t.fieldWidthM !== fw || t.fieldHeightM !== fh) return null
        return spawnCenterWorldFromView(rect.width, rect.height, t)
      },
      centerOnWorldPoint: (worldX: number, worldY: number) => {
        const canvas = canvasRef.current
        if (!canvas) return
        const rect = canvas.getBoundingClientRect()
        const cssW = rect.width
        const cssH = rect.height
        if (cssW < 2 || cssH < 2) return
        const cx = Math.min(Math.max(worldX, 0), fw)
        const cy = Math.min(Math.max(worldY, 0), fh)
        const z = viewZoomRef.current
        if (z <= 1.001) {
          const { zoom, pan } = applyZoomAtWorldPoint(
            cssW,
            cssH,
            cssW * 0.5,
            cssH * 0.5,
            { x: cx, y: cy },
            MINIMAP_NAV_ZOOM,
            fw,
            fh,
          )
          viewZoomRef.current = zoom
          viewPanRef.current = pan
        } else {
          viewPanRef.current = panCssToCenterWorldPoint(cssW, cssH, cx, cy, z, fw, fh)
        }
        gridHoverRef.current = null
        repaint()
      },
      clearMeasure: () => {
        setMeasurePoints({ a: null, b: null })
      },
      getSelectionForCopy: () => {
        const ps = planSelectRef.current
        const { targets: ts, props: ps2 } = useStageStore.getState()
        return snapshotEntitiesForCopy(ps, ts, ps2)
      },
    }),
    [fw, fh, repaint],
  )

  const prevFieldWH = useRef<{ w: number; h: number } | null>(null)
  useEffect(() => {
    const p = prevFieldWH.current
    prevFieldWH.current = { w: fw, h: fh }
    if (!p || (p.w === fw && p.h === fh)) return
    viewZoomRef.current = 1
    viewPanRef.current = { x: 0, y: 0 }
    gridHoverRef.current = null
    repaint()
  }, [fw, fh, repaint])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    repaint()
    const ro = new ResizeObserver(() => repaint())
    ro.observe(canvas)

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const r = canvas.getBoundingClientRect()
      const sx = e.clientX - r.left
      const sy = e.clientY - r.top
      const { zoom, pan } = wheelZoomAdjust(
        r.width,
        r.height,
        sx,
        sy,
        viewZoomRef.current,
        viewPanRef.current,
        e.deltaY,
        fw,
        fh,
      )
      viewZoomRef.current = zoom
      viewPanRef.current = zoom <= 1.001 ? { x: 0, y: 0 } : pan
      if (zoom <= 1.001) gridHoverRef.current = null
      repaint()
    }
    canvas.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      ro.disconnect()
      canvas.removeEventListener('wheel', onWheel)
    }
  }, [repaint, fw, fh])

  useEffect(() => {
    const inFormField = (t: EventTarget | null) =>
      t instanceof HTMLElement && t.closest('input, textarea, select, [contenteditable="true"]') !== null

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        if (e.repeat) return
        if (inFormField(e.target)) return
        if (
          measureToolActive &&
          (measurePoints.a !== null || measurePoints.b !== null)
        ) {
          e.preventDefault()
          setMeasurePoints({ a: null, b: null })
          return
        }
      }
      if (e.code === 'Delete' || e.code === 'Backspace') {
        if (e.repeat) return
        if (inFormField(e.target)) return
        const ps = planSelectRef.current
        if (ps.mode === 'none') return
        e.preventDefault()
        if (ps.mode === 'multi') {
          for (const id of ps.targetIds) onDeleteTarget(id)
          for (const id of ps.propIds) onDeleteProp(id)
        } else if (ps.mode === 'single') {
          if (ps.kind === 'target') onDeleteTarget(ps.id)
          else onDeleteProp(ps.id)
        }
        setPlanSelect({ mode: 'none' })
        return
      }
      if (e.code === 'BracketLeft' || e.code === 'BracketRight') {
        if (e.repeat) return
        if (inFormField(e.target)) return
        const ps = planSelectRef.current
        if (ps.mode !== 'single' || ps.kind !== 'target') return
        const hit = targets.find((x) => x.id === ps.id)
        if (!hit || !isSquareSteelPlateTargetType(hit.type)) return
        e.preventDefault()
        const order: readonly MetalPlateRectSideCm[] = [15, 20, 30]
        const cur = hit.metalRectSideCm ?? 30
        const idx = order.indexOf(cur)
        const i = idx >= 0 ? idx : 0
        const next = e.code === 'BracketRight' ? order[(i + 1) % 3]! : order[(i + 2) % 3]!
        onSetTargetMetalRectSideCm(ps.id, next)
        return
      }
      if (e.code !== 'Space' || e.repeat) return
      if (inFormField(e.target)) return
      e.preventDefault()
      setSpaceHeld(true)
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') setSpaceHeld(false)
    }
    const onBlur = () => setSpaceHeld(false)
    window.addEventListener('keydown', onKeyDown, { passive: false })
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [
    onDeleteTarget,
    onDeleteProp,
    onSetTargetMetalRectSideCm,
    targets,
    measurePoints.a,
    measurePoints.b,
    measureToolActive,
  ])

  useEffect(() => {
    repaint()
  }, [measurePoints, repaint])

  useEffect(() => {
    if (!marqueeModeActive) {
      marqueeDragRef.current = null
      repaint()
    }
  }, [marqueeModeActive, repaint])

  const beginViewPan = (ev: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    pendingEmptyPanRef.current = null
    gridHoverRef.current = null
    viewPanDragRef.current = {
      pointerId: ev.pointerId,
      startClientX: ev.clientX,
      startClientY: ev.clientY,
      startPanX: viewPanRef.current.x,
      startPanY: viewPanRef.current.y,
    }
    setIsPanningView(true)
    try {
      canvas.setPointerCapture(ev.pointerId)
    } catch {
      /* ignore */
    }
  }

  const onPointerDown = (ev: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const sx = ev.clientX - rect.left
    const sy = ev.clientY - rect.top

    if (ev.button === 1) {
      ev.preventDefault()
      beginViewPan(ev)
      return
    }

    if (spaceHeld && ev.button === 0) {
      ev.preventDefault()
      beginViewPan(ev)
      return
    }

    const w = screenToWorld(sx, sy, transformRef.current)

    if (measureToolActive && ev.button === 0) {
      ev.preventDefault()
      const wx = Math.min(Math.max(w.x, 0), fw)
      const wy = Math.min(Math.max(w.y, 0), fh)
      const p = { x: wx, y: wy }
      pendingEmptyPanRef.current = null
      gridHoverRef.current = null
      setPlanSelect({ mode: 'none' })
      setMeasurePoints((prev) => {
        if (!prev.a) return { a: p, b: null }
        if (!prev.b) return { a: prev.a, b: p }
        return { a: p, b: null }
      })
      return
    }

    if (placementArmed && ev.button === 0) {
      ev.preventDefault()
      pendingEmptyPanRef.current = null
      gridHoverRef.current = null
      const wx = Math.min(Math.max(w.x, 0), fw)
      const wy = Math.min(Math.max(w.y, 0), fh)
      onPlacementWorldClick({ x: wx, y: wy })
      return
    }

    if (marqueeModeActive && ev.button === 0) {
      ev.preventDefault()
      pendingEmptyPanRef.current = null
      gridHoverRef.current = null
      pinchMapRef.current.clear()
      marqueeDragRef.current = {
        pointerId: ev.pointerId,
        startSx: sx,
        startSy: sy,
        curSx: sx,
        curSy: sy,
      }
      try {
        canvas.setPointerCapture(ev.pointerId)
      } catch {
        /* ignore */
      }
      repaint()
      return
    }

    pinchMapRef.current.set(ev.pointerId, { x: sx, y: sy })
    if (pinchMapRef.current.size === 2) {
      pendingEmptyPanRef.current = null
      gridHoverRef.current = null
      dragRef.current = null
      pinchLastDistRef.current = 0
      try {
        canvas.setPointerCapture(ev.pointerId)
      } catch {
        /* ignore */
      }
      return
    }

    const ppm = transformRef.current.pxPerMeter
    const touchPad = TOUCH_PICK_MIN_PX / Math.max(ppm, 1e-6)

    if (planSelect.mode === 'single' && planSelect.kind === 'prop') {
      const selP = props.find((x) => x.id === planSelect.id)
      if (selP?.type === 'faultLine') {
        const hwFl = handleWorldPosProp(selP)
        if (pickHandle(w.x, w.y, hwFl, ppm)) {
          gridHoverRef.current = null
          dragRef.current = { mode: 'rotate', kind: 'prop', id: selP.id }
          canvas.setPointerCapture(ev.pointerId)
          return
        }
        const ends = faultLineEndPointsWorld(selP)
        if (ends && pickFaultStretchNegEnd(w.x, w.y, ends, ppm)) {
          gridHoverRef.current = null
          dragRef.current = { mode: 'stretchFaultLine', id: selP.id, anchor: 'pos' }
          canvas.setPointerCapture(ev.pointerId)
          return
        }
      }
    }

    if (planSelect.mode === 'single') {
      const selT = planSelect.kind === 'target' ? targets.find((x) => x.id === planSelect.id) : undefined
      const selP = planSelect.kind === 'prop' ? props.find((x) => x.id === planSelect.id) : undefined
      const hw =
        planSelect.kind === 'target' && selT
          ? handleWorldPosTarget(selT)
          : planSelect.kind === 'prop' && selP
            ? handleWorldPosProp(selP)
            : null
      if (hw && pickHandle(w.x, w.y, hw, ppm)) {
        gridHoverRef.current = null
        dragRef.current = { mode: 'rotate', kind: planSelect.kind, id: planSelect.id }
        canvas.setPointerCapture(ev.pointerId)
        return
      }
    }

    const hitT = pickTargetAt(targets, w.x, w.y, touchPad)
    if (hitT) {
      gridHoverRef.current = null
      setPlanSelect({ mode: 'single', kind: 'target', id: hitT.id })
      dragRef.current = {
        mode: 'move',
        kind: 'target',
        id: hitT.id,
        grabOffset: { x: w.x - hitT.position.x, y: w.y - hitT.position.y },
      }
      canvas.setPointerCapture(ev.pointerId)
      return
    }
    const hitP = pickPropAt(props, w.x, w.y, touchPad)
    if (hitP) {
      gridHoverRef.current = null
      setPlanSelect({ mode: 'single', kind: 'prop', id: hitP.id })
      dragRef.current = {
        mode: 'move',
        kind: 'prop',
        id: hitP.id,
        grabOffset: { x: w.x - hitP.position.x, y: w.y - hitP.position.y },
      }
      canvas.setPointerCapture(ev.pointerId)
      return
    }

    if (viewZoomRef.current > 1.001) {
      pendingEmptyPanRef.current = {
        pointerId: ev.pointerId,
        clientX: ev.clientX,
        clientY: ev.clientY,
      }
    } else {
      setPlanSelect({ mode: 'none' })
    }
  }

  const onPointerMove = (ev: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const sx = ev.clientX - rect.left
    const sy = ev.clientY - rect.top

    const mq = marqueeDragRef.current
    if (mq && ev.pointerId === mq.pointerId) {
      mq.curSx = sx
      mq.curSy = sy
      repaint()
      return
    }

    if (pinchMapRef.current.has(ev.pointerId)) {
      pinchMapRef.current.set(ev.pointerId, { x: sx, y: sy })
    }

    const pd = viewPanDragRef.current
    if (pd && ev.pointerId === pd.pointerId) {
      viewPanRef.current = {
        x: pd.startPanX + (ev.clientX - pd.startClientX),
        y: pd.startPanY + (ev.clientY - pd.startClientY),
      }
      transformRef.current = buildStageViewTransform(
        rect.width,
        rect.height,
        viewZoomRef.current,
        viewPanRef.current,
        fw,
        fh,
      )
      gridHoverRef.current = null
      repaint()
      return
    }

    const pend = pendingEmptyPanRef.current
    if (
      pend &&
      ev.pointerId === pend.pointerId &&
      !dragRef.current &&
      viewZoomRef.current > 1.001
    ) {
      const d = Math.hypot(ev.clientX - pend.clientX, ev.clientY - pend.clientY)
      if (d > EMPTY_PAN_THRESHOLD_PX) {
        viewPanDragRef.current = {
          pointerId: ev.pointerId,
          startClientX: ev.clientX,
          startClientY: ev.clientY,
          startPanX: viewPanRef.current.x,
          startPanY: viewPanRef.current.y,
        }
        pendingEmptyPanRef.current = null
        try {
          canvas.setPointerCapture(ev.pointerId)
        } catch {
          /* ignore */
        }
        gridHoverRef.current = null
        setIsPanningView(true)
        repaint()
        return
      }
    }

    if (pinchMapRef.current.size >= 2) {
      const pts = [...pinchMapRef.current.values()]
      const a = pts[0]!
      const b = pts[1]!
      const d = Math.hypot(a.x - b.x, a.y - b.y)
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      if (pinchLastDistRef.current > 1 && d > 1) {
        const scale = d / pinchLastDistRef.current
        const world = screenToWorld(mid.x, mid.y, transformRef.current)
        const zNew = viewZoomRef.current * scale
        const { zoom, pan } = applyZoomAtWorldPoint(
          rect.width,
          rect.height,
          mid.x,
          mid.y,
          world,
          zNew,
          fw,
          fh,
        )
        viewZoomRef.current = zoom
        viewPanRef.current = pan
        transformRef.current = buildStageViewTransform(
          rect.width,
          rect.height,
          viewZoomRef.current,
          viewPanRef.current,
          fw,
          fh,
        )
        gridHoverRef.current = null
        repaint()
      }
      pinchLastDistRef.current = d
      return
    }

    const drag = dragRef.current
    if (!drag) {
      if (viewZoomRef.current > 1.001) {
        const wHover = screenToWorld(sx, sy, transformRef.current)
        let nextHover: Vec2 | null = null
        if (wHover.x >= 0 && wHover.x <= fw && wHover.y >= 0 && wHover.y <= fh) {
          nextHover = snapVec2(clampVec2ToField(wHover, 0, fw, fh))
        }
        const prev = gridHoverRef.current
        const changed =
          (prev === null) !== (nextHover === null) ||
          (prev &&
            nextHover &&
            (prev.x !== nextHover.x || prev.y !== nextHover.y))
        if (changed) {
          gridHoverRef.current = nextHover
          repaint()
        }
      } else if (gridHoverRef.current) {
        gridHoverRef.current = null
        repaint()
      }
      return
    }
    const w = screenToWorld(sx, sy, transformRef.current)

    if (drag.mode === 'rotate') {
      const ent =
        drag.kind === 'target'
          ? targets.find((x) => x.id === drag.id)
          : drag.kind === 'prop'
            ? useStageStore.getState().props.find((x) => x.id === drag.id)
            : undefined
      if (!ent) return
      if (drag.kind === 'prop' && ent.type === 'faultLine') {
        const pose = faultLinePoseForRotateAboutNegEnd(ent, w)
        if (pose) {
          onMoveProp(drag.id, pose.position)
          onRotateProp(drag.id, pose.rotationRad)
        }
        return
      }
      const ang = Math.atan2(w.y - ent.position.y, w.x - ent.position.x)
      if (drag.kind === 'target') onRotateTarget(drag.id, ang)
      else onRotateProp(drag.id, ang)
      return
    }

    if (drag.mode === 'stretchFaultLine') {
      const pr = props.find((p) => p.id === drag.id)
      if (!pr || pr.type !== 'faultLine') return
      const maxL = faultLineMaxLenM()
      const geo = faultLineGeometryAfterStretch(pr, w, drag.anchor, maxL)
      const margin = geo.sizeM.x / 2 + geo.sizeM.y / 2 + PICK_MARGIN_M
      const c = clampVec2ToField(geo.position, margin, fw, fh)
      onSetPropGeometry(drag.id, c, geo.sizeM)
      return
    }

    const next = { x: w.x - drag.grabOffset.x, y: w.y - drag.grabOffset.y }
    const pr = props.find((p) => p.id === drag.id)
    const tgt = targets.find((t) => t.id === drag.id)
    let margin = 1
    if (drag.kind === 'target' && tgt) margin = targetFootprintWorld(tgt).boundsR + PICK_MARGIN_M
    else if (drag.kind === 'prop') margin = edgeMarginForPropMove(pr?.sizeM ?? { x: 1, y: 1 })
    const clamped = clampVec2ToField(next, margin, fw, fh)
    if (drag.kind === 'target')
      onMoveTarget(drag.id, snapVec2(clamped, TARGET_PLACEMENT_SNAP_M))
    else onMoveProp(drag.id, snapVec2(clamped, PROP_PLACEMENT_SNAP_M))
  }

  const endDrag = (ev: PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    pinchMapRef.current.delete(ev.pointerId)
    if (pinchMapRef.current.size < 2) pinchLastDistRef.current = 0

    if (viewPanDragRef.current?.pointerId === ev.pointerId) {
      viewPanDragRef.current = null
      setIsPanningView(false)
      try {
        canvas?.releasePointerCapture(ev.pointerId)
      } catch {
        /* ignore */
      }
      return
    }

    if (pendingEmptyPanRef.current?.pointerId === ev.pointerId) {
      pendingEmptyPanRef.current = null
      setPlanSelect({ mode: 'none' })
      return
    }

    const mqd = marqueeDragRef.current
    if (mqd && mqd.pointerId === ev.pointerId) {
      marqueeDragRef.current = null
      const dx = Math.abs(mqd.curSx - mqd.startSx)
      const dy = Math.abs(mqd.curSy - mqd.startSy)
      try {
        canvas?.releasePointerCapture(ev.pointerId)
      } catch {
        /* ignore */
      }
      if (dx < 4 && dy < 4) {
        setPlanSelect({ mode: 'none' })
        repaint()
        return
      }
      const l = Math.min(mqd.startSx, mqd.curSx)
      const r = Math.max(mqd.startSx, mqd.curSx)
      const t = Math.min(mqd.startSy, mqd.curSy)
      const b = Math.max(mqd.startSy, mqd.curSy)
      const tf = transformRef.current
      const w1 = screenToWorld(l, t, tf)
      const w2 = screenToWorld(r, b, tf)
      const minX = Math.min(w1.x, w2.x)
      const maxX = Math.max(w1.x, w2.x)
      const minY = Math.min(w1.y, w2.y)
      const maxY = Math.max(w1.y, w2.y)
      const { targetIds, propIds } = collectIdsInWorldRect(targets, props, minX, maxX, minY, maxY)
      if (targetIds.length === 0 && propIds.length === 0) {
        setPlanSelect({ mode: 'none' })
      } else {
        setPlanSelect({ mode: 'multi', targetIds, propIds })
      }
      repaint()
      return
    }

    const drag = dragRef.current
    if (!canvas || !drag) {
      try {
        canvas?.releasePointerCapture(ev.pointerId)
      } catch {
        /* ignore */
      }
      return
    }

    if (drag.mode === 'rotate') {
      const rect = canvas.getBoundingClientRect()
      const sx = ev.clientX - rect.left
      const sy = ev.clientY - rect.top
      const w = screenToWorld(sx, sy, transformRef.current)
      const ent =
        drag.kind === 'target'
          ? targets.find((x) => x.id === drag.id)
          : drag.kind === 'prop'
            ? useStageStore.getState().props.find((x) => x.id === drag.id)
            : undefined
      if (ent) {
        if (drag.kind === 'prop' && ent.type === 'faultLine') {
          const ends = faultLineEndPointsWorld(ent)
          if (ends) {
            const L = ent.sizeM.x
            const { neg: pivot } = ends
            const rawAng = Math.atan2(w.y - pivot.y, w.x - pivot.x)
            const snapped = snapAngleRad(rawAng)
            const c = {
              x: pivot.x + Math.cos(snapped) * (L / 2),
              y: pivot.y + Math.sin(snapped) * (L / 2),
            }
            const margin = L / 2 + ent.sizeM.y / 2 + PICK_MARGIN_M
            onMoveProp(drag.id, snapVec2(clampVec2ToField(c, margin, fw, fh), PROP_PLACEMENT_SNAP_M))
            onRotateProp(drag.id, snapped)
          }
        } else {
          const ang = Math.atan2(w.y - ent.position.y, w.x - ent.position.x)
          const snapped = snapAngleRad(ang)
          if (drag.kind === 'target') onRotateTarget(drag.id, snapped)
          else onRotateProp(drag.id, snapped)
        }
      }
    } else if (drag.mode === 'stretchFaultLine') {
      const pr = props.find((p) => p.id === drag.id)
      if (pr?.type === 'faultLine') {
        const maxL = faultLineMaxLenM()
        const L = Math.max(FAULT_LINE_SECTION_M, snapMeters(pr.sizeM.x))
        const geo = faultLineWithLength(pr, L, drag.anchor, maxL)
        const margin = geo.sizeM.x / 2 + geo.sizeM.y / 2 + PICK_MARGIN_M
        const c = snapVec2(clampVec2ToField(geo.position, margin, fw, fh))
        onSetPropGeometry(drag.id, c, geo.sizeM)
      }
    } else {
      const rect = canvas.getBoundingClientRect()
      const sx = ev.clientX - rect.left
      const sy = ev.clientY - rect.top
      const w = screenToWorld(sx, sy, transformRef.current)
      const raw = { x: w.x - drag.grabOffset.x, y: w.y - drag.grabOffset.y }
      const pr = props.find((p) => p.id === drag.id)
      const tgt = targets.find((t) => t.id === drag.id)
      let margin = 1
      if (drag.kind === 'target' && tgt) margin = targetFootprintWorld(tgt).boundsR + PICK_MARGIN_M
      else margin = edgeMarginForPropMove(pr?.sizeM ?? { x: 1, y: 1 })
      const clamped = clampVec2ToField(raw, margin, fw, fh)
      if (drag.kind === 'target')
        onMoveTarget(drag.id, snapVec2(clamped, TARGET_PLACEMENT_SNAP_M))
      else onMoveProp(drag.id, snapVec2(clamped, PROP_PLACEMENT_SNAP_M))
    }

    dragRef.current = null
    try {
      canvas.releasePointerCapture(ev.pointerId)
    } catch {
      /* ignore */
    }
  }

  const onPointerLeave = () => {
    if (gridHoverRef.current) {
      gridHoverRef.current = null
      repaint()
    }
  }

  const canvasCursor = isPanningView
    ? 'grabbing'
    : spaceHeld
      ? 'grab'
      : measureToolActive
        ? 'crosshair'
        : placementArmed
          ? 'crosshair'
          : marqueeModeActive
            ? 'crosshair'
            : undefined

  return (
    <canvas
      ref={canvasRef}
      tabIndex={0}
      className="stage-canvas"
      style={{ cursor: canvasCursor }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    />
  )
})

function edgeMarginForPropMove(sizeM: Prop['sizeM']): number {
  return Math.max(sizeM.x, sizeM.y) / 2 + PICK_MARGIN_M
}
