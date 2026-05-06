import { useEffect, useState } from 'react'
import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient'

/** `platform_is_platform_admin` RPC — who can open `/:locale/admin/organizers`. */
export function usePlatformIsAdmin(userId: string | undefined, enabled = true): boolean | 'loading' {
  const [state, setState] = useState<boolean | 'loading'>(enabled ? 'loading' : false)

  useEffect(() => {
    if (!enabled) {
      setState(false)
      return
    }
    if (!isSupabaseConfigured()) {
      setState(false)
      return
    }
    if (!userId) {
      setState(false)
      return
    }

    let cancelled = false
    const sb = getSupabase()
    void (async () => {
      const { data, error } = await sb.rpc('platform_is_platform_admin')
      if (cancelled) return
      if (error) {
        setState(false)
        return
      }
      setState(Boolean(data))
    })()

    return () => {
      cancelled = true
    }
  }, [userId, enabled])

  return state
}
