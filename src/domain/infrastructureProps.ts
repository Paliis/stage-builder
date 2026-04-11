import type { PropType } from './models'

/** Щити — підгрупа «Інфраструктура» у тулбарі. */
export const INFRASTRUCTURE_SHIELDS: readonly PropType[] = [
  'shield',
  'shieldDouble',
  'shieldWithPort',
  'shieldPortLow',
  'shieldPortHigh',
  'shieldPortSlanted',
  'shieldWithPortDoor',
]

/** Штрафна лінія — підгрупа разом із контуром штрафної зони (не PropType). */
export const INFRASTRUCTURE_FAULT_LINE: readonly PropType[] = ['faultLine']

/** Двері, базовий реквізит, меблі, активні елементи — підгрупа «Обладнання». */
export const INFRASTRUCTURE_EQUIPMENT: readonly PropType[] = [
  'door',
  'barrel',
  'tireStack',
  'woodTable',
  'woodChair',
  'weaponRackPyramid',
  'seesaw',
  'movingPlatform',
  'cooperTunnel',
  'startPosition',
]

/** @deprecated Використовуйте INFRASTRUCTURE_SHIELDS / _FAULT_LINE / _EQUIPMENT у тулбарі. */
export const INFRASTRUCTURE_PROPS_PRIMARY: readonly PropType[] = [
  ...INFRASTRUCTURE_SHIELDS,
  'door',
  'faultLine',
  'barrel',
  'tireStack',
]

/** @deprecated Див. INFRASTRUCTURE_EQUIPMENT. */
export const INFRASTRUCTURE_PROPS_FURNITURE_RACK: readonly PropType[] = [
  'woodTable',
  'woodChair',
  'weaponRackPyramid',
]

/** @deprecated Див. INFRASTRUCTURE_EQUIPMENT. */
export const INFRASTRUCTURE_PROPS_TAIL: readonly PropType[] = [
  'seesaw',
  'movingPlatform',
  'cooperTunnel',
  'startPosition',
]

/** Повний порядок типів реквізиту (як у попередньому тулбарі; парсер / файл вправи). */
export const INFRASTRUCTURE_PROP_ORDER: readonly PropType[] = [
  ...INFRASTRUCTURE_SHIELDS,
  'door',
  'faultLine',
  'barrel',
  'tireStack',
  'woodTable',
  'woodChair',
  'weaponRackPyramid',
  'seesaw',
  'movingPlatform',
  'cooperTunnel',
  'startPosition',
]
