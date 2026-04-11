import { type ReactNode } from 'react'
import {
  INFRASTRUCTURE_EQUIPMENT,
  INFRASTRUCTURE_FAULT_LINE,
  INFRASTRUCTURE_SHIELDS,
} from '../../domain/infrastructureProps'
import {
  filterTargetTypesByGroup,
  TOOLBAR_GROUP_CERAMIC,
  TOOLBAR_GROUP_METAL,
  TOOLBAR_GROUP_MOVING,
  TOOLBAR_GROUP_PAPER,
  TOOLBAR_GROUP_PENALTY_CERAMIC,
  TOOLBAR_GROUP_PENALTY_METAL,
  TOOLBAR_GROUP_PENALTY_PAPER,
} from '../../domain/toolbarTargetGroups'
import type { PlacementMode } from '../../domain/placementMode'
import type { PropType, TargetType } from '../../domain/models'
import type { MessageTree } from '../../i18n/messages'

function targetAddButtonClass(type: TargetType): string {
  switch (type) {
    case 'paperIpscTwoPostGround':
    case 'paperIpscTwoPostStand50':
    case 'paperIpscTwoPostStand100':
    case 'paperA4TwoPostGround':
    case 'paperA4TwoPostStand50':
    case 'paperA4TwoPostStand100':
    case 'paperMiniIpscTwoPostGround':
    case 'paperMiniIpscTwoPostStand50':
    case 'paperMiniIpscTwoPostStand100':
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

function noShootLabel(tr: MessageTree['targets'], ty: TargetType): string {
  switch (ty) {
    case 'paperIpscTwoPostGround':
      return tr.noShootPaperTwoPostGround
    case 'paperIpscTwoPostStand50':
      return tr.noShootPaperTwoPostStand50
    case 'paperIpscTwoPostStand100':
      return tr.noShootPaperTwoPostStand100
    case 'paperA4TwoPostGround':
      return tr.noShootPaperA4TwoPostGround
    case 'paperA4TwoPostStand50':
      return tr.noShootPaperA4TwoPostStand50
    case 'paperA4TwoPostStand100':
      return tr.noShootPaperA4TwoPostStand100
    case 'paperMiniIpscTwoPostGround':
      return tr.noShootPaperMiniTwoPostGround
    case 'paperMiniIpscTwoPostStand50':
      return tr.noShootPaperMiniTwoPostStand50
    case 'paperMiniIpscTwoPostStand100':
      return tr.noShootPaperMiniTwoPostStand100
    case 'metalPlate':
      return tr.noShootMetal
    case 'metalPlateStand50':
      return tr.noShootMetalStand50
    case 'metalPlateStand100':
      return tr.noShootMetalStand100
    case 'popper':
      return tr.noShootPopper
    case 'miniPopper':
      return tr.noShootMiniPopper
    case 'ceramicPlate':
      return tr.noShootCeramicPlate
    case 'swingerSinglePaper':
      return tr.noShootSwingerSinglePaper
    case 'swingerDoublePaper':
      return tr.noShootSwingerDoublePaper
    case 'swingerSingleCeramic':
      return tr.noShootSwingerSingleCeramic
    case 'swingerDoubleCeramic':
      return tr.noShootSwingerDoubleCeramic
    default: {
      const _e: never = ty
      return _e
    }
  }
}

function ToolbarSubgroup({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <details className="app__toolbar-details" open>
      <summary className="app__toolbar-details-summary">{title}</summary>
      <div className="app__toolbar-details-body">{children}</div>
    </details>
  )
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
  onArmPenaltyContour: () => void
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
  onArmPenaltyContour,
}: StageBuilderToolbarProps) {
  const tp = tree.toolbar
  const tr = tree.targets

  const paperTypes = filterTargetTypesByGroup(allowedTargetTypes, TOOLBAR_GROUP_PAPER)
  const metalTypes = filterTargetTypesByGroup(allowedTargetTypes, TOOLBAR_GROUP_METAL)
  const ceramicTypes = filterTargetTypesByGroup(allowedTargetTypes, TOOLBAR_GROUP_CERAMIC)
  const movingTypes = filterTargetTypesByGroup(allowedTargetTypes, TOOLBAR_GROUP_MOVING)

  const nsPaperTypes = filterTargetTypesByGroup(allowedTargetTypes, TOOLBAR_GROUP_PENALTY_PAPER)
  const nsMetalTypes = filterTargetTypesByGroup(allowedTargetTypes, TOOLBAR_GROUP_PENALTY_METAL)
  const nsCeramicTypes = filterTargetTypesByGroup(allowedTargetTypes, TOOLBAR_GROUP_PENALTY_CERAMIC)

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
            tp.placementClickPlan,
            tp.placementCancelEsc,
            layoutNarrow,
            tp.placementArmedTitleNarrow,
          )}
          onClick={() => onArmProp(pt)}
        >
          {tree.props[pt]}
        </button>
      )
    })

  const targetButtons = (types: readonly TargetType[], isNoShoot: boolean) =>
    types.map((ty) => {
      const armed =
        placementMode?.kind === 'target' && placementMode.type === ty && placementMode.isNoShoot === isNoShoot
      const label = isNoShoot ? noShootLabel(tr, ty) : tr[ty]
      return (
        <button
          key={`${isNoShoot ? 'ns' : 't'}-${ty}`}
          type="button"
          className={`${isNoShoot ? `app__tb app__tb--ns${armed ? ' is-placement-armed' : ''}` : `${targetAddButtonClass(ty)}${armed ? ' is-placement-armed' : ''}`}`}
          aria-pressed={armed}
          title={placementTitle(
            label,
            armed,
            tp.placementClickPlan,
            tp.placementCancelEsc,
            layoutNarrow,
            tp.placementArmedTitleNarrow,
          )}
          onClick={() => onArmTarget(ty, isNoShoot)}
        >
          {label}
        </button>
      )
    })

  return (
    <section className={className ?? 'app__toolbar'} aria-label={tree.toolbar.aria}>
      {placementMode ? (
        <p className="app__toolbar-placement-hint" role="status" aria-live="polite">
          {layoutNarrow ? tp.placementHintNarrow : `${tp.placementClickPlan} ${tp.placementCancelEsc}`}
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
        <ToolbarSubgroup title={tp.groupPaper}>
          <div className="app__buttons">{targetButtons(paperTypes, false)}</div>
        </ToolbarSubgroup>
        <ToolbarSubgroup title={tp.groupMetal}>
          <div className="app__buttons">{targetButtons(metalTypes, false)}</div>
        </ToolbarSubgroup>
        <ToolbarSubgroup title={tp.groupCeramic}>
          <div className="app__buttons">{targetButtons(ceramicTypes, false)}</div>
        </ToolbarSubgroup>
        <ToolbarSubgroup title={tp.groupMoving}>
          <div className="app__buttons">{targetButtons(movingTypes, false)}</div>
        </ToolbarSubgroup>
      </div>

      <div
        className="app__toolbar-section app__toolbar-section--penalty-targets"
        role="region"
        aria-label={tree.toolbar.targetsNsAria}
      >
        <h2 className="app__section-title">{tp.penaltyTargetsHeading}</h2>
        <ToolbarSubgroup title={tp.groupPenaltyPaper}>
          <div className="app__buttons app__buttons--targets-ns">{targetButtons(nsPaperTypes, true)}</div>
        </ToolbarSubgroup>
        <ToolbarSubgroup title={tp.groupPenaltyMetal}>
          <div className="app__buttons app__buttons--targets-ns">{targetButtons(nsMetalTypes, true)}</div>
        </ToolbarSubgroup>
        <ToolbarSubgroup title={tp.groupPenaltyCeramic}>
          <div className="app__buttons app__buttons--targets-ns">{targetButtons(nsCeramicTypes, true)}</div>
        </ToolbarSubgroup>
      </div>

      <div
        className="app__toolbar-section app__toolbar-section--infra"
        role="region"
        aria-label={tree.toolbar.infrastructureAria}
      >
        <h2 className="app__section-title">{tree.toolbar.infrastructureHeading}</h2>
        <p className="app__section-hint">{tree.toolbar.infrastructureHint}</p>
        <ToolbarSubgroup title={tp.infraGroupShields}>
          <div className="app__buttons">{infraPropButtons(INFRASTRUCTURE_SHIELDS)}</div>
        </ToolbarSubgroup>
        <ToolbarSubgroup title={tp.infraGroupFaultLines}>
          <div className="app__buttons">
            {infraPropButtons(INFRASTRUCTURE_FAULT_LINE)}
            <button
              type="button"
              className={`app__btn-secondary app__tb-penalty-contour${
                placementMode?.kind === 'penaltyZoneContour' ? ' is-placement-armed' : ''
              }`}
              aria-pressed={placementMode?.kind === 'penaltyZoneContour'}
              title={placementTitle(
                tp.penaltyZoneContour,
                placementMode?.kind === 'penaltyZoneContour',
                tp.placementClickPlan,
                tp.placementCancelEsc,
                layoutNarrow,
                tp.placementArmedTitleNarrow,
              )}
              onClick={() => onArmPenaltyContour()}
            >
              {tp.penaltyZoneContour}
            </button>
          </div>
          <p className="app__toolbar-fault-hint">{tp.penaltyZoneCloseHint}</p>
        </ToolbarSubgroup>
        <ToolbarSubgroup title={tp.infraGroupEquipment}>
          <div className="app__buttons">{infraPropButtons(INFRASTRUCTURE_EQUIPMENT)}</div>
        </ToolbarSubgroup>
      </div>
    </section>
  )
}
