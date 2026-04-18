import { Fragment, type ReactNode, useId, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useI18n } from '../i18n/useI18n'
import { formatTemplate } from '../i18n/format'
import {
  DEMO_CARD_IDS,
  IPSC_RULE_BOOKS_HUB_URL,
  resolveDemoCard,
  type DemoSection,
} from './roHelperCardDemoModel'
import './RoHelperCardDemo.css'

function renderBoldSegments(line: string): ReactNode[] {
  const parts = line.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    return <Fragment key={i}>{part}</Fragment>
  })
}

function SectionBody({ section }: { section: DemoSection }) {
  return (
    <div className="ro-helper-demo__section-body">
      {section.paragraphs?.map((p, i) => (
        <p key={`p-${i}`} className="ro-helper-demo__p">
          {renderBoldSegments(p)}
        </p>
      ))}
      {section.ordered && section.ordered.length > 0 ? (
        <ol className="ro-helper-demo__list ro-helper-demo__list--ol">
          {section.ordered.map((item, i) => (
            <li key={`o-${i}`}>{renderBoldSegments(item)}</li>
          ))}
        </ol>
      ) : null}
      {section.bullets && section.bullets.length > 0 ? (
        <ul className="ro-helper-demo__list ro-helper-demo__list--ul">
          {section.bullets.map((item, i) => (
            <li key={`u-${i}`}>{renderBoldSegments(item)}</li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

/** Prototype article screen for RO Helper (not production routing). */
export function RoHelperCardDemo() {
  const { locale, setLocale, tree } = useI18n()
  const d = tree.roHelperDemo
  const [searchParams] = useSearchParams()
  const [fpsuOn, setFpsuOn] = useState(true)
  const toggleId = useId()

  const { def, invalidRequested, requestedId } = useMemo(
    () => resolveDemoCard(searchParams.get('card')),
    [searchParams],
  )

  const bundle = def.contentByLocale[locale]

  const metaLine = useMemo(
    () =>
      formatTemplate(d.metaTemplate, {
        cardId: def.cardId,
        discipline: def.discipline,
        edition: def.ipscEdition,
        ruleRef: def.ruleRef,
      }),
    [d.metaTemplate, def.cardId, def.discipline, def.ipscEdition, def.ruleRef],
  )

  const invalidNotice = useMemo(() => {
    if (!invalidRequested) return null
    return formatTemplate(d.invalidCardBanner, { requested: requestedId })
  }, [d.invalidCardBanner, invalidRequested, requestedId])

  const rulesPdfLine = useMemo(
    () =>
      formatTemplate(d.rulesPdfCtaTemplate, {
        edition: def.ipscEdition,
        ruleRef: def.ruleRef,
        chapter: def.ipscChapter,
      }),
    [d.rulesPdfCtaTemplate, def.ipscChapter, def.ipscEdition, def.ruleRef],
  )

  const rulesHintLine = useMemo(
    () =>
      formatTemplate(d.rulesPdfHintTemplate, {
        ruleRef: def.ruleRef,
        chapter: def.ipscChapter,
      }),
    [d.rulesPdfHintTemplate, def.ipscChapter, def.ruleRef],
  )

  const visibleSections = useMemo(
    () => bundle.sections.filter((s) => !s.onlyWhenFpsuOn || fpsuOn),
    [bundle.sections, fpsuOn],
  )

  const categoryLabel = def.category === 'penalties' ? d.categoryPenalties : d.categorySafety
  const badgeClass =
    def.category === 'penalties'
      ? 'ro-helper-demo__badge ro-helper-demo__badge--penalties'
      : 'ro-helper-demo__badge'

  return (
    <div className="ro-helper-demo">
      <header className="ro-helper-demo__top">
        <div className="ro-helper-demo__top-row">
          <Link to="/" className="ro-helper-demo__back">
            ← {d.backHome}
          </Link>
          <div className="portal-home__lang ro-helper-demo__lang" role="group" aria-label={tree.common.langSwitcher}>
            <button
              type="button"
              className={locale === 'uk' ? 'is-active' : ''}
              onClick={() => setLocale('uk')}
              lang="uk"
            >
              {tree.common.langUk}
            </button>
            <button
              type="button"
              className={locale === 'en' ? 'is-active' : ''}
              onClick={() => setLocale('en')}
              lang="en"
            >
              {tree.common.langEn}
            </button>
          </div>
        </div>
        <p className="ro-helper-demo__ribbon" role="note">
          {d.ribbon}
        </p>
        <h1 className="ro-helper-demo__page-title">{d.pageTitle}</h1>
      </header>

      <article className="ro-helper-demo__card" aria-labelledby="ro-helper-demo-title">
        {invalidNotice ? (
          <div className="ro-helper-demo__invalid" role="alert">
            <p className="ro-helper-demo__invalid-text">{invalidNotice}</p>
            <p className="ro-helper-demo__invalid-links">
              <span className="ro-helper-demo__invalid-links-label">{d.demoCardExamplesLabel} </span>
              {DEMO_CARD_IDS.map((id, i) => (
                <Fragment key={id}>
                  {i > 0 ? <span className="ro-helper-demo__invalid-sep"> · </span> : null}
                  <Link to={`/ro-helper/demo?card=${id}`} className="ro-helper-demo__invalid-link">
                    {id}
                  </Link>
                </Fragment>
              ))}
            </p>
          </div>
        ) : null}

        <div className="ro-helper-demo__card-head">
          <span className={badgeClass}>{categoryLabel}</span>
          <span className="ro-helper-demo__draft">{d.draftBadge}</span>
        </div>
        <h2 id="ro-helper-demo-title" className="ro-helper-demo__title">
          {bundle.title}
        </h2>
        <p className="ro-helper-demo__meta">{metaLine}</p>
        <p className="ro-helper-demo__slug">
          <code>{def.slug}</code>
          <span className="ro-helper-demo__sep">·</span>
          <span>{def.discipline}</span>
        </p>
        <div className="ro-helper-demo__rules-block">
          <a
            className="ro-helper-demo__rules-link"
            href={def.primaryRulesPdfUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {rulesPdfLine}
          </a>
          <span className="ro-helper-demo__rules-sep" aria-hidden>
            {' · '}
          </span>
          <a
            className="ro-helper-demo__rules-link ro-helper-demo__rules-link--hub"
            href={IPSC_RULE_BOOKS_HUB_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            {d.rulesHubCta}
          </a>
          <p className="ro-helper-demo__rules-hint">{renderBoldSegments(rulesHintLine)}</p>
        </div>

        <section className="ro-helper-demo__disclaimer" aria-label={d.disclaimerTitle}>
          <h3 className="ro-helper-demo__disclaimer-title">{d.disclaimerTitle}</h3>
          <p className="ro-helper-demo__disclaimer-body">{d.disclaimerBody}</p>
        </section>

        <div className="ro-helper-demo__toggle">
          <input
            id={toggleId}
            type="checkbox"
            className="ro-helper-demo__toggle-input"
            checked={fpsuOn}
            onChange={(e) => setFpsuOn(e.target.checked)}
          />
          <label htmlFor={toggleId} className="ro-helper-demo__toggle-label">
            {d.toggleFpsuLabel}
          </label>
          <p className="ro-helper-demo__toggle-hint">{d.toggleFpsuHint}</p>
        </div>

        {visibleSections.map((section) => (
          <section key={section.id} className="ro-helper-demo__block">
            <h3 className="ro-helper-demo__block-title">{section.heading}</h3>
            <SectionBody section={section} />
          </section>
        ))}
      </article>
    </div>
  )
}
