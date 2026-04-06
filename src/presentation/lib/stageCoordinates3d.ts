import type { Vec2 } from '../../domain/models'

export type StageFieldM = { widthM: number; heightM: number }

/**
 * Площина 2D (x,y у метрах, як у редакторі) → Three.js, поле по центру, Y вгору.
 */
export function stageToThreeXZ(p: Vec2, field: StageFieldM): [number, number, number] {
  const ox = field.widthM / 2
  const oz = field.heightM / 2
  return [p.x - ox, 0, -(p.y - oz)]
}
