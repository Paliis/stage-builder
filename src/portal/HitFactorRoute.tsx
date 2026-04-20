import { Suspense } from 'react'
import { HitFactorPage } from '../hit-factor/HitFactorPage'
import { RoHelperRouteSuspenseFallback } from './RoHelperRouteSuspenseFallback'

/** Small wrapper for consistent Suspense boundary (future lazy split if needed). */
export function HitFactorRoute() {
  return (
    <Suspense fallback={<RoHelperRouteSuspenseFallback />}>
      <HitFactorPage />
    </Suspense>
  )
}

