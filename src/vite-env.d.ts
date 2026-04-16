/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  /** Optional GA4 measurement ID (e.g. G-XXXXXXXX). Set in Vercel → Environment Variables. */
  readonly VITE_GA_MEASUREMENT_ID?: string
  /** `staging` on staging Vercel project → noindex in HTML + ribbon in UI. */
  readonly VITE_SITE_ENV?: string
  /** Injected in `vite.config.ts` from `VERCEL_PROJECT_PRODUCTION_URL` when building on Vercel. */
  readonly VITE_BUILD_PRODUCTION_ORIGIN?: string
  readonly VITE_SHARE_PUBLIC_ORIGIN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.ttf' {
  const src: string
  export default src
}
