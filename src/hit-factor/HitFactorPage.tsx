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

function clampNonNegInt(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.trunc(n))
}

export function HitFactorPage() {
  const { tree } = useI18n()
  const p = tree.portal
  const hf = tree.hitFactor

  const [requiredHitsRaw, setRequiredHitsRaw] = useState('20')
  const [timeRaw, setTimeRaw] = useState('10.00')
  const [powerFactor, setPowerFactor] = useState<PowerFactor>('major')

  const [deltaCharlieRaw, setDeltaCharlieRaw] = useState('0')
  const [deltaDeltaRaw, setDeltaDeltaRaw] = useState('0')
  const [deltaMissRaw, setDeltaMissRaw] = useState('0')
  const [deltaNoShootRaw, setDeltaNoShootRaw] = useState('0')
  const [deltaProceduralRaw, setDeltaProceduralRaw] = useState('0')

  const bump = (raw: string, by: number) => String(clampNonNegInt((parseIntOrNull(raw) ?? 0) + by))

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

            <div className="hit-factor__penalties">
              <div className="hit-factor__penalties-head">
                <h2 className="hit-factor__h2">{hf.deviationsTitle}</h2>
                <p className="hit-factor__hint">{hf.deviationsLead}</p>
              </div>

              <div className="hit-factor__deviationList" role="group" aria-label={hf.deviationsTitle}>
                {(
                  [
                    ['charlie', hf.charlieLabel, deltaCharlieRaw, setDeltaCharlieRaw],
                    ['delta', hf.deltaLabel, deltaDeltaRaw, setDeltaDeltaRaw],
                    ['miss', hf.missLabel, deltaMissRaw, setDeltaMissRaw],
                    ['procedural', hf.proceduralLabel, deltaProceduralRaw, setDeltaProceduralRaw],
                    ['noShoot', hf.noShootLabel, deltaNoShootRaw, setDeltaNoShootRaw],
                  ] as const
                ).map(([key, label, raw, setRaw]) => {
                  const n = clampNonNegInt(parseIntOrNull(raw) ?? 0)
                  const row = analysis?.perError[key]
                  const pts = row ? row.points : null
                  const sec = row ? row.seconds : null
                  return (
                    <div key={key} className="hit-factor__deviationRow">
                      <span className="hit-factor__deviationKey">{label}</span>
                      <div className="hit-factor__stepper" role="group" aria-label={label}>
                        <button
                          type="button"
                          className="hit-factor__stepperBtn"
                          onClick={() => setRaw((v) => bump(v, -1))}
                          aria-label={`-1 ${label}`}
                          disabled={n === 0}
                        >
                          −
                        </button>
                        <output className="hit-factor__stepperValue">{raw}</output>
                        <button
                          type="button"
                          className="hit-factor__stepperBtn"
                          onClick={() => setRaw((v) => bump(v, +1))}
                          aria-label={`+1 ${label}`}
                        >
                          +
                        </button>
                      </div>
                      <span className="hit-factor__deviationPts">
                        {pts !== null ? (pts > 0 ? `+${pts}` : String(pts)) : '—'}
                      </span>
                      <span className="hit-factor__deviationSec">
                        {sec !== null && sec !== undefined ? `${sec.toFixed(2)} ${hf.secondsUnit}` : '—'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="hit-factor__controlsBottom">
              <div className="hit-factor__pf">
                <span className="hit-factor__label">{hf.powerFactorLabel}</span>
                <div className="hit-factor__pfSeg" role="group" aria-label={hf.powerFactorLabel}>
                  <button
                    type="button"
                    className={powerFactor === 'minor' ? 'is-active' : ''}
                    aria-pressed={powerFactor === 'minor'}
                    onClick={() => setPowerFactor('minor')}
                  >
                    {hf.powerFactorMinor}
                  </button>
                  <button
                    type="button"
                    className={powerFactor === 'major' ? 'is-active' : ''}
                    aria-pressed={powerFactor === 'major'}
                    onClick={() => setPowerFactor('major')}
                  >
                    {hf.powerFactorMajor}
                  </button>
                </div>
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

            <div className="hit-factor__actions">
              <button
                type="button"
                className="hit-factor__reset"
                onClick={() => {
                  setRequiredHitsRaw('20')
                  setTimeRaw('10.00')
                  setPowerFactor('major')
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

