import { useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useI18n } from '../i18n/useI18n'
import './HitFactorPage.css'

function parseNum(v: string): number | null {
  const n = Number(v.replace(',', '.'))
  if (!Number.isFinite(n)) return null
  return n
}

export function HitFactorPage() {
  const { tree } = useI18n()
  const p = tree.portal
  const hf = tree.hitFactor

  const [pointsRaw, setPointsRaw] = useState('')
  const [timeRaw, setTimeRaw] = useState('')

  const points = useMemo(() => parseNum(pointsRaw), [pointsRaw])
  const time = useMemo(() => parseNum(timeRaw), [timeRaw])

  const value = useMemo(() => {
    if (points === null || time === null) return null
    if (time <= 0) return null
    return points / time
  }, [points, time])

  const valueStr = useMemo(() => {
    if (value === null) return '—'
    return value.toFixed(4)
  }, [value])

  const helmetTitle = `${hf.pageTitle} — ${p.title}`

  return (
    <div className="hit-factor">
      <Helmet>
        <title>{helmetTitle}</title>
        <meta name="description" content={hf.pageLead} />
      </Helmet>
      <header className="hit-factor__head">
        <h1 className="hit-factor__title">{hf.pageTitle}</h1>
        <p className="hit-factor__lead">{hf.pageLead}</p>
      </header>

      <section className="hit-factor__card" aria-label={hf.pageTitle}>
        <div className="hit-factor__grid">
          <label className="hit-factor__field">
            <span className="hit-factor__label">{hf.pointsLabel}</span>
            <input
              inputMode="decimal"
              className="hit-factor__input"
              value={pointsRaw}
              onChange={(e) => setPointsRaw(e.target.value)}
              placeholder="0"
            />
          </label>
          <label className="hit-factor__field">
            <span className="hit-factor__label">{hf.timeLabel}</span>
            <input
              inputMode="decimal"
              className="hit-factor__input"
              value={timeRaw}
              onChange={(e) => setTimeRaw(e.target.value)}
              placeholder="0"
            />
          </label>
        </div>

        <div className="hit-factor__result">
          <span className="hit-factor__result-label">{hf.hfLabel}</span>
          <output className="hit-factor__result-value">{valueStr}</output>
        </div>

        <div className="hit-factor__actions">
          <button
            type="button"
            className="hit-factor__reset"
            onClick={() => {
              setPointsRaw('')
              setTimeRaw('')
            }}
          >
            {hf.reset}
          </button>
        </div>
      </section>
    </div>
  )
}

