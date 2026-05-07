/**
 * Participant phone UI / forms: sane international format without pulling libphonenumber.
 * Allows + only as first char, optional spaces/parentheses/hyphens; 7–15 digits total (ITU E.164 max).
 */
export function isValidParticipantPhone(input: string): boolean {
  const t = input.trim()
  if (t.length === 0) return false
  if (!/^[+]?(?:[0-9]|[\s().-])*$/.test(t)) return false
  const plusAt = t.indexOf('+')
  if (plusAt !== -1 && plusAt !== 0) return false
  const digitCount = (t.match(/\d/g) ?? []).length
  return digitCount >= 7 && digitCount <= 15
}
