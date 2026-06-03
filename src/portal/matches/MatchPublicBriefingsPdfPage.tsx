import { useEffect, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useParams, useSearchParams } from 'react-router-dom'

import {
  matchBriefingsPdfApiUrl,
  matchBriefingsPdfFileName,
} from '../../domain/matchBriefingsExport'
import { useI18n } from '../../i18n/useI18n'
import { MATCH_ID_UUID_RE } from './matchPortalUuid'
import '../PortalMatchesUi.css'

type PdfLoadState =
  | { status: 'loading' }
  | { status: 'ready'; objectUrl: string }
  | { status: 'error'; message: string }

export function MatchPublicBriefingsPdfPage() {
  const { matchId } = useParams<{ matchId: string }>()
  const [searchParams] = useSearchParams()
  const { locale, tree } = useI18n()
  const p = tree.portal

  const validId = matchId && MATCH_ID_UUID_RE.test(matchId)
  const matchTitle = (searchParams.get('title') ?? '').trim()

  const inlinePdfUrl = useMemo(
    () => (validId ? matchBriefingsPdfApiUrl(matchId, locale, 'inline') : ''),
    [validId, matchId, locale],
  )

  const savePdfUrl = useMemo(
    () => (validId ? matchBriefingsPdfApiUrl(matchId, locale, 'attachment') : ''),
    [validId, matchId, locale],
  )

  const fileName = matchBriefingsPdfFileName(matchTitle)
  const [load, setLoad] = useState<PdfLoadState>({ status: 'loading' })

  useEffect(() => {
    if (!inlinePdfUrl) return

    let cancelled = false
    let objectUrl: string | null = null

    void (async () => {
      setLoad({ status: 'loading' })
      try {
        const res = await fetch(inlinePdfUrl)
        const contentType = res.headers.get('Content-Type') ?? ''

        if (!res.ok) {
          let message = res.statusText
          try {
            const body = (await res.json()) as { error?: string }
            if (body?.error) message = body.error
          } catch {
            /* not JSON */
          }
          if (!cancelled) setLoad({ status: 'error', message })
          return
        }

        if (!contentType.includes('application/pdf')) {
          if (!cancelled) {
            setLoad({
              status: 'error',
              message: `${p.matchDetailBriefingsPdfNotPdf} (${contentType || 'unknown'})`,
            })
          }
          return
        }

        const blob = await res.blob()
        if (blob.size < 100) {
          if (!cancelled) setLoad({ status: 'error', message: p.matchDetailBriefingsPdfEmpty })
          return
        }

        objectUrl = URL.createObjectURL(blob)
        if (!cancelled) setLoad({ status: 'ready', objectUrl })
      } catch (e) {
        if (!cancelled) {
          setLoad({
            status: 'error',
            message: e instanceof Error ? e.message : String(e),
          })
        }
      }
    })()

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [inlinePdfUrl, p.matchDetailBriefingsPdfEmpty, p.matchDetailBriefingsPdfNotPdf])

  if (!validId) {
    return (
      <div className="portal-home">
        <Helmet>
          <title>{p.matchDetailNotFoundTitle}</title>
        </Helmet>
        <p>{p.matchDetailNotFoundBody}</p>
        <nav className="portal-page-context portal-page-context--solo-link" aria-label={p.portalBreadcrumbAria}>
          <Link to={`/${locale}/matches`}>{p.matchDetailBackToList}</Link>
        </nav>
      </div>
    )
  }

  const helmetTitle =
    matchTitle ?
      `${matchTitle} — ${p.matchDetailBriefingsPdfHelmet}`
    : p.matchDetailBriefingsPdfHelmet

  return (
    <div className="portal-match-briefings-pdf">
      <Helmet>
        <title>{helmetTitle}</title>
      </Helmet>
      <header className="portal-match-briefings-pdf__bar">
        <nav className="portal-page-context" aria-label={p.portalBreadcrumbAria}>
          <Link to={`/${locale}/matches/${matchId}`}>{p.matchDetailBriefingsPdfBack}</Link>
        </nav>
        <div className="portal-match-briefings-pdf__actions">
          {load.status === 'ready' ?
            <a
              href={savePdfUrl}
              download={fileName}
              className="portal-btn portal-btn--secondary portal-btn--compact"
            >
              {p.matchDetailBriefingsPdfSave}
            </a>
          : null}
        </div>
      </header>

      {load.status === 'loading' ?
        <p className="portal-match-briefings-pdf__status">{p.matchDetailBriefingsPdfLoading}</p>
      : load.status === 'error' ?
        <div className="portal-match-briefings-pdf__status portal-match-briefings-pdf__status--error" role="alert">
          <p>
            {p.matchDetailProgrammeStatsDownloadError}: {load.message}
          </p>
          <p className="portal-match-briefings-pdf__hint">{p.matchDetailBriefingsPdfDevHint}</p>
        </div>
      : (
        <object
          className="portal-match-briefings-pdf__frame"
          data={load.objectUrl}
          type="application/pdf"
          title={helmetTitle}
        >
          <p className="portal-match-briefings-pdf__status">
            {p.matchDetailBriefingsPdfNoEmbed}{' '}
            <a href={savePdfUrl} download={fileName}>
              {p.matchDetailBriefingsPdfSave}
            </a>
          </p>
        </object>
      )}
    </div>
  )
}
