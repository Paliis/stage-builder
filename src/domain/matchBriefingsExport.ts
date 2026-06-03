export type MatchBriefingsPdfDisposition = 'inline' | 'attachment'

export function matchBriefingsPdfFileName(matchTitle: string): string {
  const safe = matchTitle
    .trim()
    .replace(/[^\p{L}\p{N}\s_-]+/gu, '')
    .replace(/\s+/g, '-')
    .slice(0, 60)
  return `${safe || 'match'}-briefings.pdf`
}

export function matchBriefingsPdfApiUrl(
  matchId: string,
  locale: string,
  disposition: MatchBriefingsPdfDisposition = 'inline',
): string {
  const params = new URLSearchParams({
    matchId,
    lang: locale === 'en' ? 'en' : 'uk',
    disposition,
  })
  return `/api/match-export-briefings?${params.toString()}`
}

/** RFC 5987 filename for Cyrillic titles in Content-Disposition. */
export function matchBriefingsPdfContentDisposition(
  fileName: string,
  disposition: MatchBriefingsPdfDisposition,
): string {
  const asciiFallback = fileName.replace(/[^\x20-\x7E]/g, '_').replace(/"/g, '')
  const encoded = encodeURIComponent(fileName)
  return `${disposition}; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`
}
