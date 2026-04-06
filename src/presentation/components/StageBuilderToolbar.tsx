import { INFRASTRUCTURE_PROP_ORDER } from '../../domain/infrastructureProps'
import type { PropType, TargetType } from '../../domain/models'
import type { MessageTree } from '../../i18n/messages'

function targetAddButtonClass(type: TargetType): string {
  switch (type) {
    case 'paperIpsc':
    case 'paperA4':
    case 'swingerSinglePaper':
    case 'swingerDoublePaper':
      return 'app__tb app__tb--paper'
    case 'metalPlate':
    case 'popper':
    case 'miniPopper':
      return 'app__tb app__tb--metal'
    case 'ceramicPlate':
    case 'swingerSingleCeramic':
    case 'swingerDoubleCeramic':
      return 'app__tb app__tb--ceramic'
    default: {
      const _e: never = type
      return _e
    }
  }
}

function propAddButtonClass(type: PropType): string {
  switch (type) {
    case 'shield':
    case 'shieldDouble':
    case 'shieldWithPort':
      return 'app__tb-prop app__tb-prop--shield'
    case 'door':
      return 'app__tb-prop app__tb-prop--door'
    case 'faultLine':
      return 'app__tb-prop app__tb-prop--fault'
    case 'barrel':
      return 'app__tb-prop app__tb-prop--barrel'
    case 'tireStack':
      return 'app__tb-prop app__tb-prop--tire'
    case 'seesaw':
      return 'app__tb-prop app__tb-prop--seesaw'
    case 'movingPlatform':
      return 'app__tb-prop app__tb-prop--moving'
    case 'cooperTunnel':
      return 'app__tb-prop app__tb-prop--cooper'
    case 'startPosition':
      return 'app__tb-prop app__tb-prop--start'
    default: {
      const _e: never = type
      return _e
    }
  }
}

export type StageBuilderToolbarProps = {
  className?: string
  tree: MessageTree
  name: string
  allowedTargetTypes: TargetType[]
  onAddTarget: (type: TargetType, isNoShoot?: boolean) => void
  onAddProp: (type: PropType) => void
}

export function StageBuilderToolbar({
  className,
  tree,
  name,
  allowedTargetTypes,
  onAddTarget,
  onAddProp,
}: StageBuilderToolbarProps) {
  /* Клас зброї тимчасово приховано (див. stageStore addTarget). */
  return (
    <section className={className ?? 'app__toolbar'} aria-label={tree.toolbar.aria}>
      <div
        className="app__toolbar-section app__toolbar-section--first"
        role="region"
        aria-label={tree.toolbar.targetsAria}
      >
        <div className="app__section-head">
          <h2 className="app__section-title">{tree.toolbar.targetsHeading}</h2>
          <span className="app__stage-name app__stage-name--inline">{name}</span>
        </div>
        <div className="app__buttons">
          {allowedTargetTypes.map((ty) => (
            <button key={ty} type="button" className={targetAddButtonClass(ty)} onClick={() => onAddTarget(ty)}>
              {tree.targets[ty]}
            </button>
          ))}
        </div>
        <p className="app__targets-ns-caption">{tree.toolbar.targetsNsCaption}</p>
        <div className="app__buttons app__buttons--targets-ns" role="group" aria-label={tree.toolbar.targetsNsAria}>
          <button type="button" className="app__tb app__tb--ns" onClick={() => onAddTarget('paperIpsc', true)}>
            {tree.targets.noShootPaper}
          </button>
          <button type="button" className="app__tb app__tb--ns" onClick={() => onAddTarget('paperA4', true)}>
            {tree.targets.noShootPaperA4}
          </button>
          <button type="button" className="app__tb app__tb--ns" onClick={() => onAddTarget('metalPlate', true)}>
            {tree.targets.noShootMetal}
          </button>
          <button type="button" className="app__tb app__tb--ns" onClick={() => onAddTarget('popper', true)}>
            {tree.targets.noShootPopper}
          </button>
          <button type="button" className="app__tb app__tb--ns" onClick={() => onAddTarget('miniPopper', true)}>
            {tree.targets.noShootMiniPopper}
          </button>
        </div>
      </div>
      <div
        className="app__toolbar-section app__toolbar-section--infra"
        role="region"
        aria-label={tree.toolbar.infrastructureAria}
      >
        <h2 className="app__section-title">{tree.toolbar.infrastructureHeading}</h2>
        <p className="app__section-hint">{tree.toolbar.infrastructureHint}</p>
        <div className="app__buttons">
          {INFRASTRUCTURE_PROP_ORDER.map((pt: PropType) => (
            <button
              key={pt}
              type="button"
              className={`app__btn-secondary ${propAddButtonClass(pt)}`}
              onClick={() => onAddProp(pt)}
            >
              {tree.props[pt]}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
