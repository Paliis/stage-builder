/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  /** Optional GA4 measurement ID (e.g. G-XXXXXXXX). Set in Vercel → Environment Variables. */
  readonly VITE_GA_MEASUREMENT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.ttf' {
  const src: string
  export default src
}
