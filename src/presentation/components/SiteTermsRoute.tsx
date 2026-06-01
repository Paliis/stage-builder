import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n/useI18n'
import { SiteTermsPanel } from './SiteTermsPanel'

/** Site terms of use (`/:locale/terms`). */
export function SiteTermsRoute() {
  const { locale, tree } = useI18n()
  const legal = tree.legal
  const p = tree.portal
  const helmetTitle = `${legal.siteTermsTitle} — ${p.title}`
  return (
    <div className="app__publish-policy-page">
      <Helmet>
        <title>{helmetTitle}</title>
        <meta name="description" content={legal.siteTermsMetaDescription} />
      </Helmet>
      <div className="app__publish-policy-page-inner">
        <header className="app__publish-policy-page-header">
          <Link to={`/${locale}`} className="app__publish-policy-back">
            {tree.share.backHome}
          </Link>
        </header>
        <main className="app__publish-policy-page-main app__publish-policy-page-card">
          <SiteTermsPanel tree={tree} />
        </main>
      </div>
    </div>
  )
}
