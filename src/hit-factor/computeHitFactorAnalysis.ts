export type PowerFactor = 'minor' | 'major'

export type HitFactorAnalysisInput = {
  /** Total required scoring hits (minimum scoring hits). */
  requiredHits: number
  /**
   * Baseline elapsed time (seconds) without any add-ons like make-up shots.
   * Used for max HF (all-alpha at the planned pace).
   */
  timeBaseSec: number
  /**
   * Actual elapsed time (seconds) including any add-ons like make-up shots.
   * Used for actual HF and all "seconds equivalent" values.
   */
  timeActualSec: number
  powerFactor: PowerFactor

  /** Deviations from an "all alpha" baseline (count of occurrences). */
  deltaCharlie: number
  deltaDelta: number
  deltaMiss: number
  deltaNoShoot: number
  deltaProcedural: number
}

export type HitFactorAnalysisOutput = {
  maxPoints: number
  actualPoints: number
  pointsDelta: number

  hfMax: number | null
  hfActual: number | null

  /** Relative loss vs max HF, in percent (0..100+). */
  hfLossPct: number | null

  /** Seconds needed to compensate a given points delta at current HF. */
  secondsToOffsetPoints: (pointsDeltaAbs: number) => number | null

  perError: {
    charlie: { points: number; seconds: number | null }
    delta: { points: number; seconds: number | null }
    miss: { points: number; seconds: number | null }
    procedural: { points: number; seconds: number | null }
    noShoot: { points: number; seconds: number | null }
    plus1s: { seconds: number | null; hf: number | null }
    minus1s: { seconds: number | null; hf: number | null }
  }
}

function clampIntNonNegative(v: number): number {
  if (!Number.isFinite(v)) return 0
  return Math.max(0, Math.trunc(v))
}

function clampPositiveTime(v: number): number | null {
  if (!Number.isFinite(v)) return null
  if (v <= 0) return null
  return v
}

export function computeHitFactorAnalysis(raw: HitFactorAnalysisInput): HitFactorAnalysisOutput {
  const requiredHits = clampIntNonNegative(raw.requiredHits)
  const timeBaseSec = clampPositiveTime(raw.timeBaseSec)
  const timeActualSec = clampPositiveTime(raw.timeActualSec)

  const pointsA = 5
  const pointsC = raw.powerFactor === 'major' ? 4 : 3
  const pointsD = raw.powerFactor === 'major' ? 2 : 1

  const dC = pointsC - pointsA // negative
  const dD = pointsD - pointsA // negative
  const dProc = -10
  const dNS = -10
  // In "deviations from all-alpha" model, a Miss is -10 penalty + lost Alpha points.
  const dMiss = -(pointsA + 10)

  const deltaCharlie = clampIntNonNegative(raw.deltaCharlie)
  const deltaDelta = clampIntNonNegative(raw.deltaDelta)
  const deltaMiss = clampIntNonNegative(raw.deltaMiss)
  const deltaNoShoot = clampIntNonNegative(raw.deltaNoShoot)
  const deltaProcedural = clampIntNonNegative(raw.deltaProcedural)

  const maxPoints = requiredHits * pointsA
  const pointsDelta =
    deltaCharlie * dC +
    deltaDelta * dD +
    deltaMiss * dMiss +
    deltaProcedural * dProc +
    deltaNoShoot * dNS

  const actualPoints = maxPoints + pointsDelta

  const hfMax = timeBaseSec ? maxPoints / timeBaseSec : null
  const hfActual = timeActualSec ? actualPoints / timeActualSec : null

  const hfLossPct =
    hfMax !== null && hfActual !== null && hfMax > 0 ? ((hfMax - hfActual) / hfMax) * 100 : null

  const secondsToOffsetPoints = (pointsDeltaAbs: number) => {
    if (hfActual === null) return null
    if (!Number.isFinite(pointsDeltaAbs)) return null
    if (hfActual <= 0) return null
    if (pointsDeltaAbs <= 0) return 0
    return pointsDeltaAbs / hfActual
  }

  const perError = {
    charlie: { points: dC, seconds: secondsToOffsetPoints(Math.abs(dC)) },
    delta: { points: dD, seconds: secondsToOffsetPoints(Math.abs(dD)) },
    miss: { points: dMiss, seconds: secondsToOffsetPoints(Math.abs(dMiss)) },
    procedural: { points: dProc, seconds: secondsToOffsetPoints(Math.abs(dProc)) },
    noShoot: { points: dNS, seconds: secondsToOffsetPoints(Math.abs(dNS)) },
    plus1s: {
      seconds: timeActualSec ? 1 : null,
      hf: timeActualSec ? actualPoints / (timeActualSec + 1) : null,
    },
    minus1s: {
      seconds: timeActualSec && timeActualSec > 1 ? -1 : null,
      hf: timeActualSec && timeActualSec > 1 ? actualPoints / (timeActualSec - 1) : null,
    },
  }

  return {
    maxPoints,
    actualPoints,
    pointsDelta,
    hfMax,
    hfActual,
    hfLossPct,
    secondsToOffsetPoints,
    perError,
  }
}

