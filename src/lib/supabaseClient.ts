import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** Isolated from other Supabase apps on localhost (storage key suffix). */
const AUTH_STORAGE_KEY = 'sb-stage-builder-auth'

let client: SupabaseClient | null = null

export function isSupabaseConfigured(): boolean {
  return Boolean(url?.trim() && anonKey?.trim())
}

function createBrowserSupabase(urlStr: string, key: string): SupabaseClient {
  return createClient(urlStr, key, {
    auth: {
      storageKey: AUTH_STORAGE_KEY,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  })
}

/** Browser singleton (anon key). Persists session in localStorage; PKCE + URL hash fragments for redirects. */
export function getSupabase(): SupabaseClient {
  const u = url?.trim()
  const k = anonKey?.trim()
  if (!u || !k) {
    throw new Error('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set')
  }
  if (!client) {
    client = createBrowserSupabase(u, k)
  }
  return client
}

/** Testing / HMR edge cases only — avoids holding a stale client across env swaps. */
export function resetSupabaseClientForTests(): void {
  client = null
}
