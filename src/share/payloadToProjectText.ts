/** Convert `shared_stages.payload` (JSONB) to a string for `parseStageProjectJson`. */
export function payloadToProjectText(payload: unknown): string | null {
  if (payload == null) return null
  if (typeof payload === 'string') return payload
  if (typeof payload === 'object') return JSON.stringify(payload)
  return null
}
