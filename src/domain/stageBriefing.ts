import type { StageCategory } from './models'

/** Поля таблиці брифінгу, як у класифікаційних вправах (PDF). */
export type StageBriefing = {
  documentTitle: string
  exerciseType: StageCategory
  /** Вільний текст, напр. «8 металевих тарілок + 2 штрафні тарілки». */
  targetsDescription: string
  recommendedShots: string
  allowedAmmo: string
  maxPoints: string
  startSignal: string
  readyCondition: string
  startPosition: string
  procedure: string
  safetyAngles: string
}

export function defaultStageBriefing(): StageBriefing {
  return {
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
      'За сигналом таймера, вразити всі мішені, не виходячи за межі штрафних ліній. Металеві мішені мають впасти для заліку.',
    safetyAngles: '90/90/90',
  }
}

export type BriefingPdfLabels = {
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

export function briefingTableRows(
  b: StageBriefing,
  labels: BriefingPdfLabels,
  categoryLabel: (c: StageCategory) => string,
  emptyCell: string,
): { label: string; value: string }[] {
  const v = (s: string) => (s.trim() ? s : emptyCell)
  return [
    { label: labels.exerciseType, value: categoryLabel(b.exerciseType) },
    { label: labels.targets, value: v(b.targetsDescription) },
    { label: labels.recommendedShots, value: v(b.recommendedShots) },
    { label: labels.allowedAmmo, value: v(b.allowedAmmo) },
    { label: labels.maxPoints, value: v(b.maxPoints) },
    { label: labels.startSignal, value: v(b.startSignal) },
    { label: labels.readyCondition, value: v(b.readyCondition) },
    { label: labels.startPosition, value: v(b.startPosition) },
    { label: labels.procedure, value: v(b.procedure) },
    { label: labels.safetyAngles, value: v(b.safetyAngles) },
  ]
}
