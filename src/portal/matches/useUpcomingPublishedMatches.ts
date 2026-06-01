import { useCallback, useEffect, useState } from 'react'
import { getSupabase, isSupabaseConfigured } from '../../lib/supabaseClient'
import { isMatchPortalEnabled } from '../featureFlags'
import type { PubMatchRow } from './matchPortalBrowseUtils'

const UPCOMING_FETCH_LIMIT = 12

export type UpcomingPublishedMatchesState = {
  rows: PubMatchRow[] | undefined
  error: string | null
  loading: boolean
  reload: () => Promise<void>
}

/** Published matches from today onward, ascending by `starts_at` (hub + home featured band). */
export function useUpcomingPublishedMatches(enabled = true): UpcomingPublishedMatchesState {
  const matchPortalOn = isMatchPortalEnabled()
  const configured = isSupabaseConfigured()
  const active = enabled && matchPortalOn && configured

  const [rows, setRows] = useState<PubMatchRow[] | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const reload = useCallback(async () => {
    if (!active) {
      setRows(undefined)
      setError(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    const sb = getSupabase()
    const start = new Date()
    start.setUTCHours(0, 0, 0, 0)
    const { data, error: qErr } = await sb
      .from('matches')
      .select(
        'id, title, starts_at, discipline, location_label, match_event_kind, ps_match_level, cover_image_url, portal_organizer_display_name',
      )
      .eq('status', 'published')
      .gte('starts_at', start.toISOString())
      .order('starts_at', { ascending: true })
      .limit(UPCOMING_FETCH_LIMIT)
    setLoading(false)
    if (qErr) {
      setError(qErr.message)
      setRows([])
      return
    }
    setRows((data ?? []) as PubMatchRow[])
  }, [active])

  useEffect(() => {
    queueMicrotask(() => void reload())
  }, [reload])

  return { rows, error, loading, reload }
}
