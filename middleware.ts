import { next } from '@vercel/edge'
import { resolvePublicOriginFromEnv } from './src/lib/resolvePublicOriginFromEnv'
import { OG_IMAGE_ASSET_QUERY } from './src/seo/ogConstants'

/** BL-001 F16: HTML with OG/Twitter meta for link previews when crawlers request /v/ or /e/ (Edge). */
const BOT_UA =
  /facebookexternalhit|Facebot|Twitterbot|Slackbot|LinkedInBot|TelegramBot|WhatsApp|Discordbot|SkypeUriPreview|Googlebot|bingbot/i

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export const config = {
  matcher: ['/v/:path*', '/e/:path*'],
}

export default async function middleware(request: Request): Promise<Response> {
  const ua = request.headers.get('user-agent') ?? ''
  if (!BOT_UA.test(ua)) {
    return next()
  }

  const url = new URL(request.url)
  const m = url.pathname.match(/^\/(v|e)\/([^/]+)/)
  if (!m) return next()

  const shareId = m[2]
  const supabaseUrl = (process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '')
    .trim()
    .replace(/\/$/, '')
  const anon = (process.env.VITE_SUPABASE_ANON_KEY ?? '').trim()
  if (!supabaseUrl || !anon) {
    return next()
  }

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/fetch_shared_stage`, {
      method: 'POST',
      headers: {
        apikey: anon,
        Authorization: `Bearer ${anon}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ lookup_id: shareId }),
    })

    if (!res.ok) {
      return next()
    }

    const data = (await res.json()) as unknown
    if (typeof data !== 'object' || data === null) {
      return next()
    }

    const titleRaw = 'title' in data ? (data as { title?: unknown }).title : undefined
    const title =
      typeof titleRaw === 'string' && titleRaw.trim() ? titleRaw.trim().slice(0, 200) : 'Stage Builder'
    const safeTitle = escapeHtml(title)
    const pageUrl = escapeHtml(url.href.split('#')[0])
    const assetOrigin = resolvePublicOriginFromEnv(url.origin)
    const ogImage = escapeHtml(`${assetOrigin}/og-image.png${OG_IMAGE_ASSET_QUERY}`)
    const ogImageAlt = escapeHtml('Stage Builder — stage plan, targets, PDF briefing export')
    const ogDesc = escapeHtml(`${title} — Shooters Tools / Stage Builder`)
    const siteName = escapeHtml('Shooters Tools')

    const html = `<!DOCTYPE html>
<html lang="uk">
<head>
<meta charset="utf-8"/>
<meta name="robots" content="noindex, nofollow"/>
<title>${safeTitle}</title>
<meta property="og:type" content="website"/>
<meta property="og:site_name" content="${siteName}"/>
<meta property="og:title" content="${safeTitle}"/>
<meta property="og:description" content="${ogDesc}"/>
<meta property="og:url" content="${pageUrl}"/>
<meta property="og:image" content="${ogImage}"/>
<meta property="og:image:alt" content="${ogImageAlt}"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="${safeTitle}"/>
<meta name="twitter:description" content="${ogDesc}"/>
<meta name="twitter:image" content="${ogImage}"/>
</head>
<body></body>
</html>`

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
      },
    })
  } catch {
    return next()
  }
}
