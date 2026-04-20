import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { Analytics } from '@vercel/analytics/react'
import { registerSW } from 'virtual:pwa-register'
import { hydrateSessionDraft } from './application/sessionDraft'
import { notifyPwaUpdateAvailable, setPwaApplyUpdate } from './application/pwaUpdateGate'
import { I18nProvider } from './i18n/I18nProvider'
import { GoogleAnalytics } from './presentation/components/GoogleAnalytics'
import { RoutePageViewAnalytics } from './presentation/components/RoutePageViewAnalytics'
import { PublishPolicyRoute } from './presentation/components/PublishPolicyRoute'
import { ShareStageRoute } from './share/ShareStageRoute'
import './index.css'
import App from './App.tsx'
import { PortalHome } from './portal/PortalHome'
import { PortalShell } from './portal/PortalShell'
import { RoHelperRouteSuspenseFallback } from './portal/RoHelperRouteSuspenseFallback'
import {
  RoHelperArticlePage,
  RoHelperCardDemo,
  RoHelperCategoryPage,
  RoHelperDisciplinePage,
  RoHelperHome,
  RoHelperLayout,
  RoHelperTopicsPage,
} from './portal/roHelperLazyRoutes'

hydrateSessionDraft()

const reloadForNewServiceWorker = registerSW({
  immediate: true,
  onNeedRefresh() {
    notifyPwaUpdateAvailable()
  },
})
setPwaApplyUpdate(reloadForNewServiceWorker)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <HelmetProvider>
        <BrowserRouter>
          <RoutePageViewAnalytics />
          <Routes>
            <Route element={<PortalShell />}>
              <Route path="/" element={<PortalHome />} />
              <Route path="/publish-policy" element={<PublishPolicyRoute />} />
              <Route
                path="/ro-helper"
                element={
                  <Suspense fallback={<RoHelperRouteSuspenseFallback />}>
                    <RoHelperLayout />
                  </Suspense>
                }
              >
                <Route index element={<RoHelperHome />} />
                <Route path="demo" element={<RoHelperCardDemo />} />
                <Route path="topics/:category" element={<RoHelperTopicsPage />} />
                <Route path=":discipline/:category/:slug" element={<RoHelperArticlePage />} />
                <Route path=":discipline/:category" element={<RoHelperCategoryPage />} />
                <Route path=":discipline" element={<RoHelperDisciplinePage />} />
              </Route>
            </Route>
            <Route path="/stage-builder" element={<App />} />
            <Route path="/v/:shareId" element={<ShareStageRoute mode="view" />} />
            <Route path="/e/:shareId" element={<ShareStageRoute mode="edit" />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Analytics />
        <GoogleAnalytics />
      </HelmetProvider>
    </I18nProvider>
  </StrictMode>,
)
