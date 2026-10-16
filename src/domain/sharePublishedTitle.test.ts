import { describe, expect, it } from 'vitest'
import { defaultStageBriefing } from './stageBriefing'
import { resolveSharePublishedTitle, resolveStageLibraryTitle } from './sharePublishedTitle'

describe('resolveSharePublishedTitle', () => {
  it('prefers documentTitle when both exist', () => {
    expect(
      resolveSharePublishedTitle(
        { name: 'Нова вправа' },
        { ...defaultStageBriefing(), documentTitle: 'Стейдж Альфа' },
      ),
    ).toBe('Стейдж Альфа')
  })

  it('falls back to stage.name when documentTitle is blank', () => {
    expect(
      resolveSharePublishedTitle({ name: 'Тільки план' }, { ...defaultStageBriefing(), documentTitle: '   ' }),
    ).toBe('Тільки план')
  })
})

describe('resolveStageLibraryTitle', () => {
  it('keeps an explicit stage name', () => {
    expect(resolveStageLibraryTitle('Моя вправа', 'Впр№8', 'Нова вправа')).toBe('Моя вправа')
  })

  it('uses briefing document title when stage name is empty', () => {
    expect(resolveStageLibraryTitle('  ', 'Впр№8_ВісімкаОпт1', 'Нова вправа')).toBe(
      'Впр№8_ВісімкаОпт1',
    )
  })

  it('uses fallback when both are empty', () => {
    expect(resolveStageLibraryTitle('', '  ', 'Нова вправа')).toBe('Нова вправа')
  })
})
