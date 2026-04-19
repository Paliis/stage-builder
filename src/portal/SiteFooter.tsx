import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/useI18n'
import './SiteFooter.css'

const GITHUB_REPO = 'https://github.com/Paliis/stage-builder'

/** Sitewide footer for portal shell (Stage Builder route uses its own footer with PWA install). */
export function SiteFooter() {
  const { tree } = useI18n()
  const f = tree.footer

  return (
    <footer className="site-footer">
      <div className="site-footer__top">
        <div className="site-footer__card">
          <h3 className="site-footer__heading">{f.feedbackHeading}</h3>
          <p className="site-footer__text">{f.feedbackText}</p>
          <div className="site-footer__links">
            <a className="site-footer__link" href="mailto:parshencevdenis@gmail.com">
              {f.feedbackEmail}
            </a>
            <a
              className="site-footer__link site-footer__link--telegram"
              href="https://t.me/denysparshentsev"
              target="_blank"
              rel="noopener noreferrer"
            >
              {f.feedbackTelegram}
            </a>
          </div>
        </div>
        <div className="site-footer__card">
          <h3 className="site-footer__heading">{f.supportHeading}</h3>
          <p className="site-footer__text">{f.supportText}</p>
          <div className="site-footer__links">
            <a
              className="site-footer__link site-footer__link--donate"
              href="https://send.monobank.ua/jar/2gUdnYvDXy"
              target="_blank"
              rel="noopener noreferrer"
            >
              {f.supportLink}
            </a>
          </div>
        </div>
      </div>
      <div className="site-footer__bottom">
        <p className="site-footer__disclaimer">{f.portalDisclaimer}</p>
        <nav className="site-footer__nav" aria-label="Footer">
          <Link to="/publish-policy">{f.publishPolicy}</Link>
          <span className="site-footer__sep" aria-hidden="true">
            ·
          </span>
          <a href={GITHUB_REPO} target="_blank" rel="noopener noreferrer">
            {f.github}
          </a>
        </nav>
      </div>
    </footer>
  )
}
