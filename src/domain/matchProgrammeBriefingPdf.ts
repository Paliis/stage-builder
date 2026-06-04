export const MATCH_PROGRAMME_BRIEFINGS_BUCKET = 'match-stage-briefings'

export const PROGRAMME_BRIEFING_PDF_MAX_BYTES = 15 * 1024 * 1024

export function buildProgrammeBriefingStoragePath(organizerId: string, matchId: string): string {
  return `${organizerId}/${matchId}/programme-briefing.pdf`
}

export function isAcceptedProgrammeBriefingPdf(file: File): boolean {
  if (file.type === 'application/pdf') return true
  return file.name.toLowerCase().endsWith('.pdf')
}

export function normalizeProgrammeBriefingPdfUrl(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const t = raw.trim()
  return t.length > 0 ? t : null
}
