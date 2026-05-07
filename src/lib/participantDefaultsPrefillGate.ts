import { isValidParticipantPhone } from './isValidParticipantPhone'

/** Row from `participant_registration_defaults` (subset). */
export type ParticipantDefaultsPrefillInput = {
  first_name?: string | null
  last_name?: string | null
  phone?: string | null
  weapon_class?: string | null
}

/**
 * Prefill match sign-up from cabinet only when identity + phone are set and weapon class matches the match.
 * Avoids e.g. auto-picking division when the profile is still empty or for the wrong weapon class.
 */
export function participantDefaultsCompleteForMatchPrefill(
  row: ParticipantDefaultsPrefillInput,
  matchWeaponClassId: string,
): boolean {
  const matchWc = matchWeaponClassId.trim()
  if (!matchWc) return false
  const fn = typeof row.first_name === 'string' ? row.first_name.trim() : ''
  const ln = typeof row.last_name === 'string' ? row.last_name.trim() : ''
  const ph = typeof row.phone === 'string' ? row.phone.trim() : ''
  const wc = typeof row.weapon_class === 'string' ? row.weapon_class.trim() : ''
  if (fn === '' || ln === '' || !isValidParticipantPhone(ph)) return false
  return wc !== '' && wc === matchWc
}
