import type { MessageTree } from '../i18n/messages'
import type { RoHelperCategory, RoHelperDiscipline } from './constants'

export function disciplineLabel(d: RoHelperDiscipline, rh: MessageTree['roHelper']): string {
  switch (d) {
    case 'handgun':
      return rh.discHandgun
    case 'pcc':
      return rh.discPcc
    case 'rifle':
      return rh.discRifle
    case 'mini_rifle':
      return rh.discMiniRifle
    case 'shotgun':
      return rh.discShotgun
    default:
      return d
  }
}

export function categoryLabel(c: RoHelperCategory, rh: MessageTree['roHelper']): string {
  switch (c) {
    case 'safety':
      return rh.catSafety
    case 'penalties':
      return rh.catPenalties
    case 'scoring':
      return rh.catScoring
    case 'equipment':
      return rh.catEquipment
    case 'match-admin':
      return rh.catMatchAdmin
    default:
      return c
  }
}
