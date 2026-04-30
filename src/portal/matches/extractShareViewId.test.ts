import { describe, expect, it } from 'vitest'
import { extractShareViewId } from './extractShareViewId'

describe('extractShareViewId', () => {
  it('parses /v/ segment from full URL', () => {
    expect(extractShareViewId('https://x.com/v/sAbc123?q=1')).toBe('sAbc123')
  })
  it('accepts raw share id', () => {
    expect(extractShareViewId('sXy9z')).toBe('sXy9z')
  })
  it('returns null for empty', () => {
    expect(extractShareViewId('')).toBeNull()
  })
})
