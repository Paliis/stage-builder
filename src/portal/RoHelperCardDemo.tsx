import { Fragment, type ReactNode, useId, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/useI18n'
import { formatTemplate } from '../i18n/format'
import { break180DemoByLocale, type DemoSection } from './roHelperCardDemoModel'
import './RoHelperCardDemo.css'

const PRIMARY_RULES_URL = 'https://www.ipsc.org/rules'

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
  const [fpsuOn, setFpsuOn] = useState(true)
  const toggleId = useId()

  const bundle = break180DemoByLocale[locale]

  const metaLine = useMemo(
    () =>
      formatTemplate(d.metaTemplate, {
        cardId: 'C105',
        edition: 'Jan 2026',
        ruleRef: '10.5.2',
      }),
    [d.metaTemplate],
  )

  const visibleSections = useMemo(
    () => bundle.sections.filter((s) => !s.onlyWhenFpsuOn || fpsuOn),
    [bundle.sections, fpsuOn],
  )

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
        <div className="ro-helper-demo__card-head">
          <span className="ro-helper-demo__badge">{d.categorySafety}</span>
          <span className="ro-helper-demo__draft">{d.draftBadge}</span>
        </div>
        <h2 id="ro-helper-demo-title" className="ro-helper-demo__title">
          {bundle.title}
        </h2>
        <p className="ro-helper-demo__meta">{metaLine}</p>
        <p className="ro-helper-demo__slug">
          <code>break-180</code>
          <span className="ro-helper-demo__sep">·</span>
          <span>handgun</span>
        </p>
        <a className="ro-helper-demo__rules-link" href={PRIMARY_RULES_URL} target="_blank" rel="noopener noreferrer">
          {d.rulesCta}
        </a>

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
