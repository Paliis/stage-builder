import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/useI18n'
import { isMatchPortalEnabled, isRoHelperEnabled } from './featureFlags'
import { PortalPublishedMatchesSection } from './PortalPublishedMatchesSection'
import { roHelperPath } from '../ro-helper/paths'
import './PortalHome.css'

type CardBadgeKind = 'live' | 'new' | 'beta'

interface ProductCardProps {
  to: string
  /** Primary preview image URL (e.g. `…/foo.webp`). */
  preview: string
  /**
   * Optional secondary fallback for `<picture>`; useful when `preview` is a
   * modern format (WebP/AVIF) and we want a `<img src>` fallback for
   * pre-Safari-14 / very old browsers.
   */
  previewFallback?: string
  previewAlt: string
  title: string
  description: string
  features: string[]
  cta: string
  badgeKind: CardBadgeKind
  badgeLabel: string
  /** When set, the substring before the first ": " is wrapped in `<strong>` (e.g. "Точність: …"). */
  boldFeatureLabel?: boolean
}

function renderFeatureContent(text: string, boldLabel: boolean) {
  if (!boldLabel) return text
  const idx = text.indexOf(': ')
  if (idx === -1) return text
  return (
    <span className="portal-home__feature-line">
      <strong className="portal-home__feature-label">{text.slice(0, idx)}:</strong>
      {text.slice(idx + 1)}
    </span>
  )
}

function ProductCard(props: ProductCardProps) {
  const {
    to,
    preview,
    previewFallback,
    previewAlt,
    title,
    description,
    features,
    cta,
    badgeKind,
    badgeLabel,
    boldFeatureLabel = false,
  } = props
  const previewIsWebp = preview.toLowerCase().endsWith('.webp')

  return (
    <article className={`portal-home__product portal-home__product--${badgeKind}`}>
      <div className="portal-home__product-preview" aria-hidden="true">
        {previewFallback ? (
          <picture>
            {previewIsWebp ? <source srcSet={preview} type="image/webp" /> : null}
            <img
              src={previewFallback}
              alt={previewAlt}
              loading="lazy"
              decoding="async"
              width={640}
              height={400}
            />
          </picture>
        ) : (
          <img
            src={preview}
            alt={previewAlt}
            loading="lazy"
            decoding="async"
            width={640}
            height={400}
          />
        )}
      </div>
      <div className="portal-home__product-body">
        <header className="portal-home__product-head">
          <h2 className="portal-home__product-title">
            <Link to={to} className="portal-home__product-link">
              {title}
            </Link>
          </h2>
          <span className={`portal-home__product-badge portal-home__product-badge--${badgeKind}`}>
            {badgeLabel}
          </span>
        </header>
        <p className="portal-home__product-desc">{description}</p>
        <ul className="portal-home__product-features">
          {features.map((feature) => (
            <li key={feature}>{renderFeatureContent(feature, boldFeatureLabel)}</li>
          ))}
        </ul>
        <p className="portal-home__product-cta" aria-hidden="true">
          {cta} <span aria-hidden="true">→</span>
        </p>
      </div>
    </article>
  )
}

/** Launcher at `/:locale` — entry to Stage Builder, Hit Factor and RO Helper. */
export function PortalHome() {
  const { locale, tree } = useI18n()
  const p = tree.portal

  return (
    <div className="portal-home">
      <Helmet>
        <title>{p.helmetTitle}</title>
        <meta name="description" content={p.metaDescription} />
      </Helmet>

      <section className="portal-home__hero" aria-labelledby="portal-hero-title">
        <h1 id="portal-hero-title" className="portal-home__hero-title">
          {p.title}
        </h1>
        <p className="portal-home__hero-lead">{p.lead}</p>
      </section>

      {isMatchPortalEnabled() ? <PortalPublishedMatchesSection /> : null}

      <section className="portal-home__grid" aria-label={p.gridAriaLabel}>
        <ProductCard
          to="/stage-builder"
          preview="/portal-previews/stage-builder.webp"
          previewFallback="/portal-previews/stage-builder.svg"
          previewAlt={`${p.stageBuilderTitle} — ${p.stageBuilderDesc}`}
          title={p.stageBuilderTitle}
          description={p.stageBuilderDesc}
          features={p.stageBuilderFeatures}
          cta={p.openStageBuilder}
          badgeKind="live"
          badgeLabel={p.badgeLive}
          boldFeatureLabel
        />
        <ProductCard
          to={`/${locale}/hit-factor`}
          preview="/portal-previews/hit-factor.webp"
          previewFallback="/portal-previews/hit-factor.png"
          previewAlt={`${p.hitFactorTitle} — ${p.hitFactorDesc}`}
          title={p.hitFactorTitle}
          description={p.hitFactorDesc}
          features={p.hitFactorFeatures}
          cta={p.openHitFactor}
          badgeKind="new"
          badgeLabel={p.badgeNew}
          boldFeatureLabel
        />
        {isRoHelperEnabled() ? (
          <ProductCard
            to={roHelperPath(locale)}
            preview="/portal-previews/ro-helper.webp"
            previewFallback="/portal-previews/ro-helper.png"
            previewAlt={`${p.roHelperTitle} — ${p.roHelperDesc}`}
            title={p.roHelperTitle}
            description={p.roHelperDesc}
            features={p.roHelperFeatures}
            cta={p.openRoHelper}
            badgeKind="beta"
            badgeLabel={p.badgeBeta}
            boldFeatureLabel
          />
        ) : null}
      </section>
    </div>
  )
}
