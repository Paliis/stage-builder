import { useEffect, useMemo, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useI18n } from '../i18n/useI18n'
import { formatTemplate } from '../i18n/format'
import { computeHitFactorAnalysis, type PowerFactor } from './computeHitFactorAnalysis'
import './HitFactorPage.css'

type ExerciseType = 'short' | 'medium' | 'long'

function getExerciseType(weaponClass: 'pistol' | 'rifle' | 'pcc' | 'shotgun', requiredHits: number): ExerciseType {
  const shots = clampNonNegInt(requiredHits)
  if (weaponClass === 'shotgun') {
    if (shots <= 8) return 'short'
    if (shots <= 16) return 'medium'
    return 'long' // 17–28+
  }
  if (weaponClass === 'rifle') {
    if (shots <= 10) return 'short'
    if (shots <= 20) return 'medium'
    return 'long' // 21–40+
  }
  // pistol + PCC
  if (shots <= 12) return 'short'
  if (shots <= 24) return 'medium'
  return 'long' // 25–32+
}

function getSpeedStepSec(exerciseType: ExerciseType): number {
  if (exerciseType === 'short') return 0.5
  if (exerciseType === 'medium') return 0.75
  return 1.0
}

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

function formatHf(v: number): string {
  const a = Math.abs(v)
  if (a >= 1000) return v.toFixed(2)
  if (a >= 100) return v.toFixed(3)
  return v.toFixed(4)
}

export function HitFactorPage() {
  const { tree } = useI18n()
  const p = tree.portal
  const hf = tree.hitFactor

  const [requiredHitsRaw, setRequiredHitsRaw] = useState('20')
  const [timeRaw, setTimeRaw] = useState('10.00')
  const [powerFactor, setPowerFactor] = useState<PowerFactor>('major')
  const [weaponClass, setWeaponClass] = useState<'pistol' | 'rifle' | 'pcc' | 'shotgun'>('pistol')

  const [deltaCharlieRaw, setDeltaCharlieRaw] = useState('0')
  const [deltaDeltaRaw, setDeltaDeltaRaw] = useState('0')
  const [deltaMissRaw, setDeltaMissRaw] = useState('0')
  const [deltaNoShootRaw, setDeltaNoShootRaw] = useState('0')
  const [deltaProceduralRaw, setDeltaProceduralRaw] = useState('0')

  const [makeupCountRaw, setMakeupCountRaw] = useState('0')
  const [makeupSplitRaw, setMakeupSplitRaw] = useState('')
  const [makeupSplitManual, setMakeupSplitManual] = useState(false)

  const bump = (raw: string, by: number) => String(clampNonNegInt((parseIntOrNull(raw) ?? 0) + by))

  const requiredHits = useMemo(() => parseIntOrNull(requiredHitsRaw), [requiredHitsRaw])
  const timeSec = useMemo(() => parseNum(timeRaw), [timeRaw])
  const deltaCharlie = useMemo(() => parseIntOrNull(deltaCharlieRaw), [deltaCharlieRaw])
  const deltaDelta = useMemo(() => parseIntOrNull(deltaDeltaRaw), [deltaDeltaRaw])
  const deltaMiss = useMemo(() => parseIntOrNull(deltaMissRaw), [deltaMissRaw])
  const deltaNoShoot = useMemo(() => parseIntOrNull(deltaNoShootRaw), [deltaNoShootRaw])
  const deltaProcedural = useMemo(() => parseIntOrNull(deltaProceduralRaw), [deltaProceduralRaw])
  const makeupCount = useMemo(() => parseIntOrNull(makeupCountRaw), [makeupCountRaw])

  const defaultMakeupSplitSec = useMemo(() => {
    if (timeSec === null || timeSec <= 0) return null
    const hits = requiredHits ?? 0
    if (hits <= 0) return null
    return timeSec / hits / 2
  }, [requiredHits, timeSec])

  const makeupSplitSec = useMemo(() => {
    const n = parseNum(makeupSplitRaw)
    if (n !== null && n > 0) return n
    if (defaultMakeupSplitSec !== null && defaultMakeupSplitSec > 0) return defaultMakeupSplitSec
    return 0.25
  }, [defaultMakeupSplitSec, makeupSplitRaw])

  const makeupTimeSec = useMemo(() => {
    const c = clampNonNegInt(makeupCount ?? 0)
    if (c === 0) return 0
    return c * makeupSplitSec
  }, [makeupCount, makeupSplitSec])

  const totalTimeSec = useMemo(() => {
    if (timeSec === null) return null
    return timeSec + makeupTimeSec
  }, [makeupTimeSec, timeSec])

  useEffect(() => {
    if (makeupSplitManual) return
    if (defaultMakeupSplitSec === null) return
    setMakeupSplitRaw(defaultMakeupSplitSec.toFixed(2))
  }, [defaultMakeupSplitSec, makeupSplitManual])

  const timeSlider = useMemo(() => {
    const t = parseNum(timeRaw)
    if (t === null) return { min: 1, max: 60, value: 10 }
    const v = Math.min(60, Math.max(0.1, t))
    const min = Math.max(0.1, Math.floor(v - 10))
    const max = Math.min(60, Math.max(min + 1, Math.ceil(v + 10)))
    return { min, max, value: v }
  }, [timeRaw])

  const analysis = useMemo(() => {
    if (
      requiredHits === null ||
      totalTimeSec === null ||
      deltaCharlie === null ||
      deltaDelta === null ||
      deltaMiss === null ||
      deltaNoShoot === null ||
      deltaProcedural === null
    ) {
      return null
    }
    if (timeSec === null) return null
    return computeHitFactorAnalysis({
      requiredHits,
      timeBaseSec: timeSec,
      timeActualSec: totalTimeSec,
      powerFactor,
      deltaCharlie,
      deltaDelta,
      deltaMiss,
      deltaNoShoot,
      deltaProcedural,
    })
  }, [
    requiredHits,
    totalTimeSec,
    timeSec,
    powerFactor,
    deltaCharlie,
    deltaDelta,
    deltaMiss,
    deltaNoShoot,
    deltaProcedural,
  ])

  const focus = useMemo(() => {
    if (!analysis) return null
    if (totalTimeSec === null || totalTimeSec <= 0) return null
    if (analysis.hfActual === null || analysis.hfActual <= 0) return null

    const exerciseType = getExerciseType(weaponClass, requiredHits ?? 0)
    const deltaTime = getSpeedStepSec(exerciseType)
    const hfPlusTime = analysis.actualPoints / (totalTimeSec + deltaTime)
    const timeSensitivityPct = ((analysis.hfActual - hfPlusTime) / analysis.hfActual) * 100

    const pointsLossPct = analysis.pointsLossPct ?? 0

    const baseTime = totalTimeSec - makeupTimeSec
    const makeupSharePct = baseTime > 0 ? (makeupTimeSec / baseTime) * 100 : 0

    const candidates = [
      { kind: 'accuracy' as const, pct: pointsLossPct },
      { kind: 'makeups' as const, pct: makeupSharePct },
      { kind: 'speed' as const, pct: timeSensitivityPct },
    ]
    const best = candidates.reduce((a, b) => (b.pct > a.pct ? b : a), candidates[0])

    if (best.pct >= 5.0 && best.kind === 'makeups') {
      return {
        kind: 'makeups' as const,
        title: hf.focusMakeupsTitle,
        text: formatTemplate(hf.focusMakeupsText, {
          time: makeupSharePct.toFixed(1),
        }),
      }
    }

    if (best.pct >= 5.0 && best.kind === 'accuracy') {
      return {
        kind: 'accuracy' as const,
        title: hf.focusAccuracyTitle,
        text: formatTemplate(hf.focusAccuracyText, {
          loss: pointsLossPct.toFixed(1),
        }),
      }
    }

    if (best.pct >= 4.5 && best.kind === 'speed') {
      return {
        kind: 'speed' as const,
        title: hf.focusSpeedTitle,
        text: formatTemplate(hf.focusSpeedText, {
          step: deltaTime.toFixed(2),
          pct: timeSensitivityPct.toFixed(1),
        }),
      }
    }

    return {
      kind: 'balanced' as const,
      title: hf.focusBalancedTitle,
      text: hf.focusBalancedText,
    }
  }, [
    analysis,
    makeupTimeSec,
    makeupSplitSec,
    totalTimeSec,
    weaponClass,
    requiredHits,
    hf.focusAccuracyText,
    hf.focusAccuracyTitle,
    hf.focusBalancedText,
    hf.focusBalancedTitle,
    hf.focusMakeupsText,
    hf.focusMakeupsTitle,
    hf.focusSpeedText,
    hf.focusSpeedTitle,
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
          <div className="hit-factor__topLeft">
            <div className="hit-factor__topCard">
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

              <label className="hit-factor__timeSlider">
                <span className="hit-factor__timeSliderMeta">
                  <span className="hit-factor__timeSliderLabel">{hf.timeLabel}</span>
                  <span className="hit-factor__timeSliderRange">
                    {timeSlider.min.toFixed(0)}–{timeSlider.max.toFixed(0)}
                  </span>
                </span>
                <input
                  type="range"
                  className="hit-factor__range"
                  min={timeSlider.min}
                  max={timeSlider.max}
                  step={0.01}
                  value={timeSlider.value}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value)
                    if (!Number.isFinite(v)) return
                    setTimeRaw(v.toFixed(2))
                  }}
                />
              </label>
            </div>
          </div>

          <div className="hit-factor__topRight" aria-live="polite">
            <div className="hit-factor__scoreCard">
              <div className="hit-factor__scoreTop">
                <div className="hit-factor__scoreMeta">
                  <span className="hit-factor__scoreLabel">{hf.hfActualLabel}</span>
                  <strong className="hit-factor__scoreValue">
                    {analysis?.hfActual !== null && analysis ? formatHf(analysis.hfActual) : '—'}
                  </strong>
                </div>
                <div className="hit-factor__scoreMeta hit-factor__scoreMeta--muted">
                  <span className="hit-factor__scoreLabel">{hf.hfMaxLabel}</span>
                  <strong className="hit-factor__scoreValue">
                    {analysis?.hfMax !== null && analysis ? formatHf(analysis.hfMax) : '—'}
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
          </div>

          <div className="hit-factor__deviationsFull">
            <div className="hit-factor__penalties">
              <details className="hit-factor__deviationsDetails" open>
                <summary className="hit-factor__deviationsSummary">
                  <span className="hit-factor__deviationsSummaryTitle">{hf.deviationsTitle}</span>
                  <span className="hit-factor__deviationsSummaryMeta">
                    {(() => {
                      const items: string[] = []
                      const c = clampNonNegInt(parseIntOrNull(deltaCharlieRaw) ?? 0)
                      const d = clampNonNegInt(parseIntOrNull(deltaDeltaRaw) ?? 0)
                      const m = clampNonNegInt(parseIntOrNull(deltaMissRaw) ?? 0)
                      const p = clampNonNegInt(parseIntOrNull(deltaProceduralRaw) ?? 0)
                      const ns = clampNonNegInt(parseIntOrNull(deltaNoShootRaw) ?? 0)
                      const mu = clampNonNegInt(parseIntOrNull(makeupCountRaw) ?? 0)
                      if (c) items.push(`C:${c}`)
                      if (d) items.push(`D:${d}`)
                      if (m) items.push(`M:${m}`)
                      if (p) items.push(`P:${p}`)
                      if (ns) items.push(`NS:${ns}`)
                      if (mu) items.push(`MU:${mu}`)
                      return items.join(' · ')
                    })()}
                  </span>
                </summary>

                <div className="hit-factor__penalties-head">
                  <div className="hit-factor__penaltiesHeadMain">
                    <p className="hit-factor__hint">{hf.deviationsLead}</p>
                  </div>

                  <label className="hit-factor__penaltiesHeadSide">
                    <span className="hit-factor__label">{hf.weaponClassLabel}</span>
                    <select
                      className="hit-factor__select"
                      value={weaponClass}
                      onChange={(e) => setWeaponClass(e.target.value as typeof weaponClass)}
                      aria-label={hf.weaponClassLabel}
                    >
                      <option value="pistol">{hf.weaponClassPistol}</option>
                      <option value="rifle">{hf.weaponClassRifle}</option>
                      <option value="pcc">{hf.weaponClassPcc}</option>
                      <option value="shotgun">{hf.weaponClassShotgun}</option>
                    </select>
                  </label>
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

                <div className="hit-factor__deviationRow">
                  <span className="hit-factor__deviationKey">{hf.makeupShotLabel}</span>
                  <div className="hit-factor__deviationControl">
                    <input
                      inputMode="decimal"
                      className="hit-factor__stepperInput"
                      value={makeupSplitRaw}
                      onChange={(e) => {
                        setMakeupSplitManual(true)
                        setMakeupSplitRaw(e.target.value)
                      }}
                      placeholder={defaultMakeupSplitSec !== null ? defaultMakeupSplitSec.toFixed(2) : '0.25'}
                      aria-label={hf.makeupShotSplitLabel}
                    />
                    <div className="hit-factor__stepper" role="group" aria-label={hf.makeupShotCountLabel}>
                      <button
                        type="button"
                        className="hit-factor__stepperBtn"
                        onClick={() => setMakeupCountRaw((v) => bump(v, -1))}
                        aria-label={`-1 ${hf.makeupShotCountLabel}`}
                        disabled={clampNonNegInt(parseIntOrNull(makeupCountRaw) ?? 0) === 0}
                      >
                        −
                      </button>
                      <output className="hit-factor__stepperValue">{makeupCountRaw}</output>
                      <button
                        type="button"
                        className="hit-factor__stepperBtn"
                        onClick={() => setMakeupCountRaw((v) => bump(v, +1))}
                        aria-label={`+1 ${hf.makeupShotCountLabel}`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <span className="hit-factor__deviationPts">0</span>
                  <span className="hit-factor__deviationSec">
                    {`${makeupTimeSec.toFixed(2)} ${hf.secondsUnit}`}
                  </span>
                </div>
                </div>
              </details>
            </div>
          </div>

          {focus ? (
            <div className="hit-factor__focus" role="status" aria-live="polite">
              <h2 className="hit-factor__h2">{hf.focusTitle}</h2>
              <div className={`hit-factor__focusCard hit-factor__focusCard--${focus.kind}`}>
                <p className="hit-factor__focusHeading">{focus.title}</p>
                <p className="hit-factor__focusText">{focus.text}</p>
              </div>
            </div>
          ) : null}

          <div className="hit-factor__footerBar">
            <div className="hit-factor__pfInline">
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

            <details className="hit-factor__modelNote hit-factor__modelNote--inline">
              <summary className="hit-factor__modelNoteSummary">{hf.modelNoteLabel}</summary>
              <p className="hit-factor__modelNoteBody">{hf.modelNote}</p>
            </details>

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
                setWeaponClass('pistol')
                setMakeupCountRaw('0')
                setMakeupSplitRaw('')
                setMakeupSplitManual(false)
              }}
            >
              {hf.reset}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

