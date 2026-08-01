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

Назва вправи — поле в шапці редактора (`stage.name`, `DEFAULT_STAGE_NAME`), єдине джерело правди для запису в бібліотеці; у діалозі це те саме поле, синхронне з шапкою. Порожня назва лишається порожньою (підказка «Введіть назву вправи» — це заклик до дії): ні `parseStageProjectJson`, ні відновлення чернетки більше не підставляють `DEFAULT_STAGE_NAME`, він працює лише як запасний заголовок у момент збереження; відкриття запису з бібліотеки бере назву з `record.title`, якщо в payload порожньо. Після першого збереження працює автозбереження раз на 30 с (`LIBRARY_AUTOSAVE_INTERVAL_MS`, тільки за наявності незбережених змін), кнопка «Зберегти» лишається явною, поруч статус «Збережено о HH:MM» / «Є незбережені зміни» / «Не вдалося зберегти».

«Зберегти» оновлює прив’язаний запис, інакше відкриває бібліотеку; імпорт файлу та «Очистити вправу» скидають прив’язку. Сам `libraryStageId` лежить у `localStorage` (`stage-builder-library-stage-id`) поряд із чернеткою — інакше після F5 діалог пропонував лише «Зберегти як нову». На share-маршрутах ключ не читається й не пишеться, а `notFound` від `saveUserStage` (запис видалено або зайшов інший акаунт) прив’язку скидає. Не зроблено: дублювання запису, спільні вправи між користувачами, перенесення `shared_stages` під owner, захист від тихого перезапису між вкладками (`update` без звірки `updated_at` — виграє останній). З кабінетом стрільця бібліотека пов’язана лише спільною сесією — окремого розділу там немає, а матч досі бере вправи через посилання на шер (**MA-C04** у `BACKLOG_MATCHES.md`).

### Запобіжники навантаження

У `user_stages` пишемо з браузера напряму (anon-ключ + RLS), тож ліміти стоять у БД: `CHECK pg_column_size(payload) <= 524288` і тригер `enforce_user_stages_quota` на 200 рядків на власника (міграція `20260801173000_user_stages_quota.sql`, застосована). Помилки приходять текстом у `error.message`, `mapWriteError` перетворює їх на `payloadTooLarge` / `quotaExceeded`, а `saveUserStage` ще й міряє JSON до запиту. Автозбереження не працює у прихованій вкладці й після невдачі відкладає наступну спробу (30 с → ×2 → максимум 10 хв, `autosaveRetryDelayMs`); для розміру та квоти пауза одразу максимальна, бо вони самі не зникнуть. Ручне «Зберегти» паузу ігнорує.

## Панель брифінгу в редакторі

Блок під полотном — не `<details>`, а секція зі своєю смугою (`app__briefing-bar`): іконка, «Брифінг вправи», підказка про PDF, шеврон і **кнопка «Завантажити PDF» просто на смузі** — раніше єдиний вихід на PDF був схований усередині згорнутого блока. Згортання тримає CSS (`app__briefing--collapsed` ховає все, крім смуги), стан пам'ятає `stage-builder-briefing-collapsed`: за замовчуванням розгорнуто, згорнув — лишиться згорнутим. `isBriefingIncomplete` (`src/domain/stageBriefing.ts`) підсвічує рамку, поки порожні поля, які може заповнити лише автор (мішені, постріли, стартова позиція). Ширина — як у робочої зони; окремого редакторського футера більше немає, тож 64rem більше нема з чим вирівнювати.

## Вхід без виходу зі сторінки

Гість логіниться в модалці `src/portal/PortalAuthDialog.tsx` (та сама форма `PortalCompactEmailAuth`, `pathnameForRedirect` = поточний шлях). Точки входу: «Увійти» в смузі `PortalShell` та посилання в діалозі «Мої вправи» (`onRequestSignIn` з `App.tsx`) — незбережена вправа лишається відкритою позаду. Реєстрація на матч уже мала таку модалку (`MatchPublicRegistrationSection`). Пропс `onAuthenticated` каже формі не робити `window.location.assign` на `auth/email-callback` після OTP — сесія вже є, хост просто закривається. Сторінка `/{locale}/account` з `?next=` лишається для листів-підтверджень і навігаційних CTA.

Реєстрація на **вже зареєстровану** адресу: GoTrue відповідає `200` із «фальшивим» користувачем (`identities: []`) і **листа не шле** — форма раніше все одно показувала крок «введіть код», і людина чекала листа, якого не буде. Тепер `PortalCompactEmailAuth` перевіряє порожній `identities`, перемикає на вкладку «Увійти» й пише про це.

**Відновлення пароля**: у формі входу — «Забули пароль?» → крок із адресою → `resetPasswordForEmail` з `redirectTo` на той самий `auth/email-callback`. Посилання з листа відкриває сесію, а новий пароль задається в кабінеті: `src/portal/account/AccountPasswordSection.tsx` (`updateUser({ password })`) — вона ж працює як звичайна зміна пароля для будь-кого, хто ввійшов. Обмеження PKCE: лист треба відкривати **в тому самому браузері**, звідки просили відновлення, інакше `code_verifier` не збігається і callback покаже екран помилки. Шаблон **Reset password** має бути увімкнений у Dashboard.

## Спільна шапка Shooters Tools у редакторі

Редактор живе на **`/{locale}/stage-builder`** усередині `PortalShell`; старий `/stage-builder` — клієнтський редірект (`LegacyStageBuilderRedirect`), тому надруковані QR і закладки працюють. Шлях будує `src/portal/stageBuilderPath.ts` (`stageBuilderPath`, `isStageBuilderPath`).

Шапка звичайна: на широких екранах усі продукти розгорнуті, на вузьких — бургер-шухляда (той самий `compactHeader`). Клас `portal-shell--app` лише задає `--app-chrome-offset` (висота смуги для `--_dvh-cap` у `src/App.css`) і піднімає `z-index` шапки до **940**, бо липкі панелі редактора доходять до 910, а його діалоги (950/960) мають лишатись зверху. Редактор віддав шеллу бренд-лінк, перемикач мови і футер.

Назва вправи в новій сцені **порожня** (плейсхолдер «Введіть назву вправи»); `DEFAULT_STAGE_NAME` лишився фолбеком при збереженні в бібліотеку.

Футер один — `SiteFooter`, включно з карткою встановлення PWA. Шер-сторінки `/v/:shareId` і `/e/:shareId` рендерять `App` з `standalone`: там лишаються власний бренд-лінк, перемикач мови і `SiteFooter`, повного шелла немає.

## UX-беклог редактора з того ж фідбеку — закрито (BL-038…BL-044)

| Було | Стало |
|------|-------|
| Довгу штрафну не поставити внизу | вершини зони — `PENALTY_VERTEX_FIELD_MARGIN_M = 0`; реквізит clamp по осях (`clampVec2ToFieldBox` + `rotatedHalfExtentM`), а не за найдовшою стороною |
| 3D з тачпада | `rotateSpeed` / `zoomSpeed` / `panSpeed` + `zoomToCursor`; **Shift + ЛКМ — панорама** (`StageNavigator`) |
| Зум замість скролу сторінки | при масштабі 1 колесо йде сторінці; зум — **Ctrl/⌘ + колесо**, pinch або кнопки |
| Немає групового переносу | Shift/Ctrl-клік додає та знімає об’єкт у виділенні (`toggleEntityInSelection`); «Рамка» лишилась як була |
| Дрібні кліки | `MOUSE_PICK_MIN_PX = 7` проти 26 px для пальця; виграє **найближчий** силует, а не верхній |
| Клік крутить об'єкт | ручка ↻ мишею чекає рух на 4 px (`pendingRotateRef`), інакше це клік |
| Немає кнопок навігації | `ViewNavPad` у 2D і 3D: хрест панорами, зум ±, «уся площадка в кадрі» |

Деталі та ID — у [BACKLOG.md](./BACKLOG.md).

## Git

`main` → push → CI fast-forward **`staging`**. Правило: `.cursor/rules/git-main-staging-sync.mdc`. Mono на `/matches/my` — **після** таблиці, не вгору без запиту.

## Перше повідомлення в новому чаті

```
Прочитай docs/CHAT_HANDOFF.md. Далі: UX-беклог редактора (штрафні зони, 3D-навігація, кліки). commit + push main після змін.
```
