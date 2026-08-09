# План продуктових роликів (reel-packs)

**Оновлено:** 2026-08-09  
**Медіаплан (що знімаємо, передача, рев’ю):** [MEDIA_PLAN.md](./MEDIA_PLAN.md).  
**Паралельно з OBS:** [RECORDING_GUIDE.md](./RECORDING_GUIDE.md) не замінюємо — це інший пайплайн (скрінкаст). Тут — **скріни + `pack.json` → «Відео агент»**.

## Ідея

1. У цьому репо агент Stage Builder готує **`content/user-help/videos/reel-packs/<slug>/`** (PNG + `pack.json` + короткий README).
2. У сусідньому проєкті **«Відео агент»** збирає ролик: склейка, VO, субтитри, 16:9 і 9:16.
3. YouTube / Telegram — **людина** після рев’ю; у `manifest.json` потім проставляється `publishedUrl`.

Промпт для кроку 1: [AGENT_PROMPT_REEL_PACK.md](./AGENT_PROMPT_REEL_PACK.md).

## Порядок продуктових pack

| # | slug | ~с | Головна вигода | Pack |
|---|------|----|----------------|------|
| 1 | `ecosystem-hero` | 58 | від вправи до готового матчу | [reel-packs/ecosystem-hero/](./reel-packs/ecosystem-hero/) |
| 2 | `stage-builder-value` | 38 | 2D → 3D → PDF → бібліотека | ще немає |
| 3 | `match-organizer-flow` | 55 | програма, учасники, оплата, PractiScore | після MA-C04 |
| 4 | `shooter-event-flow` | 35 | знайти, переглянути, зареєструватися, оплатити | після launch |

`field-size`, `place-target` та інші вузькі ролики — P2 help; pack `field-size` зберігається як приклад технічного гайда.

## Чекліст одного slug

1. Сценарій актуальний: `scripts/<slug>.md`.
2. У чаті Stage Builder: вставити промпт з `AGENT_PROMPT_REEL_PACK.md` + `SLUG=…` (за замовч. `ecosystem-hero`).
3. Отримати `reel-packs/<slug>/` зі статусом `screenshots: ready`, `partial` або `pending`.
4. Якщо кадр залежить від майбутнього release UI — лишити точний `capture_status`, не вигадувати PNG.
5. Скопіювати блок «Відео агент» з відповіді → зібрати ролик.
6. Рев’ю → публікація → `publishedUrl` у `manifest.json`.

## Демо-сцена (єдиний стандарт)

- Поле **20×30 м**, назва **«Демо UH»** / «Демо вправи»
- За потреби сценарію: **2× IPSC**, **1 поппер**, **щит з портом**, **старт** (для 3D краще два старти)
- UI **UK**, масштаб браузера **100%**, без онбординг-діалогу й нотифікацій
- URL редактора: `https://shooters-tools.com/uk/stage-builder`

## Статуси pack

| Статус | Значення |
|--------|----------|
| `screenshots: pending` | Є повний `pack.json` + інструкції зйомки; PNG ще немає |
| `screenshots: partial` | Чернетку можна збирати; фінал чекає release-dependent кадрів |
| `screenshots: ready` | Усі `file` з `frames[]` лежать у папці |
| `assembled` | Ролик зібрано у Відео агенті (локально / артефакт) |
| `published` | Є публічне посилання в `manifest.json` |
