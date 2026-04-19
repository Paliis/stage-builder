import { Link, Navigate, useParams } from 'react-router-dom'
import { useI18n } from '../i18n/useI18n'
import { RO_HELPER_CATEGORIES, isRoHelperDiscipline } from './constants'
import { categoryLabel, disciplineLabel } from './labels'
import './RoHelperListPages.css'

export function RoHelperDisciplinePage() {
  const { discipline } = useParams<{ discipline: string }>()
  const { tree } = useI18n()
  const rh = tree.roHelper

  if (!discipline || !isRoHelperDiscipline(discipline)) {
    return <Navigate to="/ro-helper" replace />
  }

  return (
    <div className="ro-helper-list">
      <h1 className="ro-helper-list__title">{disciplineLabel(discipline, rh)}</h1>
      <p className="ro-helper-list__sub">{rh.categoryTitle}</p>
      <ul className="ro-helper-list__tiles">
        {RO_HELPER_CATEGORIES.map((c) => (
          <li key={c}>
            <Link className="ro-helper-list__tile-link" to={`/ro-helper/${discipline}/${c}`}>
              {categoryLabel(c, rh)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
