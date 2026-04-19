/**
 * Split markdown body so the FPSU / Local section can be toggled independently of UI locale
 * (RO_HELPER_V0 §5.1 — layer vs language).
 */
const FPSU_HEADING = /^##\s+(Локально\s*\(ФПСУ\)|Local\s*\(FPSU\))\s*$/im

export function splitFpsuMarkdownBody(body: string): { main: string; fpsu: string | null } {
  const m = body.match(FPSU_HEADING)
  if (!m || m.index === undefined) return { main: body, fpsu: null }
  const idx = m.index
  const main = body.slice(0, idx).trimEnd()
  const fpsu = body.slice(idx).trim()
  return { main, fpsu }
}
