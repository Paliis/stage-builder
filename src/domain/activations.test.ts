import { describe, expect, it } from 'vitest'
import {
  activationPlanLabelPoint,
  activationPlanLabelRenderPoint,
  collectParticipantRefs,
  dedupeActivationEdges,
  filterActivationsValid,
  globalActivationNumberMap,
  refKey,
} from './activations'
import type { ActivationEdge, Prop, Target } from './models'

const t = (id: string, x: number, y: number): Target => ({
  id,
  type: 'metalPlate',
  isNoShoot: false,
  position: { x, y },
  rotationRad: 0,
})

const paper = (id: string, x: number, y: number): Target => ({
  id,
  type: 'paperIpscTwoPostGround',
  isNoShoot: false,
  position: { x, y },
  rotationRad: 0,
})

const p = (id: string, x: number, y: number): Prop => ({
  id,
  type: 'barrel',
  sizeM: { x: 0.6, y: 0.6 },
  position: { x, y },
  rotationRad: 0,
})

describe('activations domain', () => {
  it('assigns global numbers: targets first by id, then props', () => {
    const edges: ActivationEdge[] = [
      {
        id: 'e1',
        from: { kind: 'prop', id: 'p1' },
        to: { kind: 'target', id: 'b' },
      },
      {
        id: 'e2',
        from: { kind: 'target', id: 'a' },
        to: { kind: 'target', id: 'b' },
      },
    ]
    const map = globalActivationNumberMap(edges)
    expect(map.get(refKey({ kind: 'target', id: 'a' }))).toBe(1)
    expect(map.get(refKey({ kind: 'target', id: 'b' }))).toBe(2)
    expect(map.get(refKey({ kind: 'prop', id: 'p1' }))).toBe(3)
  })

  it('filters invalid edges and dedupes', () => {
    const targets: Target[] = [t('a', 1, 1), t('b', 2, 2)]
    const props: Prop[] = [p('p1', 3, 3)]
    const edges: ActivationEdge[] = [
      { id: '1', from: { kind: 'target', id: 'a' }, to: { kind: 'target', id: 'b' } },
      { id: '2', from: { kind: 'target', id: 'a' }, to: { kind: 'target', id: 'b' } },
      { id: '3', from: { kind: 'target', id: 'a' }, to: { kind: 'target', id: 'a' } },
      { id: '4', from: { kind: 'target', id: 'x' }, to: { kind: 'target', id: 'b' } },
    ]
    const d = dedupeActivationEdges(filterActivationsValid(edges, targets, props))
    expect(d).toHaveLength(1)
    expect(d[0]!.from.id).toBe('a')
    expect(d[0]!.to.id).toBe('b')
  })

  it('collectParticipantRefs is stable', () => {
    const refs = collectParticipantRefs([
      { id: '1', from: { kind: 'prop', id: 'z' }, to: { kind: 'target', id: 't' } },
    ])
    expect(refs.map(refKey)).toEqual([refKey({ kind: 'target', id: 't' }), refKey({ kind: 'prop', id: 'z' })])
  })

  it('shifts activation label sideways for compact steel/ceramic/miniPopper targets', () => {
    const targets: Target[] = [t('plate', 0, 0), t('other', 8, 0)]
    const props: Prop[] = []
    const edges: ActivationEdge[] = [
      { id: 'e1', from: { kind: 'target', id: 'plate' }, to: { kind: 'target', id: 'other' } },
    ]
    const ref = { kind: 'target' as const, id: 'plate' }
    const base = activationPlanLabelPoint(ref, edges, targets, props)
    const render = activationPlanLabelRenderPoint(ref, edges, targets, props)
    expect(base).not.toBeNull()
    expect(render).not.toBeNull()
    const d = Math.hypot(render!.x - base!.x, render!.y - base!.y)
    expect(d).toBeCloseTo(0.32, 2)
  })

  it('does not shift label for large paper targets', () => {
    const targets: Target[] = [paper('p', 0, 0), t('other', 8, 0)]
    const props: Prop[] = []
    const edges: ActivationEdge[] = [
      { id: 'e1', from: { kind: 'target', id: 'p' }, to: { kind: 'target', id: 'other' } },
    ]
    const ref = { kind: 'target' as const, id: 'p' }
    expect(activationPlanLabelPoint(ref, edges, targets, props)).toEqual(
      activationPlanLabelRenderPoint(ref, edges, targets, props),
    )
  })
})
