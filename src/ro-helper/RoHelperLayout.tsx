import { Outlet, useMatch } from 'react-router-dom'
import { useI18n } from '../i18n/useI18n'
import { RoHelperFpsuPrefsProvider } from './RoHelperFpsuPrefs'
import { useRoHelperFpsuPrefs } from './useRoHelperFpsuPrefs'
import { RoHelperSearchBar } from './RoHelperSearchBar'
import './RoHelperLayout.css'

function RoHelperLayoutInner() {
  const { tree } = useI18n()
  const rh = tree.roHelper
  const { showFpsuLayer, setShowFpsuLayer } = useRoHelperFpsuPrefs()
  const isArticleRoute = useMatch('/:locale/tools/ro-helper/:discipline/:category/:slug')

  return (
    <>
      <RoHelperSearchBar />
      <div className="ro-helper-layout">
        {isArticleRoute ? (
          <div className="ro-helper-layout__subbar" role="region" aria-label={rh.fpsuLayerLabel}>
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
        ) : null}
        <Outlet />
      </div>
    </>
  )
}

export function RoHelperLayout() {
  return (
    <RoHelperFpsuPrefsProvider>
      <RoHelperLayoutInner />
    </RoHelperFpsuPrefsProvider>
  )
}
