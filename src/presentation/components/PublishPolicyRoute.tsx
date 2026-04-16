import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n/useI18n'
import { PublishPolicyPanel } from './PublishPolicyPanel'

/** Standalone page with the same text as the in-app publish policy modal (`/publish-policy`). */
export function PublishPolicyRoute() {
  const { tree } = useI18n()
  const sp = tree.share
  return (
    <div className="app__publish-policy-page">
      <header className="app__publish-policy-page-header">
        <Link to="/" className="app__publish-policy-back">
          {sp.backHome}
        </Link>
      </header>
      <main className="app__publish-policy-page-main">
        <PublishPolicyPanel tree={tree} />
      </main>
    </div>
  )
}
