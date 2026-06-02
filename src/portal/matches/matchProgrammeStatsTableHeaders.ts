import type { MessageTree } from '../../i18n/messages'

export type ProgrammeStatsHeaderCell = { full: string; short: string }

/** Full + compact labels for responsive programme stats table headers. */
export function programmeStatsTableHeaders(
  p: MessageTree['portal'],
  loc: 'uk' | 'en',
): ProgrammeStatsHeaderCell[] {
  const abbr =
    loc === 'uk' ?
      {
        paper: 'Пап.',
        metal: 'Мет.',
        ceramic: 'Кер.',
        popper: 'Поп.',
        mini: 'Мін.',
        shots: 'Пост.',
        points: 'Оч.',
        pct: '%',
        type: 'Тип',
        ammo: 'Наб.',
      }
    : {
        paper: 'Pap.',
        metal: 'Met.',
        ceramic: 'Cer.',
        popper: 'Pop.',
        mini: 'Min.',
        shots: 'Sht.',
        points: 'Pts.',
        pct: '%',
        type: 'Typ',
        ammo: 'Ammo',
      }

  return [
    { full: p.matchDetailProgrammeStatsColStage, short: p.matchDetailProgrammeStatsColStage },
    { full: p.matchDetailProgrammeStatsColType, short: abbr.type },
    { full: p.matchDetailProgrammeStatsColPaper, short: abbr.paper },
    { full: p.matchDetailProgrammeStatsColMetal, short: abbr.metal },
    { full: p.matchDetailProgrammeStatsColCeramic, short: abbr.ceramic },
    { full: p.matchDetailProgrammeStatsColPopper, short: abbr.popper },
    { full: p.matchDetailProgrammeStatsColMiniPopper, short: abbr.mini },
    { full: p.matchDetailProgrammeStatsColAmmo, short: abbr.ammo },
    { full: p.matchDetailProgrammeStatsColShots, short: abbr.shots },
    { full: p.matchDetailProgrammeStatsColPoints, short: abbr.points },
    { full: p.matchDetailProgrammeStatsColPercent, short: abbr.pct },
  ]
}
