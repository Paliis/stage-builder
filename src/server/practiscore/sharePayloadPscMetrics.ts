import { inferPaperTargetsFromBriefing } from '../../domain/briefingPaperTargetHint'
import { parseStageProjectJson } from '../../domain/stageProjectFile'
import { computePscStageMetrics, type PscStageMetrics } from '../../domain/pscStageMetrics'
import { payloadToProjectText } from '../../share/payloadToProjectText'

/** Returns null if payload is missing or does not parse as a stage project file. */
export function tryPscStageMetricsFromSharePayload(payload: unknown): PscStageMetrics | null {
  const text = payloadToProjectText(payload)
  if (!text) return null
  const parsed = parseStageProjectJson(text)
  if (!parsed.ok) return null
  const fromScene = computePscStageMetrics(parsed.data.stage.targets)
  const fromBriefing = inferPaperTargetsFromBriefing(parsed.data.briefing.targetsDescription)
  return {
    ...fromScene,
    stage_numtargs: Math.max(fromScene.stage_numtargs, fromBriefing),
  }
}
