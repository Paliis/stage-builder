import { resolvePublicOriginFromEnv } from './resolvePublicOriginFromEnv'

type ReqHeaders = Record<string, string | string[] | undefined>

function headerString(v: string | string[] | undefined): string {
  if (typeof v === 'string') return v
  if (Array.isArray(v)) return v[0] ?? ''
  return ''
}

export function isLocalDevHost(host: string): boolean {
  const h = host.split(':')[0]?.toLowerCase() ?? ''
  return h === 'localhost' || h === '127.0.0.1' || h === '[::1]'
}

/**
 * Redirect URL uses the request host (localhost in dev).
 * Webhook must be a public HTTPS URL Mono can reach — on localhost use
 * `VITE_SHARE_PUBLIC_ORIGIN` or `MATCH_PAYMENT_WEBHOOK_ORIGIN` (e.g. staging).
 */
export function resolveMatchPaymentUrls(headers: ReqHeaders): {
  redirectOrigin: string
  webHookOrigin: string
  isLocal: boolean
  localWebhookMissing: boolean
} {
  const host = headerString(headers['x-forwarded-host']) || headerString(headers.host)
  const isLocal = isLocalDevHost(host)
  const proto =
    headerString(headers['x-forwarded-proto']) || (isLocal ? 'http' : 'https')
  const fallback = host ? `${proto}://${host}` : ''
  const redirectOrigin = resolvePublicOriginFromEnv(fallback)

  const webhookOverride =
    process.env.MATCH_PAYMENT_WEBHOOK_ORIGIN?.trim() ||
    process.env.VITE_SHARE_PUBLIC_ORIGIN?.trim() ||
    ''

  let webHookOrigin = redirectOrigin
  let localWebhookMissing = false

  if (isLocal) {
    if (webhookOverride && /^https:\/\//i.test(webhookOverride)) {
      webHookOrigin = webhookOverride.replace(/\/$/, '')
    } else {
      localWebhookMissing = true
      webHookOrigin = redirectOrigin
    }
  } else if (webhookOverride) {
    webHookOrigin = webhookOverride.replace(/\/$/, '')
  }

  return { redirectOrigin, webHookOrigin, isLocal, localWebhookMissing }
}
