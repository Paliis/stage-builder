import { lazy } from 'react'

export const MatchPublicDetailPageLazy = lazy(() =>
  import('./matches/MatchPublicDetailPage').then((m) => ({ default: m.MatchPublicDetailPage })),
)

export const PlatformOrganizersPageLazy = lazy(() =>
  import('./admin/PlatformOrganizersPage').then((m) => ({ default: m.PlatformOrganizersPage })),
)
