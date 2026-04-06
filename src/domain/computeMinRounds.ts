import type { Target } from './models'
import { swingerIsPaperLoad, swingerTargetFaceCount } from './swingerGeometry'
import { isPaperTargetType } from './targetSpecs'

/**
 * Minimum shots by paper vs steel heuristic (MVP).
 * No-shoot targets do not add to this minimum.
 * Подвійна ківка — дві мішені (×2 до вкладу паперу або сталі).
 */
export function computeMinRounds(targets: readonly Target[]): number {
  let sum = 0
  for (const t of targets) {
    if (t.isNoShoot) continue
    const faces = swingerTargetFaceCount(t.type)
    if (faces > 0) {
      sum += swingerIsPaperLoad(t.type) ? 2 * faces : 1 * faces
      continue
    }
    if (isPaperTargetType(t.type)) sum += 2
    else sum += 1
  }
  return sum
}

/** Об’єктів на сцені може бути менше, ніж мішеней (подвійна ківка = 2 мішені в один вузол). */
export function countStageTargetUnits(targets: readonly Target[]): number {
  let n = 0
  for (const t of targets) {
    const faces = swingerTargetFaceCount(t.type)
    n += faces > 0 ? faces : 1
  }
  return n
}
