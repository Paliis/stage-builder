import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { useI18n } from '../../i18n/useI18n'
import { getSupabase, isSupabaseConfigured } from '../../lib/supabaseClient'
import { formatPortalDate } from './matchPortalFormat'
import '../PortalHome.css'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type MatchDetailRow = {
  id: string
  title: string
  description_md: string | null
  starts_at: string
  location_label: string | null
  competitor_limit: number | null
  discipline: string
  status: string
}

export function MatchPublicDetailPage() {
  const { matchId } = useParams<{ matchId: string }>()
  const { locale, tree } = useI18n()
  const p = tree.portal
  const [row, setRow] = useState<MatchDetailRow | null | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)

  const validId = matchId && UUID_RE.test(matchId)
  const configured = isSupabaseConfigured()

  useEffect(() => {
    if (!validId || !configured) return
    let cancelled = false
    const sb = getSupabase()
    void (async () => {
      setRow(undefined)
      const { data, error: qErr } = await sb
        .from('matches')
        .select(
          'id, title, description_md, starts_at, location_label, competitor_limit, discipline, status',
        )
        .eq('id', matchId)
        .eq('status', 'published')
        .maybeSingle()
      if (cancelled) return
      if (qErr) {
        setError(qErr.message)
        setRow(null)
        return
      }
      setError(null)
      setRow((data ?? null) as MatchDetailRow | null)
    })()
    return () => {
      cancelled = true
    }
  }, [matchId, validId, configured])

  if (!validId) {
    return (
      <div className="portal-home">
        <Helmet>
          <title>{p.matchDetailNotFoundTitle}</title>
        </Helmet>
        <p>{p.matchDetailNotFoundBody}</p>
        <p>
          <Link to={`/${locale}`}>{p.matchDetailBackToList}</Link>
        </p>
      </div>
    )
  }

  if (!configured) {
    return (
      <div className="portal-home">
        <Helmet>
          <title>{p.matchesPageHelmetTitle}</title>
        </Helmet>
        <p>{p.matchesSupabaseUnset}</p>
        <p>
          <Link to={`/${locale}`}>{p.matchDetailBackToList}</Link>
        </p>
      </div>
    )
  }

  if (row === undefined) {
    return (
      <div className="portal-home">
        <Helmet>
          <title>{p.matchesPageHelmetTitle}</title>
        </Helmet>
        <p>{p.matchesLoadingDetail}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="portal-home">
        <Helmet>
          <title>{p.matchesPageHelmetTitle}</title>
        </Helmet>
        <p role="alert">
          {p.matchesLoadError}: {error}
        </p>
        <p>
          <Link to={`/${locale}`}>{p.matchDetailBackToList}</Link>
        </p>
      </div>
    )
  }

  if (!row) {
    return (
      <div className="portal-home">
        <Helmet>
          <title>{p.matchDetailNotFoundTitle}</title>
        </Helmet>
        <p>{p.matchDetailNotFoundBody}</p>
        <p>
          <Link to={`/${locale}`}>{p.matchDetailBackToList}</Link>
        </p>
      </div>
    )
  }

  const helmetTitle = `${row.title} — ${p.matchesPageShortTitle}`

  return (
    <article className="portal-home">
      <Helmet>
        <title>{helmetTitle}</title>
      </Helmet>

      <p style={{ margin: '0 0 0.5rem' }}>
        <Link to={`/${locale}`}>{p.matchDetailBackToList}</Link>
      </p>

      <header className="portal-home__hero">
        <h1 className="portal-home__hero-title">{row.title}</h1>
      </header>

      <dl
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: '0.35rem 1rem',
          fontSize: '0.95rem',
          margin: 0,
        }}
      >
        <dt>{p.matchDetailStartsLabel}</dt>
        <dd style={{ margin: 0 }}>{formatPortalDate(row.starts_at, locale)}</dd>
        {row.location_label ? (
          <>
            <dt>{p.matchDetailLocationLabel}</dt>
            <dd style={{ margin: 0 }}>{row.location_label}</dd>
          </>
        ) : null}
        <dt>{p.matchDetailDisciplineLabel}</dt>
        <dd style={{ margin: 0 }}>{row.discipline}</dd>
        {row.competitor_limit != null ? (
          <>
            <dt>{p.matchDetailLimitLabel}</dt>
            <dd style={{ margin: 0 }}>{row.competitor_limit}</dd>
          </>
        ) : null}
      </dl>

      {row.description_md?.trim() ? (
        <section className="portal-home__hero-lead" style={{ marginTop: '1.25rem', maxWidth: '50rem' }}>
          <ReactMarkdown>{row.description_md}</ReactMarkdown>
        </section>
      ) : null}
    </article>
  )
}
