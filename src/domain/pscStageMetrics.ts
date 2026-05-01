import type { Target, TargetType } from './models'
import { swingerIsPaperLoad, swingerTargetFaceCount } from './swingerGeometry'
import { isPaperTargetType } from './targetSpecs'

/** PractiScore match_stages fields we can derive from Stage Builder targets (MVP shotgun). */
export type PscStageMetrics = {
  stage_poppers: number
  stage_numtargs: number
  stage_noshoots: boolean
  /**
   * PSC field `stage_poppers_maxnpms`: in Android this shows as “Steel NPMs” for shotgun;
   * we approximate with rectangular steel + ceramic plate targets (incl. swinger ceramic faces).
   */
  stage_poppers_maxnpms: number
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
 */
export function computePscStageMetrics(targets: readonly Target[]): PscStageMetrics {
  let poppers = 0
  let paperUnits = 0
  let steelNpmApprox = 0
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
        steelNpmApprox += faces
      }
      continue
    }
    if (t.type === 'popper' || t.type === 'miniPopper') {
      if (!t.isNoShoot) poppers += 1
      continue
    }
    if (isMetalRectPlateType(t.type) || isCeramicPlateType(t.type)) {
      if (!t.isNoShoot) steelNpmApprox += 1
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
    stage_poppers_maxnpms: steelNpmApprox,
  }
}
