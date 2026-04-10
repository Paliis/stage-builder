/**
 * Покриття площадки в 3D-перегляді (зберігається у вправі та чернетці сесії).
 */
export type FieldGroundCover3d = 'earth' | 'grass' | 'sand'

export const DEFAULT_FIELD_GROUND_COVER_3D: FieldGroundCover3d = 'grass'

export const FIELD_GROUND_COVER_3D_VALUES: FieldGroundCover3d[] = ['earth', 'grass', 'sand']

export function normalizeFieldGroundCover3d(raw: unknown): FieldGroundCover3d {
  if (raw === 'earth' || raw === 'grass' || raw === 'sand') return raw
  return DEFAULT_FIELD_GROUND_COVER_3D
}

/** Колір `meshStandardMaterial` підлоги для кожного варіанту. */
export function groundCoverColorHex(cover: FieldGroundCover3d): string {
  switch (cover) {
    case 'earth':
      /** Світліший суглинок — темніший виглядав майже чорним під тінями PBR. */
      return '#a08068'
    case 'grass':
      return '#3d7a38'
    case 'sand':
      return '#c9b896'
    default:
      return '#3d7a38'
  }
}
