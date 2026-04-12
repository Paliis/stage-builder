import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { I18nContext, type I18nValue } from './contextBase'
import { formatTemplate } from './format'
import { getMessage } from './paths'
import type { Locale, MessageTree } from './messages'
import { messagesByLocale } from './messages'
import { getInitialLocale, writeStoredLocale } from './storage'

function applySeoMeta(seo: MessageTree['seo']) {
  const set = (selector: string, attr: string, value: string) => {
    const el = document.querySelector(selector)
    if (el) el.setAttribute(attr, value)
  }
  set('meta[name="description"]', 'content', seo.metaDescription)
  set('meta[property="og:description"]', 'content', seo.metaDescription)
  set('meta[name="twitter:description"]', 'content', seo.metaDescription)
  set('meta[property="og:image:alt"]', 'content', seo.ogImageAlt)
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => getInitialLocale())

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    writeStoredLocale(next)
  }, [])

  const tree: MessageTree = messagesByLocale[locale]

  useEffect(() => {
    document.documentElement.lang = locale === 'en' ? 'en' : 'uk'
    applySeoMeta(tree.seo)
  }, [locale, tree])

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
