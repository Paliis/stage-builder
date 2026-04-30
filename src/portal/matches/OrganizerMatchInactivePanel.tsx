import { Link } from 'react-router-dom'
import type { MessageTree } from '../../i18n/messages'
import type { OrganizerSelfProfileKind } from '../useOrganizerSelfServiceProfile'
import '../account/PortalAccountPage.css'

type Portal = MessageTree['portal']

export function OrganizerMatchInactivePanel({
  locale,
  p,
  profile,
  moderationNote,
}: {
  locale: string
  p: Portal
  profile: OrganizerSelfProfileKind
  moderationNote: string | null
}) {
  const lead =
    profile === 'pending' ? p.organizerMatchAccessDeniedPendingBody
    : profile === 'blocked' ? p.organizerMatchAccessDeniedBlockedBody
    : p.organizerMatchAccessDeniedMissingBody

  return (
    <div style={{ maxWidth: '42rem', fontSize: '0.94rem', lineHeight: 1.55 }}>
      <p role="status" style={{ margin: '0 0 0.85rem' }}>
        {lead}
      </p>
      {profile === 'blocked' && moderationNote ?
        <span className="portal-account__moderation-quote">
          <strong style={{ display: 'block', marginBottom: '0.35rem' }}>{p.accountOrganizerModerationHeading}</strong>
          {moderationNote}
        </span>
      : null}
      <p style={{ margin: 0 }}>
        <Link to={`/${locale}/matches`}>{p.matchDetailBackToList}</Link>
        {' · '}
        <Link to={`/${locale}/account`}>{p.organizerMatchAccessGoAccount}</Link>
      </p>
    </div>
  )
}
