import { describe, expect, it } from 'vitest'

import {
  matchBriefingsPdfApiUrl,
  matchBriefingsPdfContentDisposition,
  matchBriefingsPdfFileName,
} from './matchBriefingsExport'

describe('matchBriefingsExport', () => {
  it('builds filename from match title', () => {
    expect(matchBriefingsPdfFileName('Кубок Києва 2026')).toBe('Кубок-Києва-2026-briefings.pdf')
  })

  it('includes disposition in api url', () => {
    expect(matchBriefingsPdfApiUrl('abc', 'uk', 'attachment')).toContain('disposition=attachment')
  })

  it('sets utf-8 filename in content-disposition', () => {
    const h = matchBriefingsPdfContentDisposition('Тест-briefings.pdf', 'inline')
    expect(h).toContain('inline')
    expect(h).toContain("filename*=UTF-8''")
  })
})
