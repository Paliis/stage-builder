import { create } from 'zustand'
import { temporal } from 'zundo'
import type { MetalPlateRectSideCm, Prop, PropType, Target, TargetType, Vec2 } from '../domain/models'
import { isSquareSteelPlateTargetType } from '../domain/targetSpecs'
import {
  clampFieldDimensions,
  clampVec2ToField,
  DEFAULT_FIELD_HEIGHT_M,
  DEFAULT_FIELD_WIDTH_M,
  PROP_PLACEMENT_SNAP_M,
  snapVec2,
  TARGET_PLACEMENT_SNAP_M,
} from '../domain/field'
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

/** Старі сцени: прибрати стіну/вікно; «port» перейменовано на shieldWithPort. */
function migrateProp(p: Prop): Prop | null {
  const raw = p.type as string
  if (raw === 'wall' || raw === 'window') return null
  if (raw === 'port') return { ...p, type: 'shieldWithPort' }
  if (
    p.type === 'tireStack' &&
    Math.abs(p.sizeM.x - 0.95) < 1e-3 &&
    Math.abs(p.sizeM.y - 0.95) < 1e-3
  ) {
    return { ...p, sizeM: defaultPropSizeM('tireStack') }
  }
  return p
}

function reclampTargetsProps(targets: Target[], props: Prop[], fw: number, fh: number) {
  const nextTargets = targets.map((t) => ({
    ...t,
    position: clampVec2ToField(t.position, 1, fw, fh),
  }))
  const nextProps = props
    .map(migrateProp)
    .filter((x): x is Prop => x !== null)
    .map((p) => {
      const m = Math.max(p.sizeM.x, p.sizeM.y) / 2 + 0.16
      return {
        ...p,
        position: clampVec2ToField(p.position, m, fw, fh),
      }
    })
  return { targets: nextTargets, props: nextProps }
}

export type StageState = {
  name: string
  weaponClass: WeaponClass
  /** Розмір площадки в метрах: x = ширина, y = довжина (як FIELD_*). */
  fieldSizeM: Vec2
  targets: Target[]
  props: Prop[]
  setStageName: (name: string) => void
  /** Повна заміна сцени (напр. з файлу вправи). */
  replaceStageState: (snapshot: {
    name: string
    weaponClass: WeaponClass
    fieldSizeM: Vec2
    targets: Target[]
    props: Prop[]
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
}

export const useStageStore = create<StageState>()(temporal((set) => ({
  name: 'Нова вправа',
  weaponClass: 'handgun',
  fieldSizeM: { x: DEFAULT_FIELD_WIDTH_M, y: DEFAULT_FIELD_HEIGHT_M },
  targets: [],
  props: [],

  setStageName: (name) =>
    set({
      name: name.trim().slice(0, 200) || 'Нова вправа',
    }),

  replaceStageState: (snapshot) =>
    set((s) => {
      const next = clampFieldDimensions(snapshot.fieldSizeM.x, snapshot.fieldSizeM.y)
      const { targets, props } = reclampTargetsProps(snapshot.targets, snapshot.props, next.x, next.y)
      return {
        name: snapshot.name.trim().slice(0, 200) || s.name,
        weaponClass: snapshot.weaponClass,
        fieldSizeM: next,
        targets,
        props,
      }
    }),

  resetSceneToDefaults: () =>
    set(() => {
      const fieldSizeM = clampFieldDimensions(DEFAULT_FIELD_WIDTH_M, DEFAULT_FIELD_HEIGHT_M)
      return {
        name: 'Нова вправа',
        weaponClass: 'handgun',
        fieldSizeM,
        targets: [],
        props: [],
      }
    }),

  // Залишено для JSON вправи; UI перемикання тимчасово прибрано.
  setWeaponClass: (weaponClass) => set({ weaponClass }),

  setFieldSizeM: (size) =>
    set((s) => {
      const next = clampFieldDimensions(size.x, size.y)
      if (next.x === s.fieldSizeM.x && next.y === s.fieldSizeM.y) return s
      const { targets, props } = reclampTargetsProps(s.targets, s.props, next.x, next.y)
      return { fieldSizeM: next, targets, props }
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
    const { name, weaponClass, fieldSizeM, targets, props } = state
    return { name, weaponClass, fieldSizeM, targets, props }
  },
}))
