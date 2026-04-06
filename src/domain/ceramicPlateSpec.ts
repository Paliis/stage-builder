const MM = 0.001

/**
 * Типова спортивна керамічна тарілка (напр. Eurotarget Standard): круг Ø 110 мм,
 * у каталогах часто «11×11 см» — зовнішній квадратний bbox.
 */
export const CERAMIC_RADIUS_M = 55 * MM

/** Яскравий «safety orange» для лиця (2D rgba / узгоджено з HEX). */
export const CERAMIC_FACE_HEX = '#ff6600'
export const CERAMIC_FACE_RGBA = 'rgba(255, 102, 0, 0.96)' as const
