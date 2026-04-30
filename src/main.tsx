import { StrictMode, Suspense, lazy } from 'react'
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
import { HitFactorRoute } from './portal/HitFactorRoute'
import { RoHelperRouteSuspenseFallback } from './portal/RoHelperRouteSuspenseFallback'
import { isMatchPortalEnabled, isRoHelperEnabled } from './portal/featureFlags'
import {
  RoHelperArticlePage,
  RoHelperCategoryPage,
  RoHelperDisciplinePage,
  RoHelperHome,
  RoHelperLayout,
} from './portal/roHelperLazyRoutes'
import { PortalLocaleGate } from './portal/PortalLocaleGate'
import {
  LegacyHitFactorRedirect,
  LegacyPublishPolicyRedirect,
  LegacyRoHelperTreeRedirect,
  RootRedirect,
} from './portal/legacyPortalRedirects'
import { MatchPublicDetailPageLazy } from './portal/matchPortalLazyRoutes'
import { getInitialLocale } from './i18n/storage'

const LazyDevSupabaseAuthSmoke =
  import.meta.env.DEV ?
    lazy(() =>
      import('./portal/DevSupabaseAuthSmoke').then((m) => ({ default: m.DevSupabaseAuthSmoke })),
    )
  : null

hydrateSessionDraft()

const reloadForNewServiceWorker = registerSW({
  immediate: true,
  onNeedRefresh() {
    notifyPwaUpdateAvailable()
  },
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return

    const checkForUpdate = () => {
      void registration.update().catch(() => {
        // ignore transient network errors
      })
    }

    // Check once right after registration (helps long-lived tabs).
    checkForUpdate()

    // Periodic update checks so open PWA tabs still receive updates.
    window.setInterval(checkForUpdate, 60 * 60 * 1000)

    // When user returns to the tab/app, check again.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') checkForUpdate()
    })
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
            <Route path="/" element={<RootRedirect />} />
            <Route path="/hit-factor" element={<LegacyHitFactorRedirect />} />
            <Route path="/publish-policy" element={<LegacyPublishPolicyRedirect />} />
            <Route path="/ro-helper" element={<LegacyRoHelperTreeRedirect />} />
            <Route path="/ro-helper/*" element={<LegacyRoHelperTreeRedirect />} />
            <Route path="/tools/ro-helper" element={<LegacyRoHelperTreeRedirect />} />
            <Route path="/tools/ro-helper/*" element={<LegacyRoHelperTreeRedirect />} />
            <Route element={<PortalShell />}>
              <Route path=":locale" element={<PortalLocaleGate />}>
                <Route index element={<PortalHome />} />
                {LazyDevSupabaseAuthSmoke ? (
                  <Route
                    path="dev/supabase-auth-smoke"
                    element={
                      <Suspense fallback={null}>
                        <LazyDevSupabaseAuthSmoke />
                      </Suspense>
                    }
                  />
                ) : null}
                <Route path="hit-factor" element={<HitFactorRoute />} />
                {isMatchPortalEnabled() ? (
                  <Route
                    path="matches/:matchId"
                    element={
                      <Suspense fallback={<RoHelperRouteSuspenseFallback />}>
                        <MatchPublicDetailPageLazy />
                      </Suspense>
                    }
                  />
                ) : null}
                <Route path="publish-policy" element={<PublishPolicyRoute />} />
                {isRoHelperEnabled() ? (
                  <Route
                    path="tools/ro-helper"
                    element={
                      <Suspense fallback={<RoHelperRouteSuspenseFallback />}>
                        <RoHelperLayout />
                      </Suspense>
                    }
                  >
                    <Route index element={<RoHelperHome />} />
                    <Route path=":discipline/:category/:slug" element={<RoHelperArticlePage />} />
                    <Route path=":discipline/:category" element={<RoHelperCategoryPage />} />
                    <Route path=":discipline" element={<RoHelperDisciplinePage />} />
                  </Route>
                ) : null}
              </Route>
            </Route>
            <Route path="/stage-builder" element={<App />} />
            <Route path="/v/:shareId" element={<ShareStageRoute mode="view" />} />
            <Route path="/e/:shareId" element={<ShareStageRoute mode="edit" />} />
            <Route path="*" element={<Navigate to={`/${getInitialLocale()}`} replace />} />
          </Routes>
        </BrowserRouter>
        <Analytics />
        <GoogleAnalytics />
      </HelmetProvider>
    </I18nProvider>
  </StrictMode>,
)
