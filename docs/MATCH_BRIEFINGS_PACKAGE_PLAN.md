# Матч: статистика + збірний пакет брифінгів (план)

**Статус:** планування (2026-06). Референс: [PracticStats Stage Studio](https://practicstats.work/stage-studio/163cb01ff65c4228/) — зведена таблиця + блоки «Вправа N» з таблицею брифінгу.

**Беклог:** [BACKLOG_MATCHES.md](./BACKLOG_MATCHES.md) → **MA-E01**, **MA-E02**.

---

## Що вже є в коді

| Шар | Що |
|-----|-----|
| Дані вправ | `match_stage_links` → `shared_stages.payload` (`*.stage.json`: `stage` + `briefing`) |
| Брифінг однієї вправи | `StageBriefing` (`src/domain/stageBriefing.ts`), PDF — `exportBriefingPdf.ts` |
| Підрахунки зі сцени | `computePscStageMetrics`, `summarizeTargets`, `computeMinRounds` |
| PSC export | `POST /api/match-export-psc` (окремий продукт; не замінює пакет брифінгів) |
| Публічна програма | RPC `fetch_public_match_programme`, список назв на картці матчу |
| Організатор | `OrganizerMatchStagesPanel` — прив’язка `/v/:id`, порядок, refresh |

**Немає:** зведеної таблиці матчу, збірного PDF/HTML, окремих колонок міні-поппер / кераміка / тарілки на рівні матчу.

---

## 1. «Статистика матчу» на картці матчу (MA-E02)

**Де показувати**

- Публічна картка `MatchPublicDetailPage` — секція після шапки / перед списком вправ (якщо `programme_stages_enabled` і програма видима).
- Опційно: прев’ю в `OrganizerMatchEditPage` (той самий компонент).

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

## 2. Збірний файл брифінгів + зведення (MA-E01)

**Ціль:** один артефакт для RO/учасників, як на референсі: обкладинка матчу → **Статистика матчу** → **Вправа 1…N** (таблиця брифінгу + знімок сцени).

**Формати (вибір продукту)**

| Варіант | Плюси | Мінуси |
|---------|-------|--------|
| **A. PDF (багатосторінковий)** | Друк, офлайн, вже є `exportBriefingPdf` | Збірка на клієнті важка; краще **server** |
| **B. HTML (одна сторінка)** | Близько до PracticStats, швидкий preview | Потрібен хост/посилання або download `.html` |
| **C. ZIP** | PDF по вправі + `index.html` або `match-briefings.pdf` | Більше кліків у UI |

**Рекомендація:** **A на сервері** — `POST /api/match-export-briefings` (аналог `match-export-psc`): Bearer, `matchId`, відповідь `application/pdf` або ZIP `{ match-briefings.pdf }`.

**Пайплайн**

1. Завантажити `match_stage_links` + payloads (service role).
2. Для кожної вправи: зібрати PDF-сторінку (реюз логіки `exportBriefingPdf` / node canvas — **дослідити** headless рендер знімка з payload або вбудований PNG у share).
3. Додати титульну сторінку + таблицю **MA-E02** (jsPDF table або html→pdf).
4. `pdf-lib` merge сторінок (якщо вже в залежностях — перевірити; інакше додати).

**UI:** кнопка на `OrganizerMatchEditPage` поруч із «Експорт PSC» — «Завантажити брифінги (PDF)»; опційно публічне read-only посилання пізніше.

**Залежності:** стабільний порядок вправ (**MA-C01**), коректні `briefing.matchName` / `documentTitle` на всіх вправах.

---

## 3. Зв’язок з іншими MA-*

| ID | Зв’язок |
|----|---------|
| **MA-C03** | Знімок PSC-метрик у `match_stage_links` зменшить розбіжності stats vs export |
| **MA-D01** | Окремий шлях; PSC ≠ пакет брифінгів |
| **MA-E01** | Збірний PDF/HTML |
| **MA-E02** | Таблиця статистики (UI + джерело для титулу пакету) |

---

## 4. Порядок впровадження

1. **MA-E02** — domain + таблиця на публічній картці (без export).
2. **MA-E01** — server PDF merge + кнопка організатора.
3. Опційно: публічний URL «briefings package» (share token) — окрема задача.

---

## 5. Відкриті питання (продукт)

1. Показувати статистику **до** дати відкриття програми (`stages_visible_days_before`) чи разом із програмою?
2. «Тип набоїв» — вільний текст чи enum у брифінгу?
3. Чи потрібен **англ.** варіант зведеного PDF окремо?

*Не розширювати цей файл покроковими інструкціями для користувача — лише технічна довідка.*
