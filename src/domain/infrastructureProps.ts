import type { PropType } from './models'

/** Щити, двері, базовий реквізит — перший блок у панелі інфраструктури. */
export const INFRASTRUCTURE_PROPS_PRIMARY: readonly PropType[] = [
  'shield',
  'shieldDouble',
  'shieldWithPort',
  'shieldPortLow',
  'shieldPortHigh',
  'shieldPortSlanted',
  'shieldWithPortDoor',
  'door',
  'faultLine',
  'barrel',
  'tireStack',
]

/** Стіл, стілець, стійка — окремий підпис у тулбарі, щоб кнопки не губилися після довгого списку щитів. */
export const INFRASTRUCTURE_PROPS_FURNITURE_RACK: readonly PropType[] = [
  'woodTable',
  'woodChair',
  'weaponRackPyramid',
]

export const INFRASTRUCTURE_PROPS_TAIL: readonly PropType[] = [
  'seesaw',
  'movingPlatform',
  'cooperTunnel',
  'startPosition',
]

/** Повний порядок (парсер / файл вправи) — збігається з об’єднанням трьох блоків. */
export const INFRASTRUCTURE_PROP_ORDER: readonly PropType[] = [
  ...INFRASTRUCTURE_PROPS_PRIMARY,
  ...INFRASTRUCTURE_PROPS_FURNITURE_RACK,
  ...INFRASTRUCTURE_PROPS_TAIL,
]
