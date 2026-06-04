# Матч: статистика + збірний пакет брифінгів (план)

**Статус:** **baseline реалізовано** (2026-06-04, staging). Референс: [PracticStats Stage Studio](https://practicstats.work/stage-studio/163cb01ff65c4228/). Далі — PNG знімки вправ у PDF (див. §3 «відкрито»).

**Беклог:** [BACKLOG_MATCHES.md](./BACKLOG_MATCHES.md) → **MA-E01**, **MA-E02**, **MA-E03** — **done**.

---

## Що вже є в коді

| Шар | Що |
|-----|-----|
| Дані вправ | `match_stage_links` → `shared_stages.payload` (`*.stage.json`: `stage` + `briefing`) |
| Брифінг однієї вправи | `StageBriefing` (`src/domain/stageBriefing.ts`), PDF — `exportBriefingPdf.ts` |
| Підрахунки зі сцени | `computePscStageMetrics`, `summarizeTargets`, `computeMinRounds` |
| PSC export | `POST /api/match-export-psc` (окремий продукт; не замінює пакет брифінгів) |
| Публічна програма | RPC `fetch_public_match_programme`, список вправ + **MA-E02** таблиця (`MatchPublicProgrammePanel`, `GET /api/match-programme-stats`) |
| Зведення учасників | **MA-E03**: RPC `fetch_public_match_participant_summary`, UI `MatchPublicParticipantSummary` |
| Збірний PDF матчу | **MA-E01**: `GET /api/match-export-briefings`, `buildMatchBriefingsPdf.ts`; перегляд `/{locale}/matches/:id/briefings` |
| Організатор | `OrganizerMatchStagesPanel` — прив’язка `/v/:id`, порядок, refresh |

**Відкрито (не в baseline):** PNG/HTML-знімки плану вправ у збірному PDF (зараз — таблиці брифінгу + QR на share `/v/:id`).

**Дані учасників:** `match_registrations.division`, `categories`, `power_factor`; агрегація MA-E03 — `fetch_public_match_participant_summary`. Ростер: `fetch_public_match_roster` (лише `open` list).

---

## 1. Блок «Програма» на публічній картці матчу (MA-E02 + кнопка MA-E01)

**Аудиторія:** **стрільці / гості** на `MatchPublicDetailPage` — **не** кнопка в кабінеті організатора (експорт PSC лишається окремо для організатора).

**Макет (узгоджено з UI, 2026-06):** у секції **«Програма»** (`matchDetailProgrammeHeading`), коли програма **публічно видима**:

```text
┌─────────────────────────────────────────────────────────┐
│ Програма                                                │
├──────────────────────┬──────────────────────────────────┤
│ 1. Вправа … (посилання│  Таблиця «Статистика матчу»      │
│ 2. …                  │  (постріли, мішені, % матчу…)    │
│ …                     │                                  │
│                       │  [ Завантажити брифінги матчу ]  │
└──────────────────────┴──────────────────────────────────┘
```

- **Ліворуч** — наявний `<ol>` з посиланнями на `/v/:share_stage_id` (брифінг однієї вправи).
- **Праворуч** — **MA-E02**: зведена таблиця розрахунку по вправах.
- **Під таблицею (або поруч)** — **MA-E01**: кнопка завантаження **загального брифінгу** (PDF усіх вправ + титул + таблиця зведення).

Компонент-орієнтир: `MatchPublicProgrammePanel` (новий) у `MatchPublicDetailPage.tsx`; CSS grid у `PortalMatchesUi.css`.

**Видимість:** ті самі умови, що й список вправ — `programme_stages_enabled`, RPC `fetch_public_match_programme` → `publiclyVisible` (і **не** показувати праву колонку в стані «буде доступно з {{date}}»).

**Організатор:** опційно той самий прев’ю на сторінці редагування матчу (read-only), **без** дублювання головної CTA — основна точка входу для учасників — публічна картка.

**Колонки (узгоджено з референсом)**

| Колонка | Джерело |
|---------|---------|
| № вправи | `match_stage_links.sort_order` |
| Тип вправи | `briefing.exerciseType` → Коротка / Середня / Довга |
| Паперові мішені | підрахунок з `stage.targets` (двостійковий папір + paper swingers) |
| Металеві тарілки | `metalPlate*`, gong (без popper/mini) |
| Керамічні тарілки | ceramic + ceramic swingers |
| Поппери | `popper` |
| Міні-поппери | `miniPopper` |
| Тип набоїв | `briefing.allowedAmmo` (перший рядок / категорія: Картеч, Шріт, Куля — парсинг або тег у брифінгу пізніше) |
| К-сть пострілів | `briefing.recommendedShots` або `computeMinRounds(targets)` |
| К-сть очок | `briefing.maxPoints` |
| % матчу | `очки_вправи / sum(очки) × 100`, рядок **Разом** |

**Реалізація (орієнтир)**

- Новий модуль `src/domain/matchProgrammeStats.ts`: `computeStageStatRow(payload) → MatchStageStatRow`, `aggregateMatchStats(rows) → totals`.
- Розширити підрахунки відносно `PscStageMetrics` (зараз popper + plates разом у `stage_poppers`).
- RPC або розширення `fetch_public_match_programme` — повертати готові рядки (менше парсингу на клієнті) **або** парсити payload на сервері в `GET` export-only; для UI — кешувати в пам’яті після завантаження programme.
- i18n: заголовки колонок у `messages.ts` (uk/en).

**Не в scope v1:** редагування чисел вручну в таблиці (лише похідні від сцени/брифінгу).

---

## 2. Зведена таблиця по дивізіонах і класах (MA-E03)

**Ціль:** матриця / дві таблиці «скільки стрільців» для планування матчу та друку в пакеті брифінгів (поруч із **MA-E02**).

**Терміни в продукті**

| Термін UI (укр.) | Поле / каталог |
|------------------|----------------|
| **Дивізіон** | `match_registrations.division` + `divisionLabel(matches.discipline, division, locale)` |
| **Клас / категорія** | `match_registrations.categories[]` — Lady, Junior, Military, … (`SHOOTER_CATEGORIES`) |
| **Power factor** | `power_factor` — Major / Minor (опційна колонка або фільтр) |

**Варіанти зведення (узгодити з продуктом)**

1. **Таблиця A — по дивізіонах:** рядки = дивізіони дисципліни матчу; колонки = кількість `confirmed` (+ опц. `pending`); рядок **Разом**.
2. **Таблиця B — по класах:** рядки = категорії з каталогу (або лише ті, що є в заявках); колонка «К-сть»; учасник з кількома категоріями — **політика:** рахувати в кожному рядку або лише «основну» (потрібне рішення).
3. **Таблиця C — хрест (опційно):** рядки = дивізіон, колонки = категорія, комірка = кількість (тільки `confirmed` для публікації).

**Джерело:** агрегація на сервері (RPC `fetch_match_participant_summary` або розширення метрик реєстрації) — не парсити на клієнті весь ростер для великих матчів.

**Де показувати (узгоджено 2026-06)**

1. **Публічна картка** — секція **«Учасники»** (`participant_list_visibility = open`): **під** таблицею ростеру (ім’я, сквод, дивізіон, категорія, підтвердження) — підблок «За дивізіонами» / «За класами» (таблиці **MA-E03**).
2. **Загальний PDF матчу (MA-E01)** — обов’язкова частина пакету: після **статистики вправ (MA-E02)**, перед блоками «Вправа 1…N».

**Не** в блоці «Програма» (там лише MA-E02 + кнопка завантаження PDF).

**Опційно пізніше:** той самий знімок на сторінці **Заявки** організатора (read-only).

**Не в scope v1:** окремі дивізіони по прематч / main squad (можна v2 через `squad_phase`).

---

## 3. Завантаження загального брифінгу (MA-E01)

**Ціль:** один файл для стрільця з картки матчу — як [PracticStats](https://practicstats.work/stage-studio/163cb01ff65c4228/):

```text
Титул матчу
→ Статистика вправ (MA-E02)
→ Зведення по дивізіонах / класах (MA-E03)
→ Вправа 1 … N (брифінг + знімок кожної)
```

**Формати (вибір продукту)**

| Варіант | Плюси | Мінуси |
|---------|-------|--------|
| **A. PDF (багатосторінковий)** | Друк, офлайн, вже є `exportBriefingPdf` | Збірка на клієнті важка; краще **server** |
| **B. HTML (одна сторінка)** | Близько до PracticStats, швидкий preview | Потрібен хост/посилання або download `.html` |
| **C. ZIP** | PDF по вправі + `index.html` або `match-briefings.pdf` | Більше кліків у UI |

**Рекомендація:** **A на сервері** — **`GET` або `POST /api/match-export-briefings`** з `matchId`:

- **Без обов’язкового логіну** для опублікованого матчу з видимою програмою (як перегляд `/v/:id`).
- Перевірки: `matches.status = published`, програма у вікні видимості (`stages_visible_days_before` / `fetch_public_match_programme` логіка).
- Відповідь: `application/pdf` (`Content-Disposition: attachment`).
- **Не** плутати з `POST /api/match-export-psc` (лише організатор, bearer).

**Пайплайн**

1. Завантажити `match_stage_links` + payloads (service role).
2. Для кожної вправи: зібрати PDF-сторінку (реюз логіки `exportBriefingPdf` / node canvas — **дослідити** headless рендер знімка з payload або вбудований PNG у share).
3. Додати титульну сторінку + **MA-E02** + **MA-E03** (обидві таблиці в PDF) — jsPDF table або html→pdf.
4. `pdf-lib` merge сторінок (якщо вже в залежностях — перевірити; інакше додати).

**UI:** кнопка в блоці **«Програма»** на публічній картці (див. §1); стани loading / помилка / «немає вправ».

**Залежності:** стабільний порядок вправ (**MA-C01**), коректні `briefing.matchName` / `documentTitle` на всіх вправах.

---

## 4. Зв’язок з іншими MA-*

| ID | Зв’язок |
|----|---------|
| **MA-C03** | Знімок PSC-метрик у `match_stage_links` зменшить розбіжності stats vs export |
| **MA-D01** | Окремий шлях; PSC ≠ пакет брифінгів |
| **MA-E01** | Збірний PDF/HTML |
| **MA-E02** | Таблиця статистики вправ (UI + джерело для титулу пакету) |
| **MA-E03** | Зведення учасників по дивізіонах і класах |

---

## 5. Порядок впровадження (виконано 2026-06-04)

1. **MA-E02** — `matchProgrammeStats.ts`, `MatchPublicProgrammePanel`, `/api/match-programme-stats`.
2. **MA-E03** — `fetch_public_match_participant_summary`, `MatchPublicParticipantSummary`.
3. **MA-E01** — `/api/match-export-briefings`, `MatchPublicBriefingsPdfPage`.
4. Організатор: прев’ю PDF — **не** зроблено (публічна CTA достатня для MVP).

---

## 6. Відкриті питання (продукт)

1. Показувати статистику вправ **до** дати відкриття програми (`stages_visible_days_before`) чи разом із програмою?
2. «Тип набоїв» — вільний текст чи enum у брифінгу?
3. Чи потрібен **англ.** варіант зведеного PDF окремо?
4. **MA-E03:** учасник з кількома `categories` — рахувати в кожному класі чи один раз у «головному»?
5. **MA-E03:** у зведенні лише `confirmed` чи також `pending`?

*Не розширювати цей файл покроковими інструкціями для користувача — лише технічна довідка.*
