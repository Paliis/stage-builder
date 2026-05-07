import type { MessageTree } from '../../i18n/messages'

type Portal = MessageTree['portal']

export type ParticipantPaymentOption = 'bank_transfer' | 'on_site'

export function parseParticipantPaymentOption(raw: unknown): ParticipantPaymentOption {
  return raw === 'on_site' ? 'on_site' : 'bank_transfer'
}

export function participantPaymentOptionLabel(p: Portal, option: ParticipantPaymentOption): string {
  return option === 'on_site' ? p.matchDetailRegistrationPaymentOnSite : p.matchDetailRegistrationPaymentBankTransfer
}
