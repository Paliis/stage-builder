import { describe, expect, it } from 'vitest'
import {
  RANGE_DISTANCE_SIGN_LABEL_MAX,
  RANGE_DISTANCE_SIGN_LABEL_MIN,
  clampRangeDistanceSignLabelM,
  reclampRangeDistanceSignsToField,
} from './rangeDistanceSigns'

describe('rangeDistanceSigns', () => {
  it('clamps label to 1–999', () => {
    expect(clampRangeDistanceSignLabelM(0)).toBe(RANGE_DISTANCE_SIGN_LABEL_MIN)
    expect(clampRangeDistanceSignLabelM(-5)).toBe(RANGE_DISTANCE_SIGN_LABEL_MIN)
    expect(clampRangeDistanceSignLabelM(500)).toBe(500)
    expect(clampRangeDistanceSignLabelM(999)).toBe(RANGE_DISTANCE_SIGN_LABEL_MAX)
    expect(clampRangeDistanceSignLabelM(1000)).toBe(RANGE_DISTANCE_SIGN_LABEL_MAX)
    expect(clampRangeDistanceSignLabelM(12_000)).toBe(RANGE_DISTANCE_SIGN_LABEL_MAX)
  })

  it('reclamps labels in signs', () => {
    const out = reclampRangeDistanceSignsToField(
      [
        { id: 'a', edgePositionYM: 10, labelM: 2000 },
        { id: 'b', edgePositionYM: 5, labelM: 50 },
      ],
      100,
    )
    expect(out[0]!.labelM).toBe(999)
    expect(out[1]!.labelM).toBe(50)
    expect(out[0]!.edgePositionYM).toBe(10)
  })
})
