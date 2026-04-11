import type { PropType, TargetType } from './models'

/** Режим «клац по плану»: після вибору типу в тулбарі кожен клік ставить об’єкт у точці. */
export type PlacementMode =
  | null
  | { kind: 'target'; type: TargetType; isNoShoot: boolean }
  | { kind: 'prop'; type: PropType }
  /** Замкнений контур штрафної зони (BL-019): після замикання — новий полігон або дірка (за геометрією). */
  | { kind: 'penaltyZoneContour' }
