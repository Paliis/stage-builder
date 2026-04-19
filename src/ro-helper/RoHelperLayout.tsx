import { Link, Outlet } from 'react-router-dom'
import { useI18n } from '../i18n/useI18n'
import { RoHelperFpsuPrefsProvider } from './RoHelperFpsuPrefs'
import { useRoHelperFpsuPrefs } from './useRoHelperFpsuPrefs'
import './RoHelperLayout.css'

function RoHelperLayoutInner() {
  const { tree } = useI18n()
  const rh = tree.roHelper
  const { showFpsuLayer, setShowFpsuLayer } = useRoHelperFpsuPrefs()

  return (
    <div className="ro-helper-layout">
      <div className="ro-helper-layout__subbar">
        <nav className="ro-helper-layout__crumb" aria-label="Breadcrumb">
          <Link to="/">{rh.navPortal}</Link>
          <span className="ro-helper-layout__crumb-sep" aria-hidden="true">
            /
          </span>
          <Link to="/ro-helper">{rh.breadcrumbRo}</Link>
        </nav>
        <div className="ro-helper-layout__fpsu">
          <label className="ro-helper-layout__fpsu-label">
            <input
              type="checkbox"
              className="ro-helper-layout__fpsu-input"
              checked={showFpsuLayer}
              onChange={(e) => setShowFpsuLayer(e.target.checked)}
            />
            <span>{rh.fpsuLayerLabel}</span>
          </label>
          <p className="ro-helper-layout__fpsu-hint">{rh.fpsuLayerHint}</p>
        </div>
      </div>
      <Outlet />
    </div>
  )
}

export function RoHelperLayout() {
  return (
    <RoHelperFpsuPrefsProvider>
      <RoHelperLayoutInner />
    </RoHelperFpsuPrefsProvider>
  )
}
