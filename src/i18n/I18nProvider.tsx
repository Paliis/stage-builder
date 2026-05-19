import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { I18nContext, type I18nValue } from './contextBase'
import { formatTemplate } from './format'
import { getMessage } from './paths'
import type { Locale, MessageTree } from './messages'
import { messagesByLocale } from './messages'
import { getInitialLocale, writeStoredLocale } from './storage'

function applySeoMeta(tree: MessageTree, pathname: string) {
  const { seo, portal } = tree
  const set = (selector: string, attr: string, value: string) => {
    const el = document.querySelector(selector)
    if (el) el.setAttribute(attr, value)
  }

  const isStageBuilder = pathname === '/stage-builder'
  const description = isStageBuilder ? seo.stageBuilderMetaDescription : seo.metaDescription

  set('meta[name="description"]', 'content', description)
  set('meta[property="og:description"]', 'content', description)
  set('meta[name="twitter:description"]', 'content', description)
  set('meta[property="og:image:alt"]', 'content', seo.ogImageAlt)

  if (isStageBuilder) {
    document.title = seo.stageBuilderHelmetTitle
    set('meta[property="og:title"]', 'content', seo.stageBuilderHelmetTitle)
    set('meta[name="twitter:title"]', 'content', seo.stageBuilderHelmetTitle)
  } else if (pathname === '/uk' || pathname === '/en') {
    set('meta[property="og:title"]', 'content', portal.helmetTitle)
    set('meta[name="twitter:title"]', 'content', portal.helmetTitle)
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const [locale, setLocaleState] = useState<Locale>(() => getInitialLocale())

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    writeStoredLocale(next)
  }, [])

  const tree: MessageTree = messagesByLocale[locale]

  useEffect(() => {
    document.documentElement.lang = locale === 'en' ? 'en' : 'uk'
    applySeoMeta(tree, pathname)
  }, [locale, tree, pathname])

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
