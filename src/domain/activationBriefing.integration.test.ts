import { describe, expect, it } from 'vitest'
import { buildActivationBriefingBlock } from './activationBriefing'
import type { ActivationEdge, Prop, Target } from './models'

const t = (id: string): Target => ({
  id,
  type: 'metalPlate',
  isNoShoot: false,
  position: { x: 1, y: 1 },
  rotationRad: 0,
})

const emptyProps: Prop[] = []

describe('buildActivationBriefingBlock', () => {
  it('builds UK lines with heading', () => {
    const edges: ActivationEdge[] = [
      { id: '1', from: { kind: 'target', id: 'a' }, to: { kind: 'target', id: 'b' } },
      { id: '2', from: { kind: 'target', id: 'a' }, to: { kind: 'target', id: 'c' } },
    ]
    const targets = [t('a'), t('b'), t('c')]
    const text = buildActivationBriefingBlock(edges, targets, emptyProps, 'uk')
    expect(text).toContain('Активації:')
    expect(text).toContain('№1')
    expect(text).toContain('та')
  })

  it('returns empty when no edges', () => {
    expect(buildActivationBriefingBlock([], [t('a')], emptyProps, 'en')).toBe('')
  })
})
