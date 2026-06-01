const MONO_MERCHANT_API = 'https://api.monobank.ua'

export type MonobankPubkeyResponse = {
  key?: string
}

/** Validates X-Token by fetching merchant pubkey (no charge). */
export async function fetchMonobankMerchantPubkey(xToken: string): Promise<MonobankPubkeyResponse> {
  const token = xToken.trim()
  if (!token) throw new Error('empty_token')

  const res = await fetch(`${MONO_MERCHANT_API}/api/merchant/pubkey`, {
    method: 'GET',
    headers: {
      'X-Token': token,
    },
  })

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
