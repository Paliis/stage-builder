import { describe, expect, it } from 'vitest'
import { defaultStageBriefing } from './stageBriefing'
import { resolveSharePublishedTitle } from './sharePublishedTitle'

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
