import { useEffect, useState } from 'react'
import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient'

/** From `match_admin_profiles.organizer_status` — excludes `pending`, which overlaps with shooters. */
export type OrganizerPortalStatus = 'none' | 'active' | 'blocked' | 'loading'

/**
 * Resolves organizer write role for portal UI badges.
 * Rows with status `pending` are treated as `none` (not shown as organizer)
 * so shooters with a default profile row are not labelled organizers.
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
      else setState('none')
    })()

    return () => {
      cancelled = true
    }
  }, [userId])

  return state
}
