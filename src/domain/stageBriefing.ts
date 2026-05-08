import type { StageCategory } from './models'

/**
 * Підстановка з сцени: макс. очки = мін. залікові постріли × це значення (залік «А» IPSC-стилю).
 */
export const BRIEFING_SCENE_SYNC_POINTS_PER_SCORING_HIT = 5

/** Поля таблиці брифінгу, як у класифікаційних вправах (PDF). */
export type StageBriefing = {
  /** Заголовок матчу у PDF (над назвою вправи); порожній — рядок не показується. */
  matchName: string
  documentTitle: string
  exerciseType: StageCategory
  /** Вільний текст, напр. «2 сталеві + 4 керамічні + 3 паперові мішені». */
  targetsDescription: string
  recommendedShots: string
  allowedAmmo: string
  maxPoints: string
  startSignal: string
  readyCondition: string
  startPosition: string
  procedure: string
  safetyAngles: string
  /** Показувати лого ФПСУ у заголовку PDF (`public/briefing-logos/`). */
  pdfLogoFpsu: boolean
  /** Показувати лого IPSC у заголовку PDF. */
  pdfLogoIpsc: boolean
}

export function defaultStageBriefing(): StageBriefing {
  return {
    matchName: '',
    documentTitle: '\u0412\u043f\u0440\u0430\u0432\u0430 \u21161',
    exerciseType: 'short',
    targetsDescription: '',
    recommendedShots: '',
    allowedAmmo: 'Шріт (максимальний розмір №3, не більше 3,5 мм в діаметрі)',
    maxPoints: '40',
    startSignal: 'Звуковий',
    readyCondition: 'Заряджено (Положення 1)',
    startPosition: '',
    procedure:
      'За сигналом таймера, вразити всі мішені, не виходячи за межі штрафних ліній. Металеві мішені мають впасти для заліку. Керамічні мішені (якщо є) мають мати явні сліди ураження.',
    safetyAngles: '90/90/90',
    pdfLogoFpsu: false,
    pdfLogoIpsc: false,
  }
}

export type BriefingPdfLabels = {
  /** Один рядок таблиці PDF: тип вправи + рекомендовані постріли. */
  exerciseTypeAndShots: string
  exerciseType: string
  targets: string
  recommendedShots: string
  allowedAmmo: string
  maxPoints: string
  startSignal: string
  readyCondition: string
  startPosition: string
  procedure: string
  safetyAngles: string
}

/** Parses briefing «Макс. очок» for PSC exports; empty or invalid → null. */
export function parseBriefingOptionalPositiveInt(raw: string): number | null {
  const t = raw.trim()
  if (!t) return null
  const n = Number.parseFloat(t.replace(',', '.'))
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.round(n)
}

export function briefingTableRows(
  b: StageBriefing,
  labels: BriefingPdfLabels,
  categoryLabel: (c: StageCategory) => string,
  emptyCell: string,
): { label: string; value: string }[] {
  const v = (s: string) => (s.trim() ? s : emptyCell)
  const cat = categoryLabel(b.exerciseType)
  const shots = b.recommendedShots.trim()
  const typeAndShotsValue = shots.length > 0 ? `${cat} · ${shots}` : cat
  return [
    { label: labels.exerciseTypeAndShots, value: typeAndShotsValue },
    { label: labels.targets, value: v(b.targetsDescription) },
    { label: labels.allowedAmmo, value: v(b.allowedAmmo) },
    { label: labels.maxPoints, value: v(b.maxPoints) },
    { label: labels.startSignal, value: v(b.startSignal) },
    { label: labels.readyCondition, value: v(b.readyCondition) },
    { label: labels.startPosition, value: v(b.startPosition) },
    { label: labels.procedure, value: v(b.procedure) },
    { label: labels.safetyAngles, value: v(b.safetyAngles) },
  ]
}
