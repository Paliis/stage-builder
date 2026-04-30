import { useCallback, useEffect, useState } from 'react'
import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient'

/** Own row in `match_admin_profiles` (`organizer_status`), for account “apply organizer” UI. */
export type OrganizerSelfProfileKind = 'missing' | 'pending' | 'active' | 'blocked'

async function fetchKind(userId: string): Promise<OrganizerSelfProfileKind> {
  const sb = getSupabase()
  const { data, error } = await sb
    .from('match_admin_profiles')
    .select('organizer_status')
    .eq('user_id', userId)
    .maybeSingle<{ organizer_status?: string | null }>()

  if (error || data == null) return 'missing'
  const raw = typeof data.organizer_status === 'string' ? data.organizer_status.trim() : ''
  if (raw === 'pending') return 'pending'
  if (raw === 'active') return 'active'
  if (raw === 'blocked') return 'blocked'
  return 'missing'
}

export function useOrganizerSelfServiceProfile(userId: string | undefined): {
  loading: boolean
  profile: OrganizerSelfProfileKind
  refresh: () => Promise<void>
} {
  const [loading, setLoading] = useState(Boolean(userId && isSupabaseConfigured()))
  const [profile, setProfile] = useState<OrganizerSelfProfileKind>('missing')

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured() || !userId) {
      setProfile('missing')
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      setProfile(await fetchKind(userId))
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { loading, profile, refresh }
}
