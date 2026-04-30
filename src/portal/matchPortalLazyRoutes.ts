import { lazy } from 'react'

export const MatchPublicDetailPageLazy = lazy(() =>
  import('./matches/MatchPublicDetailPage').then((m) => ({ default: m.MatchPublicDetailPage })),
)

export const MatchPortalHomePageLazy = lazy(() =>
  import('./matches/MatchPortalHomePage').then((m) => ({ default: m.MatchPortalHomePage })),
)

export const OrganizerMatchesListPageLazy = lazy(() =>
  import('./matches/OrganizerMatchesListPage').then((m) => ({ default: m.OrganizerMatchesListPage })),
)

export const OrganizerMatchEditPageLazy = lazy(() =>
  import('./matches/OrganizerMatchEditPage').then((m) => ({ default: m.OrganizerMatchEditPage })),
)

export const OrganizerMatchRegistrationsPageLazy = lazy(() =>
  import('./matches/OrganizerMatchRegistrationsPage').then((m) => ({
    default: m.OrganizerMatchRegistrationsPage,
  })),
)

export const PlatformOrganizersPageLazy = lazy(() =>
  import('./admin/PlatformOrganizersPage').then((m) => ({ default: m.PlatformOrganizersPage })),
)

export const PortalAccountPageLazy = lazy(() =>
  import('./account/PortalAccountPage').then((m) => ({ default: m.PortalAccountPage })),
)
