import { createPublicKey, createVerify } from 'node:crypto'

const MONO_MERCHANT_API = 'https://api.monobank.ua'
const MONO_HTTP_TIMEOUT_MS = 20_000

function wrapMonoFetchError(e: unknown): Error {
  if (e instanceof Error && e.name === 'TimeoutError') {
    return new Error('mono_request_timeout')
  }
  return e instanceof Error ? e : new Error('mono_request_failed')
}

export type MonobankPubkeyResponse = {
  key?: string
}

export type MonobankCreateInvoiceResponse = {
  invoiceId?: string
  pageUrl?: string
}

export type MonobankWebhookPayload = {
  invoiceId?: string
  status?: string
  reference?: string
  modifiedDate?: string
  amount?: number
  finalAmount?: number
}

/** Validates API token by fetching merchant pubkey (no charge). */
export async function fetchMonobankMerchantPubkey(xToken: string): Promise<MonobankPubkeyResponse> {
  const token = xToken.trim()
  if (!token) throw new Error('empty_token')

  let res: Response
  try {
    res = await fetch(`${MONO_MERCHANT_API}/api/merchant/pubkey`, {
      method: 'GET',
      headers: { 'X-Token': token },
      signal: AbortSignal.timeout(MONO_HTTP_TIMEOUT_MS),
    })
  } catch (e) {
    throw wrapMonoFetchError(e)
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`mono_pubkey_http_${res.status}${text ? `: ${text.slice(0, 200)}` : ''}`)
  }

  const data = (await res.json()) as MonobankPubkeyResponse
  if (!data?.key || typeof data.key !== 'string' || !data.key.trim()) {
    throw new Error('mono_pubkey_missing_key')
  }
  return data
}

export function monoTokenHint(xToken: string): string {
  const t = xToken.trim()
  if (t.length <= 4) return '••••'
  return `••••${t.slice(-4)}`
}

export async function createMonobankInvoice(
  xToken: string,
  params: {
    amountKop: number
    reference: string
    destination: string
    redirectUrl: string
    webHookUrl: string
    validitySec?: number
  },
): Promise<MonobankCreateInvoiceResponse> {
  let res: Response
  try {
    res = await fetch(`${MONO_MERCHANT_API}/api/merchant/invoice/create`, {
      method: 'POST',
      headers: {
        'X-Token': xToken.trim(),
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(MONO_HTTP_TIMEOUT_MS),
      body: JSON.stringify({
      amount: params.amountKop,
      ccy: 980,
      merchantPaymInfo: {
        reference: params.reference,
        destination: params.destination.slice(0, 280),
      },
      redirectUrl: params.redirectUrl,
      webHookUrl: params.webHookUrl,
      validity: params.validitySec ?? 86_400,
      paymentType: 'debit',
      }),
    })
  } catch (e) {
    throw wrapMonoFetchError(e)
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`mono_invoice_http_${res.status}${text ? `: ${text.slice(0, 300)}` : ''}`)
  }

  const data = (await res.json()) as MonobankCreateInvoiceResponse
  if (!data.invoiceId || !data.pageUrl) throw new Error('mono_invoice_missing_fields')
  return data
}

export function verifyMonobankWebhookSignature(
  pubKeyBase64: string,
  body: Buffer,
  xSignBase64: string,
): boolean {
  try {
    const pemBytes = Buffer.from(pubKeyBase64, 'base64')
    const key = createPublicKey({ key: pemBytes, format: 'pem' })
    const signature = Buffer.from(xSignBase64, 'base64')
    const verify = createVerify('SHA256')
    verify.update(body)
    verify.end()
    return verify.verify({ key, dsaEncoding: 'ieee-p1363' }, signature)
  } catch {
    try {
      const pemBytes = Buffer.from(pubKeyBase64, 'base64')
      const key = createPublicKey({ key: pemBytes, format: 'pem' })
      const signature = Buffer.from(xSignBase64, 'base64')
      const verify = createVerify('SHA256')
      verify.update(body)
      verify.end()
      return verify.verify(key, signature)
    } catch {
      return false
    }
  }
}

export function isMonobankInvoicePaid(status: string | undefined): boolean {
  return status === 'success'
}
