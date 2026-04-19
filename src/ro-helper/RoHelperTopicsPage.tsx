import { useMemo } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useI18n } from '../i18n/useI18n'
import { listRefsForTopic } from './articleGlob'
import { type RoHelperDiscipline, isRoHelperCategory } from './constants'
import type { ArticleGlobRef } from './articleGlob'
import { categoryLabel, disciplineLabel } from './labels'
import './RoHelperListPages.css'

export function RoHelperTopicsPage() {
  const { category } = useParams<{ category: string }>()
  const { locale, tree } = useI18n()
  const rh = tree.roHelper

  const categoryOk = category && isRoHelperCategory(category) ? category : null

  const refs = useMemo(
    () => (categoryOk ? listRefsForTopic(locale, categoryOk) : []),
    [locale, categoryOk],
  )
  const byDisc = useMemo(() => {
    const m = new Map<RoHelperDiscipline, ArticleGlobRef[]>()
    for (const r of refs) {
      const arr = m.get(r.discipline) ?? []
      arr.push(r)
      m.set(r.discipline, arr)
    }
    for (const arr of m.values()) arr.sort((a, b) => a.slug.localeCompare(b.slug))
    return m
  }, [refs])

  if (!categoryOk) {
    return <Navigate to="/ro-helper" replace />
  }

  const catLab = categoryLabel(categoryOk, rh)

  return (
    <div className="ro-helper-list">
      <h1 className="ro-helper-list__title">
        {rh.topicsTitle}: {catLab}
      </h1>
      {refs.length === 0 ? (
        <p className="ro-helper-list__empty">{rh.articlesEmpty}</p>
      ) : (
        [...byDisc.entries()].map(([disc, rows]) => (
          <section key={disc} className="ro-helper-list__group">
            <h2 className="ro-helper-list__group-title">{disciplineLabel(disc, rh)}</h2>
            <ul className="ro-helper-list__ul">
              {rows.map((r) => (
                <li key={`${r.discipline}-${r.slug}`}>
                  <Link to={`/ro-helper/${r.discipline}/${r.category}/${r.slug}`}>{r.slug}</Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}
