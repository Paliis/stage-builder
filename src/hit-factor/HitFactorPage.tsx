import { useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useI18n } from '../i18n/useI18n'
import { computeHitFactorAnalysis, type PowerFactor } from './computeHitFactorAnalysis'
import './HitFactorPage.css'

function parseNum(v: string): number | null {
  const n = Number(v.replace(',', '.'))
  if (!Number.isFinite(n)) return null
  return n
}

function parseIntOrNull(v: string): number | null {
  const t = v.trim()
  if (!t) return null
  const n = Number(t)
  if (!Number.isFinite(n)) return null
  return Math.trunc(n)
}

export function HitFactorPage() {
  const { tree } = useI18n()
  const p = tree.portal
  const hf = tree.hitFactor

  const [requiredHitsRaw, setRequiredHitsRaw] = useState('20')
  const [timeRaw, setTimeRaw] = useState('10.00')
  const [powerFactor, setPowerFactor] = useState<PowerFactor>('minor')
  const [missIncludesLostAlpha, setMissIncludesLostAlpha] = useState(true)

  const [deltaCharlieRaw, setDeltaCharlieRaw] = useState('0')
  const [deltaDeltaRaw, setDeltaDeltaRaw] = useState('0')
  const [deltaMissRaw, setDeltaMissRaw] = useState('0')
  const [deltaNoShootRaw, setDeltaNoShootRaw] = useState('0')
  const [deltaProceduralRaw, setDeltaProceduralRaw] = useState('0')

  const requiredHits = useMemo(() => parseIntOrNull(requiredHitsRaw), [requiredHitsRaw])
  const timeSec = useMemo(() => parseNum(timeRaw), [timeRaw])
  const deltaCharlie = useMemo(() => parseIntOrNull(deltaCharlieRaw), [deltaCharlieRaw])
  const deltaDelta = useMemo(() => parseIntOrNull(deltaDeltaRaw), [deltaDeltaRaw])
  const deltaMiss = useMemo(() => parseIntOrNull(deltaMissRaw), [deltaMissRaw])
  const deltaNoShoot = useMemo(() => parseIntOrNull(deltaNoShootRaw), [deltaNoShootRaw])
  const deltaProcedural = useMemo(() => parseIntOrNull(deltaProceduralRaw), [deltaProceduralRaw])

  const analysis = useMemo(() => {
    if (
      requiredHits === null ||
      timeSec === null ||
      deltaCharlie === null ||
      deltaDelta === null ||
      deltaMiss === null ||
      deltaNoShoot === null ||
      deltaProcedural === null
    ) {
      return null
    }
    return computeHitFactorAnalysis({
      requiredHits,
      timeSec,
      powerFactor,
      deltaCharlie,
      deltaDelta,
      deltaMiss,
      deltaNoShoot,
      deltaProcedural,
      missIncludesLostAlpha,
    })
  }, [
    requiredHits,
    timeSec,
    powerFactor,
    deltaCharlie,
    deltaDelta,
    deltaMiss,
    deltaNoShoot,
    deltaProcedural,
    missIncludesLostAlpha,
  ])

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
        <div className="hit-factor__layout">
          <div className="hit-factor__inputs">
            <div className="hit-factor__grid">
              <label className="hit-factor__field">
                <span className="hit-factor__label">{hf.requiredHitsLabel}</span>
                <input
                  inputMode="numeric"
                  className="hit-factor__input"
                  value={requiredHitsRaw}
                  onChange={(e) => setRequiredHitsRaw(e.target.value)}
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

            <div className="hit-factor__grid hit-factor__grid--2">
              <label className="hit-factor__field">
                <span className="hit-factor__label">{hf.powerFactorLabel}</span>
                <select
                  className="hit-factor__select"
                  value={powerFactor}
                  onChange={(e) => setPowerFactor(e.target.value as PowerFactor)}
                >
                  <option value="minor">{hf.powerFactorMinor}</option>
                  <option value="major">{hf.powerFactorMajor}</option>
                </select>
              </label>
              <label className="hit-factor__field hit-factor__field--toggle">
                <span className="hit-factor__label">{hf.missModelLabel}</span>
                <button
                  type="button"
                  className={`hit-factor__toggle${missIncludesLostAlpha ? ' is-on' : ''}`}
                  aria-pressed={missIncludesLostAlpha}
                  onClick={() => setMissIncludesLostAlpha((v) => !v)}
                >
                  <span className="hit-factor__toggle-dot" aria-hidden="true" />
                  <span className="hit-factor__toggle-text">
                    {missIncludesLostAlpha ? hf.missModelPenaltyPlusLost : hf.missModelPenaltyOnly}
                  </span>
                </button>
              </label>
            </div>

            <div className="hit-factor__penalties">
              <div className="hit-factor__penalties-head">
                <h2 className="hit-factor__h2">{hf.deviationsTitle}</h2>
                <p className="hit-factor__hint">{hf.deviationsLead}</p>
              </div>

              <div className="hit-factor__grid hit-factor__grid--5">
                <label className="hit-factor__field">
                  <span className="hit-factor__label">{hf.charlieLabel}</span>
                  <input
                    inputMode="numeric"
                    className="hit-factor__input"
                    value={deltaCharlieRaw}
                    onChange={(e) => setDeltaCharlieRaw(e.target.value)}
                  />
                </label>
                <label className="hit-factor__field">
                  <span className="hit-factor__label">{hf.deltaLabel}</span>
                  <input
                    inputMode="numeric"
                    className="hit-factor__input"
                    value={deltaDeltaRaw}
                    onChange={(e) => setDeltaDeltaRaw(e.target.value)}
                  />
                </label>
                <label className="hit-factor__field">
                  <span className="hit-factor__label">{hf.missLabel}</span>
                  <input
                    inputMode="numeric"
                    className="hit-factor__input"
                    value={deltaMissRaw}
                    onChange={(e) => setDeltaMissRaw(e.target.value)}
                  />
                </label>
                <label className="hit-factor__field">
                  <span className="hit-factor__label">{hf.proceduralLabel}</span>
                  <input
                    inputMode="numeric"
                    className="hit-factor__input"
                    value={deltaProceduralRaw}
                    onChange={(e) => setDeltaProceduralRaw(e.target.value)}
                  />
                </label>
                <label className="hit-factor__field">
                  <span className="hit-factor__label">{hf.noShootLabel}</span>
                  <input
                    inputMode="numeric"
                    className="hit-factor__input"
                    value={deltaNoShootRaw}
                    onChange={(e) => setDeltaNoShootRaw(e.target.value)}
                  />
                </label>
              </div>
            </div>

            <details className="hit-factor__modelNote">
              <summary className="hit-factor__modelNoteSummary">{hf.modelNoteLabel}</summary>
              <p className="hit-factor__modelNoteBody">{hf.modelNote}</p>
            </details>
          </div>

          <div className="hit-factor__resultCol" aria-live="polite">
            <div className="hit-factor__scoreCard">
              <div className="hit-factor__scoreTop">
                <div className="hit-factor__scoreMeta">
                  <span className="hit-factor__scoreLabel">{hf.hfActualLabel}</span>
                  <strong className="hit-factor__scoreValue">
                    {analysis?.hfActual !== null && analysis ? analysis.hfActual.toFixed(4) : '—'}
                  </strong>
                </div>
                <div className="hit-factor__scoreMeta hit-factor__scoreMeta--muted">
                  <span className="hit-factor__scoreLabel">{hf.hfMaxLabel}</span>
                  <strong className="hit-factor__scoreValue">
                    {analysis?.hfMax !== null && analysis ? analysis.hfMax.toFixed(4) : '—'}
                  </strong>
                </div>
              </div>

              <div className="hit-factor__scoreBottom">
                <div className="hit-factor__kv">
                  <span>{hf.maxPointsLabel}</span>
                  <strong>{analysis ? String(analysis.maxPoints) : '—'}</strong>
                </div>
                <div className="hit-factor__kv">
                  <span>{hf.actualPointsLabel}</span>
                  <strong>{analysis ? String(analysis.actualPoints) : '—'}</strong>
                </div>
                <div className="hit-factor__kv">
                  <span>{hf.hfLossLabel}</span>
                  <strong>
                    {analysis?.hfLossPct !== null && analysis ? `${analysis.hfLossPct.toFixed(1)}%` : '—'}
                  </strong>
                </div>
              </div>
            </div>

            <div className="hit-factor__impact">
              <h2 className="hit-factor__h2">{hf.impactTitle}</h2>
              <p className="hit-factor__hint">{hf.impactLead}</p>

              <div className="hit-factor__impactGrid">
                {(
                  [
                    ['charlie', hf.charlieLabel],
                    ['delta', hf.deltaLabel],
                    ['miss', hf.missLabel],
                    ['procedural', hf.proceduralLabel],
                    ['noShoot', hf.noShootLabel],
                  ] as const
                ).map(([key, label]) => {
                  const row = analysis?.perError[key]
                  const pts = row ? row.points : null
                  const sec = row ? row.seconds : null
                  return (
                    <div key={key} className="hit-factor__impactRow">
                      <span className="hit-factor__impactKey">{label}</span>
                      <span className="hit-factor__impactPts">
                        {pts !== null ? (pts > 0 ? `+${pts}` : String(pts)) : '—'}
                      </span>
                      <span className="hit-factor__impactSec">
                        {sec !== null && sec !== undefined
                          ? `${sec.toFixed(2)} ${hf.secondsUnit}`
                          : '—'}
                      </span>
                    </div>
                  )
                })}
                <div className="hit-factor__impactRow hit-factor__impactRow--time">
                  <span className="hit-factor__impactKey">{hf.plusOneSecondLabel}</span>
                  <span className="hit-factor__impactPts">—</span>
                  <span className="hit-factor__impactSec">
                    {analysis?.perError.plus1s.hf !== null && analysis
                      ? `${analysis.perError.plus1s.hf!.toFixed(4)} HF`
                      : '—'}
                  </span>
                </div>
                <div className="hit-factor__impactRow hit-factor__impactRow--time">
                  <span className="hit-factor__impactKey">{hf.minusOneSecondLabel}</span>
                  <span className="hit-factor__impactPts">—</span>
                  <span className="hit-factor__impactSec">
                    {analysis?.perError.minus1s.hf !== null && analysis
                      ? `${analysis.perError.minus1s.hf!.toFixed(4)} HF`
                      : '—'}
                  </span>
                </div>
              </div>
            </div>

            <div className="hit-factor__actions">
              <button
                type="button"
                className="hit-factor__reset"
                onClick={() => {
                  setRequiredHitsRaw('20')
                  setTimeRaw('10.00')
                  setPowerFactor('minor')
                  setMissIncludesLostAlpha(true)
                  setDeltaCharlieRaw('0')
                  setDeltaDeltaRaw('0')
                  setDeltaMissRaw('0')
                  setDeltaProceduralRaw('0')
                  setDeltaNoShootRaw('0')
                }}
              >
                {hf.reset}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

