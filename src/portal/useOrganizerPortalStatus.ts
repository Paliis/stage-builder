import { useEffect, useState } from 'react'
import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient'

/** From `match_admin_profiles.organizer_status` for header badges (includes application pending). */
export type OrganizerPortalStatus = 'none' | 'active' | 'blocked' | 'pending' | 'loading'

/**
 * Resolves organizer-related labels for portal header.
 * `pending` is shown as «application under review», not as full organizer.
 */
export function useOrganizerPortalStatus(userId: string | undefined): OrganizerPortalStatus {
  const [state, setState] = useState<OrganizerPortalStatus>('loading')

  useEffect(() => {
    if (!isSupabaseConfigured() || !userId) {
      setState('none')
      return
    }

    setState('loading')
    let cancelled = false
    const sb = getSupabase()

    void (async () => {
      const { data, error } = await sb
        .from('match_admin_profiles')
        .select('organizer_status')
        .eq('user_id', userId)
        .maybeSingle<{ organizer_status?: string | null }>()

      if (cancelled) return
      if (error || data == null) {
        setState('none')
        return
      }
      const raw = typeof data.organizer_status === 'string' ? data.organizer_status.trim() : ''
      if (raw === 'active') setState('active')
      else if (raw === 'blocked') setState('blocked')
      else if (raw === 'pending') setState('pending')
      else setState('none')
    })()

    return () => {
      cancelled = true
    }
  }, [userId])

  return state
}
