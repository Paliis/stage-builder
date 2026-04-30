import { useCallback, useEffect, useState } from 'react'
import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient'

/** Own row in `match_admin_profiles` (`organizer_status`), for account “apply organizer” UI. */
export type OrganizerSelfProfileKind = 'missing' | 'pending' | 'active' | 'blocked'

type SelectedRow = {
  organizer_status: string | null
  organizer_moderation_note?: string | null
}

async function fetchProfile(userId: string): Promise<{ kind: OrganizerSelfProfileKind; moderationNote: string | null }> {
  const sb = getSupabase()
  const { data, error } = await sb
    .from('match_admin_profiles')
    .select('organizer_status, organizer_moderation_note')
    .eq('user_id', userId)
    .maybeSingle<SelectedRow>()

  if (error || data == null) return { kind: 'missing', moderationNote: null }

  const raw = typeof data.organizer_status === 'string' ? data.organizer_status.trim() : ''
  const noteRaw = typeof data.organizer_moderation_note === 'string' ? data.organizer_moderation_note.trim() : ''
  const moderationNote = noteRaw.length ? noteRaw : null

  if (raw === 'pending') return { kind: 'pending', moderationNote: null }
  if (raw === 'active') return { kind: 'active', moderationNote: null }
  if (raw === 'blocked') return { kind: 'blocked', moderationNote }
  return { kind: 'missing', moderationNote: null }
}

export function useOrganizerSelfServiceProfile(userId: string | undefined): {
  loading: boolean
  profile: OrganizerSelfProfileKind
  moderationNote: string | null
  refresh: () => Promise<void>
} {
  const [loading, setLoading] = useState(Boolean(userId && isSupabaseConfigured()))
  const [profile, setProfile] = useState<OrganizerSelfProfileKind>('missing')
  const [moderationNote, setModerationNote] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured() || !userId) {
      setProfile('missing')
      setModerationNote(null)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const r = await fetchProfile(userId)
      setProfile(r.kind)
      setModerationNote(r.moderationNote)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { loading, profile, moderationNote, refresh }
}
