import { describe, expect, it } from 'vitest'
import {
  buildStageViewTransform,
  computeViewTransform,
  panCssToCenterWorldPoint,
  screenToWorld,
  spawnCenterWorldFromView,
  worldToScreen,
} from './viewTransform'

describe('worldToScreen / screenToWorld', () => {
  it('roundtrips at zoom 1', () => {
    const t = buildStageViewTransform(800, 600, 1, { x: 0, y: 0 }, 30, 40)
    const sx = 120
    const sy = 200
    const w = screenToWorld(sx, sy, t)
    const back = worldToScreen(w.x, w.y, t)
    expect(back.x).toBeCloseTo(sx, 5)
    expect(back.y).toBeCloseTo(sy, 5)
  })
})

describe('computeViewTransform', () => {
  it('centers field in canvas with default padding', () => {
    const t = computeViewTransform(800, 600, 30, 40)
    const c = spawnCenterWorldFromView(800, 600, t)
    expect(c.x).toBeCloseTo(15, 1)
    expect(c.y).toBeCloseTo(20, 1)
  })
})

describe('panCssToCenterWorldPoint', () => {
  it('returns pan so world point maps to canvas center', () => {
    const zoom = 1
    const w = 800
    const h = 600
    const fw = 30
    const fh = 40
    const world = { x: 10, y: 12 }
    const pan = panCssToCenterWorldPoint(w, h, world.x, world.y, zoom, fw, fh)
    const t1 = buildStageViewTransform(w, h, zoom, pan, fw, fh)
    const mid = screenToWorld(w * 0.5, h * 0.5, t1)
    expect(mid.x).toBeCloseTo(world.x, 4)
    expect(mid.y).toBeCloseTo(world.y, 4)
  })
})
