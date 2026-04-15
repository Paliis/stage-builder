import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useBriefingStore } from '../application/briefingStore'
import { useStageStore } from '../application/stageStore'
import { parseStageProjectJson } from '../domain/stageProjectFile'
import { useI18n } from '../i18n/useI18n'
import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient'
import App from '../App'

function payloadToProjectText(payload: unknown): string | null {
  if (payload == null) return null
  if (typeof payload === 'string') return payload
  if (typeof payload === 'object') return JSON.stringify(payload)
  return null
}

type ShareMode = 'view' | 'edit'

type LoadStatus = 'loading' | 'ready' | 'error'

export function ShareStageRoute({ mode }: { mode: ShareMode }) {
  const { shareId } = useParams<{ shareId: string }>()
  const [searchParams] = useSearchParams()
  const { setLocale, t } = useI18n()
  const replaceStageState = useStageStore((s) => s.replaceStageState)
  const setBriefing = useBriefingStore((s) => s.setBriefing)

  const [status, setStatus] = useState<LoadStatus>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const lang = searchParams.get('lang')
    if (lang === 'uk' || lang === 'en') setLocale(lang)
  }, [searchParams, setLocale])

  useEffect(() => {
    let cancelled = false

    async function run() {
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
  }, [shareId, mode, replaceStageState, setBriefing, t])

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

  return <App shareReadOnly={mode === 'view'} />
}
