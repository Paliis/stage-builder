import { create } from 'zustand'
import { temporal } from 'zundo'
import type { MetalPlateRectSideCm, Prop, PropType, Target, TargetType, Vec2 } from '../domain/models'
import {
  emptyPenaltyZoneSet,
  newPolygonId,
  newRingId,
  reclampPenaltyZoneSet,
  resolveClosedPenaltyRing,
  type PenaltyZoneSet,
} from '../domain/penaltyZones'
import { isSquareSteelPlateTargetType } from '../domain/targetSpecs'
import { DEFAULT_FIELD_GROUND_COVER_3D, type FieldGroundCover3d } from '../domain/fieldGround3d'
import {
  clampFieldDimensions,
  clampVec2ToField,
  DEFAULT_FIELD_HEIGHT_M,
  DEFAULT_FIELD_WIDTH_M,
  PROP_PLACEMENT_SNAP_M,
  snapVec2,
  TARGET_PLACEMENT_SNAP_M,
} from '../domain/field'
import { reclampTargetsProps } from '../domain/fieldEntityReclamp'
import { defaultPropSizeM } from '../domain/propGeometry'
import type { WeaponClass } from '../domain/weaponClass'

/**
 * На http:// з LAN (не localhost) браузер часто дає !isSecureContext —
 * crypto.randomUUID() недоступний, кнопки «додати» ламаються без видимої помилки.
 */
function newId(): string {
  if (globalThis.isSecureContext && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `sb-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`
}

function spawnTargetPosition(s: StageState): Vec2 {
  const fw = s.fieldSizeM.x
  const fh = s.fieldSizeM.y
  const step = 0.85
  const cols = 5
  const i = s.targets.length % 20
  const col = i % cols
  const row = Math.floor(i / cols)
  const cx = fw / 2
  const cy = fh / 2
  return clampVec2ToField(
    {
      x: cx + (col - 2) * step,
      y: cy + (row - 1) * step,
    },
    1,
    fw,
    fh,
  )
}

function spawnPropPosition(s: StageState): Vec2 {
  const fw = s.fieldSizeM.x
  const fh = s.fieldSizeM.y
  const step = 1
  const i = s.props.length % 12
  return clampVec2ToField(
    {
      x: fw / 2 + (i - 5) * step * 0.6,
      y: fh / 2 - Math.min(4, fh / 2 - 2) + Math.floor(i / 6) * step,
    },
    2,
    fw,
    fh,
  )
}

export type StageState = {
  name: string
  weaponClass: WeaponClass
  /** Розмір площадки в метрах: x = ширина, y = довжина (як FIELD_*). */
  fieldSizeM: Vec2
  /** Покриття підлоги в 3D (земля / трава / пісок). */
  fieldGroundCover3d: FieldGroundCover3d
  targets: Target[]
  props: Prop[]
  /** Замкнені контури штрафних зон (BL-019). */
  penaltyZoneSet: PenaltyZoneSet
  setStageName: (name: string) => void
  setFieldGroundCover3d: (cover: FieldGroundCover3d) => void
  /** Повна заміна сцени (напр. з файлу вправи). */
  replaceStageState: (snapshot: {
    name: string
    weaponClass: WeaponClass
    fieldSizeM: Vec2
    targets: Target[]
    props: Prop[]
    fieldGroundCover3d?: FieldGroundCover3d
    penaltyZoneSet?: PenaltyZoneSet
  }) => void
  setWeaponClass: (wc: WeaponClass) => void
  setFieldSizeM: (size: Vec2) => void
  addTarget: (type: TargetType, isNoShoot?: boolean, positionHint?: Vec2) => void
  addProp: (type: PropType, sizeM?: Vec2, positionHint?: Vec2) => void
  setTargetPosition: (id: string, position: Vec2) => void
  setPropPosition: (id: string, position: Vec2) => void
  setTargetRotation: (id: string, rotationRad: number) => void
  setTargetMetalRectSideCm: (id: string, cm: MetalPlateRectSideCm) => void
  setPropRotation: (id: string, rotationRad: number) => void
  setPropGeometry: (id: string, position: Vec2, sizeM: Vec2) => void
  removeTarget: (id: string) => void
  removeProp: (id: string) => void
  /** Вставка клонів (нові id); позиції вже зміщені та clamp у полі. */
  pasteCloneEntities: (targets: Target[], props: Prop[]) => void
  /** Порожня сцена, дефолтний розмір поля та ім’я (кнопка «нова вправа»). */
  resetSceneToDefaults: () => void
  setPenaltyZoneSet: (pz: PenaltyZoneSet) => void
  /** Замкнений контур: автоматично — новий полігон або дірка в існуючому (за геометрією, не «останній»). */
  addPenaltyClosedRing: (vertices: Vec2[]) => void
}

export const useStageStore = create<StageState>()(temporal((set) => ({
  name: 'Нова вправа',
  weaponClass: 'handgun',
  fieldSizeM: { x: DEFAULT_FIELD_WIDTH_M, y: DEFAULT_FIELD_HEIGHT_M },
  fieldGroundCover3d: DEFAULT_FIELD_GROUND_COVER_3D,
  targets: [],
  props: [],
  penaltyZoneSet: emptyPenaltyZoneSet(),

  setStageName: (name) =>
    set({
      name: name.trim().slice(0, 200) || 'Нова вправа',
    }),

  setFieldGroundCover3d: (cover) => set({ fieldGroundCover3d: cover }),

  replaceStageState: (snapshot) =>
    set((s) => {
      const next = clampFieldDimensions(snapshot.fieldSizeM.x, snapshot.fieldSizeM.y)
      const { targets, props } = reclampTargetsProps(snapshot.targets, snapshot.props, next.x, next.y)
      const fieldGroundCover3d = snapshot.fieldGroundCover3d ?? DEFAULT_FIELD_GROUND_COVER_3D
      const penaltyZoneSet = reclampPenaltyZoneSet(
        snapshot.penaltyZoneSet ?? emptyPenaltyZoneSet(),
        next.x,
        next.y,
      )
      return {
        name: snapshot.name.trim().slice(0, 200) || s.name,
        weaponClass: snapshot.weaponClass,
        fieldSizeM: next,
        fieldGroundCover3d,
        targets,
        props,
        penaltyZoneSet,
      }
    }),

  resetSceneToDefaults: () =>
    set(() => {
      const fieldSizeM = clampFieldDimensions(DEFAULT_FIELD_WIDTH_M, DEFAULT_FIELD_HEIGHT_M)
      return {
        name: 'Нова вправа',
        weaponClass: 'handgun',
        fieldSizeM,
        fieldGroundCover3d: DEFAULT_FIELD_GROUND_COVER_3D,
        targets: [],
        props: [],
        penaltyZoneSet: emptyPenaltyZoneSet(),
      }
    }),

  setPenaltyZoneSet: (pz) => set({ penaltyZoneSet: pz }),

  addPenaltyClosedRing: (vertices) =>
    set((s) => {
      if (vertices.length < 3) return s
      const resolved = resolveClosedPenaltyRing(vertices, s.penaltyZoneSet)
      const ringCopy = vertices.map((v) => ({ ...v }))
      if (resolved.kind === 'newPolygon') {
        const polyId = newPolygonId()
        const ringId = newRingId()
        return {
          penaltyZoneSet: {
            polygons: [
              ...s.penaltyZoneSet.polygons,
              {
                id: polyId,
                outer: { id: ringId, vertices: ringCopy, closed: true },
                holes: [],
              },
            ],
          },
        }
      }
      const polygonId = resolved.polygonId
      const poly = s.penaltyZoneSet.polygons.find((p) => p.id === polygonId)
      if (!poly) return s
      const holeId = newRingId()
      return {
        penaltyZoneSet: {
          polygons: s.penaltyZoneSet.polygons.map((p) =>
            p.id === polygonId
              ? {
                  ...p,
                  holes: [
                    ...p.holes,
                    { id: holeId, vertices: ringCopy, closed: true },
                  ],
                }
              : p,
          ),
        },
      }
    }),

  // Залишено для JSON вправи; UI перемикання тимчасово прибрано.
  setWeaponClass: (weaponClass) => set({ weaponClass }),

  setFieldSizeM: (size) =>
    set((s) => {
      const next = clampFieldDimensions(size.x, size.y)
      if (next.x === s.fieldSizeM.x && next.y === s.fieldSizeM.y) return s
      const { targets, props } = reclampTargetsProps(s.targets, s.props, next.x, next.y)
      const penaltyZoneSet = reclampPenaltyZoneSet(s.penaltyZoneSet, next.x, next.y)
      return { fieldSizeM: next, targets, props, penaltyZoneSet }
    }),

  addTarget: (type, isNoShoot = false, positionHint) =>
    set((s) => {
      // Клас зброї тимчасово прихований у UI; фільтрацію за isTargetTypeForWeaponClass вимкнено.
      // if (!isTargetTypeForWeaponClass(type, s.weaponClass)) return s
      const fw = s.fieldSizeM.x
      const fh = s.fieldSizeM.y
      const position = positionHint
        ? clampVec2ToField(snapVec2(positionHint, TARGET_PLACEMENT_SNAP_M), 1, fw, fh)
        : spawnTargetPosition({ ...s, targets: s.targets })
      const base: Target = {
        id: newId(),
        type,
        isNoShoot,
        position,
        rotationRad: 0,
      }
      const t: Target =
        isSquareSteelPlateTargetType(type) ? { ...base, metalRectSideCm: 15 } : base
      return {
        targets: [...s.targets, t],
      }
    }),

  addProp: (type, sizeM, positionHint) =>
    set((s) => {
      const fw = s.fieldSizeM.x
      const fh = s.fieldSizeM.y
      const position = positionHint
        ? clampVec2ToField(snapVec2(positionHint, PROP_PLACEMENT_SNAP_M), 2, fw, fh)
        : spawnPropPosition({ ...s, props: s.props })
      return {
        props: [
          ...s.props,
          {
            id: newId(),
            type,
            sizeM: sizeM ?? defaultPropSizeM(type),
            position,
            rotationRad: 0,
          },
        ],
      }
    }),

  setTargetPosition: (id, position) =>
    set((s) => ({
      targets: s.targets.map((x) => (x.id === id ? { ...x, position } : x)),
    })),

  setPropPosition: (id, position) =>
    set((s) => ({
      props: s.props.map((x) => (x.id === id ? { ...x, position } : x)),
    })),

  setTargetRotation: (id, rotationRad) =>
    set((s) => ({
      targets: s.targets.map((x) => (x.id === id ? { ...x, rotationRad } : x)),
    })),

  setTargetMetalRectSideCm: (id, cm) =>
    set((s) => ({
      targets: s.targets.map((x) =>
        x.id === id && isSquareSteelPlateTargetType(x.type) ? { ...x, metalRectSideCm: cm } : x,
      ),
    })),

  setPropRotation: (id, rotationRad) =>
    set((s) => ({
      props: s.props.map((x) => (x.id === id ? { ...x, rotationRad } : x)),
    })),

  setPropGeometry: (id, position, sizeM) =>
    set((s) => ({
      props: s.props.map((x) => (x.id === id ? { ...x, position, sizeM } : x)),
    })),

  removeTarget: (id) =>
    set((s) => ({
      targets: s.targets.filter((x) => x.id !== id),
    })),

  removeProp: (id) =>
    set((s) => ({
      props: s.props.filter((x) => x.id !== id),
    })),

  pasteCloneEntities: (targets, props) =>
    set((s) => ({
      targets: [...s.targets, ...targets.map((t) => ({ ...t, id: newId() }))],
      props: [...s.props, ...props.map((p) => ({ ...p, id: newId() }))],
    })),
}), {
  limit: 50,
  partialize: (state) => {
    const { name, weaponClass, fieldSizeM, fieldGroundCover3d, targets, props, penaltyZoneSet } =
      state
    return { name, weaponClass, fieldSizeM, fieldGroundCover3d, targets, props, penaltyZoneSet }
  },
}))
