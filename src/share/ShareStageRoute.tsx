import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  clearSessionDraftStorage,
  downloadSessionDraftEnvelopeAsFile,
  isSessionDraftMeaningful,
  peekSessionDraftEnvelope,
} from '../application/sessionDraft'
import { useBriefingStore } from '../application/briefingStore'
import { useStageStore } from '../application/stageStore'
import { parseStageProjectJson } from '../domain/stageProjectFile'
import { useI18n } from '../i18n/useI18n'
import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient'
import { payloadToProjectText } from './payloadToProjectText'
import App from '../App'

type ShareMode = 'view' | 'edit'

type LoadStatus = 'loading' | 'ready' | 'error'

export function ShareStageRoute({ mode }: { mode: ShareMode }) {
  const { shareId } = useParams<{ shareId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setLocale, t } = useI18n()
  const replaceStageState = useStageStore((s) => s.replaceStageState)
  const setBriefing = useBriefingStore((s) => s.setBriefing)

  const [draftResolved, setDraftResolved] = useState(() => {
    const env = peekSessionDraftEnvelope()
    return !env || !isSessionDraftMeaningful(env)
  })

  const [status, setStatus] = useState<LoadStatus>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const lang = searchParams.get('lang')
    if (lang === 'uk' || lang === 'en') setLocale(lang)
  }, [searchParams, setLocale])

  /** BL-001 F15: noindex for share routes (SPA — update existing meta from index.html). */
  useLayoutEffect(() => {
    const id = shareId?.trim()
    if (!id) return
    const robots = document.querySelector('meta[name="robots"]')
    const prevR = robots?.getAttribute('content') ?? null
    const googlebot = document.querySelector('meta[name="googlebot"]')
    const prevG = googlebot?.getAttribute('content') ?? null
    if (robots) robots.setAttribute('content', 'noindex, nofollow')
    if (googlebot) googlebot.setAttribute('content', 'noindex, nofollow')
    return () => {
      if (robots && prevR !== null) robots.setAttribute('content', prevR)
      if (googlebot && prevG !== null) googlebot.setAttribute('content', prevG)
    }
  }, [shareId])

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!draftResolved) return

      if (!shareId?.trim()) {
        setStatus('error')
        setErrorMessage(t('share.invalidId'))
        return
      }
      if (!isSupabaseConfigured()) {
        setStatus('error')
        setErrorMessage(t('share.envMissing'))
        return
      }

      setStatus('loading')
      setErrorMessage(null)

      try {
        const supabase = getSupabase()
        const { data, error } = await supabase.rpc('fetch_shared_stage', { lookup_id: shareId.trim() })
        if (cancelled) return
        if (error) {
          setStatus('error')
          setErrorMessage(error.message || t('share.loadError'))
          return
        }
        if (data == null || (typeof data === 'object' && data !== null && !('payload' in data))) {
          setStatus('error')
          setErrorMessage(t('share.notFoundOrExpired'))
          return
        }

        const row = data as Record<string, unknown>
        const text = payloadToProjectText(row.payload)
        if (!text) {
          setStatus('error')
          setErrorMessage(t('share.loadError'))
          return
        }

        const parsed = parseStageProjectJson(text)
        if (!parsed.ok) {
          setStatus('error')
          setErrorMessage(t('project.loadErrorShape'))
          return
        }

        const rowMode = typeof row.mode === 'string' ? row.mode : null
        if (rowMode === 'view' || rowMode === 'edit') {
          const expect = mode === 'view' ? 'view' : 'edit'
          if (rowMode !== expect) {
            console.warn('[share] URL mode does not match stored mode', { expect, rowMode, shareId })
          }
        }

        replaceStageState(parsed.data.stage)
        setBriefing(parsed.data.briefing)
        setStatus('ready')
      } catch (e) {
        if (cancelled) return
        setStatus('error')
        setErrorMessage(e instanceof Error ? e.message : t('share.loadError'))
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [draftResolved, shareId, mode, replaceStageState, setBriefing, t])

  const proceedAfterDraftChoice = useCallback(() => {
    clearSessionDraftStorage()
    setDraftResolved(true)
    setStatus('loading')
  }, [])

  const handleSaveDraftToFile = useCallback(() => {
    const env = peekSessionDraftEnvelope()
    if (env) downloadSessionDraftEnvelopeAsFile(env)
    proceedAfterDraftChoice()
  }, [proceedAfterDraftChoice])

  const handleDiscardDraft = useCallback(() => {
    proceedAfterDraftChoice()
  }, [proceedAfterDraftChoice])

  const handleCancelOpenShare = useCallback(() => {
    navigate('/')
  }, [navigate])

  if (!draftResolved) {
    return (
      <div className="app share-route">
        <div
          className="share-route__dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="share-draft-title"
        >
          <h2 id="share-draft-title" className="share-route__dialog-title">
            {t('share.draftConflictTitle')}
          </h2>
          <p className="share-route__dialog-body">{t('share.draftConflictBody')}</p>
          <div className="share-route__dialog-actions">
            <button type="button" className="app__btn-secondary" onClick={handleSaveDraftToFile}>
              {t('share.draftSave')}
            </button>
            <button type="button" className="app__btn-secondary" onClick={handleDiscardDraft}>
              {t('share.draftDiscard')}
            </button>
            <button type="button" className="app__btn-secondary" onClick={handleCancelOpenShare}>
              {t('share.draftCancel')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'loading') {
    return (
      <div className="app share-route">
        <div className="share-route__panel" role="status">
          <p>{t('share.loading')}</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="app share-route">
        <div className="share-route__panel share-route__panel--error" role="alert">
          <p>{errorMessage ?? t('share.loadError')}</p>
          <p>
            <Link to="/">{t('share.backHome')}</Link>
          </p>
        </div>
      </div>
    )
  }

  const sid = shareId?.trim()
  return (
    <App
      shareReadOnly={mode === 'view'}
      shareViewContext={sid ? { shareId: sid } : null}
    />
  )
}
