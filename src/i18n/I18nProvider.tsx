import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { I18nContext, type I18nValue } from './contextBase'
import { formatTemplate } from './format'
import { getMessage } from './paths'
import type { Locale, MessageTree } from './messages'
import { messagesByLocale } from './messages'
import { getInitialLocale, writeStoredLocale } from './storage'

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => getInitialLocale())

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    writeStoredLocale(next)
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale === 'en' ? 'en' : 'uk'
  }, [locale])

  const tree: MessageTree = messagesByLocale[locale]

  const t = useCallback(
    (path: string, vars?: Record<string, string | number>) => {
      const raw = getMessage(tree, path)
      return vars ? formatTemplate(raw, vars) : raw
    },
    [tree],
  )

  const value: I18nValue = useMemo(
    () => ({ locale, setLocale, t, tree }),
    [locale, setLocale, t, tree],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
