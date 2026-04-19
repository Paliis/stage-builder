import type { Locale } from '../i18n/messages'
import type { RoHelperCategory, RoHelperDiscipline } from './constants'
import { isRoHelperCategory, isRoHelperDiscipline } from './constants'

export type ArticleGlobRef = {
  locale: Locale
  discipline: RoHelperDiscipline
  category: RoHelperCategory
  slug: string
  /** Vite glob key (relative path) */
  globKey: string
}

const loaders = import.meta.glob<string>('../../content/ro-helper/**/*.md', {
  query: '?raw',
  import: 'default',
})

function parseGlobKey(key: string): ArticleGlobRef | null {
  const norm = key.replace(/\\/g, '/')
  const m = norm.match(/ro-helper\/(uk|en)\/([^/]+)\/([^/]+)\/([^/]+)\.md$/)
  if (!m) return null
  const locale = m[1] as Locale
  const discipline = m[2]
  const category = m[3]
  const slug = m[4]
  if (!isRoHelperDiscipline(discipline) || !isRoHelperCategory(category)) return null
  return { locale, discipline, category, slug, globKey: key }
}

let cachedRefs: ArticleGlobRef[] | null = null

export function listArticleRefs(): ArticleGlobRef[] {
  if (cachedRefs) return cachedRefs
  const out: ArticleGlobRef[] = []
  for (const k of Object.keys(loaders)) {
    const r = parseGlobKey(k)
    if (r) out.push(r)
  }
  cachedRefs = out
  return out
}

export async function loadArticleRaw(
  locale: Locale,
  discipline: RoHelperDiscipline,
  category: RoHelperCategory,
  slug: string,
): Promise<string | null> {
  const ref = listArticleRefs().find(
    (r) =>
      r.locale === locale &&
      r.discipline === discipline &&
      r.category === category &&
      r.slug === slug,
  )
  if (!ref) return null
  const fn = loaders[ref.globKey]
  if (!fn) return null
  return (await fn()) as string
}

export function listSlugsFor(
  locale: Locale,
  discipline: RoHelperDiscipline,
  category: RoHelperCategory,
): string[] {
  const slugs = new Set<string>()
  for (const r of listArticleRefs()) {
    if (r.locale === locale && r.discipline === discipline && r.category === category) slugs.add(r.slug)
  }
  return [...slugs].sort()
}

export function listRefsForTopic(locale: Locale, category: RoHelperCategory): ArticleGlobRef[] {
  return listArticleRefs().filter((r) => r.locale === locale && r.category === category)
}
