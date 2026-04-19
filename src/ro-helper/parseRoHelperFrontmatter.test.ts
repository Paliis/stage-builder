import { describe, expect, it } from 'vitest'
import { parseRoHelperArticleFrontmatter } from './parseRoHelperFrontmatter'
import { plainSummaryFromMd } from './plainSummaryFromMd'

const SAMPLE_META = `title: "Методи підрахунку"
card_id: "C161"
slug: "scoring-methods"
category: scoring
locale: uk
discipline: pcc
ipsc_edition: "Jan 2026"
ipsc_refs:
  - rule: "9.2"
    note: "Scoring methods"
primary_url: "https://example.com/rules.pdf"
fpsu_refs:
  - rule: "X §2"
    note: "Метод"
    url: "https://upsf.org.ua/rules/upsf/2020/10-scoring#2"
fpsu_delta_verified: false
`

describe('parseRoHelperArticleFrontmatter', () => {
  it('extracts scalars, IPSC rules, and FPSU URLs', () => {
    const fm = parseRoHelperArticleFrontmatter(SAMPLE_META)
    expect(fm.title).toBe('Методи підрахунку')
    expect(fm.primaryUrl).toBe('https://example.com/rules.pdf')
    expect(fm.ipscEdition).toBe('Jan 2026')
    expect(fm.ipscRules).toEqual(['9.2'])
    expect(fm.fpsuUrls[0]).toContain('upsf.org.ua')
  })
})

describe('plainSummaryFromMd', () => {
  it('skips headings and returns truncated plain text', () => {
    const md = `## Що це\n\n**9.2** визначає методи.\n\nДругий абзац.`
    expect(plainSummaryFromMd(md, 40)).toMatch(/^9\.2/)
  })
})
