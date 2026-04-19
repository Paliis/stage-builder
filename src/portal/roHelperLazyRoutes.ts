import { lazy } from 'react'

export const RoHelperLayout = lazy(() => import('../ro-helper/RoHelperLayout').then((m) => ({ default: m.RoHelperLayout })))
export const RoHelperHome = lazy(() => import('../ro-helper/RoHelperHome').then((m) => ({ default: m.RoHelperHome })))
export const RoHelperCardDemo = lazy(() => import('./RoHelperCardDemo').then((m) => ({ default: m.RoHelperCardDemo })))
export const RoHelperTopicsPage = lazy(() =>
  import('../ro-helper/RoHelperTopicsPage').then((m) => ({ default: m.RoHelperTopicsPage })),
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
