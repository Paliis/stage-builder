import { describe, expect, it } from 'vitest'
import {
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
})
