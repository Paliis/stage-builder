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
/** Легка заливка «островів» штрафної зони на 2D-плані (узгоджено з VISIBILITY §4.5). */
export function plan2DGroundTintRgba(cover: FieldGroundCover3d): string {
  switch (cover) {
    case 'earth':
      return 'rgba(160, 128, 104, 0.28)'
    case 'grass':
      return 'rgba(61, 122, 56, 0.22)'
    case 'sand':
      return 'rgba(201, 184, 150, 0.26)'
    default:
      return 'rgba(61, 122, 56, 0.22)'
  }
}

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

function hexToRgb01(hex: string): { r: number; g: number; b: number } {
  const h = hex.startsWith('#') ? hex.slice(1) : hex
  const v = parseInt(h, 16)
  if (!Number.isFinite(v) || h.length < 6) return { r: 0.24, g: 0.47, b: 0.22 }
  return {
    r: ((v >> 16) & 255) / 255,
    g: ((v >> 8) & 255) / 255,
    b: (v & 255) / 255,
  }
}

/**
 * Базова заливка прямокутника поля на 2D-плані — той самий відтінок, що й `groundCoverColorHex` у 3D,
 * з невеликою прозорістю; зверху лишається шахматка кроком 1 м (`drawChessboard1m`).
 */
export function plan2DFieldBaseRgba(cover: FieldGroundCover3d, alpha = 0.2): string {
  const { r, g, b } = hexToRgb01(groundCoverColorHex(cover))
  const R = Math.round(r * 255)
  const G = Math.round(g * 255)
  const B = Math.round(b * 255)
  return `rgba(${R},${G},${B},${alpha})`
}
