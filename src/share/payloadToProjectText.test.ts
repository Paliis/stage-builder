import { describe, expect, it } from 'vitest'
import { parseStageProjectJson } from '../domain/stageProjectFile'
import { payloadToProjectText } from './payloadToProjectText'

describe('payloadToProjectText', () => {
  it('returns null for unsupported types', () => {
    expect(payloadToProjectText(undefined)).toBeNull()
    expect(payloadToProjectText(42)).toBeNull()
  })

  it('passes through string payload', () => {
    const raw = '{"format":"stage-builder","version":2,"stage":{"name":"S","weaponClass":"handgun","fieldSizeM":{"x":30,"y":40},"fieldGroundCover3d":"grass","targets":[],"props":[],"penaltyZoneSet":{"polygons":[]}},"briefing":{"documentTitle":"T","exerciseType":"short","targetsDescription":"","recommendedShots":"","allowedAmmo":"","maxPoints":"","startSignal":"","readyCondition":"","startPosition":"","procedure":"","safetyAngles":""}}'
    expect(payloadToProjectText(raw)).toBe(raw)
  })

  it('stringifies object payload for parseStageProjectJson', () => {
    const obj = {
      format: 'stage-builder',
      version: 2,
      stage: {
        name: 'Obj payload',
        weaponClass: 'handgun',
        fieldSizeM: { x: 30, y: 40 },
        fieldGroundCover3d: 'grass',
        targets: [],
        props: [],
        penaltyZoneSet: { polygons: [] },
      },
      briefing: {
        documentTitle: 'T',
        exerciseType: 'short',
        targetsDescription: '',
        recommendedShots: '',
        allowedAmmo: '',
        maxPoints: '',
        startSignal: '',
        readyCondition: '',
        startPosition: '',
        procedure: '',
        safetyAngles: '',
      },
    }
    const text = payloadToProjectText(obj)
    expect(text).not.toBeNull()
    const parsed = parseStageProjectJson(text!)
    expect(parsed.ok).toBe(true)
    if (parsed.ok) expect(parsed.data.stage.name).toBe('Obj payload')
  })
})
