# Handoff для наступного чату (Stage Builder)

**Оновлено:** 2026-06-01 · гілка `main` синхронна з `origin/main` · робоче дерево чисте.

## Контекст

Репозиторій **Stage Builder / Shooters Tools**. Модуль **Події (matches)** на staging (`VITE_ENABLE_MATCH_PORTAL=1`). Онлайн-оплата внеску — **Monobank Acquiring**, модель **A** (X-Token організатора).

Продуктові рішення: [MATCH_PAYMENTS_PLAN.md](./MATCH_PAYMENTS_PLAN.md) §9. Беклог: [BACKLOG_MATCHES.md](./BACKLOG_MATCHES.md) (рядки MA-P*).

## Зроблено (у git)

| ID | Що |
|----|-----|
| **MA-P01** | `organizer_payment_providers`, API save/verify/disconnect, UI Mono на **`/matches/my`** (не `/account`) |
| **MA-P02** | `entry_fee_*_kop` на `matches`, секція в `OrganizerMatchEditPage`, `src/domain/matchEntryFee.ts` |
| **MA-P04** | `POST /api/create-payment`, `POST /api/payments/webhook/mono` → `payment_received` + auto `confirmed` (`confirmed_by` = organizer матчу) |
| **MA-P05** | UI «Сплатити онлайн» у `MatchPublicRegistrationSection`, `?payment=return`, таймаути, localhost webhook guard |
| Cursor | `.cursorignore`, `.cursor/rules/agent-context-budget.mdc` (не перевантажувати чат; коміти — `commit-push-after-changes.mdc`) |

**Коміти (останні):** `d35fb4d` (оплата), `fb44c30` (cursor), перед ними `af8195e`, `ec4b67e`.

**Міграції (застосовані на linked Supabase):**

- `20260602120000_organizer_payment_providers.sql`
- `20260603120000_match_entry_fees.sql`
- `20260604120000_match_registration_online_payment.sql` (+ `match_mono_invoices`)

**Код API:** правити `src/server/*ApiHandler.ts` → `npm run build:api` → коміт `api/*.js`.

## Не зроблено (наступні кроки)

1. **MA-P06** — у таблиці заявок організатора: колонка «Оплачено» + badge **«онлайн»** (`payment_provider = 'mono'` / `paid_at`). RPC `fetch_organizer_match_registration_roster` уже має `payment_received`.
2. **Оновити BACKLOG** — MA-P04/P05 → `partial` або `done`; MA-P01 примітка: UI на `/matches/my`, не кабінет.
3. **Опційно:** user-help статті про онлайн-оплату (`content/user-help/`) — лише якщо користувач попросить контент.

## Локальна перевірка оплати

1. `.env.local`: `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_*`
2. **Обов’язково для localhost:** `VITE_SHARE_PUBLIC_ORIGIN=https://stage-builder-staging.vercel.app` (публічний HTTPS webhook для Mono; redirect лишається на localhost)
3. `npm run dev` — API через `src/dev/matchPaymentsDevApiPlugin.ts`
4. Організатор: `/matches/my` → зберегти + **Перевірити** Mono-токен; у матчі — суми внеску
5. Стрілець: опублікований матч → заявка pending → **Сплатити онлайн**

Якщо кнопка «Перенаправлення…» зависає — перевірити Network `POST /api/create-payment` (має відповідь &lt;35s або помилка з текстом).

## Важливі шляхи

| Що | Де |
|----|-----|
| Create payment | `src/server/createPaymentApiHandler.ts` |
| Webhook | `src/server/monoPaymentWebhookApiHandler.ts` |
| Mono HTTP | `src/server/payments/monobankAcquiring.ts` |
| URL redirect/webhook | `src/lib/resolveMatchPaymentUrls.ts` |
| UI стрільця | `src/portal/matches/MatchPublicRegistrationSection.tsx` |
| UI внесків | `src/portal/matches/OrganizerMatchEditPage.tsx` |
| UI Mono організатора | `src/portal/matches/OrganizerMonoPaymentSection.tsx` |

## Правила для агента

- Див. `.cursor/rules/agent-context-budget.mdc` — без `npm run check` за замовчуванням; не читати цілий `messages.ts` / `api/*.js`.
- Після нових файлів у `supabase/migrations/` → `npx supabase db push --linked --yes`.
- Після змін handlers → `npm run build:api`.
- Коміт + push після завершення задачі (`commit-push-after-changes.mdc`).
- Спілкування з користувачем — **українською**.

## Перше повідомлення в новому чаті (копіпаст)

```
Прочитай docs/CHAT_HANDOFF.md. Зроби MA-P06 (badge «онлайн» у заявках організатора) і онови BACKLOG_MATCHES для MA-P01/P04/P05. Дотримуйся agent-context-budget.mdc.
```
