# Handoff для наступного чату (Stage Builder)

**Оновлено:** 2026-07-31 · **`main`** = **`staging`** (синхрон через CI / `npm run git:sync-staging`) · фаза **E** (MA-E01…E03) на staging · E2E Mono **пройдено** · [MATCH_PAYMENTS_PLAN.md](./MATCH_PAYMENTS_PLAN.md).

## Контекст

**Stage Builder / Shooters Tools** — модуль **Події** на [stage-builder-staging.vercel.app](https://stage-builder-staging.vercel.app) (`VITE_ENABLE_MATCH_PORTAL=1`). Онлайн-внесок: **Monobank Acquiring**, модель **A** (X-Token організатора). Prod ([shooters-tools.com](https://shooters-tools.com)) — матчі **вимкнені** прапорцем.

Беклог: [BACKLOG_MATCHES.md](./BACKLOG_MATCHES.md) (фаза **P**). План оплат: [MATCH_PAYMENTS_PLAN.md](./MATCH_PAYMENTS_PLAN.md).

## Реалізовано (Mono MVP, staging)

| ID | Що |
|----|-----|
| **MA-P01** | `organizer_payment_providers`, API save/verify/disconnect, RPC `get_own_organizer_mono_payment_status`, UI **`OrganizerMonoPaymentSection`** на **`/matches/my`** (після таблиці подій). Токен у БД (service role); **Supabase Vault — не** підключено. |
| **MA-P02** | `entry_fee_*_kop`, секція внеску в `OrganizerMatchEditPage`, `src/domain/matchEntryFee.ts`. |
| **MA-P04** | `POST /api/create-payment`, `POST /api/payments/webhook/mono` → `payment_received`, `paid_at`, `payment_provider=mono`, **`status=confirmed`** (auto). Таблиця `match_mono_invoices`. |
| **MA-P05** | «Сплатити онлайн» у `MatchPublicRegistrationSection`; RPC `match_online_payment_available`; `?payment=return`; localhost → `VITE_SHARE_PUBLIC_ORIGIN` для webhook. |
| **MA-P06** | Колонка «Оплачено» + badge «онлайн» у `OrganizerMatchRegistrationsPage`. |
| **Підстраховка** | `POST /api/payments/reconcile` + виклик з UI для `pending` після повернення з Mono (якщо webhook затримався / body на Vercel). |
| **MA-E01** | `GET /api/match-export-briefings` (`matchExportBriefingsApiHandler` → `api/match-export-briefings.js`); UI `/{locale}/matches/:id/briefings` (`MatchPublicBriefingsPdfPage` — inline PDF + «Зберегти»); кнопка з «Програма». Знімки сцен у PDF — **ні** (таблиця брифінгу + QR → `/v/:id`). |
| **MA-E02** | `GET /api/match-programme-stats`; `MatchPublicProgrammePanel` + `src/domain/matchProgrammeStats.ts`; дані в PDF (MA-E01). |
| **MA-E03** | `MatchPublicParticipantSummary` під «Учасники»; RPC `fetch_public_match_participant_summary` (`20260601140000_*`); той самий блок у PDF. |

**API (збірка):** `src/server/*ApiHandler.ts` → `npm run build:api` → `api/*.js` (webhook: `bodyParser: false`).

**Міграції:**

- `20260602120000_organizer_payment_providers.sql`
- `20260603120000_match_entry_fees.sql`
- `20260604120000_match_registration_online_payment.sql`
- `20260605120000_organizer_roster_online_payment_fields.sql`
- `20260605130000_match_online_payment_available_rpc.sql`

## Не зроблено

- **MA-P00** — QR IBAN, покращений офлайн.
- **MA-P03**, **MA-P07**, **MA-P08** — LiqPay, WayForPay, Portmone.
- **MA-W\*** — waitlist, дедлайн оплати.
- **MA-E01** — PNG знімки вправ у збірному PDF (зараз лише брифінг-таблиця + QR); див. [MATCH_BRIEFINGS_PACKAGE_PLAN.md](./MATCH_BRIEFINGS_PACKAGE_PLAN.md) §3.
- **Vault** для X-Token (зараз колонка `mono_x_token`, RLS revoke).
- User-help про оплату — лише за запитом.

## E2E (перевірено на staging, тестовий токен api.monobank.ua)

1. Організатор: `/uk/matches/my` → Mono: зберегти + **Перевірити**; у матчі — суми внеску (≥ 1 ₴).
2. Стрілець: заявка `pending` → **Сплатити онлайн** → Mono «успішно» → повернення.
3. Очікування: **підтверджено · Внесок оплачено**; організатор → заявки: **онлайн**.

**Mono UI:** заголовок форми («Test Caption») — з кабінету/тестового токена Mono; опис внеску — `Внесок: {назва матчу}` з `create-payment`.

**Локально:** `.env.local` — `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_*`, **`VITE_SHARE_PUBLIC_ORIGIN=https://stage-builder-staging.vercel.app`**. Dev API: `src/dev/matchPaymentsDevApiPlugin.ts`.

## Шляхи коду

| Що | Файл |
|----|------|
| Create payment | `src/server/createPaymentApiHandler.ts` |
| Webhook | `src/server/monoPaymentWebhookApiHandler.ts` |
| Reconcile | `src/server/reconcileMatchMonoPaymentApiHandler.ts` |
| Mono HTTP | `src/server/payments/monobankAcquiring.ts` |
| Застосування оплати | `src/server/payments/applyMatchMonoPayment.ts` |
| URL redirect/webhook | `src/lib/resolveMatchPaymentUrls.ts` |
| UI стрільця | `src/portal/matches/MatchPublicRegistrationSection.tsx` |
| UI Mono | `src/portal/matches/OrganizerMonoPaymentSection.tsx` |
| PDF брифінги API | `src/server/matchExportBriefingsApiHandler.ts`, `src/server/matchBriefingsPdf/buildMatchBriefingsPdf.ts` |
| Статистика програми API | `src/server/matchProgrammeStatsApiHandler.ts`, `src/server/loadMatchProgrammeStats.ts` |
| Публічний PDF viewer | `src/portal/matches/MatchPublicBriefingsPdfPage.tsx` |
| Зведення учасників UI | `src/portal/matches/MatchPublicParticipantSummary.tsx` |

## Хмарна бібліотека вправ (SB-CL01) — baseline у продакшені

Вправи зберігаються в акаунті: таблиця `public.user_stages` (own-row RLS, міграція `20260801120000_user_stages.sql`, застосована). `payload jsonb` — той самий конверт, що й `.stage.json`, тому валідацію робить наявний `parseStageProjectJson`; файл лишився **експортом/імпортом**.

| Що | Файл |
|----|------|
| CRUD + парсер рядка | `src/application/userStagesLibrary.ts` |
| Діалог «Мої вправи» | `src/presentation/components/StageLibraryDialog.tsx` |
| Кнопки та сесія в редакторі | `src/App.tsx` (`quickSaveToLibrary`, `libraryStageId`) |
| i18n | секція `library` в `src/i18n/messages.ts` |

Назва вправи — поле в шапці редактора (`stage.name`, `DEFAULT_STAGE_NAME`), єдине джерело правди для запису в бібліотеці; діалог її лише показує. Після першого збереження працює автозбереження раз на 30 с (`LIBRARY_AUTOSAVE_INTERVAL_MS`, тільки за наявності незбережених змін), кнопка «Зберегти» лишається явною, поруч статус «Збережено о HH:MM» / «Є незбережені зміни» / «Не вдалося зберегти».

«Зберегти» оновлює прив’язаний запис, інакше відкриває бібліотеку; імпорт файлу та «Очистити вправу» скидають прив’язку. Не зроблено: автозбереження в хмару, дублювання запису, спільні вправи між користувачами, перенесення `shared_stages` під owner. З кабінетом стрільця бібліотека пов’язана лише спільною сесією — окремого розділу там немає, а матч досі бере вправи через посилання на шер (**MA-C04** у `BACKLOG_MATCHES.md`).

## Беклог UX з того ж фідбеку (діагнози готові)

| Скарга | Причина в коді |
|--------|----------------|
| Довгу штрафну не поставити внизу | вершини затискаються `clampVec2ToField(p, 1, …)` — margin 1 м з усіх боків |
| 3D з тачпада | дефолтний drei `OrbitControls` без `rotateSpeed/zoomSpeed/mouseButtons`, pan з тачпада недосяжний |
| Зум замість скролу сторінки | безумовний `preventDefault` у wheel-listener `StageCanvas.tsx`, канвас на ~95dvh |
| Немає групового переносу | насправді **є** (`moveMulti`), але лише кнопка «Рамка», без Shift/Ctrl, режим гасне після жесту |
| Дрібні кліки | `TOUCH_PICK_MIN_PX = 26` застосовано і до миші, «верхній виграє» |
| Клік крутить об'єкт | ручка ↻ перевіряється **до** pick, і для миші немає порогу руху |
| Немає кнопок навігації | панорама лише жестами, стрілок і +/− не існує |

## Git

`main` → push → CI fast-forward **`staging`**. Правило: `.cursor/rules/git-main-staging-sync.mdc`. Mono на `/matches/my` — **після** таблиці, не вгору без запиту.

## Перше повідомлення в новому чаті

```
Прочитай docs/CHAT_HANDOFF.md. Далі: UX-беклог редактора (штрафні зони, 3D-навігація, кліки). commit + push main після змін.
```
