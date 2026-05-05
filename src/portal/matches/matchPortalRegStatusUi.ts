/** Shared portal CSS class names for subtle pending (amber) / confirmed (green) registration cues. */

export function portalMatchRegLabelClass(status: string): string {
  if (status === 'confirmed') return 'portal-match-reg-label portal-match-reg-label--confirmed'
  if (status === 'pending') return 'portal-match-reg-label portal-match-reg-label--pending'
  return 'portal-match-reg-label portal-match-reg-label--muted'
}

export function portalMatchRegRowClass(
  inactive: boolean,
  regStatus: string,
  /** Active row: draft / control value; ignored when `inactive`. */
  controlValue: 'pending' | 'confirmed',
): string | undefined {
  if (inactive) {
    if (regStatus === 'confirmed') return 'portal-match-roster-tr--faint-confirmed'
    if (regStatus === 'pending') return 'portal-match-roster-tr--faint-pending'
    return undefined
  }
  return controlValue === 'confirmed' ? 'portal-match-roster-tr--confirmed' : 'portal-match-roster-tr--pending'
}

export function portalMatchRegSelectClass(value: 'pending' | 'confirmed'): string {
  const tone = value === 'confirmed' ? 'portal-match-reg-select--confirmed' : 'portal-match-reg-select--pending'
  return `portal-match-reg-select ${tone}`
}

export function portalMatchRegCardCueClass(value: 'pending' | 'confirmed'): string {
  return value === 'confirmed' ? 'portal-match-reg-cue-confirmed' : 'portal-match-reg-cue-pending'
}
