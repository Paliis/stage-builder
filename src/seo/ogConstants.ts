/**
 * Bump when `public/og-image.png` changes (Telegram/CDN cache).
 * Keep in sync: `index.html` placeholders, `vite.config.ts` HTML transform, `middleware.ts` og:image.
 */
export const OG_IMAGE_ASSET_QUERY = '?v=20260417-ipsc-st-v2' as const
