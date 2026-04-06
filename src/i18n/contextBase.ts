import { createContext } from 'react'
import type { Locale, MessageTree } from './messages'

export type I18nValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (path: string, vars?: Record<string, string | number>) => string
  tree: MessageTree
}

export const I18nContext = createContext<I18nValue | null>(null)
