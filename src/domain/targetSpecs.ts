/**
 * Габарити мішеней у метрах (IPSC / узгоджені додатки).
 *
 * Папір IPSC — зовнішній контур B2 (45×57 см). `paperIpscTwoPostGround` / `Stand50` / `Stand100` — той самий контур, дві стійки; висота нижнього краю лиця як у металу (≈0,1 м / 0,5 м / 1 м). Mini IPSC — B3 номінал 30×37,5 см. A4 — масштаб 1,5× від 210×297 мм.
 * Метал Appendix C3 — квадрат 15/20/30 см; варіанти зі стійкою 50 см / 1 м (низ лиця у 3D). Нова мішень за замовч. 15 см; без поля — 30 см.
 * Керамічна тарілка Ø 110 мм (див. ceramicPlateSpec). Поппери C2.
 */
import type { Target, TargetType } from './models'
import { CERAMIC_RADIUS_M } from './ceramicPlateSpec'
import {
  isSwingerTargetType,
  swingerBoundsRadiusM,
  swingerFootprintHullLocal,
  swingerIsPaperLoad,
} from './swingerGeometry'

const MM = 0.001
/** Додатки B2: координати на кресленні в сантиметрах. */
const CM = 0.01

/** Квадратна сталева пластина (на підлозі або на стійці 50 см / 1 м у 3D). */
export function isSquareSteelPlateTargetType(type: TargetType): boolean {
  return type === 'metalPlate' || type === 'metalPlateStand50' || type === 'metalPlateStand100'
}

/** Паперова IPSC на двох стійках (будь-яка з трьох висот нижнього краю лиця). */
export function isPaperIpscTwoPostTargetType(type: TargetType): boolean {
  return (
    type === 'paperIpscTwoPostGround' ||
    type === 'paperIpscTwoPostStand50' ||
    type === 'paperIpscTwoPostStand100'
  )
}

/**
 * Висота нижнього краю лиця над «землею» у 3D (м), узгоджено з `steelPlateStandHeightM` для металу.
 */
export function paperIpscTwoPostFaceBottomHeightM(type: TargetType): number {
  if (type === 'paperIpscTwoPostGround') return 0.1
  if (type === 'paperIpscTwoPostStand50') return 0.5
  if (type === 'paperIpscTwoPostStand100') return 1.0
  return 1.0
}

function metalPlateSquareSideM(t: Target): number {
  if (!isSquareSteelPlateTargetType(t.type)) return 300 * MM
  /** `metalRectSideCm` у сантиметрах → метри через CM, не MM (інакше 15 см стають 15 мм). */
  return (t.metalRectSideCm ?? 30) * CM
}

/** Коефіцієнт збільшення мішені A4 на плані / у 3D від номіналу аркуша. */
const PAPER_A4_VISUAL_SCALE = 1.5

function paperA4HalfExtentsM(): { hw: number; hh: number } {
  return {
    hw: 210 * MM * 0.5 * PAPER_A4_VISUAL_SCALE,
    hh: 297 * MM * 0.5 * PAPER_A4_VISUAL_SCALE,
  }
}

const STEEL_TARGET_TYPES = new Set<TargetType>([
  'popper',
  'miniPopper',
  'metalPlate',
  'metalPlateStand50',
  'metalPlateStand100',
  'ceramicPlate',
])

const CERAMIC_TARGET_TYPES = new Set<TargetType>([
  'ceramicPlate',
  'swingerSingleCeramic',
  'swingerDoubleCeramic',
])

export function isCeramicTargetType(t: TargetType): boolean {
  return CERAMIC_TARGET_TYPES.has(t)
}

export function isPaperTargetType(t: TargetType): boolean {
  if (isSwingerTargetType(t)) return swingerIsPaperLoad(t)
  return !STEEL_TARGET_TYPES.has(t)
}

type Vec2 = { x: number; y: number }

function diagramToLocalMeters(xd: number, yd: number, cxCm: number, cyCm: number): Vec2 {
  return {
    x: (xd - cxCm) * CM,
    y: (cyCm - yd) * CM,
  }
}

function rectLocal(hw: number, hh: number): Vec2[] {
  return [
    { x: -hw, y: -hh },
    { x: hw, y: -hh },
    { x: hw, y: hh },
    { x: -hw, y: hh },
  ]
}

/** Appendix B2: зовнішній контур (см), вісь Y креслення вниз → local +Y вгору, центр bbox (22,5; 28,5) см. */
function ipscClassicOutlineLocalM(): Vec2[] {
  const cx = 22.5
  const cy = 28.5
  const pts: [number, number][] = [
    [15, 0],
    [30, 0],
    [45, 19],
    [45, 38],
    [30, 57],
    [15, 57],
    [0, 38],
    [0, 19],
  ]
  return pts.map(([xa, ya]) => diagramToLocalMeters(xa, ya, cx, cy))
}

/** Appendix B3 номінал 30×37,5 см — силует як пропорційно стиснутий B2 (45×57 см). */
function ipscMiniOutlineLocalM(): Vec2[] {
  const sx = 30 / 45
  const sy = 37.5 / 57
  return ipscClassicOutlineLocalM().map((p) => ({ x: p.x * sx, y: p.y * sy }))
}

function circleOutlineLocal(r: number, n: number): Vec2[] {
  const out: Vec2[] = []
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    out.push({ x: Math.cos(a) * r, y: Math.sin(a) * r })
  }
  return out
}

function polygonMaxRadiusM(pts: Vec2[]): number {
  let m = 0
  for (const p of pts) m = Math.max(m, Math.hypot(p.x, p.y))
  return m
}

/** Локальний контур у метрах (+Y вгору лиця), до обертання на плані / екструзії в 3D. */
export function targetFootprintLocalM(t: Target): Vec2[] {
  switch (t.type) {
    case 'paperIpsc':
    case 'paperIpscTwoPostGround':
    case 'paperIpscTwoPostStand50':
    case 'paperIpscTwoPostStand100':
      return ipscClassicOutlineLocalM()
    case 'paperMiniIpsc':
      return ipscMiniOutlineLocalM()
    case 'paperA4': {
      const { hw, hh } = paperA4HalfExtentsM()
      return rectLocal(hw, hh)
    }
    case 'popper':
      return rectLocal(300 * MM * 0.5, 850 * MM * 0.5)
    case 'miniPopper':
      return rectLocal(200 * MM * 0.5, 560 * MM * 0.5)
    case 'metalPlate':
    case 'metalPlateStand50':
    case 'metalPlateStand100': {
      const half = metalPlateSquareSideM(t) * 0.5
      return rectLocal(half, half)
    }
    case 'ceramicPlate':
      return circleOutlineLocal(CERAMIC_RADIUS_M, 32)
    case 'swingerSinglePaper':
    case 'swingerDoublePaper':
    case 'swingerSingleCeramic':
    case 'swingerDoubleCeramic':
      return swingerFootprintHullLocal(t)
    default: {
      const _e: never = t.type
      return _e
    }
  }
}

function toWorld(pts: Vec2[], cx: number, cy: number, rot: number): Vec2[] {
  const c = Math.cos(rot)
  const s = Math.sin(rot)
  return pts.map(({ x: lx, y: ly }) => ({
    x: cx + lx * c - ly * s,
    y: cy + lx * s + ly * c,
  }))
}

function localToWorldPoint(lx: number, ly: number, cx: number, cy: number, rot: number): Vec2 {
  const c = Math.cos(rot)
  const s = Math.sin(rot)
  return {
    x: cx + lx * c - ly * s,
    y: cy + lx * s + ly * c,
  }
}

export function targetMetalPedestalWorld(t: Target): Vec2[] | null {
  const loc = targetMetalPedestalLocal(t)
  if (!loc) return null
  const { x: cx, y: cy } = t.position
  const rot = t.rotationRad
  return toWorld(loc, cx, cy, rot)
}

/** Силует поппера C2 у локальних осях: центр bbox = центр мішені, +Y — догори таргета. */
export function popperSilhouetteLocal(isMini: boolean): Vec2[] {
  const h = (isMini ? 560 : 850) * MM
  const r = (isMini ? 100 : 150) * MM
  const wBot = (isMini ? 100 : 150) * MM
  const wJoin = (isMini ? 135 : 200) * MM
  const centerUp = (isMini ? 460 : 700) * MM
  const yBot = -h * 0.5
  const yC = yBot + centerUp
  const chord = wJoin * 0.5
  const dy = Math.sqrt(Math.max(0, r * r - chord * chord))
  const yJoin = yC - dy
  const pts: Vec2[] = [
    { x: -wBot * 0.5, y: yBot },
    { x: wBot * 0.5, y: yBot },
    { x: wJoin * 0.5, y: yJoin },
  ]
  const aR = Math.atan2(yJoin - yC, wJoin * 0.5)
  const aL = Math.atan2(yJoin - yC, -wJoin * 0.5)
  const arcEnd = aL + Math.PI * 2
  const n = 26
  for (let i = 1; i < n; i++) {
    const u = i / n
    const a = aR + (arcEnd - aR) * u
    pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r + yC })
  }
  pts.push({ x: -wJoin * 0.5, y: yJoin })
  return pts
}

/** Многокутник тільки основи поппера (без дуги голови) — для окремого заливання / 3D. */
export function popperBaseOnlyLocal(isMini: boolean): Vec2[] {
  const h = (isMini ? 560 : 850) * MM
  const r = (isMini ? 100 : 150) * MM
  const wBot = (isMini ? 100 : 150) * MM
  const wJoin = (isMini ? 135 : 200) * MM
  const centerUp = (isMini ? 460 : 700) * MM
  const yBot = -h * 0.5
  const yC = yBot + centerUp
  const chord = wJoin * 0.5
  const dy = Math.sqrt(Math.max(0, r * r - chord * chord))
  const yJoin = yC - dy
  return [
    { x: -wBot * 0.5, y: yBot },
    { x: wBot * 0.5, y: yBot },
    { x: wJoin * 0.5, y: yJoin },
    { x: -wJoin * 0.5, y: yJoin },
  ]
}

export function popperHeadCenterLocal(isMini: boolean): Vec2 {
  const h = (isMini ? 560 : 850) * MM
  const centerUp = (isMini ? 460 : 700) * MM
  const yBot = -h * 0.5
  return { x: 0, y: yBot + centerUp }
}

export function popperHeadRadiusM(isMini: boolean): number {
  return (isMini ? 100 : 150) * MM
}

export type Popper2DSpec = {
  outlineWorld: Vec2[]
  baseWorld: Vec2[]
  headCenterWorld: Vec2
  headRadiusM: number
}

export function popper2DDrawSpec(t: Target): Popper2DSpec | null {
  if (t.type !== 'popper' && t.type !== 'miniPopper') return null
  const isMini = t.type === 'miniPopper'
  const { x: cx, y: cy } = t.position
  const rot = t.rotationRad
  return {
    outlineWorld: toWorld(popperSilhouetteLocal(isMini), cx, cy, rot),
    baseWorld: toWorld(popperBaseOnlyLocal(isMini), cx, cy, rot),
    headCenterWorld: localToWorldPoint(popperHeadCenterLocal(isMini).x, popperHeadCenterLocal(isMini).y, cx, cy, rot),
    headRadiusM: popperHeadRadiusM(isMini),
  }
}

/** Контур лиця для 2D/3D (поппер — силует C2; інше — footprint). */
export function targetFaceOutlineLocalM(t: Target): Vec2[] {
  if (t.type === 'popper') return popperSilhouetteLocal(false)
  if (t.type === 'miniPopper') return popperSilhouetteLocal(true)
  if (isSwingerTargetType(t.type)) return swingerFootprintHullLocal(t)
  return targetFootprintLocalM(t)
}

/**
 * Той самий контур, що й targetFaceOutlineLocalM, для типів де він залежить лише від `type`
 * (папір; без свінгерів/поперів/сталі). Для інших повертає null.
 */
export function targetFaceOutlineLocalMForType(type: TargetType): Vec2[] | null {
  if (isSwingerTargetType(type)) return null
  if (
    type === 'popper' ||
    type === 'miniPopper' ||
    type === 'ceramicPlate' ||
    isSquareSteelPlateTargetType(type)
  )
    return null
  if (type === 'paperMiniIpsc') return ipscMiniOutlineLocalM()
  if (type === 'paperIpscTwoPostGround' || type === 'paperIpscTwoPostStand50' || type === 'paperIpscTwoPostStand100') {
    return ipscClassicOutlineLocalM()
  }
  return targetFaceOutlineLocalM({ type } as Target)
}

/** Тонка «підошва» C3 під сталевою/керамічною мішенню на плані (локально під низом лиця). */
export function targetMetalPedestalLocal(t: Target): Vec2[] | null {
  const ph = 0.028
  if (t.type === 'ceramicPlate') {
    const r = targetFaceSizeM(t).w * 0.5
    const pw = Math.min(0.18, r * 1.5)
    const yMid = -r - ph * 0.5
    const hwp = pw * 0.5
    const hhp = ph * 0.5
    return [
      { x: -hwp, y: yMid - hhp },
      { x: hwp, y: yMid - hhp },
      { x: hwp, y: yMid + hhp },
      { x: -hwp, y: yMid + hhp },
    ]
  }
  if (isSquareSteelPlateTargetType(t.type)) {
    const { w, h } = targetFaceSizeM(t)
    const hh = h * 0.5
    const pw = Math.min(w * 0.62, w * 0.9)
    const yMid = -hh - ph * 0.5
    const hwp = pw * 0.5
    const hhp = ph * 0.5
    return [
      { x: -hwp, y: yMid - hhp },
      { x: hwp, y: yMid - hhp },
      { x: hwp, y: yMid + hhp },
      { x: -hwp, y: yMid + hhp },
    ]
  }
  return null
}

/**
 * Два нижні «кути» плоского низу B2 (кінці нижнього ребра) — сюди в 3D прикріплюються стійки.
 * Локальні координати лиця (+Y вгору).
 */
export function paperIpscTwoPostBottomCornerAnchorsLocalM(): Vec2[] {
  const outline = ipscClassicOutlineLocalM()
  let minY = Infinity
  for (const p of outline) minY = Math.min(minY, p.y)
  const eps = 1e-5
  const atBottom = outline.filter((p) => Math.abs(p.y - minY) < eps)
  atBottom.sort((a, b) => a.x - b.x)
  if (atBottom.length >= 2) {
    return [atBottom[0]!, atBottom[atBottom.length - 1]!]
  }
  return [
    { x: -0.075, y: minY },
    { x: 0.075, y: minY },
  ]
}

function quadCentroidLocal(pts: Vec2[]): Vec2 {
  let sx = 0
  let sy = 0
  for (const p of pts) {
    sx += p.x
    sy += p.y
  }
  const n = pts.length
  return { x: sx / n, y: sy / n }
}

/** Дві підошви стійок (локально); центри під кутами нижнього ребра. */
export function paperIpscTwoPostBasesLocalM(): Vec2[][] {
  const anchors = paperIpscTwoPostBottomCornerAnchorsLocalM()
  const ph = 0.028
  const footW = 0.044
  const hwp = footW * 0.5
  const hhp = ph * 0.5
  return anchors.map((a) => {
    const yMid = a.y - ph * 0.5
    return [
      { x: a.x - hwp, y: yMid - hhp },
      { x: a.x + hwp, y: yMid - hhp },
      { x: a.x + hwp, y: yMid + hhp },
      { x: a.x - hwp, y: yMid + hhp },
    ]
  })
}

/**
 * На 2D-плані: від центру кожної підошви до центру мішені — довжина лінії залежить від висоти стійки в 3D.
 */
export function targetPaperTwoPostStickIndicatorsWorld(t: Target): { from: Vec2; to: Vec2 }[] | null {
  if (!isPaperIpscTwoPostTargetType(t.type)) return null
  const bases = paperIpscTwoPostBasesLocalM()
  const h = paperIpscTwoPostFaceBottomHeightM(t.type)
  const planLenM = 0.06 + 0.52 * h
  const { x: cx, y: cy } = t.position
  const rot = t.rotationRad
  const out: { from: Vec2; to: Vec2 }[] = []
  for (const poly of bases) {
    const c = quadCentroidLocal(poly)
    const fromW = localToWorldPoint(c.x, c.y, cx, cy, rot)
    const dx = cx - fromW.x
    const dy = cy - fromW.y
    const dist = Math.hypot(dx, dy) || 1
    const ux = dx / dist
    const uy = dy / dist
    out.push({
      from: fromW,
      to: { x: fromW.x + ux * planLenM, y: fromW.y + uy * planLenM },
    })
  }
  return out
}

export function targetPaperTwoPostBasesWorld(t: Target): Vec2[][] | null {
  if (!isPaperIpscTwoPostTargetType(t.type)) return null
  const bases = paperIpscTwoPostBasesLocalM()
  const { x: cx, y: cy } = t.position
  const rot = t.rotationRad
  return bases.map((poly) => toWorld(poly, cx, cy, rot))
}

/** Контур для відмалювання на 2D (те саме лице, що й у 3D-екструзії). */
export function targetRenderPolygonWorld(t: Target): Vec2[] {
  const { x: cx, y: cy } = t.position
  const rot = t.rotationRad
  return toWorld(targetFaceOutlineLocalM(t), cx, cy, rot)
}

export function pointInPolygon(wx: number, wy: number, poly: Vec2[]): boolean {
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

export function targetFootprintWorld(t: Target): { poly: Vec2[]; boundsR: number } {
  const { x: cx, y: cy } = t.position
  const rot = t.rotationRad
  const loc = targetFootprintLocalM(t)
  const boundsR = isSwingerTargetType(t.type) ? swingerBoundsRadiusM(t) : polygonMaxRadiusM(loc)
  return {
    poly: toWorld(loc, cx, cy, rot),
    boundsR,
  }
}

export function pointInTargetFootprint(wx: number, wy: number, t: Target): boolean {
  const { poly } = targetFootprintWorld(t)
  return pointInPolygon(wx, wy, poly)
}

export function targetHandleDistanceM(t: Target): number {
  return targetFootprintWorld(t).boundsR
}

/** Розмір «лиця» мішені для 3D (м): ширина × висота по локальних осях до обертання. */
export function targetFaceSizeM(t: Target): { w: number; h: number } {
  switch (t.type) {
    case 'paperIpsc':
    case 'paperIpscTwoPostGround':
    case 'paperIpscTwoPostStand50':
    case 'paperIpscTwoPostStand100':
      return { w: 450 * MM, h: 570 * MM }
    case 'paperMiniIpsc':
      return { w: 300 * MM, h: 375 * MM }
    case 'paperA4':
      return { w: 210 * MM * PAPER_A4_VISUAL_SCALE, h: 297 * MM * PAPER_A4_VISUAL_SCALE }
    case 'popper':
      return { w: 300 * MM, h: 850 * MM }
    case 'miniPopper':
      return { w: 200 * MM, h: 560 * MM }
    case 'metalPlate':
    case 'metalPlateStand50':
    case 'metalPlateStand100': {
      const s = metalPlateSquareSideM(t)
      return { w: s, h: s }
    }
    case 'ceramicPlate':
      return { w: CERAMIC_RADIUS_M * 2, h: CERAMIC_RADIUS_M * 2 }
    case 'swingerSinglePaper':
    case 'swingerDoublePaper':
    case 'swingerSingleCeramic':
    case 'swingerDoubleCeramic': {
      const hull = swingerFootprintHullLocal(t)
      let minX = Infinity
      let maxX = -Infinity
      let minY = Infinity
      let maxY = -Infinity
      for (const p of hull) {
        minX = Math.min(minX, p.x)
        maxX = Math.max(maxX, p.x)
        minY = Math.min(minY, p.y)
        maxY = Math.max(maxY, p.y)
      }
      return { w: maxX - minX, h: maxY - minY }
    }
    default: {
      const _e: never = t.type
      return _e
    }
  }
}

/**
 * Порядок для 2D/3D: спочатку основні мішені, поверх — NS (перекриття штрафної
 * над «своєю» мішенню не залежить від порядку додавання в масив).
 */
export function targetsDrawOrder(targets: readonly Target[]): Target[] {
  const main = targets.filter((t) => !t.isNoShoot)
  const ns = targets.filter((t) => t.isNoShoot)
  return [...main, ...ns]
}

export { CERAMIC_RADIUS_M }
