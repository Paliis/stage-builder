import { lazy } from 'react'

export const MatchPublicDetailPageLazy = lazy(() =>
  import('./matches/MatchPublicDetailPage').then((m) => ({ default: m.MatchPublicDetailPage })),
)
