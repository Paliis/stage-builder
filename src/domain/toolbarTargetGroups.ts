import type { TargetType } from './models'

/** Мішені → папір (двостійкові + паперові ківаки в групі «Рухомі» окремо). */
export const TOOLBAR_GROUP_PAPER: readonly TargetType[] = [
  'paperIpscTwoPostGround',
  'paperIpscTwoPostStand50',
  'paperIpscTwoPostStand100',
  'paperA4TwoPostGround',
  'paperA4TwoPostStand50',
  'paperA4TwoPostStand100',
  'paperMiniIpscTwoPostGround',
  'paperMiniIpscTwoPostStand50',
  'paperMiniIpscTwoPostStand100',
]

export const TOOLBAR_GROUP_METAL: readonly TargetType[] = [
  'metalPlate',
  'metalPlateStand50',
  'metalPlateStand100',
  'popper',
  'miniPopper',
]

export const TOOLBAR_GROUP_CERAMIC: readonly TargetType[] = ['ceramicPlate']

/** Рухомі мішені (ківаки). */
export const TOOLBAR_GROUP_MOVING: readonly TargetType[] = [
  'swingerSinglePaper',
  'swingerDoublePaper',
  'swingerSingleCeramic',
  'swingerDoubleCeramic',
]

/** Штрафні мішені — папір: двостійкові + паперові ківаки. */
export const TOOLBAR_GROUP_PENALTY_PAPER: readonly TargetType[] = [
  ...TOOLBAR_GROUP_PAPER,
  'swingerSinglePaper',
  'swingerDoublePaper',
]

export const TOOLBAR_GROUP_PENALTY_METAL: readonly TargetType[] = [...TOOLBAR_GROUP_METAL]

/** Керамічна тарілка та ківаки з керамікою. */
export const TOOLBAR_GROUP_PENALTY_CERAMIC: readonly TargetType[] = [
  'ceramicPlate',
  'swingerSingleCeramic',
  'swingerDoubleCeramic',
]

export function filterTargetTypesByGroup(
  allowed: readonly TargetType[],
  group: readonly TargetType[],
): TargetType[] {
  const s = new Set(allowed)
  return group.filter((t) => s.has(t))
}
