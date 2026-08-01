import { beforeEach, describe, expect, it } from 'vitest'
import { useStageStore } from './stageStore'
import { defaultPropSizeM } from '../domain/propGeometry'

describe('addProp placement', () => {
  beforeEach(() => {
    useStageStore.getState().resetSceneToDefaults()
  })

  it('puts a fault line at the very bottom of the field', () => {
    const { x: fw, y: fh } = useStageStore.getState().fieldSizeM
    useStageStore.getState().addProp('faultLine', undefined, { x: fw / 2, y: 0 })
    const placed = useStageStore.getState().props.at(-1)!
    // Раніше clamp тримав центр за 2 м від краю, хоча товщина лінії — сантиметри.
    expect(placed.position.y).toBeLessThan(0.2)
  })

  it('keeps the long axis of a fault line inside the field', () => {
    const { x: fw } = useStageStore.getState().fieldSizeM
    useStageStore.getState().addProp('faultLine', undefined, { x: 0, y: 5 })
    const placed = useStageStore.getState().props.at(-1)!
    const halfLength = defaultPropSizeM('faultLine').x / 2
    expect(placed.position.x).toBeGreaterThanOrEqual(halfLength)
    expect(placed.position.x).toBeLessThan(fw / 2)
  })
})
