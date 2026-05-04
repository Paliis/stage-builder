/**
 * Canonical ids for shooter profile defaults (account page, future PSC export).
 * Labels: UK / EN inline — keeps forms independent of huge i18n trees.
 */

export type ShooterCategoryDef = { id: string; labelUk: string; labelEn: string }

/** IPSC-style participant categories; shooter may have several (e.g. Lady + Junior). */
export const SHOOTER_CATEGORIES: readonly ShooterCategoryDef[] = [
  { id: 'lady', labelUk: 'Леді', labelEn: 'Lady' },
  { id: 'junior', labelUk: 'Юніор', labelEn: 'Junior' },
  { id: 'super_junior', labelUk: 'Супер-юніор', labelEn: 'Super Junior' },
  { id: 'lady_junior', labelUk: 'Леді-юніор', labelEn: 'Lady Junior' },
  { id: 'grand_junior', labelUk: 'Гранд-юніор', labelEn: 'Grand Junior' },
  { id: 'lady_grand_junior', labelUk: 'Леді гранд-юніор', labelEn: 'Lady Grand Junior' },
  { id: 'senior', labelUk: 'Сеньйор', labelEn: 'Senior' },
  { id: 'lady_senior', labelUk: 'Леді-сеньйор', labelEn: 'Lady Senior' },
  { id: 'super_senior', labelUk: 'Супер-сеньйор', labelEn: 'Super Senior' },
  { id: 'grand_senior', labelUk: 'Гранд-сеньйор', labelEn: 'Grand Senior' },
  { id: 'military', labelUk: 'Військовий', labelEn: 'Military' },
  { id: 'law_enforcement', labelUk: 'Правоохоронець', labelEn: 'Law enforcement' },
] as const

export type WeaponClassId = (typeof WEAPON_CLASS_ORDER)[number]

/** Fixed order in dropdowns. */
export const WEAPON_CLASS_ORDER = ['shotgun', 'handgun', 'rifle', 'pcc', 'mini_rifle'] as const

export type DivisionDef = { id: string; labelUk: string; labelEn: string }

const SG: DivisionDef[] = [
  { id: 'open', labelUk: 'Open', labelEn: 'Open' },
  { id: 'modified', labelUk: 'Modified', labelEn: 'Modified' },
  { id: 'standard', labelUk: 'Standard', labelEn: 'Standard' },
  { id: 'standard_manual', labelUk: 'Standard Manual', labelEn: 'Standard Manual' },
]

const HG: DivisionDef[] = [
  { id: 'open', labelUk: 'Open', labelEn: 'Open' },
  { id: 'standard', labelUk: 'Standard', labelEn: 'Standard' },
  { id: 'classic', labelUk: 'Classic', labelEn: 'Classic' },
  { id: 'production', labelUk: 'Production', labelEn: 'Production' },
  { id: 'production_optics', labelUk: 'Production Optics', labelEn: 'Production Optics' },
  { id: 'carry_optics', labelUk: 'Carry Optics', labelEn: 'Carry Optics' },
  { id: 'revolver', labelUk: 'Revolver', labelEn: 'Revolver' },
]

const RF: DivisionDef[] = [
  { id: 'open', labelUk: 'Open', labelEn: 'Open' },
  { id: 'standard', labelUk: 'Standard', labelEn: 'Standard' },
  { id: 'semi_auto', labelUk: 'Semi-auto', labelEn: 'Semi-auto' },
  { id: 'manual_action', labelUk: 'Manual action', labelEn: 'Manual action' },
]

const PCC: DivisionDef[] = [
  { id: 'open', labelUk: 'Open', labelEn: 'Open' },
  { id: 'standard', labelUk: 'Standard', labelEn: 'Standard' },
  { id: 'classic', labelUk: 'Classic', labelEn: 'Classic' },
  { id: 'carry_optics', labelUk: 'Carry Optics', labelEn: 'Carry Optics' },
]

const MINI: DivisionDef[] = [
  { id: 'open', labelUk: 'Open', labelEn: 'Open' },
  { id: 'standard', labelUk: 'Standard', labelEn: 'Standard' },
]

export const WEAPON_CLASS_META: Record<
  WeaponClassId,
  { labelUk: string; labelEn: string; divisions: DivisionDef[] }
> = {
  shotgun: { labelUk: 'Рушниця (IPSC Shotgun)', labelEn: 'Shotgun (IPSC)', divisions: SG },
  handgun: { labelUk: 'Пістолет (IPSC Handgun)', labelEn: 'Handgun (IPSC)', divisions: HG },
  rifle: { labelUk: 'Гвинтівка (IPSC Rifle)', labelEn: 'Rifle (IPSC)', divisions: RF },
  pcc: { labelUk: 'PCC', labelEn: 'PCC', divisions: PCC },
  mini_rifle: { labelUk: 'Mini Rifle', labelEn: 'Mini Rifle', divisions: MINI },
}

export function divisionsForWeapon(weaponClassId: string | undefined | null): DivisionDef[] {
  if (!weaponClassId || !(weaponClassId in WEAPON_CLASS_META)) return []
  return WEAPON_CLASS_META[weaponClassId as WeaponClassId].divisions
}

export function isValidDivisionForWeapon(weaponClassId: string, divisionId: string): boolean {
  return divisionsForWeapon(weaponClassId).some((d) => d.id === divisionId)
}

export function categoryLabel(id: string, locale: 'uk' | 'en'): string {
  const row = SHOOTER_CATEGORIES.find((c) => c.id === id)
  if (!row) return id
  return locale === 'en' ? row.labelEn : row.labelUk
}

export function divisionLabel(weaponClassId: string, divisionId: string, locale: 'uk' | 'en'): string {
  const d = divisionsForWeapon(weaponClassId).find((x) => x.id === divisionId)
  if (!d) return divisionId
  return locale === 'en' ? d.labelEn : d.labelUk
}

export function weaponClassLabel(id: string, locale: 'uk' | 'en'): string {
  const m = WEAPON_CLASS_META[id as WeaponClassId]
  if (!m) return id
  return locale === 'en' ? m.labelEn : m.labelUk
}
