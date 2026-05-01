import type { Target, TargetType } from './models'
import { swingerIsPaperLoad, swingerTargetFaceCount } from './swingerGeometry'
import { isPaperTwoPostTargetType } from './targetSpecs'

/** PractiScore match_stages fields we derive from Stage Builder targets (MVP shotgun). */
export type PscStageMetrics = {
  /** Popper silhouettes plus steel rectangles / ceramics (shown as «Poppers/Plates» in PS mobile). */
  stage_poppers: number
  /** Paper/cardboard classic targets (`stage_numtargs`). */
  stage_numtargs: number
  stage_noshoots: boolean
  /**
   * Optional `stage_tppoints` for PSC (IPSC shotgun: 5 per steel plate + 10 per classic paper face).
   * Filled when metrics come from share payload (`tryPscStageMetricsFromSharePayload`); export falls back to the same heuristic if absent.
   */
  stage_tppoints?: number
}

function isMetalRectPlateType(type: TargetType): boolean {
  return type === 'metalPlate' || type === 'metalPlateStand50' || type === 'metalPlateStand100'
}

function isCeramicPlateType(type: TargetType): boolean {
  return type === 'ceramicPlate'
}

function isSwingerCeramicType(type: TargetType): boolean {
  return type === 'swingerSingleCeramic' || type === 'swingerDoubleCeramic'
}

/**
 * Maps editor targets to PSC stage counts (shotgun round-trip template field names).
 * Classic cardboard for `stage_numtargs` — only two‑post paper types + paper swingers (`isPaperTwoPostTargetType` / swingers), not «anything not in steel set».
 * Do **not** use `stage_poppers_maxnpms` here — PractiScore treats it as scoring (max NPM), not plate count.
 */
export function computePscStageMetrics(targets: readonly Target[]): PscStageMetrics {
  let poppersLike = 0
  let paperUnits = 0
  let hasNoShoot = false

  for (const t of targets) {
    if (t.isNoShoot) hasNoShoot = true
    const faces = swingerTargetFaceCount(t.type)
    if (faces > 0) {
      if (swingerIsPaperLoad(t.type)) {
        paperUnits += faces
        continue
      }
      if (isSwingerCeramicType(t.type) && !t.isNoShoot) {
        poppersLike += faces
      }
      continue
    }
    if (t.type === 'popper' || t.type === 'miniPopper') {
      if (!t.isNoShoot) poppersLike += 1
      continue
    }
    if (isMetalRectPlateType(t.type) || isCeramicPlateType(t.type)) {
      if (!t.isNoShoot) poppersLike += 1
      continue
    }
    if (isPaperTwoPostTargetType(t.type)) {
      paperUnits += 1
    }
  }

  return {
    stage_poppers: poppersLike,
    stage_numtargs: paperUnits,
    stage_noshoots: hasNoShoot,
  }
}
