import type { Target } from './models'
import { swingerIsPaperLoad, swingerTargetFaceCount } from './swingerGeometry'
import { isPaperTargetType } from './targetSpecs'

/** PractiScore match_stages fields we can derive from Stage Builder targets (MVP shotgun). */
export type PscStageMetrics = {
  stage_poppers: number
  stage_numtargs: number
  stage_noshoots: boolean
}

/**
 * Maps editor targets to PSC stage counts. Plates / ceramic (non-popper) stay out of stage_poppers —
 * PS template only exposes poppers + paper counts; MD can adjust in PS after import if needed.
 */
export function computePscStageMetrics(targets: readonly Target[]): PscStageMetrics {
  let poppers = 0
  let paperUnits = 0
  let hasNoShoot = false

  for (const t of targets) {
    if (t.isNoShoot) hasNoShoot = true
    const faces = swingerTargetFaceCount(t.type)
    if (faces > 0) {
      if (swingerIsPaperLoad(t.type)) paperUnits += faces
      continue
    }
    if (t.type === 'popper' || t.type === 'miniPopper') {
      if (!t.isNoShoot) poppers += 1
      continue
    }
    if (isPaperTargetType(t.type)) {
      paperUnits += 1
    }
  }

  return {
    stage_poppers: poppers,
    stage_numtargs: paperUnits,
    stage_noshoots: hasNoShoot,
  }
}
