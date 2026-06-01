import { useCallback, useEffect, useState } from 'react'
import { getSupabase, isSupabaseConfigured } from '../../lib/supabaseClient'
import { isMatchPortalEnabled } from '../featureFlags'

export type MyActiveMatchRegistration = {
  registrationId: string
  matchId: string
  status: 'pending' | 'confirmed'
  matchTitle: string
  matchStartsAt: string
}

type MatchNested = {
  id: string
  title: string
  starts_at: string
  status: string
} | null

type RegRow = {
  id: string
  match_id: string
  status: string
  matches: MatchNested
}

function pickPrimaryActive(rows: RegRow[]): MyActiveMatchRegistration | null {
  const candidates: MyActiveMatchRegistration[] = []
  for (const r of rows) {
    const st = r.status
    if (st !== 'pending' && st !== 'confirmed') continue
    const m = r.matches
    if (!m?.id) continue
    const title = typeof m.title === 'string' ? m.title.trim() : ''
    candidates.push({
      registrationId: r.id,
      matchId: m.id,
      status: st,
      matchTitle: title || '—',
      matchStartsAt: m.starts_at,
    })
  }
  if (candidates.length === 0) return null

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const upcoming = candidates.filter((c) => {
    const t = new Date(c.matchStartsAt).getTime()
    return !Number.isNaN(t) && t >= todayStart.getTime()
  })
  const pool = upcoming.length > 0 ? upcoming : candidates
  pool.sort((a, b) => new Date(a.matchStartsAt).getTime() - new Date(b.matchStartsAt).getTime())
  return pool[0] ?? null
}

/** Nearest upcoming (or latest) pending/confirmed registration for home band / quick access. */
export function useMyActiveMatchRegistration(userId: string | undefined, enabled = true) {
  const matchPortalOn = isMatchPortalEnabled()
  const configured = isSupabaseConfigured()
  const active = enabled && matchPortalOn && configured && Boolean(userId)

  const [registration, setRegistration] = useState<MyActiveMatchRegistration | null | undefined>(undefined)
  const [loading, setLoading] = useState(false)

  const reload = useCallback(async () => {
    if (!active || !userId) {
      setRegistration(undefined)
      setLoading(false)
      return
    }
    setLoading(true)
    const sb = getSupabase()
    const { data, error } = await sb
      .from('match_registrations')
      .select('id, match_id, status, matches ( id, title, starts_at, status )')
      .eq('competitor_user_id', userId)
      .in('status', ['pending', 'confirmed'])
      .order('created_at', { ascending: false })
      .limit(20)
    setLoading(false)
    if (error) {
      setRegistration(null)
      return
    }
    setRegistration(pickPrimaryActive((data ?? []) as unknown as RegRow[]))
  }, [active, userId])

  useEffect(() => {
    queueMicrotask(() => void reload())
  }, [reload])

  return { registration, loading, reload }
}
