import type { StageBriefing } from './stageBriefing'

type StageNamePick = Pick<{ name: string }, 'name'>
type BriefingTitlePick = Pick<StageBriefing, 'documentTitle'>

/** Column `shared_stages.title` and programme UI: prefer briefing heading (`documentTitle`), then plan name (`stage.name`). */
export function resolveSharePublishedTitle(stage: StageNamePick, briefing: BriefingTitlePick): string {
  const doc = briefing.documentTitle.trim()
  const sn = stage.name.trim()
  const t = doc || sn || 'Stage'
  return t.slice(0, 500)
}
