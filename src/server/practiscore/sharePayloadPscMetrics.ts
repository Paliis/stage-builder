import { parseStageProjectJson } from '../../domain/stageProjectFile'
import { computePscStageMetrics, type PscStageMetrics } from '../../domain/pscStageMetrics'
import { payloadToProjectText } from '../../share/payloadToProjectText'

/** Returns null if payload is missing or does not parse as a stage project file. */
export function tryPscStageMetricsFromSharePayload(payload: unknown): PscStageMetrics | null {
  const text = payloadToProjectText(payload)
  if (!text) return null
  const parsed = parseStageProjectJson(text)
  if (!parsed.ok) return null
  return computePscStageMetrics(parsed.data.stage.targets)
}
