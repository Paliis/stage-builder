import { startTransition, useEffect, useMemo, useRef, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useI18n } from '../i18n/useI18n'
import { buildQuickCiteText } from './buildQuickCite'
import { loadArticleRaw } from './articleGlob'
import { MarkdownBody } from './MarkdownBody'
import { extractTitleFromMeta, splitFrontmatter } from './parseArticleMd'
import { parseRoHelperArticleFrontmatter, type RoHelperArticleFrontmatter } from './parseRoHelperFrontmatter'
import { plainSummaryFromMd } from './plainSummaryFromMd'
import { splitFpsuMarkdownBody } from './splitFpsuSection'
import { isRoHelperCategory, isRoHelperDiscipline } from './constants'
import { categoryLabel, disciplineLabel } from './labels'
import { useRoHelperFpsuPrefs } from './useRoHelperFpsuPrefs'
import { trackRoHelperEvent } from './roHelperAnalytics'
import './RoHelperArticlePage.css'

export function RoHelperArticlePage() {
  const { discipline, category, slug } = useParams<{
    discipline: string
    category: string
    slug: string
  }>()
  const { locale, tree } = useI18n()
  const rh = tree.roHelper
  const demo = tree.roHelperDemo
  const { showFpsuLayer } = useRoHelperFpsuPrefs()

  const [phase, setPhase] = useState<'loading' | 'ready' | 'missing'>('loading')
  const [mainMd, setMainMd] = useState('')
  const [fpsuMd, setFpsuMd] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [articleMeta, setArticleMeta] = useState<RoHelperArticleFrontmatter | null>(null)
  const [citeStatus, setCiteStatus] = useState<'idle' | 'ok' | 'err'>('idle')
  const lastArticleGaKey = useRef<string | null>(null)

  const valid =
    discipline &&
    category &&
    slug &&
    isRoHelperDiscipline(discipline) &&
    isRoHelperCategory(category)

  useEffect(() => {
    if (!valid) return
    let cancelled = false
    startTransition(() => {
      if (!cancelled) setPhase('loading')
    })
    ;(async () => {
      const raw = await loadArticleRaw(locale, discipline!, category!, slug!)
      if (cancelled) return
      if (!raw) {
        setPhase('missing')
        setMainMd('')
        setFpsuMd(null)
        setTitle('')
        setArticleMeta(null)
        return
      }
      const { metaBlock, body } = splitFrontmatter(raw)
      const fm = parseRoHelperArticleFrontmatter(metaBlock)
      setArticleMeta(fm)
      setTitle(fm.title ?? extractTitleFromMeta(metaBlock) ?? slug!)
      const { main, fpsu } = splitFpsuMarkdownBody(body)
      setMainMd(main)
      setFpsuMd(fpsu)
      setPhase('ready')
    })()
    return () => {
      cancelled = true
    }
  }, [valid, locale, discipline, category, slug])

  const metaDescription = useMemo(() => {
    if (phase !== 'ready' || !mainMd) return rh.seoModuleDescription
    const s = plainSummaryFromMd(mainMd)
    return s || `${title} — ${rh.seoModuleDescription}`
  }, [phase, mainMd, title, rh.seoModuleDescription])

  const browserTitle = useMemo(() => {
    if (phase !== 'ready' || !title) return `${rh.breadcrumbRo} — ${tree.portal.title}`
    return `${title} · ${rh.breadcrumbRo} — ${tree.portal.title}`
  }, [phase, title, rh.breadcrumbRo, tree.portal.title])

  const quickCiteText = useMemo(() => {
    if (!articleMeta) return ''
    return buildQuickCiteText(rh, articleMeta, {
      showFpsuLayer,
      hasFpsuBody: Boolean(fpsuMd && fpsuMd.trim()),
    })
  }, [rh, articleMeta, showFpsuLayer, fpsuMd])

  useEffect(() => {
    if (phase !== 'ready' || !valid || !slug || !category || !discipline) return
    const key = `${locale}/${discipline}/${category}/${slug}`
    if (lastArticleGaKey.current === key) return
    lastArticleGaKey.current = key
    trackRoHelperEvent('article_view', {
      article_slug: slug,
      category,
      discipline,
      layer_fpsu: showFpsuLayer ? 'true' : 'false',
    })
  }, [phase, valid, slug, category, discipline, locale, showFpsuLayer])

  useEffect(() => {
    if (citeStatus === 'idle') return
    const t = window.setTimeout(() => setCiteStatus('idle'), 2500)
    return () => window.clearTimeout(t)
  }, [citeStatus])

  async function onQuickCite() {
    if (!quickCiteText) return
    try {
      await navigator.clipboard.writeText(quickCiteText)
      setCiteStatus('ok')
    } catch {
      setCiteStatus('err')
    }
  }

  if (!valid) {
    return <Navigate to="/ro-helper" replace />
  }

  if (phase === 'loading') {
    return (
      <div className="ro-helper-article">
        <Helmet>
          <title>{`${rh.loading} · ${rh.breadcrumbRo} — ${tree.portal.title}`}</title>
          <meta name="description" content={rh.seoModuleDescription} />
        </Helmet>
        <p className="ro-helper-article__loading">{rh.loading}</p>
      </div>
    )
  }

  if (phase === 'missing') {
    return (
      <div className="ro-helper-article">
        <Helmet>
          <title>{`${rh.articleNotFound} · ${rh.breadcrumbRo} — ${tree.portal.title}`}</title>
          <meta name="description" content={rh.seoModuleDescription} />
        </Helmet>
        <p className="ro-helper-article__missing">{rh.articleNotFound}</p>
        <p>
          <Link to="/ro-helper">{rh.breadcrumbRo}</Link>
        </p>
      </div>
    )
  }

  return (
    <article className="ro-helper-article">
      <Helmet>
        <title>{browserTitle}</title>
        <meta name="description" content={metaDescription} />
      </Helmet>
      <nav className="ro-helper-article__crumb" aria-label="Breadcrumb">
        <Link to="/ro-helper">{rh.breadcrumbRo}</Link>
        <span aria-hidden="true"> / </span>
        <Link to={`/ro-helper/${discipline}`}>{disciplineLabel(discipline!, rh)}</Link>
        <span aria-hidden="true"> / </span>
        <Link to={`/ro-helper/${discipline}/${category}`}>{categoryLabel(category!, rh)}</Link>
        <span aria-hidden="true"> / </span>
        <span>{slug}</span>
      </nav>

      <aside className="ro-helper-article__banner" role="note">
        <strong>{demo.disclaimerTitle}:</strong> {demo.disclaimerBody}
      </aside>

      <header className="ro-helper-article__head ro-helper-article__head--with-actions">
        <h1 className="ro-helper-article__title">{title}</h1>
        <div className="ro-helper-article__actions">
          <button
            type="button"
            className="ro-helper-article__quick-cite"
            onClick={() => void onQuickCite()}
            disabled={!quickCiteText}
            aria-label={rh.quickCiteAria}
          >
            {rh.quickCiteButton}
          </button>
          {citeStatus === 'ok' ? (
            <span className="ro-helper-article__cite-feedback ro-helper-article__cite-feedback--ok" role="status">
              {rh.quickCiteCopied}
            </span>
          ) : null}
          {citeStatus === 'err' ? (
            <span className="ro-helper-article__cite-feedback ro-helper-article__cite-feedback--err" role="alert">
              {rh.quickCiteFailed}
            </span>
          ) : null}
        </div>
      </header>

      <div className="ro-helper-article__body">
        <MarkdownBody markdown={mainMd} />
        {showFpsuLayer && fpsuMd ? (
          <div className="ro-helper-article__fpsu">
            <MarkdownBody markdown={fpsuMd} />
          </div>
        ) : null}
      </div>
    </article>
  )
}
