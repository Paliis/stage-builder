import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/useI18n'
import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient'
import { formatPortalDate } from './matches/matchPortalFormat'
import { isMatchPortalEnabled } from './featureFlags'
import './PortalHome.css'

type PubMatch = {
  id: string
  title: string
  starts_at: string
  location_label?: string | null
}

/** Published matches teaser on portal home (`/:locale`) — not part of shooter account hub. */
export function PortalPublishedMatchesSection() {
  const { locale, tree } = useI18n()
  const p = tree.portal
  const configured = isSupabaseConfigured()
  const sb = useMemo(() => (configured ? getSupabase() : null), [configured])

  const [rows, setRows] = useState<PubMatch[] | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)

  const matchPortalOn = isMatchPortalEnabled()

  const load = useCallback(async () => {
    if (!sb || !matchPortalOn) return
    setError(null)
    const start = new Date()
    start.setUTCHours(0, 0, 0, 0)
    const { data, error } = await sb
      .from('matches')
      .select('id, title, starts_at, location_label')
      .eq('status', 'published')
      .gte('starts_at', start.toISOString())
      .order('starts_at', { ascending: true })
      .limit(40)
    if (error) {
      setError(error.message)
      setRows([])
      return
    }
    setRows((data ?? []) as PubMatch[])
  }, [sb, matchPortalOn])

  useEffect(() => {
    if (!configured || !matchPortalOn) return
    void load()
  }, [configured, load, matchPortalOn])

  if (!matchPortalOn || !configured) return null

  return (
    <section className="portal-home__matches-published" aria-labelledby="portal-published-matches">
      <h2 id="portal-published-matches" className="portal-home__matches-published-title">
        {p.portalPublishedMatchesHeading}
      </h2>
      <p className="portal-home__matches-published-lead">{p.portalPublishedMatchesLead}</p>
      {error ?
        <p role="alert" className="portal-home__matches-published-error">
          {p.portalPublishedMatchesLoadError}: {error}
        </p>
      : rows === undefined ?
        <p className="portal-home__matches-published-empty">{p.matchesLoadingDetail}</p>
      : rows.length === 0 ?
        <p className="portal-home__matches-published-empty">{p.portalPublishedMatchesEmpty}</p>
      :
        <ul className="portal-home__matches-published-list">
          {rows.map((m) => (
            <li key={m.id} className="portal-home__matches-published-item">
              <span className="portal-home__matches-published-item-meta">
                <time dateTime={m.starts_at}>{formatPortalDate(m.starts_at, locale)}</time>
                {m.location_label?.trim() ?
                  <>
                    {' · '}
                    {m.location_label.trim()}
                  </>
                : null}
              </span>
              <span className="portal-home__matches-published-item-body">
                <Link to={`/${locale}/matches/${m.id}`} className="portal-home__matches-published-link">
                  {m.title.trim() || '—'}
                </Link>
                <span className="portal-home__matches-published-cta" aria-hidden>
                  {' →'}
                </span>
              </span>
            </li>
          ))}
        </ul>
      }
    </section>
  )
}
