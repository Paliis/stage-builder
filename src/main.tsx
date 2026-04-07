import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import { registerSW } from 'virtual:pwa-register'
import { hydrateSessionDraft } from './application/sessionDraft'
import { notifyPwaUpdateAvailable, setPwaApplyUpdate } from './application/pwaUpdateGate'
import { I18nProvider } from './i18n/I18nProvider'
import { GoogleAnalytics } from './presentation/components/GoogleAnalytics'
import './index.css'
import App from './App.tsx'

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
      <App />
      <Analytics />
      <GoogleAnalytics />
    </I18nProvider>
  </StrictMode>,
)
