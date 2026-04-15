/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

/**
 * Bump when favicons, PWA icons, or og-image change. Same path is cached for days
 * (Telegram, Chrome, CDN); query forces a fresh fetch.
 */
const ASSET_QUERY = '?v=20260409-tg-og'

/** Set `VITE_SITE_ENV=staging` on the staging Vercel project so builds get noindex + UI ribbon. */
const SITE_ENV = process.env.VITE_SITE_ENV ?? ''

function htmlTransformPlugin() {
  return {
    name: 'html-transform-assets-staging',
    transformIndexHtml(html: string) {
      let out = html.replaceAll('__ASSET_Q__', ASSET_QUERY)
      if (SITE_ENV === 'staging') {
        out = out.replace(
          /<meta name="robots" content="[^"]*"\s*\/>/,
          '<meta name="robots" content="noindex, nofollow" />',
        )
        out = out.replace(
          /<meta name="googlebot" content="[^"]*"\s*\/>/,
          '<meta name="googlebot" content="noindex, nofollow" />',
        )
        out = out.replace(
          /<title>Stage Builder — IPSC Stage Designer<\/title>/,
          '<title>Stage Builder — IPSC Stage Designer (staging)</title>',
        )
      }
      return out
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    htmlTransformPlugin(),
    VitePWA({
      /** User activates new SW via UI; see `pwaUpdateGate` + `PwaUpdateBanner` (max one prompt / 24h). */
      registerType: 'prompt',
      includeAssets: [
        'favicon.ico',
        'favicon.svg',
        'favicon-16.png',
        'favicon-32.png',
        'favicon-48.png',
        'apple-touch-icon.png',
        'icon-192.png',
        'icon-512.png',
        'og-image.png',
      ],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,ico,png,ttf}'],
        /**
         * Default NavigationRoute serves index.html for all navigations; without a denylist,
         * /sitemap_index.xml and /robots.txt show the SPA in the browser (curl still gets XML).
         * Use explicit paths — /^\/[^?]*\.[^/]+$/ is wrong: [^?]* is greedy and swallows the ".xml"
         * segment so /sitemap_index.xml never matched the denylist.
         */
        navigateFallbackDenylist: [
          /^\/api\//,
          /^\/sitemap.*\.xml$/i,
          /^\/robots\.txt$/i,
          /^\/google[0-9a-z]+\.html$/i,
          /^\/manifest\.webmanifest$/i,
        ],
        /**
         * POST /api/* must hit the network (Vercel serverless), never cached index.html.
         * Without this, fetch('/api/publish-share') can be mishandled after SW install.
         */
        runtimeCaching: [
          {
            /** POST must be explicit — default Workbox route is GET-only; otherwise POST /api/* falls through to SPA. */
            urlPattern: ({ url }: { url: URL }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkOnly',
            method: 'POST',
          },
          {
            urlPattern: ({ url }: { url: URL }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkOnly',
            method: 'GET',
          },
        ],
      },
      manifest: {
        name: 'Stage Builder',
        /** Launcher label on home screen (Chrome/Android prefer short_name over name). */
        short_name: 'Stage Builder',
        description: 'IPSC stage designer: 2D plan, 3D preview, PDF briefing export',
        theme_color: '#f8fafc',
        /** Splash behind icon; match generated PNG tiles (white + dark SB mark) */
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'any',
        lang: 'uk',
        start_url: '/',
        icons: [
          {
            src: `/favicon.svg${ASSET_QUERY}`,
            sizes: 'any',
            type: 'image/svg+xml',
          },
          {
            src: `/icon-192.png${ASSET_QUERY}`,
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: `/icon-512.png${ASSET_QUERY}`,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
