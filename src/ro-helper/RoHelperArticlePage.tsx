import { startTransition, useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useI18n } from '../i18n/useI18n'
import { loadArticleRaw } from './articleGlob'
import { MarkdownBody } from './MarkdownBody'
import { extractTitleFromMeta, splitFrontmatter } from './parseArticleMd'
import { splitFpsuMarkdownBody } from './splitFpsuSection'
import { isRoHelperCategory, isRoHelperDiscipline } from './constants'
import { categoryLabel, disciplineLabel } from './labels'
import { useRoHelperFpsuPrefs } from './useRoHelperFpsuPrefs'
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
        return
      }
      const { metaBlock, body } = splitFrontmatter(raw)
      setTitle(extractTitleFromMeta(metaBlock) ?? slug!)
      const { main, fpsu } = splitFpsuMarkdownBody(body)
      setMainMd(main)
      setFpsuMd(fpsu)
      setPhase('ready')
    })()
    return () => {
      cancelled = true
    }
  }, [valid, locale, discipline, category, slug])

  if (!valid) {
    return <Navigate to="/ro-helper" replace />
  }

  if (phase === 'loading') {
    return (
      <div className="ro-helper-article">
        <p className="ro-helper-article__loading">{rh.loading}</p>
      </div>
    )
  }

  if (phase === 'missing') {
    return (
      <div className="ro-helper-article">
        <p className="ro-helper-article__missing">{rh.articleNotFound}</p>
        <p>
          <Link to="/ro-helper">{rh.breadcrumbRo}</Link>
        </p>
      </div>
    )
  }

  return (
    <article className="ro-helper-article">
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

      <header className="ro-helper-article__head">
        <h1 className="ro-helper-article__title">{title}</h1>
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
