/**
 * Canonical ids for shooter profile defaults (account page, future PSC export).
 * Labels: UK / EN inline — keeps forms independent of huge i18n trees.
 */

export type ShooterCategoryDef = { id: string; labelUk: string; labelEn: string }

/** IPSC-style participant categories; shooter may have several (e.g. Lady + Junior). */
export const SHOOTER_CATEGORIES: readonly ShooterCategoryDef[] = [
  { id: 'general', labelUk: 'Загальна', labelEn: 'General' },
  { id: 'lady', labelUk: 'Леді', labelEn: 'Lady' },
  { id: 'junior', labelUk: 'Юніор', labelEn: 'Junior' },
  { id: 'lady_junior', labelUk: 'Леді-юніор', labelEn: 'Lady Junior' },
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
  rifle: { labelUk: 'Карабін (IPSC Rifle)', labelEn: 'Rifle (IPSC)', divisions: RF },
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

export function isWeaponClassId(v: string | null | undefined): v is WeaponClassId {
  return typeof v === 'string' && (WEAPON_CLASS_ORDER as readonly string[]).includes(v)
}

/** Parsed `matches.discipline`; empty/unknown → null (no default shotgun). */
export function parseMatchDiscipline(discipline: string | null | undefined): WeaponClassId | null {
  if (!discipline?.trim()) return null
  const id = discipline.trim()
  return isWeaponClassId(id) ? id : null
}

const SHOOTER_CATEGORY_ID_SET = new Set(SHOOTER_CATEGORIES.map((c) => c.id))
const SHOOTER_CATEGORY_ORDER = new Map(SHOOTER_CATEGORIES.map((c, i) => [c.id, i]))

/** Stored when no special category applies; also used if the user leaves the multi-select empty. */
export const DEFAULT_SHOOTER_CATEGORY_ID = 'general' as const

function sortShooterCategoryIds(ids: string[]): string[] {
  return [...new Set(ids)].sort((a, b) => (SHOOTER_CATEGORY_ORDER.get(a) ?? 99) - (SHOOTER_CATEGORY_ORDER.get(b) ?? 99))
}

/**
 * Normalizes category ids for DB / JSON: empty or only "general" → `['general']`;
 * if any other id is present, "general" is dropped (special categories replace default).
 */
export function resolveShooterCategoriesForStorage(selectedIds: readonly string[]): string[] {
  const valid = selectedIds.filter((id) => SHOOTER_CATEGORY_ID_SET.has(id))
  const other = valid.filter((id) => id !== DEFAULT_SHOOTER_CATEGORY_ID)
  if (other.length > 0) return sortShooterCategoryIds(other)
  if (valid.includes(DEFAULT_SHOOTER_CATEGORY_ID)) return [DEFAULT_SHOOTER_CATEGORY_ID]
  return [DEFAULT_SHOOTER_CATEGORY_ID]
}

function lookupKeysForStoredValue(s: string): string[] {
  const t = s.trim().toLowerCase()
  if (!t) return []
  return [t, t.replace(/[\s-]+/g, '_')]
}

function buildCatalogAliasMap(entries: readonly { id: string; labelUk: string; labelEn: string }[]): Map<string, string> {
  const m = new Map<string, string>()
  for (const e of entries) {
    for (const key of new Set([
      ...lookupKeysForStoredValue(e.id),
      ...lookupKeysForStoredValue(e.labelEn),
      ...lookupKeysForStoredValue(e.labelUk),
    ])) {
      if (key) m.set(key, e.id)
    }
  }
  return m
}

const CATEGORY_ALIAS_TO_ID = buildCatalogAliasMap(SHOOTER_CATEGORIES)

const DIVISION_ALIAS_BY_WEAPON = new Map<WeaponClassId, Map<string, string>>(
  WEAPON_CLASS_ORDER.map((w) => [w, buildCatalogAliasMap(WEAPON_CLASS_META[w].divisions)]),
)

/** Map legacy label casing (e.g. "Modified", "Lady") to canonical catalog id. */
export function canonicalShooterCategoryId(raw: string): string {
  const t = raw.trim()
  if (!t) return ''
  for (const key of lookupKeysForStoredValue(t)) {
    const id = CATEGORY_ALIAS_TO_ID.get(key)
    if (id) return id
  }
  return t.toLowerCase()
}

export function canonicalDivisionId(discipline: string | null | undefined, raw: string): string {
  const t = raw.trim()
  if (!t) return ''
  const weapon = parseMatchDiscipline(discipline)
  if (weapon) {
    const map = DIVISION_ALIAS_BY_WEAPON.get(weapon)
    if (map) {
      for (const key of lookupKeysForStoredValue(t)) {
        const id = map.get(key)
        if (id) return id
      }
    }
  }
  return t.toLowerCase()
}
