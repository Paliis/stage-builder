import { lazy } from 'react'

export const RoHelperLayout = lazy(() =>
  import('../ro-helper/RoHelperLayout').then((m) => ({ default: m.RoHelperLayout })),
)
export const RoHelperHome = lazy(() =>
  import('../ro-helper/RoHelperHome').then((m) => ({ default: m.RoHelperHome })),
)
export const RoHelperArticlePage = lazy(() =>
  import('../ro-helper/RoHelperArticlePage').then((m) => ({ default: m.RoHelperArticlePage })),
)
export const RoHelperCategoryPage = lazy(() =>
  import('../ro-helper/RoHelperCategoryPage').then((m) => ({ default: m.RoHelperCategoryPage })),
)
export const RoHelperDisciplinePage = lazy(() =>
  import('../ro-helper/RoHelperDisciplinePage').then((m) => ({ default: m.RoHelperDisciplinePage })),
)
