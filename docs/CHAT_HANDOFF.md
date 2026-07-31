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

## Наступна задача: хмарна бібліотека вправ (SB-CL01) — не почато

Фідбек стрільців: вправу неможливо нормально зберегти. План складено, код **не** починали. Рішення: **хмара основне сховище**, `.stage.json` лишається експортом; бібліотека відкривається **в редакторі**; без логіну «Зберегти» пропонує увійти.

Стартові факти (аудит уже зроблено, повторювати не треба):

| Що | Стан |
|----|------|
| Збереження вправи | `saveStageProject` у `src/App.tsx` — `Blob` + `a.download`, без id проєкту в стані |
| Чернетка | `src/application/sessionDraft.ts`, один ключ `stage-builder-session-draft-v1`, debounce 450 мс |
| Шери | `shared_stages` (`20260409120000_*`) — RLS без політик, **без owner**, читання лише RPC `fetch_shared_stage` по id |
| Авторизація в редакторі | **немає** — `src/App.tsx` не торкається Supabase; `/api/publish-share` анонімний |
| Готове до переюзу | `src/lib/supabaseClient.ts`, `src/portal/useSupabaseSession.ts`, зразок RLS-таблиці `20260510120000_participant_registration_defaults.sql` |
| Конверт payload | `src/domain/stageProjectFile.ts`, `STAGE_PROJECT_VERSION = 6`, парсер `parseStageProjectJson` |

Перший крок: міграція `public.user_stages` (`owner_id`, `title`, `weapon_class`, `payload jsonb`, `schema_version`, `created_at/updated_at`, індекс `(owner_id, updated_at desc)`, own-row RLS) + `npx supabase db push --linked --yes`. Далі — CRUD через клієнтський Supabase з RLS (без окремого Vercel API), потім кнопки «Зберегти / Мої вправи / Експорт».

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
Прочитай docs/CHAT_HANDOFF.md. Далі: SB-CL01 — міграція user_stages і хмарне збереження вправ. commit + push main після змін.
```
