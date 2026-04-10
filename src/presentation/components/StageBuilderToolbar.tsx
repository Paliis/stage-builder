import {
  INFRASTRUCTURE_PROPS_FURNITURE_RACK,
  INFRASTRUCTURE_PROPS_PRIMARY,
  INFRASTRUCTURE_PROPS_TAIL,
} from '../../domain/infrastructureProps'
import { useId } from 'react'
import type { PlacementMode } from '../../domain/placementMode'
import type { PropType, TargetType } from '../../domain/models'
import type { MessageTree } from '../../i18n/messages'

function targetAddButtonClass(type: TargetType): string {
  switch (type) {
    case 'paperIpsc':
    case 'paperIpscTwoPostGround':
    case 'paperIpscTwoPostStand50':
    case 'paperIpscTwoPostStand100':
    case 'paperA4':
    case 'paperMiniIpsc':
    case 'swingerSinglePaper':
    case 'swingerDoublePaper':
      return 'app__tb app__tb--paper'
    case 'metalPlate':
    case 'metalPlateStand50':
    case 'metalPlateStand100':
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
    case 'shieldPortLow':
    case 'shieldPortHigh':
    case 'shieldPortSlanted':
    case 'shieldWithPortDoor':
      return 'app__tb-prop app__tb-prop--shield'
    case 'door':
      return 'app__tb-prop app__tb-prop--door'
    case 'faultLine':
      return 'app__tb-prop app__tb-prop--fault'
    case 'barrel':
      return 'app__tb-prop app__tb-prop--barrel'
    case 'tireStack':
      return 'app__tb-prop app__tb-prop--tire'
    case 'woodTable':
      return 'app__tb-prop app__tb-prop--woodTable'
    case 'woodChair':
      return 'app__tb-prop app__tb-prop--woodChair'
    case 'weaponRackPyramid':
      return 'app__tb-prop app__tb-prop--weaponRack'
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

function placementTitle(
  baseLabel: string,
  armed: boolean,
  clickPlan: string,
  escHint: string,
  layoutNarrow: boolean,
  armedNarrow: string,
): string {
  if (!armed) return baseLabel
  if (layoutNarrow) return `${baseLabel} — ${armedNarrow}`
  return `${baseLabel} — ${clickPlan} ${escHint}`
}

export type StageBuilderToolbarProps = {
  className?: string
  tree: MessageTree
  name: string
  allowedTargetTypes: TargetType[]
  placementMode: PlacementMode
  /** Matches plan toolbar breakpoint (~52rem): one tap places one item and exits placement. */
  layoutNarrow: boolean
  onArmTarget: (type: TargetType, isNoShoot?: boolean) => void
  onArmProp: (type: PropType) => void
}

export function StageBuilderToolbar({
  className,
  tree,
  name,
  allowedTargetTypes,
  placementMode,
  layoutNarrow,
  onArmTarget,
  onArmProp,
}: StageBuilderToolbarProps) {
  const furnitureGroupId = useId()
  const infraPropButtons = (types: readonly PropType[]) =>
    types.map((pt) => {
      const armed = placementMode?.kind === 'prop' && placementMode.type === pt
      return (
        <button
          key={pt}
          type="button"
          className={`app__btn-secondary ${propAddButtonClass(pt)}${armed ? ' is-placement-armed' : ''}`}
          aria-pressed={armed}
          title={placementTitle(
            tree.props[pt],
            armed,
            tree.toolbar.placementClickPlan,
            tree.toolbar.placementCancelEsc,
            layoutNarrow,
            tree.toolbar.placementArmedTitleNarrow,
          )}
          onClick={() => onArmProp(pt)}
        >
          {tree.props[pt]}
        </button>
      )
    })

  return (
    <section className={className ?? 'app__toolbar'} aria-label={tree.toolbar.aria}>
      {placementMode ? (
        <p className="app__toolbar-placement-hint" role="status" aria-live="polite">
          {layoutNarrow ? tree.toolbar.placementHintNarrow : `${tree.toolbar.placementClickPlan} ${tree.toolbar.placementCancelEsc}`}
        </p>
      ) : null}
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
          {allowedTargetTypes.map((ty) => {
            const armed =
              placementMode?.kind === 'target' &&
              placementMode.type === ty &&
              placementMode.isNoShoot === false
            return (
              <button
                key={ty}
                type="button"
                className={`${targetAddButtonClass(ty)}${armed ? ' is-placement-armed' : ''}`}
                aria-pressed={armed}
                title={placementTitle(
                  tree.targets[ty],
                  armed,
                  tree.toolbar.placementClickPlan,
                  tree.toolbar.placementCancelEsc,
                  layoutNarrow,
                  tree.toolbar.placementArmedTitleNarrow,
                )}
                onClick={() => onArmTarget(ty, false)}
              >
                {tree.targets[ty]}
              </button>
            )
          })}
        </div>
        <p className="app__targets-ns-caption">{tree.toolbar.targetsNsCaption}</p>
        <div className="app__buttons app__buttons--targets-ns" role="group" aria-label={tree.toolbar.targetsNsAria}>
          {(
            [
              ['paperIpsc', tree.targets.noShootPaper] as const,
              ['paperIpscTwoPostGround', tree.targets.noShootPaperTwoPostGround] as const,
              ['paperIpscTwoPostStand50', tree.targets.noShootPaperTwoPostStand50] as const,
              ['paperIpscTwoPostStand100', tree.targets.noShootPaperTwoPostStand100] as const,
              ['paperA4', tree.targets.noShootPaperA4] as const,
              ['paperMiniIpsc', tree.targets.noShootPaperMini] as const,
              ['metalPlate', tree.targets.noShootMetal] as const,
              ['metalPlateStand50', tree.targets.noShootMetalStand50] as const,
              ['metalPlateStand100', tree.targets.noShootMetalStand100] as const,
              ['popper', tree.targets.noShootPopper] as const,
              ['miniPopper', tree.targets.noShootMiniPopper] as const,
            ] as const
          ).map(([ty, label]) => {
            const armed =
              placementMode?.kind === 'target' &&
              placementMode.type === ty &&
              placementMode.isNoShoot === true
            return (
              <button
                key={ty}
                type="button"
                className={`app__tb app__tb--ns${armed ? ' is-placement-armed' : ''}`}
                aria-pressed={armed}
                title={placementTitle(
                  label,
                  armed,
                  tree.toolbar.placementClickPlan,
                  tree.toolbar.placementCancelEsc,
                  layoutNarrow,
                  tree.toolbar.placementArmedTitleNarrow,
                )}
                onClick={() => onArmTarget(ty, true)}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>
      <div
        className="app__toolbar-section app__toolbar-section--infra"
        role="region"
        aria-label={tree.toolbar.infrastructureAria}
      >
        <h2 className="app__section-title">{tree.toolbar.infrastructureHeading}</h2>
        <p className="app__section-hint">{tree.toolbar.infrastructureHint}</p>
        <div className="app__buttons">{infraPropButtons(INFRASTRUCTURE_PROPS_PRIMARY)}</div>
        <p id={furnitureGroupId} className="app__toolbar-infra-sub">
          {tree.toolbar.furnitureGroupLabel}
        </p>
        <div className="app__buttons" role="group" aria-labelledby={furnitureGroupId}>
          {infraPropButtons(INFRASTRUCTURE_PROPS_FURNITURE_RACK)}
        </div>
        <div className="app__buttons">{infraPropButtons(INFRASTRUCTURE_PROPS_TAIL)}</div>
      </div>
    </section>
  )
}
