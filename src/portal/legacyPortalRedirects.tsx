import { Navigate, useParams } from 'react-router-dom'
import { getInitialLocale } from '../i18n/storage'
import { roHelperPath } from '../ro-helper/paths'
import { stageBuilderPath } from './stageBuilderPath'

export function RootRedirect() {
  return <Navigate to={`/${getInitialLocale()}`} replace />
}

export function LegacyHitFactorRedirect() {
  return <Navigate to={`/${getInitialLocale()}/hit-factor`} replace />
}

/** Printed QR codes and bookmarks still point at `/stage-builder`. */
export function LegacyStageBuilderRedirect() {
  return <Navigate to={stageBuilderPath(getInitialLocale())} replace />
}

export function LegacyPublishPolicyRedirect() {
  return <Navigate to={`/${getInitialLocale()}/publish-policy`} replace />
}

export function LegacyTermsRedirect() {
  return <Navigate to={`/${getInitialLocale()}/terms`} replace />
}

/** `/tools/ro-helper/*` and `/ro-helper/*` → `/:locale/tools/ro-helper/*` */
export function LegacyRoHelperTreeRedirect() {
  const { '*': rest } = useParams()
  const loc = getInitialLocale()
  const base = roHelperPath(loc)
  const suffix = rest?.replace(/^\/+/, '').trim()
  const to = suffix ? `${base}/${suffix}` : base
  return <Navigate to={to} replace />
}
