import { Helmet } from 'react-helmet-async'
import { Link, Navigate, useParams } from 'react-router-dom'
import type { MessageTree } from '../i18n/messages'
import { useI18n } from '../i18n/useI18n'
import { RO_HELPER_CATEGORIES, isRoHelperDiscipline, type RoHelperCategory } from './constants'
import { categoryLabel, disciplineLabel } from './labels'
import { roHelperPath } from './paths'
import './RoHelperListPages.css'

const CATEGORY_TONE: Record<RoHelperCategory, string> = {
  safety: 'safety',
  penalties: 'penalties',
  scoring: 'scoring',
  equipment: 'equipment',
  'match-admin': 'match-admin',
}

function categoryDesc(c: RoHelperCategory, rh: MessageTree['roHelper']): string {
  switch (c) {
    case 'safety':
      return rh.catSafetyDesc
    case 'penalties':
      return rh.catPenaltiesDesc
    case 'scoring':
      return rh.catScoringDesc
    case 'equipment':
      return rh.catEquipmentDesc
    case 'match-admin':
      return rh.catMatchAdminDesc
    default:
      return ''
  }
}

export function RoHelperDisciplinePage() {
  const { discipline } = useParams<{ discipline: string }>()
  const { locale, tree } = useI18n()
  const rh = tree.roHelper

  if (!discipline || !isRoHelperDiscipline(discipline)) {
    return <Navigate to={roHelperPath(locale)} replace />
  }

  const dLabel = disciplineLabel(discipline, rh)
  const helmetTitle = `${dLabel} · ${rh.breadcrumbRo} — ${tree.portal.title}`

  return (
    <div className="ro-helper-list">
      <Helmet>
        <title>{helmetTitle}</title>
        <meta name="description" content={rh.seoModuleDescription} />
      </Helmet>
      <h1 className="ro-helper-list__title">{dLabel}</h1>
      <p className="ro-helper-list__sub">{rh.categoryTitle}</p>
      <ul className="ro-helper-list__cards">
        {RO_HELPER_CATEGORIES.map((c) => (
          <li key={c} className="ro-helper-list__card-item">
            <Link
              className={`ro-helper-cat-card ro-helper-cat-card--${CATEGORY_TONE[c]}`}
              to={roHelperPath(locale, discipline, c)}
            >
              <span className="ro-helper-cat-card__accent" aria-hidden="true" />
              <span className="ro-helper-cat-card__body">
                <span className="ro-helper-cat-card__name">{categoryLabel(c, rh)}</span>
                <span className="ro-helper-cat-card__sub">{categoryDesc(c, rh)}</span>
              </span>
              <span className="ro-helper-cat-card__cta" aria-hidden="true">
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
