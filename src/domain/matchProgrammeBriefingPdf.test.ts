import { describe, expect, it } from 'vitest'

import {
  buildProgrammeBriefingStoragePath,
  isAcceptedProgrammeBriefingPdf,
  normalizeProgrammeBriefingPdfUrl,
} from './matchProgrammeBriefingPdf'

describe('matchProgrammeBriefingPdf', () => {
  it('builds fixed storage path per match', () => {
    expect(buildProgrammeBriefingStoragePath('uid', 'mid')).toBe('uid/mid/programme-briefing.pdf')
  })

  it('normalizes pdf url', () => {
    expect(normalizeProgrammeBriefingPdfUrl('  https://x/a.pdf ')).toBe('https://x/a.pdf')
    expect(normalizeProgrammeBriefingPdfUrl('')).toBeNull()
  })

  it('accepts pdf files', () => {
    expect(isAcceptedProgrammeBriefingPdf(new File(['x'], 'b.pdf', { type: 'application/pdf' }))).toBe(true)
  })
})
