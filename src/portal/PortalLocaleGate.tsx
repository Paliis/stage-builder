import { useEffect } from 'react'
import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom'
import { useI18n } from '../i18n/useI18n'
import { isPortalLocaleParam } from '../i18n/portalLocalePath'

/** Syncs `I18nProvider` locale with the first URL segment; rejects unknown locale slugs. */
export function PortalLocaleGate() {
  const { locale: param } = useParams()
  const { pathname } = useLocation()
  const { locale, setLocale } = useI18n()

  const valid = isPortalLocaleParam(param)

  useEffect(() => {
    if (valid && param !== locale) setLocale(param)
  }, [valid, param, locale, setLocale])

  if (!valid) {
    const tail = pathname.replace(/^\/[^/]+/, '') || ''
    const to = tail ? `/uk${tail}` : '/uk'
    return <Navigate to={to} replace />
  }

  return <Outlet />
}
