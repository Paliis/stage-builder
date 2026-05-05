import { formatTemplate } from '../../i18n/format'

export type ProgrammeSnapshotRow = {
  share_stage_id: string | null
  snapshot_meta: Record<string, unknown> | null
}

/** Stored label from link row — same basis as PSC export snapshot title. */
export function programmeSnapshotTitleRaw(r: ProgrammeSnapshotRow): string {
  const meta = r.snapshot_meta
  const snap = typeof meta?.title_snapshot === 'string' ? meta.title_snapshot.trim() : ''
  if (snap) return snap
  return r.share_stage_id?.trim() || '—'
}

type DuplicateOrdinalMsgs = {
  matchDetailProgrammeDuplicateOrdinalFallback: string
}

/** When every row has the identical snapshot title (common pasted briefing headings), rewrite leading exercise ordinal to match programme order. */
export function normalizeDuplicateProgrammeTitle(
  raw: string,
  listIndexZero: number,
  allRawTitles: readonly string[],
  p: DuplicateOrdinalMsgs,
): string {
  const trimmed = raw.trim()
  if (!trimmed) return raw

  const first = allRawTitles[0]?.trim() ?? ''
  const allDup =
    first.length > 0 &&
    allRawTitles.length > 1 &&
    allRawTitles.every((t) => t.trim() === first)

  if (!allDup) return raw

  const n = listIndexZero + 1

  let next = trimmed.replace(/^Вправа\s*№\s*\d+/iu, `Вправа №${n}`)
  if (next !== trimmed) return next

  next = trimmed.replace(/^Exercise\s*#\s*\d+/iu, `Exercise ${n}`)
  if (next !== trimmed) return next

  next = trimmed.replace(/^Exercise\s+\d+/iu, `Exercise ${n}`)
  if (next !== trimmed) return next

  return formatTemplate(p.matchDetailProgrammeDuplicateOrdinalFallback, { n, title: trimmed })
}

export function programmeListDisplayTitles(rows: ProgrammeSnapshotRow[], p: DuplicateOrdinalMsgs): string[] {
  const raws = rows.map(programmeSnapshotTitleRaw)
  return rows.map((_, idx) =>
    normalizeDuplicateProgrammeTitle(raws[idx] ?? '', idx, raws, p),
  )
}
