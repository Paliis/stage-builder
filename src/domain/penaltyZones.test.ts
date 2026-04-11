import { describe, expect, it } from 'vitest'
import {
  canClosePolyline,
  emptyPenaltyZoneSet,
  PENALTY_ZONE_CLOSE_EPSILON_M,
  pointInPolygonWithHoles,
  pointInSimplePolygon,
  reclampPenaltyZoneSet,
  vecDist,
} from './penaltyZones'
import type { PenaltyPolygonData } from './penaltyZones'

describe('penaltyZones', () => {
  it('canClosePolyline respects epsilon', () => {
    const v = [
      { x: 1, y: 1 },
      { x: 5, y: 1 },
    ]
    expect(canClosePolyline(v, { x: 1, y: 1 + PENALTY_ZONE_CLOSE_EPSILON_M * 0.5 })).toBe(true)
    expect(canClosePolyline(v, { x: 1, y: 1 + PENALTY_ZONE_CLOSE_EPSILON_M * 3 })).toBe(false)
  })

  it('pointInSimplePolygon square', () => {
    const sq = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ]
    expect(pointInSimplePolygon({ x: 5, y: 5 }, sq)).toBe(true)
    expect(pointInSimplePolygon({ x: 11, y: 5 }, sq)).toBe(false)
  })

  it('pointInPolygonWithHoles excludes hole', () => {
    const poly: PenaltyPolygonData = {
      id: 'p1',
      outer: {
        id: 'o',
        vertices: [
          { x: 0, y: 0 },
          { x: 20, y: 0 },
          { x: 20, y: 20 },
          { x: 0, y: 20 },
        ],
        closed: true,
      },
      holes: [
        {
          id: 'h',
          vertices: [
            { x: 8, y: 8 },
            { x: 12, y: 8 },
            { x: 12, y: 12 },
            { x: 8, y: 12 },
          ],
          closed: true,
        },
      ],
    }
    expect(pointInPolygonWithHoles({ x: 5, y: 5 }, poly)).toBe(true)
    expect(pointInPolygonWithHoles({ x: 10, y: 10 }, poly)).toBe(false)
  })

  it('reclampPenaltyZoneSet clamps vertices', () => {
    const pz = emptyPenaltyZoneSet()
    pz.polygons.push({
      id: 'x',
      outer: {
        id: 'o',
        vertices: [
          { x: -1, y: 5 },
          { x: 100, y: 5 },
          { x: 5, y: 100 },
        ],
        closed: true,
      },
      holes: [],
    })
    const r = reclampPenaltyZoneSet(pz, 30, 40)
    expect(r.polygons[0]!.outer.vertices[0]!.x).toBe(0)
    expect(r.polygons[0]!.outer.vertices[1]!.x).toBe(30)
  })

  it('vecDist', () => {
    expect(vecDist({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5)
  })
})
