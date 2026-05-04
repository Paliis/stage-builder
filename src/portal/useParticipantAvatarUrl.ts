import { useEffect, useState } from 'react'
import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient'

export const PARTICIPANT_AVATAR_UPDATED_EVENT = 'portal-participant-avatar-updated'

export function dispatchParticipantAvatarUpdated(url: string) {
  window.dispatchEvent(
    new CustomEvent<{ url: string }>(PARTICIPANT_AVATAR_UPDATED_EVENT, { detail: { url } }),
  )
}

/** Public avatar URL from shooter defaults — used in portal shell next to account icon. */
export function useParticipantAvatarUrl(userId: string | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!userId || !isSupabaseConfigured()) {
      setUrl(null)
      return
    }

    let cancelled = false
    const load = async () => {
      const sb = getSupabase()
      const { data } = await sb
        .from('participant_registration_defaults')
        .select('avatar_url')
        .eq('user_id', userId)
        .maybeSingle()
      if (cancelled) return
      const u = typeof data?.avatar_url === 'string' ? data.avatar_url.trim() : ''
      setUrl(u || null)
    }
    void load()

    const onEvt = (e: Event) => {
      const d = (e as CustomEvent<{ url: string }>).detail
      const next = typeof d?.url === 'string' ? d.url.trim() : ''
      setUrl(next || null)
    }
    window.addEventListener(PARTICIPANT_AVATAR_UPDATED_EVENT, onEvt)
    return () => {
      cancelled = true
      window.removeEventListener(PARTICIPANT_AVATAR_UPDATED_EVENT, onEvt)
    }
  }, [userId])

  return url
}
