import type { Locale } from '../i18n/messages'

/** Editor route inside the portal shell. */
export function stageBuilderPath(locale: Locale | string): string {
  return `/${locale}/stage-builder`
}

/** Matches both the localized route and the legacy `/stage-builder` handled by a redirect. */
const STAGE_BUILDER_RE = /^(?:\/(?:uk|en))?\/stage-builder\/?$/

export function isStageBuilderPath(pathname: string): boolean {
  return STAGE_BUILDER_RE.test(pathname)
}
