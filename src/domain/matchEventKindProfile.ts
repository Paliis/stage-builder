import { isMatchEventKind, type MatchEventKind } from './matchTaxonomy'

export type RegistrationMode = 'full' | 'seminar_minimal'

export type MatchEventKindProfile = {
  kind: MatchEventKind | null
  showPsLevelField: boolean
  showPsLevelOnCard: boolean
  showDisciplineOnCard: boolean
  /** Organizer may toggle stage programme (seminar / training). */
  showProgrammeStagesToggle: boolean
  defaultProgrammeStagesEnabled: boolean
  registrationMode: RegistrationMode
}

const MATCH_LIKE: Omit<MatchEventKindProfile, 'kind'> = {
  showPsLevelField: true,
  showPsLevelOnCard: true,
  showDisciplineOnCard: true,
  showProgrammeStagesToggle: false,
  defaultProgrammeStagesEnabled: true,
  registrationMode: 'full',
}

/** UI + registration behaviour per `matches.match_event_kind` (product brief 2026-05). */
export function getMatchEventKindProfile(kind: string | null | undefined): MatchEventKindProfile {
  const k = kind && isMatchEventKind(kind) ? kind : null
  switch (k) {
    case 'seminar':
      return {
        kind: 'seminar',
        showPsLevelField: false,
        showPsLevelOnCard: false,
        showDisciplineOnCard: false,
        showProgrammeStagesToggle: true,
        defaultProgrammeStagesEnabled: false,
        registrationMode: 'seminar_minimal',
      }
    case 'training':
      return {
        kind: 'training',
        showPsLevelField: false,
        showPsLevelOnCard: false,
        showDisciplineOnCard: true,
        showProgrammeStagesToggle: true,
        defaultProgrammeStagesEnabled: true,
        registrationMode: 'full',
      }
    case 'classification':
      return { kind: 'classification', ...MATCH_LIKE }
    case 'match':
      return { kind: 'match', ...MATCH_LIKE }
    default:
      return { kind: null, ...MATCH_LIKE }
  }
}
