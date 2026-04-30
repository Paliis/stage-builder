import { lazy } from 'react'

export const MatchListPageLazy = lazy(() =>
  import('./matches/MatchListPage').then((m) => ({ default: m.MatchListPage })),
)

export const MatchPublicDetailPageLazy = lazy(() =>
  import('./matches/MatchPublicDetailPage').then((m) => ({ default: m.MatchPublicDetailPage })),
)
