# Промпт: pack для «Відео агент»

Вставте в чат агента **Stage Builder**. Замініть `<SLUG>` або лишіть `ecosystem-hero`.

---

Ти агент проєкту Shooters Tools / Stage Builder. Підготуй контент-пакет для генерації продуктового ролика у сусідньому проєкті «Відео агент» (скріни + опис → відео з VO і субтитрами).

## Мета
НЕ знімати OBS і НЕ монтувати відео. Зроби лише pack зі скрінами UI та структурованим JSON, щоб інший агент зібрав ролик.

## Джерело сценарію
Використай існуючий сценарій рілса:
- `content/user-help/videos/scripts/<SLUG>.md`
- за потреби `production/<SLUG>.md` і `manifest.json`

За замовчуванням почни з P0: **`ecosystem-hero`** (якщо я не вказав інший slug).

Демо-вправа для кадрів (як у `scripts/README.md`):
- поле 20×30 м
- назва «Демо UH» / «Демо вправи»
- 2× IPSC, 1 поппер, щит з портом, старт — лише якщо сценарій цього вимагає
- мова UI: українська
- чистий інтерфейс: без діалогу онбордингу, без нотифікацій, масштаб браузера 100%

## Що зробити
1. Прочитай сценарій і розбий таймінг на discrete кадри (одна ключова **вигода / результат** = один скрін). Не перетворюй ролик на покрокову інструкцію.
2. Зроби/експортуй скріни (PNG, бажано ≥1280 px по ширині, 16:9 або з запасом під crop 9:16).
3. Збережи пакет сюди:
```
content/user-help/videos/reel-packs/<SLUG>/
  01_....png
  02_....png
  ...
  pack.json
  README.md
```
Якщо реальний UI зараз недоступний для зйомки — створи `pack.json` повністю, познач кожен кадр `capture_status`, додай точні умови дозйомки й постав у README статус `screenshots: partial` або `pending`. Не вигадуй фейкові PNG «як ніби UI».

## Формат pack.json
Див. приклад у `reel-packs/ecosystem-hero/pack.json`. Обов’язкові поля: `version`, `product`, `slug`, `title`, `goal`, `language`, `source_script`, `target_duration_sec`, `aspect_hints`, `demo_stage`, `brand`, `frames[]` (`id`, `file`, `duration_sec`, `capture_status`, `action`, `voiceover`, `subtitle`, `motion`, `crop_safe`), `music_mood`, `notes_for_video_agent`.

Правила:
- Сума `duration_sec` ≈ `target_duration_sec` (±10%).
- `voiceover` природний, без жаргону (PWA, localStorage тощо).
- Один кадр = одна вигода або результат; детальні кліки лишаються для help-сценаріїв.
- Останній кадр — CTA / URL.
- Імена файлів з нумерацією `01_`, `02_`, …
- Усі шляхи `file` — відносні до папки pack.

## Після виконання
Коротко:
1. Шлях до pack/
2. Скільки кадрів і орієнтовна тривалість
3. `screenshots: ready | partial | pending`
4. Блок для копіювання в чат «Відео агент»:

```
Збери ролик з pack Stage Builder.
Шлях: content/user-help/videos/reel-packs/<SLUG>
Формати: 16:9, 9:16
Додай VO + субтитри + легку музику за pack.json.
```

## Обмеження
- Не публікуй на YouTube.
- Не змінюй прод-код без потреби; контент лише в `content/user-help/videos/reel-packs/`.
- Не замінюй скрінкаст-гайд у `RECORDING_GUIDE.md` — це окремий паралельний пайплайн.
