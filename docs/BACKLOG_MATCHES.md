# Беклог модуля «Матчі» (реєстрація, PractiScore)

**Єдине місце для задач епіку матчів** з нумерацією **фаза + номер задачі** в межах фази. **Де цей файл у загальній структурі продукту:** **[PLANNING_INDEX.md](./PLANNING_INDEX.md)** (розділ **Матчі**). Детальні фази A–F — у **[MATCH_REGISTRATION_AND_PSC_PLAN.md](./MATCH_REGISTRATION_AND_PSC_PLAN.md)** §4; короткий продуктовий статус — **[MATCH_PORTAL_PRODUCT_PLAN.md](./MATCH_PORTAL_PRODUCT_PLAN.md)**. Схема БД — **[SUPABASE_MATCH_ADMIN.md](./SUPABASE_MATCH_ADMIN.md)**.

Загальнопродуктовий скрізний беклог **`BL-NNN`** лишається в **[BACKLOG.md](./BACKLOG.md)**; нижче — колонка **BL** для зв’язку.

---

## Як нумеруємо

| Компонент | Значення |
|-----------|----------|
| **`MA`** | Префікс **M**odule **A**rea — модуль «Матчі» (окремий від загального `BL-NNN`). |
| **`A` … `F`** | Фаза з [MATCH_REGISTRATION_AND_PSC_PLAN.md §4](./MATCH_REGISTRATION_AND_PSC_PLAN.md#4-фази-реалізації): **A** фундамент, **B** підтвердження заявок, **C** вправи Stage Builder, **D** експорт `.psc`, **E** збірний PDF, **F** результати / посилання. |
| **`R`** | **R**elease / продуктова ітерація поза літерними фазами плану (покращення каталогу, seed, UX). |
| **`P`** | **P**ayments — онлайн-оплата внесків (поза §4 A–F); план — [MATCH_PAYMENTS_PLAN.md](./MATCH_PAYMENTS_PLAN.md). |
| **`W`** | **W**aitlist — резерв місця до дедлайну оплати, лист очікування після повного ліміту (великі матчі). |
| **`NN`** | Дворозрядний порядковий номер **задачі всередині фази** (`01`, `02`, …). |

**Повний ID задачі:** **`MA-<фаза><NN>`** — приклади: **`MA-A01`**, **`MA-B02`**, **`MA-R01`**.

**Статуси:** `idea` | `candidate` | `ready` | `in progress` | `partial` (частково зроблено) | `done` | `dropped`.

---

## Фаза A — фундамент

*Узгоджено з **§ Фаза A** плану реєстрації.*

| ID | Задача | Статус | BL | Примітки |
|----|--------|--------|-----|----------|
| **MA-A01** | Supabase: `matches`, скводи, заявки; RLS організатор/стрілець; профіль `match_admin_profiles` | partial | BL-025 | Базові міграції + [SUPABASE_MATCH_ADMIN.md](./SUPABASE_MATCH_ADMIN.md) |
| **MA-A02** | CRUD матчу для організатора (чернетка / опубліковано) | partial | BL-025 | Редактор: `OrganizerMatchEditPage` |
| **MA-A03** | Публічна картка опублікованого матчу (read-only) | done | BL-025 | `MatchPublicDetailPage` |
| **MA-A04** | Заявка стрільця: сквод, дивізіон, PF, клас (валідація під shotgun MVP) | partial | BL-025 | Залежить від скводів / лімітів |
| **MA-A05** | Сітка скводів, `organizer_sync_match_squads`, `competitor_limit` | partial | BL-025 | Міграції squad template |

---

## Фаза B — підтвердження реєстрації та облік оплати

| ID | Задача | Статус | BL | Примітки |
|----|--------|--------|-----|----------|
| **MA-B01** | Сторінка заявок організатора: список, **підтвердити**, **примітка про оплату** | done | BL-026 | Перед підняттям типів у проді потрібна міграція **`20260512130000_fetch_organizer_roster_payment_note.sql`** для RPC (**`payment_note`** у видачі). Без онлайн-платежів у MVP. |
| **MA-B02** | Потік pending → confirmed узгоджено з політикою публічного ростера | partial | BL-026 | У БД/UI: `participant_list_visibility`, RPC **`fetch_public_match_roster`**; залишаються поліровка UX і правила відображення |

---

## Фаза C — зв’язок зі Stage Builder

| ID | Задача | Статус | BL | Примітки |
|----|--------|--------|-----|----------|
| **MA-C01** | Прив’язка вправи до матчу (share `/v/:id`, метадані) | partial | BL-027 | UI **`OrganizerMatchEditPage`**, таблиця **`match_stage_links`**, міграції share group; залишаться стабільні PSC-поля (**MA-C03**) |
| **MA-C02** | Оновлення прив’язки до останнього view у групі (RPC / кнопка в UI) | partial | BL-027 | RPC **`organizer_refresh_match_stage_link_latest`** + кнопки в UI; регресії / edge cases — за потреби |
| **MA-C04** | Додати вправу в матч **прямо з «Моїх вправ»**: вибір із `user_stages` в `OrganizerMatchStagesPanel` → авто-публікація view-шеру → запис у `match_stage_links` | **done** | BL-027 | UI + `publishViewShareFromProject`; paste `/v/:id` лишився запасним шляхом. Snapshot_meta: `source=user_library`, `user_stage_id`. Суміжне (поза скоупом): розділ «Мої вправи» в кабінеті стрільця |
| **MA-C03** | Стабільні поля для мапінгу в `match_stages[]` PSC (поппери, папір, тощо) | candidate | BL-027 | Довідник полів і **§8.6** черга кроків 1→7 — [MATCH_EXPORT_PSC_STAGE_FIELDS.md](./MATCH_EXPORT_PSC_STAGE_FIELDS.md), [MATCH_REGISTRATION_AND_PSC_PLAN.md §8.6](./MATCH_REGISTRATION_AND_PSC_PLAN.md#86-покроковий-план-mac03--mad01--mad02-узгоджена-черга); у коді уже `PscStageMetrics` + парсинг share |

---

## Фаза D — експорт `.psc`

| ID | Задача | Статус | BL | Примітки |
|----|--------|--------|-----|----------|
| **MA-D01** | Мапер портальної моделі → `match_def.json` + порожні scores, ZIP | partial | BL-028 | Є v1 (`buildPortalPractiscoreZip`, `/api/match-export-psc`); наступний обов’язковий код — **крок 1 §8.6** fallback без `psc_metrics` |
| **MA-D02** | Регресія / фікстури порівняння з еталонним `.psc` | partial | BL-028 | Є Vitest збірки; **кроки 2 і 5 §8.6** — multi-stage й еталонний `.psc` |
| **MA-D03** | Поля **`match_event_kind`** / **`ps_match_level`** у видачі PS (рівень `L1`–`L5`) | done | — | Див. `matchTaxonomy`, міграція `20260511100000_*` |

---

## Фаза E — PDF «усі вправи»

| ID | Задача | Статус | BL | Примітки |
|----|--------|--------|-----|----------|
| **MA-E01** | **Публічне** завантаження PDF: усі брифінги + зведення; `GET /api/match-export-briefings` | done | — | Кнопка в **«Програма»** → `/{locale}/matches/:id/briefings` (inline + download); `matchExportBriefingsApiHandler` |
| **MA-E02** | Таблиця пострілів/мішеней у блоці **«Програма»** (праворуч від списку вправ) | done | — | `match-programme-stats` API + `MatchPublicProgrammePanel` |
| **MA-E03** | Зведення по **дивізіонах** і **класах** учасників | done | — | `MatchPublicParticipantSummary` + PDF-розділ; RPC `fetch_public_match_participant_summary` |

---

## Фаза F — результати

| ID | Задача | Статус | BL | Примітки |
|----|--------|--------|-----|----------|
| **MA-F01** | Публічне поле «посилання на результати PractiScore» | idea | — | URL у картці матчу |
| **MA-F02** | Опційно: імпорт файлу результатів PS у storage | idea | — | Після дослідження формату PS |

---

## Фаза P — онлайн-оплата (Mono MVP на staging)

*Деталі — [MATCH_PAYMENTS_PLAN.md](./MATCH_PAYMENTS_PLAN.md). **MA-P04…P06** на staging; prod без match portal до flip — [MATCH_PORTAL_PRODUCT_PLAN.md §6](./MATCH_PORTAL_PRODUCT_PLAN.md#6-prod-gate-увімкнення-матчів-на-shooters-toolscom).*

| ID | Задача | Статус | BL | Примітки |
|----|--------|--------|-----|----------|
| **MA-P00** | Покращений офлайн: QR IBAN, код у призначенні | idea | — | Суми внеску + колонка «Оплачено» вже є (P02/P06) |
| **MA-P01** | `organizer_payment_providers`; UI Mono; «Перевірити» = pubkey | partial | — | **done** функціонально; **Vault** — не підключено (`mono_x_token` у таблиці, service role) |
| **MA-P02** | Секція «Внесок»: 3 суми; офлайн+онлайн за замовч. | done | — | `OrganizerMatchEditPage`, `matchEntryFee.ts`, RPC `match_online_payment_available` |
| **MA-P03** | API `create-payment` + webhook **LiqPay** | idea | — | Після Mono |
| **MA-P04** | API + webhook **Monobank**; auto **`confirmed`** | done | — | + `POST /api/payments/reconcile`, raw body webhook (`vercelRawBody.ts`) |
| **MA-P05** | UI «Сплатити онлайн» + return + reconcile | done | — | E2E staging 2026-06; `VITE_SHARE_PUBLIC_ORIGIN` для localhost webhook |
| **MA-P06** | Колонка «Оплачено» + badge «онлайн» | done | — | `OrganizerMatchRegistrationsPage` |
| **MA-P07** | WayForPay (опційно) | idea | — | |
| **MA-P08** | Дослідження **Portmone marketplace**: юридика, split, комісії, sandbox | idea | — | Після зустрічі з Portmone — оновити MATCH_PAYMENTS_PLAN §6 |

---

## Фаза W — резерв місця та лист очікування (великі матчі)

*Поза §4 A–F. Зараз у ліміт входять усі `pending` + `confirmed` без терміну — матч «повний», хоча частина ще не оплатила. **Узгоджено (травень 2026):***

1. **`pending` тримає слот** до **`payment_deadline_at`** на матчі (або N днів після заявки — за вибором організатора в редакторі).
2. **Waitlist лише після повного `competitor_limit`** (не при «м’якому» overbooking).
3. **Контекст UA:** типово оплачують **за 2–5 днів до матчу** — дедлайн і нагадування не ставити занадто рано; після дедлайну прострочений hold звільняє слот → промоушн з черги.
4. **`confirmed` / `payment_received`** — гарантована участь; публічний ростер без ПІБ waitlist (як **MA-B02**).

| ID | Задача | Статус | BL | Примітки |
|----|--------|--------|-----|----------|
| **MA-W01** | Поля матчу: `payment_deadline_at`, опційно `hold_ttl_days`; cron/RPC прострочення `pending` без `payment_received` → скасування/звільнення слоту; **`fetch_public_match_registration_metrics`** рахує лише активні hold + `confirmed` | idea | — | Залежить від **MA-B02**; дефолт дедлайну в UI — орієнтир **дата матчу − 3–5 днів** |
| **MA-W02** | Waitlist після `matchFull`: таблиця черги, CTA «У лист очікування» на картці, перегляд/порядок у кабінеті організатора (FIFO за `waitlisted_at`) | idea | — | Після **MA-W01** |
| **MA-W03** | Автопромоушн: RPC `promote_next_waitlist_entry`, офер з TTL (напр. 24–48 год), email; звільнення слоту при `withdraw` / простроченому hold; зв’язок з **MA-P05** (оплата → `payment_received`) | idea | — | Після **MA-W02**; опційно **MA-P00** (QR + код заявки) раніше |

---

## Фаза R — продуктові дрібниці (каталог, тип події, рівень PS)

Задачі **не** з §4 A–F, але закривають UX каталогу й онбординг.

| ID | Задача | Статус | BL | Примітки |
|----|--------|--------|-----|----------|
| **MA-R01** | Каталог `/{locale}/matches`: рядок з типом і рівнем; фільтри | done | BL-033 | `PortalPublishedMatchesSection` |
| **MA-R02** | Seed тестового матчу: `match_event_kind`, `ps_match_level` | done | BL-034 | `match_admin_test_seed.sql`; існуючий рядок у БД — `UPDATE` вручну |
| **MA-R03** | Документ §5 + підказки в редакторі матчу | done | BL-035 | [MATCH_PORTAL_PRODUCT_PLAN.md](./MATCH_PORTAL_PRODUCT_PLAN.md), i18n |
| **MA-R04** | Таблиця «Мої матчі»: колонки тип / рівень | done | — | `OrganizerMatchesListPage` |

---

## Зведення BL ↔ MA

| BL | MA-ідентифікатори (орієнтир) |
|----|------------------------------|
| **BL-025** | MA-A01 … MA-A05 (фундамент) |
| **BL-026** | MA-B01, MA-B02 |
| **BL-027** | MA-C01 … MA-C03 |
| **BL-028** | MA-D01, MA-D02 |
| **BL-033** | MA-R01 |
| **BL-034** | MA-R02 |
| **BL-035** | MA-R03 |

---

## Історія змін документа

| Дата | Зміни |
|------|--------|
| 2026-08-10 | Посилання на **prod gate** (§6 MATCH_PORTAL_PRODUCT_PLAN); аудит тестів/`tsc` перед публікацією на prod. |
| 2026-08-09 | **MA-C04** → **done**: вибір із `user_stages` у `OrganizerMatchStagesPanel`, авто-publish view через `/api/publish-share`, insert у `match_stage_links`; paste `/v/:id` лишився. |
| 2026-08-01 | **MA-C04** (idea): додавання вправи в матч із хмарної бібліотеки `user_stages` (SB-CL01) замість ручного посилання на шер. |
| 2026-06-04 | **MA-E01…E03** → **done** на staging: programme stats API, participant summary RPC, briefings PDF + viewer; [MATCH_BRIEFINGS_PACKAGE_PLAN.md](./MATCH_BRIEFINGS_PACKAGE_PLAN.md) оновлено під код. |
| 2026-06-01 | План **MA-E01…E03**: [MATCH_BRIEFINGS_PACKAGE_PLAN.md](./MATCH_BRIEFINGS_PACKAGE_PLAN.md) (статистика вправ, дивізіони/класи, збірний PDF). |
| 2026-06-01 | **MA-P02**, **MA-P04**…**P06** → **done**; webhook raw body + **reconcile**; E2E Mono staging; docs sync. **MA-P01** partial (без Vault). |
| 2026-05-06 | Узгодження з тестами: **MA-D02** → **partial** (Vitest на збірку ZIP; повний diff з еталоном у CI — за потреби). |
| 2026-05-07 | Синхронізація статусів з кодом: **MA-B02**, **MA-C01**, **MA-C02** → **partial** (публічний ростер / прив’язка вправ і refresh уже в проді-коді; епік C–PSC уточнюється). |
| 2026-05-06 | PSC: додано [MATCH_REGISTRATION §8.6](./MATCH_REGISTRATION_AND_PSC_PLAN.md#86-покроковий-план-mac03--mad01--mad02-узгоджена-черга) і [MATCH_EXPORT_PSC_STAGE_FIELDS.md](./MATCH_EXPORT_PSC_STAGE_FIELDS.md); примітки в рядках **MA-C03**, **MA-D01**, **MA-D02**. |
| 2026-05-06 | Ростер (таблиця): один **«Зберегти»** для всіх змін статусу та скводу; колонку «Дії» прибрано. Дошка скводів — зміни скводів/статусу як і раніше зберігаються одразу. |
| 2026-05-01 | MA-B01: редактор **`payment_note`** у табличному та дошковому режимах ростера; підтвердження записує текст примітки з форми замість заглушки. |
| 2026-05-04 | Каталог матчів: обкладинка (`cover_image_url`), кеш імені організатора для хабу (`portal_organizer_display_name`), бакет Storage `match-covers`; UX хабу — sticky календар на desktop, список вище календаря на мобільному. Міграція `20260515120000_match_portal_cover_and_organizer_display.sql`. |
| 2026-05-23 | Оплата: зафіксовано §9 плану — Mono, auto-confirm, 3 тарифи (Стандарт / Військовий / Леді·Юніори), перевірка X-Token без грошей; оновлено рядки **MA-P01**…**P05**. |
| 2026-05-26 | Фаза **P** (оплата): [MATCH_PAYMENTS_PLAN.md](./MATCH_PAYMENTS_PLAN.md), MA-P00…P08. |
| 2026-05-26 | Фаза **W** (waitlist): узгоджені правила (hold до дедлайну, waitlist після повного ліміту, UA 2–5 днів до оплати); **MA-W01…W03**. |
| 2026-05-01 | Перша версія: структура MA-<фаза><NN>, фази A–F + R, зв’язок із BL. |
