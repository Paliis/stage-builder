import type { PropType, TargetType } from './models'

/** Режим «клац по плану»: після вибору типу в тулбарі кожен клік ставить об’єкт у точці. */
export type PlacementMode =
  | null
  | { kind: 'target'; type: TargetType; isNoShoot: boolean }
  | { kind: 'prop'; type: PropType }
  /** Зовнішній контур штрафної зони (BL-019): клік додає вершину; замикання біля першої точки. */
  | { kind: 'penaltyZoneOuter' }
  /** Дірка всередині полігона `polygonId` (той самий інструмент, що зовнішній контур). */
  | { kind: 'penaltyZoneHole'; polygonId: string }
