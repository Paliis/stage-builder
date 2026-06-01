# Користувацька довідка та онбординг — план робіт

**Код розділу в плануванні:** **UH** (User Help).  
**Епік:** **BL-037** · **Беклог за шарами:** [BACKLOG_USER_HELP.md](./BACKLOG_USER_HELP.md) (**T** текст · **V** відео · **P** продукт).  
**Статус:** чернетка плану + **локальна структура контенту** (`content/user-help/`) — **ще не** в проді (немає маршруту `/help`, зміни в `messages.ts` — шар **P**).

**Межі:** це **користувацькі** тексти й сценарії (проста мова). Не дублюємо [FUNCTIONALITY.md](./FUNCTIONALITY.md) / [TECH.md](./TECH.md) — лише посилання для розробників у коментарях плану.

**Локальний контент:** [content/user-help/README.md](../content/user-help/README.md), маніфест [content/user-help/manifest.json](../content/user-help/manifest.json).

**Контент-план (усі розділи, таймінг рілсів, тексти FAQ/статей):** [USER_HELP_CONTENT_PLAN.md](./USER_HELP_CONTENT_PLAN.md) · сценарії відео: [content/user-help/videos/scripts/](../content/user-help/videos/scripts/).

**Поточний онбординг у коді:** діалог у `src/App.tsx`, рядки `src/i18n/messages.ts` (`onboardingS1…S6`) — замінюємо **після** затвердження текстів у `content/user-help/`.

---

## 1. Цілі та принципи

| Ціль | Як досягаємо |
|------|----------------|
| Перша вправа за ~5 хв | «Швидкий старт» — 4 кроки, без стіни тексту |
| Відповіді на типові «чому не…» | FAQ за **болями**, не за меню |
| Відео без перевантаження | Рілси 30–60 с, **одна дія** = одне відео |
| Два мови | Паралельно `uk` / `en` у `content/user-help/` |
| Без технічного жаргону | Без PWA, localStorage, env, Supabase у текстах для користувача |

**Не робимо:** одну велику вікі на весь портал (вікі-стиль лишається для **RO Helper**). Для Stage Builder / матчів — **статті за сценаріями** + **FAQ**.

---

## 2. Архітектура (3 шари)

```text
[У продукті]     Перший візит → 4 кроки (діалог)
                 Контекстні підказки (пізніша фаза)
                 Кнопка «Допомога» → меню статей / FAQ / відео

[Локально зараз] content/user-help/{uk,en}/…

[Прод пізніше]   /:locale/help/*  або статичний розділ на Vercel
                 Посилання з онбордингу та PortalHome
```

---

## 3. Фази та покрокові задачі

Позначення: **☐** — не почато, **◐** — в роботі, **☑** — готово (оновлюйте вручну в цьому файлі).

### Фаза 0 — Каркас (локально) — **☑ старт**

| ID | Задача | Результат | Статус |
|----|--------|-----------|--------|
| UH-00 | Створити `content/user-help/` + README + `manifest.json` | Структура папок, схема frontmatter | ☑ |
| UH-01 | Цей план у `docs/USER_HELP_ONBOARDING_PLAN.md` | Покроковий backlog **UH-*** | ☑ |
| UH-02 | Рядок **UH** у [PLANNING_INDEX.md](./PLANNING_INDEX.md) | Зв’язок з іншими розділами | ☑ |

### Фаза 1 — Контент «ядра» (українська)

Детальний перелік статей, FAQ і рілсів — [USER_HELP_CONTENT_PLAN.md](./USER_HELP_CONTENT_PLAN.md). Нижче — контрольні точки.

| ID | Задача | Файл(и) | Критерій готовності |
|----|--------|---------|---------------------|
| UH-10 | **Швидкий старт** | `uk/quick-start.md`, `en/quick-start.md` | 4 кроки; посилання на статті |
| UH-11 | Статті SB P0 (4 шт.) | `first-stage`, `save-and-share-file`, `briefing-and-pdf`, `share-link` | Текст за контент-планом §3 |
| UH-12 | Статті SB P1 (4 шт.) | `plan-2d-tools`, `shields-and-ports`, `mobile-tips`, `view-shared-stage` | + рілси P1 |
| UH-13 | Статті SB P2 (2 шт.) | `activations`, `range-distance-signs` | |
| UH-14 | Портал + share + account + HF | `portal/overview`, `share/publish-policy-user`, `account/profile`, `hit-factor/basics` | |
| UH-15 | **FAQ повний UK** | `uk/faq.md` | Усі F-* з контент-плану §2–9 |
| UH-16 | **Сценарії рілсів** | `videos/scripts/*.md` (17 файлів) | Таймінг 0:00–0:xx у кожному |
| UH-17 | In-app + context hints | `onboarding/in-app-dialog.md`, `context-hints.md` | Готово до UH-42/43 |
| UH-18 | Рев’ю з RO/організатором | — | `status: review` у manifest |

**Після UH-18:** синхронізувати **EN** (UH-19): переклад або паралельне написання `en/*`.

| ID | Задача | Статус |
|----|--------|--------|
| UH-19 | Англійські версії ядра (quick-start, faq, 4 статті, in-app) | ☐ |

### Фаза 2 — Відео (рілси)

| ID | Задача | Тривалість | Примітка |
|----|--------|------------|----------|
| UH-20 | Сценарій + storyboard (таблиця в `videos/manifest.json`) | — | Один рядок = один рілс |
| UH-21 | Зйомка екрана: поле, мішені, 3D, PDF, файл | 30–60 с кожен | Одна й та сама демо-вправа |
| UH-22 | Монтаж: субтитри UK, опційно EN | — | Без голосу або короткий VO |
| UH-23 | Публікація: YouTube / Telegram / Instagram | — | URL у `manifest.json` → `publishedUrl` |
| UH-24 | Прев’ю-GIF для статей (опційно) | 5–10 с | `content/user-help/assets/` |

| Рілс | slug | Пріоритет |
|------|------|-----------|
| 1 | `field-size` | P0 |
| 2 | `place-target` | P0 |
| 3 | `shield-and-3d` | P1 |
| 4 | `measure-distance` | P1 |
| 5 | `view-3d-shooter` | P0 |
| 6 | `briefing-pdf` | P0 |
| 7 | `save-stage-file` | P0 |
| 8 | `share-link` | P2 |
| 9–12 | `plan-tools-overview`, `activations-quick`, `mobile-place-delete`, `open-shared-view` | P1–P2 |
| 13–15 | `matches-*`, `ro-helper-search` | P2 / фаза 3 |

### Фаза 3 — Матчі (якщо модуль увімкнений)

| ID | Задача | Файл |
|----|--------|------|
| UH-30 | Статті матчів (5) | `register`, `organizer-create`, `organizer-stages`, `organizer-roster`, `export-psc` |
| UH-31 | FAQ матчів | `uk/faq.md` § Матчі (F-MT01–07) |
| UH-32 | Рілси матчів | `videos/scripts/matches-*.md` |
| UH-33 | Зйомка + `publishedUrl` | `videos/manifest.json` |
| UH-34 | Картка PortalHome «Дивитись 40 с» | backlog **PT** |

### Фаза 4 — Інтеграція в продукт (прод)

| ID | Задача | Де в коді |
|----|--------|-----------|
| UH-40 | Маршрут `/:locale/help` + сторінка-хаб | `src/portal/` (новий модуль або lazy route) |
| UH-41 | Рендер markdown з `content/user-help` (build-time import або скрипт) | `scripts/build-user-help.mjs` (новий) |
| UH-42 | Скоротити in-app діалог; «Детальніше» → `/help` | `messages.ts`, `App.tsx` |
| UH-43 | Контекстні підказки (перший раз у режимі) | `App.tsx` + ключі i18n |
| UH-44 | SEO: `noindex` для чернеток staging; sitemap `/help` | `TECH.md` оновити коротко |
| UH-45 | Посилання з футера / PortalHome | `SiteFooter`, `PortalHome` |

**Порядок інтеграції:** UH-41 → UH-40 → UH-42 → UH-43 → UH-44 → UH-45.

---

## 4. Структура `content/user-help/` (канон)

```text
content/user-help/
  README.md
  manifest.json          # реєстр усіх матеріалів + статус + video URLs
  assets/                # GIF, постери рілсів (git, без важких mp4)
  videos/
    manifest.json
  uk/
    _index.md            # хаб «Допомога»
    quick-start.md
    faq.md
    onboarding/
      in-app-dialog.md
    articles/
      stage-builder/
      matches/           # чернетки, якщо MT увімкнений
      portal/
  en/                    # дзеркало uk
```

**Frontmatter (обов’язково):** `id`, `slug`, `locale`, `title`, `summary`, `audience`, `status` (`draft` | `review` | `ready`), `module` (`stage-builder` | `matches` | `portal` | `hit-factor` | `ro-helper`).

---

## 5. Зміст «Швидкого старту» (затвердженний каркас)

Використовувати в `quick-start.md` і в скороченому діалозі:

1. **Майданчик** — пресет або ширина × довжина в метрах.  
2. **Мішені** — тип зліва → клік по плану (вийти: Esc).  
3. **3D** — перемкнути вкладку, обернути сцену, перевірити видимість.  
4. **Результат** — брифінг → PDF або «Зберегти вправу».

Кнопка **«Детальніше»** → статті з §4 і FAQ.

---

## 6. FAQ — обов’язкові групи (чернетка списку)

Заповнити відповіді в `uk/faq.md` (коротко, 2–4 речення):

**Файл і збереження**

- Де вправа після закриття вкладки?  
- Чим відрізняється файл, чернетка в браузері та посилання share?  
- Чи можна відкрити вправу на іншому комп’ютері?

**План і 3D**

- Чому мішень підсвічено пунктиром (кути безпеки)?  
- PDF показує не той знімок — що зробити?  
- Чи можна редагувати вправу з посилання `/v/`?

**Телефон**

- Чому після одного дотику режим розстановки вимкнувся?  
- Як видалити мішень без клавіатури?

**Оновлення та офлайн**

- Смуга «Оновити» зверху — навіщо?  
- Чи працює без інтернету?

**Матчі** (окремий підрозділ, фаза 3)

- Як записатися / скасувати заявку?  
- Організатор: як прив’язати вправу з Stage Builder?

---

## 7. Критерії «готово до проду»

- [ ] Усі матеріали P0 у `manifest.json` зі статусом `ready`.  
- [ ] UK + EN для quick-start, faq, in-app-dialog.  
- [ ] Мінімум 5 рілсів P0 з `publishedUrl`.  
- [ ] Рев’ю від цільового користувача (RO або організатор).  
- [ ] UH-40…45 виконані; smoke: відкрити help з редактора та з порталу.  
- [ ] Старий текст S1–S6 у `messages.ts` замінено або винесено в «Детальна інструкція».

---

## 8. Зв’язок з іншими документами

| Документ | Роль |
|----------|------|
| [FUNCTIONALITY.md](./FUNCTIONALITY.md) | Джерело фактів для розробника; не копіювати в user-help |
| [PRODUCT.md](./PRODUCT.md) | Аудиторії та модулі — для поля `audience` |
| [PLANNING_INDEX.md](./PLANNING_INDEX.md) | Код **UH** |
| [USER_FEEDBACK.md](./USER_FEEDBACK.md) | Нові питання → доповнення FAQ |

---

## 9. Журнал змін плану

| Дата | Зміна |
|------|--------|
| 2026-05-21 | Початковий план + локальна структура `content/user-help/` |
| 2026-05-21 | [USER_HELP_CONTENT_PLAN.md](./USER_HELP_CONTENT_PLAN.md) — усі модулі, 17 рілсів, FAQ UK, 21 стаття |
