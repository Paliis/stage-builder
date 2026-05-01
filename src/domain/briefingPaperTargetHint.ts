/**
 * Derive a paper-target count hint from the briefing table line «Мішені (текст)».
 * Matches wording produced by `summarizeTargets` (UA/EN) and common nom. plural UA.
 * Used when PSC metrics are built from the share payload: scene targets may miss paper
 * while the PDF line still lists them.
 */
export function inferPaperTargetsFromBriefing(targetsDescription: string): number {
  const s = targetsDescription.replace(/\u00A0/g, ' ')
  if (!s.trim()) return 0

  let max = 0
  const bump = (re: RegExp) => {
    for (const m of s.matchAll(re)) {
      const n = Number.parseInt(m[1]!, 10)
      if (Number.isFinite(n) && n >= 0 && n <= 999) max = Math.max(max, n)
    }
  }

  // Avoid `\b` — JS word boundaries align with `\w` (ASCII-ish), Cyrillic tails break matches.
  bump(/(?:^|\D)(\d+)\s+паперових\s+мішен(?:ей|ь)/giu)
  bump(/(?:^|\D)(\d+)\s+паперові\s+мішен(?:і|ей|ь)/giu)
  bump(/(?:^|\D)(\d+)\s+паперова\s+мішень/giu)
  bump(/(?:^|\D)(\d+)\s+paper\s+targets?/giu)

  return max
}
