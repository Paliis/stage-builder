import type { Vec2 } from './models'

/** Замикання контуру: відстань між першою й останньою вершиною (див. VISIBILITY_AND_SAFETY_RULES §4). */
export const PENALTY_ZONE_CLOSE_EPSILON_M = 0.05

export type PenaltyRingData = {
  id: string
  /** Вершини по порядку; для замкненого кільця перша й остання можуть збігатися в межах epsilon. */
  vertices: Vec2[]
  closed: boolean
}

/** Один полігон: зовнішня межа + отвори («матрьошка»). */
export type PenaltyPolygonData = {
  id: string
  outer: PenaltyRingData
  holes: PenaltyRingData[]
}

export type PenaltyZoneSet = {
  polygons: PenaltyPolygonData[]
}

export function emptyPenaltyZoneSet(): PenaltyZoneSet {
  return { polygons: [] }
}

export function vecDistSq(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return dx * dx + dy * dy
}

export function vecDist(a: Vec2, b: Vec2): number {
  return Math.sqrt(vecDistSq(a, b))
}

/** Чи можна замкнути полілінію в точці `p` (близько до першої вершини). */
export function canClosePolyline(vertices: readonly Vec2[], p: Vec2): boolean {
  if (vertices.length < 2) return false
  const first = vertices[0]!
  return vecDist(first, p) <= PENALTY_ZONE_CLOSE_EPSILON_M
}

function dedupeClosingVertex(vertices: Vec2[]): Vec2[] {
  if (vertices.length < 2) return vertices
  const first = vertices[0]!
  const last = vertices[vertices.length - 1]!
  if (vecDist(first, last) <= PENALTY_ZONE_CLOSE_EPSILON_M) {
    return vertices.slice(0, -1)
  }
  return vertices
}

/** Замкнене кільце для геометрії: мінімум 3 точки, без дубліката кінця. */
export function ringToClosedPoints(ring: PenaltyRingData): Vec2[] | null {
  if (!ring.closed || ring.vertices.length < 3) return null
  const v = dedupeClosingVertex([...ring.vertices])
  if (v.length < 3) return null
  return [...v, v[0]!]
}

export function newRingId(): string {
  if (globalThis.isSecureContext && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `ring-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

export function newPolygonId(): string {
  return newRingId()
}

/** Ray casting: точка всередині простого полігона (замкнута ламана). */
export function pointInSimplePolygon(pt: Vec2, polygon: readonly Vec2[]): boolean {
  if (polygon.length < 3) return false
  let inside = false
  const n = polygon.length
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const pi = polygon[i]!
    const pj = polygon[j]!
    const intersect =
      pi.y > pt.y !== pj.y > pt.y &&
      pt.x < ((pj.x - pi.x) * (pt.y - pi.y)) / (pj.y - pi.y + 1e-20) + pi.x
    if (intersect) inside = !inside
  }
  return inside
}

/** Точка всередині `outer` і поза всіма `holes`. */
export function pointInPolygonWithHoles(pt: Vec2, poly: PenaltyPolygonData): boolean {
  const outerPts = ringToClosedPoints(poly.outer)
  if (!outerPts || outerPts.length < 4) return false
  const outerFlat = outerPts.slice(0, -1)
  if (!pointInSimplePolygon(pt, outerFlat)) return false
  for (const h of poly.holes) {
    const hp = ringToClosedPoints(h)
    if (hp && hp.length >= 4) {
      const hf = hp.slice(0, -1)
      if (pointInSimplePolygon(pt, hf)) return false
    }
  }
  return true
}

export function ringCentroid(vertices: readonly Vec2[]): Vec2 {
  const n = vertices.length
  if (n === 0) return { x: 0, y: 0 }
  let sx = 0
  let sy = 0
  for (const v of vertices) {
    sx += v.x
    sy += v.y
  }
  return { x: sx / n, y: sy / n }
}

/** Площа простого полігона (м²), |шнурок|. */
export function polygonAbsArea(vertices: readonly Vec2[]): number {
  if (vertices.length < 3) return 0
  let s = 0
  const n = vertices.length
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    s += vertices[i]!.x * vertices[j]!.y - vertices[j]!.x * vertices[i]!.y
  }
  return Math.abs(s * 0.5)
}

export type ResolvedPenaltyClosedRing =
  | { kind: 'newPolygon' }
  | { kind: 'addHole'; polygonId: string }

/**
 * Після замикання контуру визначає: новий верхньорівневий полігон чи дірка в існуючому.
 * Дірка прив’язується до полігона з **найменшою** зовнішньою межею, що містить ситуацію
 * (щоб вкладені окремі полігони розрізнялись коректно), а не до «останнього» у списку.
 */
export function resolveClosedPenaltyRing(vertices: Vec2[], pz: PenaltyZoneSet): ResolvedPenaltyClosedRing {
  if (vertices.length < 3) return { kind: 'newPolygon' }

  const c = ringCentroid(vertices)

  type Scored = { poly: PenaltyPolygonData; outerArea: number }
  const primary: Scored[] = []
  for (const poly of pz.polygons) {
    const outerPts = ringToClosedPoints(poly.outer)
    if (!outerPts || outerPts.length < 4) continue
    const outerFlat = outerPts.slice(0, -1)
    if (!pointInSimplePolygon(c, outerFlat)) continue
    if (!pointInPolygonWithHoles(c, poly)) continue
    primary.push({ poly, outerArea: polygonAbsArea(outerFlat) })
  }
  if (primary.length > 0) {
    primary.sort((a, b) => a.outerArea - b.outerArea)
    return { kind: 'addHole', polygonId: primary[0]!.poly.id }
  }

  const fallback: Scored[] = []
  for (const poly of pz.polygons) {
    const outerPts = ringToClosedPoints(poly.outer)
    if (!outerPts || outerPts.length < 4) continue
    const outerFlat = outerPts.slice(0, -1)
    if (!vertices.every((v) => pointInSimplePolygon(v, outerFlat))) continue
    const oa = polygonAbsArea(outerFlat)
    const ra = polygonAbsArea(vertices)
    if (ra >= oa * 0.999) continue
    fallback.push({ poly, outerArea: oa })
  }
  if (fallback.length > 0) {
    fallback.sort((a, b) => a.outerArea - b.outerArea)
    return { kind: 'addHole', polygonId: fallback[0]!.poly.id }
  }

  return { kind: 'newPolygon' }
}

export function reclampPenaltyZoneSet(pz: PenaltyZoneSet, fw: number, fh: number): PenaltyZoneSet {
  const clamp = (v: Vec2): Vec2 => ({
    x: Math.min(fw, Math.max(0, v.x)),
    y: Math.min(fh, Math.max(0, v.y)),
  })
  const clampRing = (r: PenaltyRingData): PenaltyRingData => ({
    ...r,
    vertices: r.vertices.map(clamp),
  })
  return {
    polygons: pz.polygons.map((p) => ({
      ...p,
      outer: clampRing(p.outer),
      holes: p.holes.map(clampRing),
    })),
  }
}
