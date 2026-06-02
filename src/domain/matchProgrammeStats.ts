import type { StageCategory, Target, TargetType } from './models'
import { computeMinRounds } from './computeMinRounds'
import { parseBriefingOptionalPositiveInt, type StageBriefing } from './stageBriefing'
import type { StageProjectFileV1 } from './stageProjectFile'
import { isPaperTwoPostTargetType } from './targetSpecs'
import { swingerIsPaperLoad, swingerTargetFaceCount } from './swingerGeometry'
import { isGongTargetType } from './gongSpec'

export type MatchStageTargetCounts = {
  paper: number
  metalPlates: number
  ceramic: number
  poppers: number
  miniPoppers: number
}

export type MatchStageStatRow = {
  sortOrder: number
  exerciseType: StageCategory
  targets: MatchStageTargetCounts
  ammoLabel: string
  shots: number
  points: number
  matchPercent: number
}

export type MatchProgrammeStatsTotals = MatchStageTargetCounts & {
  shots: number
  points: number
}

export type MatchProgrammeStatsBundle = {
  rows: MatchStageStatRow[]
  totals: MatchProgrammeStatsTotals
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

export function computeMatchStageTargetCounts(targets: readonly Target[]): MatchStageTargetCounts {
  const out: MatchStageTargetCounts = {
    paper: 0,
    metalPlates: 0,
    ceramic: 0,
    poppers: 0,
    miniPoppers: 0,
  }

  for (const t of targets) {
    if (t.isNoShoot) continue
    const faces = swingerTargetFaceCount(t.type)
    if (faces > 0) {
      if (swingerIsPaperLoad(t.type)) {
        out.paper += faces
        continue
      }
      if (isSwingerCeramicType(t.type)) {
        out.ceramic += faces
      }
      continue
    }
    if (t.type === 'popper') {
      out.poppers += 1
      continue
    }
    if (t.type === 'miniPopper') {
      out.miniPoppers += 1
      continue
    }
    if (isCeramicPlateType(t.type)) {
      out.ceramic += 1
      continue
    }
    if (isMetalRectPlateType(t.type) || isGongTargetType(t.type)) {
      out.metalPlates += 1
      continue
    }
    if (isPaperTwoPostTargetType(t.type)) {
      out.paper += 1
    }
  }

  return out
}

/** Short ammo label for stats table (first token / known UA keywords). */
export function ammoLabelFromBriefing(allowedAmmo: string): string {
  const t = allowedAmmo.trim()
  if (!t) return '—'
  const head = t.split(/[(\n]/)[0]?.trim() ?? ''
  if (!head) return '—'
  const lower = head.toLowerCase()
  if (lower.startsWith('картеч') || lower.includes('buckshot')) return 'Картеч'
  if (lower.startsWith('шріт') || lower.includes('birdshot') || lower.includes('shot')) return 'Шріт'
  if (lower.startsWith('куля') || lower.includes('slug')) return 'Куля'
  return head.length > 28 ? `${head.slice(0, 27)}…` : head
}

function pointsFromBriefingAndTargets(briefing: StageBriefing, targets: readonly Target[]): number {
  const fromBrief = parseBriefingOptionalPositiveInt(briefing.maxPoints)
  if (fromBrief !== null) return fromBrief
  const counts = computeMatchStageTargetCounts(targets)
  return (
    5 * (counts.poppers + counts.miniPoppers + counts.metalPlates + counts.ceramic) +
    10 * counts.paper
  )
}

function shotsFromBriefingAndTargets(briefing: StageBriefing, targets: readonly Target[]): number {
  const fromBrief = parseBriefingOptionalPositiveInt(briefing.recommendedShots)
  if (fromBrief !== null) return fromBrief
  return computeMinRounds(targets)
}

export function matchStageStatRowFromProject(
  sortOrder: number,
  project: StageProjectFileV1,
): Omit<MatchStageStatRow, 'matchPercent'> {
  const { stage, briefing } = project
  return {
    sortOrder,
    exerciseType: briefing.exerciseType,
    targets: computeMatchStageTargetCounts(stage.targets),
    ammoLabel: ammoLabelFromBriefing(briefing.allowedAmmo),
    shots: shotsFromBriefingAndTargets(briefing, stage.targets),
    points: pointsFromBriefingAndTargets(briefing, stage.targets),
  }
}

export function aggregateMatchProgrammeStats(
  partialRows: Omit<MatchStageStatRow, 'matchPercent'>[],
): MatchProgrammeStatsBundle {
  const totalPoints = partialRows.reduce((s, r) => s + r.points, 0)
  const rows: MatchStageStatRow[] = partialRows.map((r) => ({
    ...r,
    matchPercent: totalPoints > 0 ? Math.round((r.points / totalPoints) * 1000) / 10 : 0,
  }))

  const totals: MatchProgrammeStatsTotals = {
    paper: 0,
    metalPlates: 0,
    ceramic: 0,
    poppers: 0,
    miniPoppers: 0,
    shots: 0,
    points: totalPoints,
  }
  for (const r of rows) {
    totals.paper += r.targets.paper
    totals.metalPlates += r.targets.metalPlates
    totals.ceramic += r.targets.ceramic
    totals.poppers += r.targets.poppers
    totals.miniPoppers += r.targets.miniPoppers
    totals.shots += r.shots
  }

  return { rows, totals }
}
