import type { MessageTree } from '../../i18n/messages'

type Portal = MessageTree['portal']

/** Map Postgres RPC errors from organizer_sync_match_squads to localized summaries. */
export function organizerSquadSyncErrorMessage(raw: string, p: Portal): string {
  const msg = raw.trim()
  if (msg.includes('Cannot remove prematch squads')) return p.matchOrgSyncErrPrematchRemove
  if (msg.includes('Cannot lower shooters-per-squad')) return p.matchOrgSyncErrLowerCapacity
  if (msg.includes('Cannot reduce squad count')) return p.matchOrgSyncErrReduceSquads
  if (msg.includes('not_match_owner')) return p.matchOrgEditNotFound
  if (msg.includes('organizer_not_active')) return p.matchOrgSyncErrOrganizerInactive
  return msg || p.matchOrgSyncErrGeneric
}
