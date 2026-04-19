import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useI18n } from '../i18n/useI18n'
import { loadArticleRaw, listSlugsFor } from './articleGlob'
import { extractTitleFromMeta, splitFrontmatter } from './parseArticleMd'
import { isRoHelperCategory, isRoHelperDiscipline } from './constants'
import { categoryLabel, disciplineLabel } from './labels'
import './RoHelperListPages.css'

type Row = { slug: string; title: string }

export function RoHelperCategoryPage() {
  const { discipline, category } = useParams<{ discipline: string; category: string }>()
  const { locale, tree } = useI18n()
  const rh = tree.roHelper
  const [rows, setRows] = useState<Row[] | null>(null)

  const valid =
    discipline &&
    category &&
    isRoHelperDiscipline(discipline) &&
    isRoHelperCategory(category)

  useEffect(() => {
    if (!valid) return
    let cancelled = false
    ;(async () => {
      const slugs = listSlugsFor(locale, discipline!, category!)
      const out: Row[] = []
      for (const slug of slugs) {
        const raw = await loadArticleRaw(locale, discipline!, category!, slug)
        let title = slug
        if (raw) {
          const { metaBlock } = splitFrontmatter(raw)
          title = extractTitleFromMeta(metaBlock) ?? slug
        }
        out.push({ slug, title })
      }
      if (!cancelled) setRows(out)
    })()
    return () => {
      cancelled = true
    }
  }, [valid, locale, discipline, category])

  if (!valid) {
    return <Navigate to="/ro-helper" replace />
  }

  const pageTitle = `${disciplineLabel(discipline, rh)} · ${categoryLabel(category, rh)}`
  const helmetTitle = `${pageTitle} · ${rh.breadcrumbRo} — ${tree.portal.title}`

  return (
    <div className="ro-helper-list">
      <Helmet>
        <title>{helmetTitle}</title>
        <meta name="description" content={rh.seoModuleDescription} />
      </Helmet>
      <h1 className="ro-helper-list__title">{pageTitle}</h1>
      {rows === null ? (
        <p className="ro-helper-list__loading">{rh.loading}</p>
      ) : rows.length === 0 ? (
        <p className="ro-helper-list__empty">{rh.articlesEmpty}</p>
      ) : (
        <ul className="ro-helper-list__ul">
          {rows.map((r) => (
            <li key={r.slug}>
              <Link to={`/ro-helper/${discipline}/${category}/${r.slug}`}>{r.title}</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
