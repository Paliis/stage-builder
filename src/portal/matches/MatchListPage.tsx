import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n/useI18n'
import { getSupabase, isSupabaseConfigured } from '../../lib/supabaseClient'
import { formatPortalDate } from './matchPortalFormat'
import '../PortalHome.css'

type PublishedMatchRow = {
  id: string
  title: string
  starts_at: string
  location_label: string | null
  discipline: string
}

export function MatchListPage() {
  const { locale, tree } = useI18n()
  const p = tree.portal
  const [rows, setRows] = useState<PublishedMatchRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const configured = isSupabaseConfigured()

  useEffect(() => {
    if (!configured) return
    let cancelled = false
    const sb = getSupabase()
    void (async () => {
      const { data, error: qErr } = await sb
        .from('matches')
        .select('id, title, starts_at, location_label, discipline, status')
        .eq('status', 'published')
        .order('starts_at', { ascending: true })
      if (cancelled) return
      if (qErr) {
        setError(qErr.message)
        setRows(null)
        return
      }
      setError(null)
      setRows((data ?? []) as PublishedMatchRow[])
    })()
    return () => {
      cancelled = true
    }
  }, [configured])

  return (
    <div className="portal-home">
      <Helmet>
        <title>{p.matchesPageHelmetTitle}</title>
        <meta name="description" content={p.matchesPageMetaDescription} />
      </Helmet>

      <header className="portal-home__hero">
        <h1 className="portal-home__hero-title">{p.matchesPageTitle}</h1>
        <p className="portal-home__hero-lead">{p.matchesPageLead}</p>
      </header>

      {!configured ? (
        <p role="status" className="portal-home__hero-lead">
          {p.matchesSupabaseUnset}
        </p>
      ) : null}

      {error ? (
        <p role="alert" style={{ color: 'var(--danger, #c44)' }}>
          {p.matchesLoadError}: {error}
        </p>
      ) : null}

      {configured && rows === null && !error ? <p role="status">{p.matchesLoadingList}</p> : null}

      {configured && rows && rows.length === 0 ? (
        <p role="status">{p.matchesEmpty}</p>
      ) : null}

      {rows && rows.length > 0 ? (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '1rem' }}>
          {rows.map((m) => (
            <li
              key={m.id}
              style={{
                border: '1px solid var(--border, rgba(128,128,128,0.25))',
                borderRadius: '10px',
                padding: '1rem 1.1rem',
              }}
            >
              <h2 style={{ margin: '0 0 0.35rem', fontSize: '1.1rem' }}>
                <Link to={`/${locale}/matches/${m.id}`}>{m.title}</Link>
              </h2>
              <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>
                {formatPortalDate(m.starts_at, locale)}
                {m.location_label ? ` · ${m.location_label}` : null}
                {m.discipline ? ` · ${m.discipline}` : null}
              </p>
              <p style={{ margin: '0.5rem 0 0' }}>
                <Link to={`/${locale}/matches/${m.id}`}>{p.matchCardCta}</Link>
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
