import { lazy } from 'react'

export const MatchPublicDetailPageLazy = lazy(() =>
  import('./matches/MatchPublicDetailPage').then((m) => ({ default: m.MatchPublicDetailPage })),
)

export const OrganizerMatchesListPageLazy = lazy(() =>
  import('./matches/OrganizerMatchesListPage').then((m) => ({ default: m.OrganizerMatchesListPage })),
)

export const OrganizerMatchEditPageLazy = lazy(() =>
  import('./matches/OrganizerMatchEditPage').then((m) => ({ default: m.OrganizerMatchEditPage })),
)

export const PlatformOrganizersPageLazy = lazy(() =>
  import('./admin/PlatformOrganizersPage').then((m) => ({ default: m.PlatformOrganizersPage })),
)
