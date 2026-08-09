# План запису онбординг-роликів (reel-packs)

**Оновлено:** 2026-08-09  
**Медіаплан (що знімаємо, передача, рев’ю):** [MEDIA_PLAN.md](./MEDIA_PLAN.md).  
**Паралельно з OBS:** [RECORDING_GUIDE.md](./RECORDING_GUIDE.md) не замінюємо — це інший пайплайн (скрінкаст). Тут — **скріни + `pack.json` → «Відео агент»**.

## Ідея

1. У цьому репо агент Stage Builder готує **`content/user-help/videos/reel-packs/<slug>/`** (PNG + `pack.json` + короткий README).
2. У сусідньому проєкті **«Відео агент»** збирає ролик: склейка, VO, субтитри, 16:9 і 9:16.
3. YouTube / Telegram — **людина** після рев’ю; у `manifest.json` потім проставляється `publishedUrl`.

Промпт для кроку 1: [AGENT_PROMPT_REEL_PACK.md](./AGENT_PROMPT_REEL_PACK.md).

## Порядок зйомки / pack (P0 Stage Builder)

| # | slug | ~с | Залежність демо-сцени | Pack |
|---|------|----|------------------------|------|
| 1 | `field-size` | 35 | чисте поле → 20×30 | [reel-packs/field-size/](./reel-packs/field-size/) |
| 2 | `place-target` | 45 | після розміру: 2×IPSC, поппер | ще немає |
| 3 | `view-3d-shooter` | 55 | + старт(и), щит з портом | ще немає |
| 4 | `briefing-pdf` | 55 | назва «Демо UH», заповнений брифінг | ще немає |
| 5 | `save-stage-file` | 45 | збереження в «Мої вправи» | ще немає |
| 6 | `first-stage-full` | 120 | зшивка 1–5 або окремий master-pack | ще немає |

П1/P2 (`shield-and-3d`, `measure-distance`, …) — після P0.

Матчі / RO Helper — окрема черга (`matches-*`, `ro-helper-search`).

## Чекліст одного slug

1. Сценарій актуальний: `scripts/<slug>.md`.
2. У чаті Stage Builder: вставити промпт з `AGENT_PROMPT_REEL_PACK.md` + `SLUG=…` (за замовч. `field-size`).
3. Отримати `reel-packs/<slug>/` зі статусом `screenshots: ready` або `pending`.
4. Якщо `pending` — за 2 хв зробити PNG за README пакета, покласти файли з іменами з `pack.json`.
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
| `screenshots: ready` | Усі `file` з `frames[]` лежать у папці |
| `assembled` | Ролик зібрано у Відео агенті (локально / артефакт) |
| `published` | Є публічне посилання в `manifest.json` |
