/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  /** Optional GA4 measurement ID (e.g. G-XXXXXXXX). Set in Vercel → Environment Variables. */
  readonly VITE_GA_MEASUREMENT_ID?: string
  /** `staging` on staging Vercel project → noindex in HTML + ribbon in UI. */
  readonly VITE_SITE_ENV?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.ttf' {
  const src: string
  export default src
}
