/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon-32.png', 'favicon-48.png', 'icon-192.png', 'icon-512.png', 'og-image.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,ico,png,ttf}'],
      },
      manifest: {
        name: 'Stage Builder',
        short_name: 'Stage',
        description: 'IPSC stage designer: 2D plan, 3D preview, PDF briefing export',
        theme_color: '#0f172a',
        /** Splash behind icon; match generated PNG tiles (white + dark SB mark) */
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'any',
        lang: 'uk',
        start_url: '/',
        icons: [
          {
            src: '/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
          },
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icon-512.png',
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
