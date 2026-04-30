import { useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient'

export type SupabaseSessionState = {
  loading: boolean
  session: Session | null
  user: User | null
}

/** Subscribes to `auth.onAuthStateChange` after hydrating `getSession()` (portal / match-admin). */
export function useSupabaseSession(): SupabaseSessionState {
  const [loading, setLoading] = useState(isSupabaseConfigured())
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false)
      setSession(null)
      return
    }

    let cancelled = false
    const sb = getSupabase()

    void sb.auth.getSession().then(({ data }) => {
      if (cancelled) return
      setSession(data.session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      setLoading(false)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  return { loading, session, user: session?.user ?? null }
}
