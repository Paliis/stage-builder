import type { MessageTree } from '../i18n/messages'
import type { RoHelperArticleFrontmatter } from './parseRoHelperFrontmatter'

export function buildQuickCiteText(
  rh: MessageTree['roHelper'],
  fm: RoHelperArticleFrontmatter,
  opts: { showFpsuLayer: boolean; hasFpsuBody: boolean },
): string {
  const rules = fm.ipscRules.length > 0 ? fm.ipscRules.join(', ') : rh.quickCiteNoRules
  const edition = fm.ipscEdition ?? rh.quickCiteUnset
  const primary = fm.primaryUrl ?? rh.quickCiteUnset

  let fpsuLine = ''
  if (fm.fpsuUrls.length > 0) {
    fpsuLine = `${rh.quickCiteFpsu} ${fm.fpsuUrls.slice(0, 3).join(' ')}`
  } else if (opts.showFpsuLayer && opts.hasFpsuBody) {
    fpsuLine = `${rh.quickCiteFpsu} ${rh.quickCiteFpsuSeeBlock}`
  }

  const lines = [
    rh.quickCiteHeader,
    `${rh.quickCiteTopic} ${fm.title ?? rh.quickCiteUnset}`,
    `${rh.quickCiteIpsc} ${rules} (${edition})`,
    `${rh.quickCitePrimary} ${primary}`,
  ]
  if (fpsuLine) lines.push(fpsuLine)
  lines.push(rh.quickCiteNote)
  return lines.join('\n')
}
