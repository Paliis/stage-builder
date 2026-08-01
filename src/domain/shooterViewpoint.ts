import { DEFAULT_FIELD_HEIGHT_M, DEFAULT_FIELD_WIDTH_M } from './field'
import type { Prop, Target, Vec2 } from './models'
import type { PenaltyZoneSet } from './penaltyZones'
import { faultLineEndPointsWorld } from './propGeometry'

/** Звідки взята точка огляду: маркер старту, габарити штрафних ліній чи просто поле. */
export type ShooterViewpointKind = 'start' | 'faultLines' | 'field'

export type ShooterViewpoint = {
  /** `id` стартової позиції або синтетичний ключ для запасних точок. */
  id: string
  kind: ShooterViewpointKind
  /** Де стоїть стрілець (план, м). */
  position: Vec2
  /** Куди він дивиться (план, м) — ціль орбіти камери. */
  lookAt: Vec2
}

/** Камера не має стояти впритул до огорожі, навіть якщо маркер поставили на самому краю. */
const VIEWPOINT_FIELD_MARGIN_M = 0.5

/** Відстань до цілі орбіти: досить далеко, щоб огляд був майже горизонтальним. */
const LOOK_DISTANCE_M = 12

/** Без маркерів і штрафних ліній — стрілець стоїть у цій частині поля від ближнього краю. */
const FALLBACK_DEPTH_FRACTION = 0.25
const FALLBACK_DEPTH_MAX_M = 9

function clampToField(p: Vec2, widthM: number, heightM: number): Vec2 {
  const axis = (value: number, sizeM: number): number =>
    VIEWPOINT_FIELD_MARGIN_M * 2 >= sizeM ?
      sizeM / 2
    : Math.max(VIEWPOINT_FIELD_MARGIN_M, Math.min(sizeM - VIEWPOINT_FIELD_MARGIN_M, value))
  return { x: axis(p.x, widthM), y: axis(p.y, heightM) }
}

/** Куди «цікаво» дивитися: центр мас мішеней, інакше центр поля. */
function sceneInterestPoint(targets: readonly Target[], widthM: number, heightM: number): Vec2 {
  if (targets.length === 0) return { x: widthM / 2, y: heightM / 2 }
  let sx = 0
  let sy = 0
  for (const t of targets) {
    sx += t.position.x
    sy += t.position.y
  }
  return { x: sx / targets.length, y: sy / targets.length }
}

function lookAtAlong(position: Vec2, dir: Vec2): Vec2 {
  const len = Math.hypot(dir.x, dir.y)
  if (len < 1e-9) return { x: position.x, y: position.y + LOOK_DISTANCE_M }
  return {
    x: position.x + (dir.x / len) * LOOK_DISTANCE_M,
    y: position.y + (dir.y / len) * LOOK_DISTANCE_M,
  }
}

/**
 * Маркер старту — це пара слідів, симетрична відносно центра: поворот задає лише вісь погляду,
 * а не бік. Бік обираємо той, що дивиться в бік мішеней (інакше — углиб поля).
 */
function startFacing(p: Prop, interest: Vec2): Vec2 {
  const axis = { x: -Math.sin(p.rotationRad), y: Math.cos(p.rotationRad) }
  const toInterest = { x: interest.x - p.position.x, y: interest.y - p.position.y }
  const dot = axis.x * toInterest.x + axis.y * toInterest.y
  if (Math.abs(dot) > 1e-6) return dot > 0 ? axis : { x: -axis.x, y: -axis.y }
  return axis.y >= 0 ? axis : { x: -axis.x, y: -axis.y }
}

/**
 * Габарит розмітки — кінці окремих штрафних ліній і вершини зовнішніх контурів штрафних зон
 * (отвори всередині контуру габарит не розширюють). Центр цього прямокутника і є «між штрафними».
 */
function faultLinesCenter(props: readonly Prop[], penaltyZoneSet?: PenaltyZoneSet): Vec2 | null {
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  let found = false
  const include = (v: Vec2): void => {
    found = true
    minX = Math.min(minX, v.x)
    maxX = Math.max(maxX, v.x)
    minY = Math.min(minY, v.y)
    maxY = Math.max(maxY, v.y)
  }
  for (const p of props) {
    const ends = faultLineEndPointsWorld(p)
    if (!ends) continue
    include(ends.neg)
    include(ends.pos)
  }
  for (const poly of penaltyZoneSet?.polygons ?? []) {
    for (const v of poly.outer.vertices) include(v)
  }
  if (!found) return null
  return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 }
}

/**
 * Точки огляду для режиму «зона стрільця», у порядку показу в перемикачі:
 * - кожен маркер стартової позиції (ближчі до низу плану — перші), погляд за поворотом маркера;
 * - якщо стартів немає — центр габаритів штрафних ліній і контурів зон, погляд у бік мішеней;
 * - якщо немає й розмітки — середина ширини поля на чверті його довжини, погляд углиб.
 *
 * Список ніколи не порожній.
 */
export function computeShooterViewpoints(
  props: readonly Prop[],
  targets: readonly Target[],
  widthM: number = DEFAULT_FIELD_WIDTH_M,
  heightM: number = DEFAULT_FIELD_HEIGHT_M,
  penaltyZoneSet?: PenaltyZoneSet,
): ShooterViewpoint[] {
  const interest = sceneInterestPoint(targets, widthM, heightM)

  const starts = props
    .filter((p) => p.type === 'startPosition')
    .slice()
    .sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x)
  if (starts.length > 0) {
    return starts.map((p) => {
      const position = clampToField(p.position, widthM, heightM)
      return {
        id: p.id,
        kind: 'start' as const,
        position,
        lookAt: lookAtAlong(position, startFacing(p, interest)),
      }
    })
  }

  const center = faultLinesCenter(props, penaltyZoneSet)
  if (center) {
    const position = clampToField(center, widthM, heightM)
    return [
      {
        id: 'fault-lines-center',
        kind: 'faultLines',
        position,
        lookAt: lookAtAlong(position, { x: interest.x - position.x, y: interest.y - position.y }),
      },
    ]
  }

  const position = clampToField(
    { x: widthM / 2, y: Math.min(FALLBACK_DEPTH_MAX_M, heightM * FALLBACK_DEPTH_FRACTION) },
    widthM,
    heightM,
  )
  return [
    {
      id: 'field-center',
      kind: 'field',
      position,
      lookAt: lookAtAlong(position, { x: interest.x - position.x, y: interest.y - position.y }),
    },
  ]
}
