# Stage Builder — технічна документація

Документ для розробників: архітектура, домен, формати даних, збірка та відомі обмеження.

**Пов’язані документи:** зведений контекст (бізнес + техніка + індекс `docs/`) — **[PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md)**; **джерела даних (файл, `localStorage`, Supabase)** — **[DATA_AND_STORAGE.md](./DATA_AND_STORAGE.md)**; бізнес- і технічний огляд **[PRODUCT.md](./PRODUCT.md)**; план порталу (архітектура, бренд, URL, хостінг) **[PORTAL_PLAN.md](./PORTAL_PLAN.md)**; **беклог ідей** **[BACKLOG.md](./BACKLOG.md)**; чернетка **видимість / промені 2D** (BL-010 / BL-013) — **[VISIBILITY_AND_SAFETY_RULES.md](./VISIBILITY_AND_SAFETY_RULES.md)**; повний опис функціоналу **[FUNCTIONALITY.md](./FUNCTIONALITY.md)**; продуктові версії **[VERSIONING.md](./VERSIONING.md)**; чернетка зворотного зв’язку **[USER_FEEDBACK.md](./USER_FEEDBACK.md)**; **оптимізація бандла** — **[OPTIMIZATION.md](./OPTIMIZATION.md)**; **план посилання на вправу (BL-001)** — **[BL-001_SHARE_LINK_PLAN.md](./BL-001_SHARE_LINK_PLAN.md)**; **політика публікації (чернетка BL-001)** — **[PUBLISH_POLICY.md](./PUBLISH_POLICY.md)**; **Bluetooth-таймер SG Timer, BLE (BL-014)** — **[BL-014_SG_TIMER_BLE.md](./BL-014_SG_TIMER_BLE.md)**; **активації на плані (BL-004, специфіка рішень)** — **[BL-004_ACTIVATIONS.md](./BL-004_ACTIVATIONS.md)**.  
**Важливо:** позначки V0 / V1 / V2 — це продукт, не версія схеми файлу. Версія JSON-вправи — `STAGE_PROJECT_VERSION` у `stageProjectFile.ts` (зараз **6**; історія змін схеми — коментар біля константи та `[DATA_AND_STORAGE.md](./DATA_AND_STORAGE.md)`).

## Посилання на вправу (BL-001)

**Статус:** MVP (посилання, публікація, перегляд/редактор, PDF QR, noindex, OG для ботів) — **[BL-001_SHARE_LINK_PLAN.md](./BL-001_SHARE_LINK_PLAN.md)**.

**База (Supabase):** міграція **`supabase/migrations/20260409120000_shared_stages.sql`** — таблиця **`shared_stages`**, RLS, RPC **`fetch_shared_stage`**. Застосування та перевірка — **[SUPABASE_SHARED_STAGES.md](./SUPABASE_SHARED_STAGES.md)**; локальний smoke-тест мережі — **`node scripts/test-supabase-share.mjs`**. **Data API** у проєкті має бути увімкнено (Dashboard → Integrations → Data API).

**Матчі / реєстрація (BL-025, MVP shotgun):** міграція **`supabase/migrations/20260501140000_match_admin_mvp.sql`** (`matches`, `match_squads`, `match_registrations`, `match_stage_links`, `match_admin_profiles`) — **[SUPABASE_MATCH_ADMIN.md](./SUPABASE_MATCH_ADMIN.md)** ([MATCH_REGISTRATION_AND_PSC_PLAN.md](./MATCH_REGISTRATION_AND_PSC_PLAN.md)). Накочування міграцій на хмарний проєкт через **Supabase CLI**: **`supabase/README.md`**, скрипти **`npm run supabase:push`** (після **`supabase:login`** та **`supabase:link`**).

**Код:** `src/main.tsx` — **`BrowserRouter`**: портал під префіксом **`/:locale`** (`uk` \| `en`) — **`/:locale`** (`PortalHome`), **`/:locale/hit-factor`**, **`/:locale/publish-policy`**, **`/:locale/matches`** (публічний список опублікованих матчів: пошук, діапазон дат, календар за днями), **`/:locale/matches/my`** / **`/:locale/matches/:matchId`** / **`/:locale/admin/organizers`** (картка матчу, кабінет організатора та адмінка платформи **лише якщо увімкнено match portal**; без `VITE_ENABLE_MATCH_PORTAL=1` маршрути не реєструються — пор. **`isMatchPortalEnabled()`** і [MATCH_REGISTRATION_AND_PSC_PLAN.md §1.4](./MATCH_REGISTRATION_AND_PSC_PLAN.md)), **`/:locale/tools/ro-helper/...`** (RO Helper). **`/`** редірект на **`/${locale}`** (якщо шлях не починається з `uk`/`en`, початкова мова — `localStorage`, інакше детект браузера). Шляхи без префікса (**`/hit-factor`**, **`/publish-policy`**, **`/tools/ro-helper`**, **`/ro-helper`**) залишені для сумісності й ведуть на відповідну локалізовану сторінку. **`/stage-builder`**, **`/v/:shareId`**, **`/e/:shareId`** — без префікса мови. У **`PortalShell`** (лише портал): **Helmet** з **`link rel="canonical"`** та **`hreflang`** для UK/EN. Клієнтський канонічний origin для цих тегів — **`getPublicSiteOrigin()`** (`src/seo/publicOriginClient.ts`; узгоджено з **`VITE_SHARE_PUBLIC_ORIGIN`** / прод-каноном).

**Share (BL-001):** **`ShareStageRoute`** на **`/v/:shareId`** та **`/e/:shareId`** — RPC **`fetch_shared_stage`**, гідратація стору. Режим **`/v/`** — **`shareReadOnly`**; **`/e/`** — повний редактор. Обидва передають у **`App`** **`shareViewContext: { shareId }`** (QR у PDF — **`/v/:id?lang=`**; «Відкрити в редакторі» — **`target="_blank"`** на **`/e/:id`**). Перед завантаженням share: діалог при змістовній чернетці у **`localStorage`** (`isSessionDraftMeaningful` у **`sessionDraft.ts`**). Клієнт Supabase — **`src/lib/supabaseClient.ts`** (браузерний singleton anon: **`persistSession`**, **`autoRefreshToken`**, **`detectSessionInUrl`**, **`flowType: 'pkce'`**, **`storageKey` `sb-stage-builder-auth`**); **`VITE_SUPABASE_URL`**, **`VITE_SUPABASE_ANON_KEY`**; для UI порталу — **`useSupabaseSession`** (`src/portal/useSupabaseSession.ts`). У Supabase Dashboard → Auth → URL додай **redirect** для локальної та прод-оригіну SPA (OAuth / magic link). **Локальна перевірка A1:** вхід через **`/:locale/account`** або з публічної картки матчу (**`/:locale/matches/:matchId`**, кнопка «Зареєструватись» та модалка email/пароль). Service role — лише на сервері.

**Канонічний домен:** `src/seo/canonicalProductionOrigin.ts` (`https://shooters-tools.com`). У **`index.html`** абсолютні URL для SEO задані як **`__SITE_ORIGIN__`**; **`vite.config.ts`** (`transformIndexHtml`) підставляє значення з **`VITE_PUBLIC_SITE_ORIGIN`** → **`VITE_SHARE_PUBLIC_ORIGIN`** → **`VERCEL_PROJECT_PRODUCTION_URL`** (з нормалізацією legacy `stage-builder.vercel.app`) → канон. **`resolvePublicOriginFromEnv`** на Edge/API також переписує legacy production-хост на канон, якщо немає явного **`VITE_SHARE_PUBLIC_ORIGIN`**. **`vercel.json`**: редірект з хоста **`stage-builder.vercel.app`** на **`shooters-tools.com`**; **`rewrites`** для **`/uk`**, **`/uk/*`**, **`/en`**, **`/en/*`**, **`/stage-builder`**, **`/publish-policy`**, **`/hit-factor`**, **`/ro-helper`**, **`/tools/ro-helper`** та їх підшляхів, **`/v/*`**, **`/e/*`** → **`/index.html`**.

**Індексація / прев’ю:** у **`ShareStageRoute`** для **`/v/`** та **`/e/`** оновлюються існуючі **`meta name="robots"`** та **`googlebot`** → **`noindex, nofollow`** (після відходу з маршруту — відновлення з `index.html`). **`middleware.ts`** (Vercel Edge, **`@vercel/edge`**): для типових User-Agent ботів на **`/v/*`** та **`/e/*`** повертається HTML з **`og:title`** (з поля **`title`** через RPC **`fetch_shared_stage`**), **`og:image`** / **`twitter:image`** (канонічний хост через **`resolvePublicOriginFromEnv`**: **`VITE_SHARE_PUBLIC_ORIGIN`** або **`VERCEL_PROJECT_PRODUCTION_URL`** / legacy → канон, далі **`/og-image.png`** + query з **`src/seo/ogConstants.ts`** — узгоджено з **`index.html`**), **`og:description`**, **`og:site_name`** (**Shooters Tools**); для **`/hit-factor`**, **`/uk/hit-factor`**, **`/en/hit-factor`** — статичний OG для калькулятора Hit Factor; інакше **`next()`** до SPA. Потрібні **`VITE_SUPABASE_URL`** і **`VITE_SUPABASE_ANON_KEY`** у середовищі Edge.

**Публікація (POST):** логіка в **`src/server/publishShareApiHandler.ts`**; артефакт **`api/publish-share.js`** (esbuild, CommonJS) + **`api/package.json`** з **`"type": "commonjs"`** — інакше кореневий **`"type": "module"`** змушує Node трактувати **`api/*.js`** як ESM і функція падає з **`FUNCTION_INVOCATION_FAILED`**. Файл **`api/publish-share.js`** закомічений (щоб Vercel не втрачав маршрут). Змінні: **`SUPABASE_SERVICE_ROLE_KEY`**, **`SUPABASE_URL`** або **`VITE_SUPABASE_URL`**; опційно **`VITE_SHARE_PUBLIC_ORIGIN`**. Абсолютні URL у відповіді API формуються через **`resolvePublicOriginFromEnv`** (`src/lib/resolvePublicOriginFromEnv.ts`): спочатку **`VITE_SHARE_PUBLIC_ORIGIN`**, інакше production-хост з **`VERCEL_PROJECT_PRODUCTION_URL`** (без slug preview-деплою), далі **`VERCEL_URL`**, далі заголовки запиту. Клієнтський QR / «відкрити в редакторі» на preview: **`import.meta.env.VITE_BUILD_PRODUCTION_ORIGIN`** (inject у **`vite.config.ts`** з тієї ж змінної Vercel). Валідація: **`src/server/sharePublish.ts`**. Після змін у handler — **`npm run build`** і commit **`api/publish-share.js`**. Якщо публікація без тексту від Supabase — змінні на **production** і міграція **`shared_stages`**. Якщо **не JSON** — SW (**`NetworkOnly`** для **`/api/*`**) або логи функції на Vercel.

**Експорт матчу в PractiScore (POST, BL-028):** **`src/server/matchExportPscApiHandler.ts`** → зібраний **`api/match-export-psc.js`** тим же esbuild-пайплайном, що **`scripts/bundle-publish-api.mjs`** (після **`npm run build`** — commit артефакту як для publish-share). **`POST /api/match-export-psc`**, заголовок **`Authorization: Bearer <access_token>`** (сесія Supabase), тіло **`{ "matchId": "<uuid>" }`**; відповідь — ZIP із **`match_def.json`** + порожній **`match_scores.json`**. Перевірки: активний організатор (**`match_admin_profiles.organizer_status`**), власник матчу (`matches.organizer_id`), і наявність хоча б одного рядка **`match_stage_links`**. У **`match_shooters[]`** PSC очікує **`sh_ln`** (прізвище) та **`sh_fn`** (ім’я); **`splitDisplayName`** у **`buildPortalPractiscoreZip.ts`** вирізає з профілю хвости на кшталт **`(Скв. 2 №1)`** та для повністю кириличних ПІБ використовує порядок «прізвище далі ім’я»; для латиниці залишається «ім’я решта» або формат **`Прізвище, Ім’я`**. Поля **`match_stages[]`**: **`stage_poppers`**, **`stage_noshoots`**. **Папір:** у золотому експорті з PractiScore app картон задається масивом **`stage_targets`**: елементи **`{ "target_number": n, "target_reqshots": 2 }`** (IPSC SG, два влучання на мішень); при цьому **`stage_numtargs`** часто **0**. Портальний експорт заповнює **`stage_targets`** за кількістю паперових одиниць (`computePscStageMetrics` + підказка з брифінгу) і для таких стадій теж виставляє **`stage_numtargs: 0`**. **`stage_tppoints`**: евристика **5×сталь + 10×папір** (або **max** з парсингу рядка **«Макс. очок»** у брифінгу, якщо задано). **`stage_poppers_maxnpms`**: у PractiScore mobile це «Steel NPMs»; round-trip шаблон давав **`2`** для кожної скопійованої стадії — портальний експорт пише **`0`**. Метал і кераміка — у **`stage_poppers`** через **`tryPscStageMetricsFromSharePayload`** / **`computePscStageMetrics`** (**`shared_stages.payload`**). **`match_shooters.sh_sqd`** — **`pscSquadNumbers.ts`** + **`match_squads.squad_phase`** (основний **1…n**, прематч **11…** або **22…**, якщо в матчі >10 скводів; **`sh_sqd` = етикетка − 1**). При невідомому **`squad_id`** за наявності прематч-скводів — по черзі. Якщо payload не парситься — таргети з **`matchDefRoundtripTemplate.json`**

**Картка матчу (Markdown / посилання):** поле **`description_md`** рендериться **`react-markdown`** з плагіном **`remark-gfm`** (**`MatchDescriptionRichText`**); у редакторі опису доступні обгортки BBCode через **`wrapBbCode`** (**`bbCodeTextareaWrap.ts`**); текст **`location_label`** на картці — з **`PlainTextAutolink`**. Стилізація дій (**`.portal-btn`**) — [MATCHES_PORTAL_BUTTONS.md](./MATCHES_PORTAL_BUTTONS.md).

**Увага (актуальність share):** експорт зчитує **`shared_stages.payload`** для **`share_stage_id`** з **`match_stage_links`**. Якщо ви змінили план у редакторі після того, як додали вправу до матчу, у ZIP потрапить **старий** payload, доки немає **нової VIEW-публікації** (той самий **`share_group_id`**) і в кабінеті організатора **«Оновити до актуального»**. Перевірка: **`/v/<share_stage_id>`** має показувати той самий план, що очікуєте в PSC.

**Локально з `/api/*` (варіант 1):** чистий **`npm run dev`** (лише Vite) **не** піднімає маршрути з **`api/*.js`** (**`publish-share`** тощо). Для **`POST /api/publish-share`** використовуй **`npm run dev:vercel`**. **`POST /api/match-export-psc`** у **`npm run dev`** обслуговує dev-плагін **`src/dev/matchExportDevApiPlugin.ts`**, якщо **`SUPABASE_SERVICE_ROLE_KEY`** (і URL) є у **`.env` / `.env.local`** (**`vite.config.ts`** робить **`loadEnv` → `process.env`** лише коли **`mode === 'development'`**). Альтернатива — **`npm run dev:vercel`** для потрібної поведінки, як і раніше. Коротко: **`npm install`** → **`npm run vercel:link`** (одноразово, створюється **`.vercel/`**, у gitignored) → **`npm run vercel:env-pull`** або вручну ключі (**`.env.example`**; **`vercel env pull`** кладе у **`.env.local`**) → **`npm run dev:vercel`** для повного локального наближення до Vercel. Конфіг: **`vercel.json`** задає **`devCommand`: `npm run dev`** та **`installCommand`**. Якщо змінено TypeScript-хендлери **`src/server/*`** для бойового **`api/*.js`**, перезібері API: **`npm run build:api`** (або **`npm run build`**). Див. також **`.env.example`**.

## Архітектура

Проєкт дотримується шаруватої структури:

| Шар | Каталог | Відповідальність |
|-----|---------|------------------|
| **Domain** | `src/domain/` | Типи (`models.ts`), геометрія мішеней і реквізиту (`propGeometry.ts`, `swingerGeometry.ts`), константи габаритів (IPSC, A4, кераміка), розрахунки (`computeMinRounds`, `targetSummary`), **чернетка тексту активацій для брифінгу** (`activationBriefing.ts`, BL-004), **таблички дистанції** (`rangeDistanceSigns.ts`), парсинг/збірка `*.stage.json`, буфер плану (`planClipboard.ts`), кути безпеки (`safetyAngles.ts`), маппінг 3D (`stageCoordinates3d.ts`), опорна точка огляду 3D (`overviewAnchor.ts`), покриття площадки в 3D (`fieldGround3d.ts`), макет A4/PDF (`a4PrintLayout.ts`) |
| **Application** | `src/application/` | Zustand: сцена (`stageStore`, у т. ч. **`activations`** BL-004, undo/redo через `zundo`), брифінг (`briefingStore`), чернетка `localStorage` (`sessionDraft.ts`), компонент **`SessionDraftPersist.tsx`** (підписка + debounce) |
| **Presentation** | `src/presentation/` | React-компоненти: `StageCanvas`, `StageView3D`, `RangeDistanceSignDialog`, `StageBuilderToolbar`, `StageMinimap`, `GoogleAnalytics`; хуки (`usePwaInstall`); бібліотеки: `exportBriefingPdf`, `pdfFonts`, `viewTransform` |
| **Корінь UI** | `src/App.tsx` | Композиція layout, брифінг-форма, гарячі клавіші, lazy-3D, стрічка staging, посилання на канвас через `ref` (`StageCanvasHandle`) |
| **i18n** | `src/i18n/` | Дерева рядків UK/EN (`messages.ts`), `I18nProvider`, `getMessage` / `formatTemplate`, `localStorage` для мови (`storage.ts`) |
| **Портал** | `src/portal/` | `PortalShell`, home, калькулятор Hit Factor, RO Helper (lazy), акаунт, модуль матчів (`matches/*`; прапорець **`isMatchPortalEnabled`**), утиліти сесії (**`useSupabaseSession`**) |

Точка входу: `src/main.tsx` — `hydrateSessionDraft()`, реєстрація PWA (`virtual:pwa-register`), обгортка `I18nProvider`, **`BrowserRouter`** з маршрутами, **Vercel Analytics** і **Google Analytics**.

**Code splitting:** `StageView3D` підвантажується через `React.lazy` у `App.tsx` лише в режимі «3D», всередині `<Suspense>`. Експорт PDF — динамічний `import()` модуля `exportBriefingPdf` у момент натискання кнопки. Після **production-деплою** з новими chunk-хешами стара вкладка інколи не може підвантажити ці модулі (`Failed to fetch dynamically imported module` тощо): у `App.handleExportPdf` такі помилки розпізнаються (`isStaleBundledChunkError`), користувачу показується **локалізована підказка** оновити сторінку (`exportPdfStaleChunkHint` у `messages.ts`).

## Площадка, пресети та прив’язка

- **Стан сцени** — `StageState` у `stageStore.ts`: `name`, `weaponClass`, **`fieldSizeM`** (`Vec2`: ширина × довжина в метрах), масиви `targets` і `props`. Тип `Stage` у `models.ts` (поля `category`, `maxPoints` тощо) у рантаймі сцени **не** використовується — категорія вправи живе в брифінгу (`StageBriefing.exerciseType` / `StageCategory`).
- **`field.ts`** — `FIELD_SIZE_PRESETS`, `FIELD_SIZE_LIMITS` (мінімум 8 м по кожній осі; **ширина** до 50 м, **довжина** до 100 м), `clampFieldDimensions`, дефолт 30×40. Для пропорцій картки прев’ю в UI: `STAGE_CARD_UI_DEPTH_FACTOR`.
- **Картка 2D/3D** (`App.css`): робоча зона та сітка кластера на **повну ширину**; друга колонка — `1fr` (не обмежується «letterbox»-шириною від метрів поля). Сама картка — **width: 100%** колонки; висота `min(--_plan-cap, 100cqw * h/w)` **без** `aspect-ratio` на контейнері (інакше поєднання з лімітом висоти знову стискало б ширину). Поля розміру в шапці — текстовий ввід з фіксацією при **blur** (чернетка в стейті).
- **Прокрутка сторінки** — смуга перемикання 2D/3D, полів розміру та пресетів (`.app__view-controls-strip`) і ліва панель тулбару на широкому екрані (`min-width: 52.0625rem`) закріплені через `position: sticky`, щоб залишатися в полі зору при довгій сітці. Відступ лівої панелі від верху вьюпорту узгоджується з `--app-sticky-controls-height` у `index.css` (за потреби підлаштувати, якщо зміниться верстка смуги). На вузьких екранах ліва панель — у drawer (overlay), sticky для неї не застосовується.
- **Сітка та snap** — `GRID_SNAP_M = 0.5`; поверх поля на 2D — **шахматка** кроком `GRID_CHESS_M = 1` (дві тонкі заливки, лише видимий viewport; при дуже сильному віддаленні або понад ~8000 клітин у кадрі шахматку пропускаємо — лишаються лінії 0,5 м). Інтер’єри дірок у «матрьошці» штрафних зон **не** перекриваються окремою заливкою — видно ту саму шахматку, що й на решті поля. Для центрів після перетягування: `TARGET_PLACEMENT_SNAP_M` і `PROP_PLACEMENT_SNAP_M` (0,05 м), щоб дрібно позиціонувати мішені й стикувати реквізит.
- **Зміна розміру поля** — `setFieldSizeM` і завантаження файлу викликають `reclampTargetsProps`: усі позиції обмежуються новими межами; реквізит проходить через `migrateProp` (старі типи `wall`/`window` прибираються, `port` → `shieldWithPort`, корекція розміру `tireStack`). У **шапці** (числові поля та пресети) перед `setFieldSizeM` викликається `fieldResizeChangesEntities` (`fieldResizeImpact.ts`); якщо симуляція reclamp змінює сцену — показується `window.confirm` з текстом `toolbar.fieldResizeConfirm`.
- **3D і знімок PDF** — `a4PrintLayout.ts`: для PNG брифінгу **`briefingPdfSnapshotAspectRatio`** (не вужче за **`PDF_BRIEFING_SNAPSHOT_MIN_ASPECT`**, для широких полів — як `stageViewportAspectRatio`), **`pdfSnapshotPixelSize`** (ширина колонки PDF × **`PDF_SNAPSHOT_EXPORT_SCALE`** у `capturePngDataUrl`), висота з цього aspect. У **`StageView3D`** режим камери `pdf` дає той самий aspect, що й PNG; обгортка канваса (`App.css`) — вписаний прямокутник (`--pdf-aspect`, `min(100cqw, …)`). Параметри **«Без тіней»** та **«Чорно-біле»** — блок **`.app__view3d-render-tools`** у `App.tsx` (**верхній правий кут** картки 3D, кнопки **вертикально**).

## Розстановка з тулбару (placement)

- Клік по типу мішені або реквізиту в **`StageBuilderToolbar`** увімкнює **`PlacementMode`** (`placementMode.ts`): далі кожен **ЛКМ по 2D-плану** викликає `addTarget` / `addProp` з координатами кліку (snap/clamp у `stageStore`). **Hit-test ігнорується** — можна ставити «поверх» існуючих об’єктів. Повторний клік по тій самій кнопці або **Esc** вимикає режим. **Вимір** і placement **взаємовиключні**. Реалізація кліку — `StageCanvas` (`placementArmed`, `onPlacementWorldClick`).
- **Порядок кнопок реквізиту** — `INFRASTRUCTURE_PROP_ORDER` у `infrastructureProps.ts` (узгоджено з парсером `PROP_TYPES` у `stageProjectFile.ts`); у тулбарі реквізит згруповано (`INFRASTRUCTURE_SHIELDS`, `INFRASTRUCTURE_FAULT_LINE`, `INFRASTRUCTURE_EQUIPMENT`). Мішені — групи в `toolbarTargetGroups.ts`.
- **Генерація `id`** — `newId()` у `stageStore` і `newEntityId()` у `stageProjectFile`: за можливості `crypto.randomUUID()`; на **HTTP (наприклад LAN без TLS)** `crypto.randomUUID` може бути недоступний — тоді fallback на префікс `sb-` + час/випадковість (див. коментар у `stageStore`).

## Клас зброї

- У знімку сцени та в `*.stage.json` зберігається **`weaponClass`**: `handgun` | `rifle` | `shotgun` (`weaponClass.ts`).
- Набори мішеней за класом описані в `weaponClass.ts`; наразі **всі класи отримують той самий повний список** `ALL_TARGET_TYPES`. У `addTarget` фільтрація за класом **вимкнена** (коментар у `stageStore` — UI перемикання класу для обмеження палітри тимчасово прибрано).

## План 2D: лінійки та вимір

- **Лінійки** — `drawViewportFixedRulers` у `StageCanvas.tsx`: смуги **закріплені на вікні** (ліворуч і вздовж низу). Діапазон поділок — **перетин** видимого вікна (`computeWorldViewportRect`) з **межами поля** `[0, fieldWidthM] × [0, fieldHeightM]`, щоб шкала не показувала «зайві» метри за сіткою. Крок — `pickRulerStepM` (мін. **0,5 м**), дрібні поділки при кроці ≥ 1 м. Підпис **«0»** на нижній осі не дублюється.
- **Інструмент вимірювання** — лише в **2D**: кнопка в `app__plan-map-actions`, клавіша **M** (коли `viewMode === '2d'` і фокус не в полі форми). Два **ліві кліки** — кінці відрізка; координати в межах поля, **без** snap сітки. Маркери кінців — той самий екранний радіус, що й інші точки контакту плану (`planContactHandleRadiusPx`). Після двох точок лінія й підпис лишаються; наступний клік починає нову пару. **Esc** скидає незавершений відрізок. У **3D** вимір вимикається; при вимкненні інструмента `App` викликає `StageCanvasHandle.clearMeasure()`.
- **Закріплені розміри** (`planDimensions`) — створення режимом «Розміри»; переміщення endpoints або сегменту (рух усій лінії), виділення кліком, **Delete/Backspace** прибирають лінію; мутація `setPlanDimensionLineEnds` у `stageStore` (Temporal undo); маркери кінців на канвасі компактні (**`dimensionPlanEndpointDotPx`**, без спільної формули **`planContactHandleRadiusPx`**).
- Інші **«точки контакту» 2D** (обертання, штрафна лінія, вершини штрафної зони M-вимір, чернетка контуру, підказка вузла сітки під зумом, активне джерело активацій тощо) — узгоджено через **`planContactHandleRadiusPx`** у **`StageCanvas.tsx`**; зона влучення кліком — **pick**/ **TOUCH_PICK_MIN_PX**.

## План 2D: зона безпеки та попередження

- Текст **«Кути безпеки»** у брифінгу (`briefingStore` / поле `safetyAngles`) парситься як `лівий/правий[/верх]` у **`parseSafetyAngles`** (`safetyAngles.ts`).
- Якщо на плані є реквізит **`startPosition`** і рядок успішно розібрано, на 2D малюється клин **`drawSafetyZone`** (напрямок «вниз по полю» = downrange).
- Мішені, чий центр **поза** цим клином відносно старту, отримують червоний пунктирний контур і маркер **⚠** (`isTargetInSafetyZone` у циклі малювання мішеней у `StageCanvas`).

## План 2D: рамка, копіювання, вставка

- **Режим рамки** (`marqueeModeActive` у `App.tsx` → `StageCanvas`): ЛКМ тягне прямокутник; у світі AABB. У виділення потрапляють об’єкти, у яких **центр** (`position`) всередині прямокутника (`collectIdsInWorldRect` / логіка в канвасі).
- **API канваса** — `StageCanvasHandle`: `getSelectionForCopy()`, `getSpawnCenterWorld()`, **`captureVisiblePngDataUrl()`** (PNG поточного 2D-виду для PDF); виклики з `App.tsx`.
- **Копіювання** — **Ctrl+C** / Cmd+C і кнопка: deep clone виділення; внутрішній буфер у `App`; додатково спроба записати JSON у системний clipboard (помилки ігноруються).
- **Вставка** — **Ctrl+V** / кнопка: `shiftClonesForPaste` і пов’язана логіка в **`planClipboard.ts`**; центр мас набору вирівнюється з `getSpawnCenterWorld`; нові сутності через `pasteCloneEntities` у `stageStore` (нові `id`).
- **Взаємовиключення**: рамка, вимір і placement; перехід у **3D** або **очищення вправи** вимикає рамку й скидає внутрішній буфер.

## Домен: мішені та підрахунки

Повний перелік — **`TargetType`** у `models.ts`. Коротко:

- **Папір:** лише `paperIpscTwoPostGround` / `Stand50` / `Stand100`, `paperA4TwoPostGround` / `Stand50` / `Stand100`, `paperMiniIpscTwoPostGround` / `Stand50` / `Stand100` (низ лиця ≈0,1 м / 0,5 м / 1 м у 3D). У старих `.stage.json`: `paperIpscTwoPost` → `paperIpscTwoPostStand100`; колишні одностійкові `paperIpsc` / `paperA4` / `paperMiniIpsc` → відповідний `*TwoPostStand100`.
- **Метал:** `metalPlate` (квадрат Appendix C3: 15 / 20 / 30 см, поле `metalRectSideCm`), `metalPlateStand50`, `metalPlateStand100`, `popper`, `miniPopper`, **`gongSquare`** / **`gongRound`** (гонг на рамці 1×1 м; розмір пластини 30 / 40 / 50 см, поле `gongSizeCm`; сегменти в палітрі «Метал» або `[` / `]` на плані).
- **Кераміка:** `ceramicPlate` (радіус і колір — `ceramicPlateSpec.ts`).
- **Ківаки:** `swingerSinglePaper` / `Double`, `swingerSingleCeramic` / `Double` (геометрія — `swingerGeometry.ts`).

Допоміжна логіка:

- **`targetSpecs.ts`** — `isPaperTargetType`, `isPaperTwoPostTargetType` (паперова палітра — лише типи з двома стійками), `isCeramicTargetType`, `isSquareSteelPlateTargetType`, тощо. Кріплення: `paperIpscTwoPostStandAnchorsLocalM`, `paperA4TwoPostStandAnchorsLocalM`, `paperMiniIpscTwoPostStandAnchorsLocalM` або узагальнено `paperTwoPostStandAnchorsLocalM(type)`; на 2D — `targetPaperTwoPostStickIndicatorsWorld` (уздовж локального «низу» лиця).
- **`computeMinRounds.ts`** — евристика мінімуму пострілів (папір ×2, сталь/кераміка ×1; подвійний ківак = дві одиниці).
- **`targetSummary.ts`** — текст для брифінгу/PDF (метал, кераміка, папір, NS). Кнопка «підставити з сцени» в `App.tsx` оновлює `targetsDescription`, `recommendedShots` і **`maxPoints` = `computeMinRounds` × `BRIEFING_SCENE_SYNC_POINTS_PER_SCORING_HIT`** (5 очок на заліковий постріл, IPSC-стиль «А»).
- **`countStageTargetUnits`** — одиниці на плані для підказок UI.

## Домен: реквізит

Повний перелік — **`PropType`** у `models.ts` (двері, штрафна лінія, щити звичайні/подвійні/з портом і варіантами порту, дверцята в порті, бочка **`barrel`**, подвійна бочка **`barrelDouble`**, стос шин **`tireStack`** / **`tireStack1m`** / **`tireStackTall`** (висоти — `TIRE_STACK_*_HEIGHT_M` у `propGeometry.ts`), **стіл** `woodTable`, **стілець** `woodChair`, **стійка** `weaponRackPyramid`, декор **авто** `decorationCar` — спільна логіка пропорцій у `decorationCarGeometry.ts` для `CarSUV` і плану 2D, качель, платформа, тунель Купера, стартова позиція). Додаткове подовження кабіни вперед (передня зона дверей / вікно): **`DECORATION_CABIN_EXTRA_FORWARD_LENGTH_M`** у тому ж файлі. Дефолтні розміри та геометрія плану/3D — **`propGeometry.ts`** (у т.ч. спеціалізовані малювалки для щитів з портом, качелі тощо в `StageCanvas` / `StageView3D`).

## Файл вправи (`*.stage.json`)

- Контракт: `stageProjectFile.ts` — `STAGE_PROJECT_FORMAT`, `STAGE_PROJECT_VERSION`, розширення `.stage.json`.
- Вміст: знімок сцени (`name`, `weaponClass`, `fieldSizeM`, `fieldGroundCover3d`, `targets`, `props`, **`penaltyZoneSet`** з `version >= 2`, **`rangeDistanceSigns`**) + об’єкт брифінгу. Таблички дистанції біля лівого краю: при парсингу **`labelM` clamp 1…999 м** (`rangeDistanceSigns.ts`).
- Для квадратних сталевих мішеней у JSON зберігається опційне **`metalRectSideCm`** (15 | 20 | 30).
- При завантаженні: `migrateProp` у `stageStore` (узгоджено з парсером).
- **BL-019** (замкнені контури штрафних зон): у проді — `penaltyZoneSet` у JSON, **`PENALTY_ZONE_CLOSE_EPSILON_M`** = 0,05 у `penaltyZones.ts`; після замикання контуру **`resolveClosedPenaltyRing`** вирішує, чи це новий полігон, чи дірка в існуючому (найменший зовнішній контур, що містить ситуацію), без окремого режиму «дірка в останньому»; при кресленні та перетягуванні вершин **прив’язка** — **`PENALTY_CONTOUR_VERTEX_SNAP_M`** = 0,1 у `field.ts` (тонше за загальну сітку **`GRID_SNAP_M`**); на 2D-плані вершини показані однаковими біло-червоними маркерами (окремої «режимної» плями під час виділення немає): клік — перетягування, під час переміщення малюється довжина **двох суміжних** ребер; запис у сторі **`movePenaltyVertex`** нормалізує позицію так само, як клік при кресленні: **`clampVec2ToField(..., 1, …)`** + **`PENALTY_CONTOUR_VERTEX_SNAP_M`**; Delete/Backspace — видалення вершини (`movePenaltyVertex` / `removePenaltyVertex` у `stageStore.ts`); 2D — `StageCanvas.tsx`; 3D — сегменти контуру як «стінки» з тими ж габаритами/кольором, що **`faultLine`** (`PenaltyZonesFaultLines3D` у `StageView3D.tsx`); орієнтація ребра: кут навколо **Y** = `atan2(-dz, dx)` у просторі Three (після `Ry` локальна **+X** дає `(cos θ, 0, −sin θ)`). Деталі — [VISIBILITY_AND_SAFETY_RULES.md §4](./VISIBILITY_AND_SAFETY_RULES.md).

## Стан і undo

- **Сцена** — `useStageStore` + `temporal` (zundo): undo/redo для мішеней, реквізиту, **штрафних зон** (`penaltyZoneSet`), розміру поля, покриття 3D, імені, класу зброї; гарячі клавіші та кнопки в `App.tsx` (`Ctrl+Z` / `Ctrl+Shift+Z` / `Ctrl+Y`, у полях вводу не перехоплюються). Чернетка контуру штрафної зони (`penaltyDraftVertices` у `App.tsx`) **не** в temporal: поки є незамкнені вершини, undo/redo спочатку знімає/повертає останню точку чернетки, інакше — знімок сцени.
- **Брифінг** — `useBriefingStore` **без** undo (зміни брифінгу не відкочуються разом із сценою).

## Чернетка сесії (localStorage)

- Ключ **`stage-builder-session-draft-v1`** (`SESSION_DRAFT_STORAGE_KEY` у `sessionDraft.ts`).
- Обгортка зберігання містить **`draftMetaVersion`** (`SESSION_DRAFT_META_VERSION`), час `savedAt`, знімок `stage` (у т.ч. **`penaltyZoneSet`**, **`rangeDistanceSigns`**) + `briefing`.
- Старт: `hydrateSessionDraft()` у `main.tsx` **до** першого рендеру; парсинг через `parseStageProjectJson`. Після відновлення — `temporal.clear()`. Пошкоджений JSON видаляється зі сховища.
- `SessionDraftPersist` — debounce **450 ms** (`DEBOUNCE_MS`).
- Очистити вправу: кнопка кошика у **стовпчику під міні-картою**; `resetSceneToDefaults`, `defaultStageBriefing()`, `temporal.clear`, `clearSessionDraftStorage`.

## 3D

- **`StageView3D.tsx`** — R3F + Drei; імпорт маппінгу площадки X/Y → Three.js через `stageCoordinates3d.ts`.
- **Огляд і режим PDF:** початкова точка огляду (`StageNavigator`) береться з `computeOverviewAnchorWorld2d` (`overviewAnchor.ts`): якщо на сцені є стартові позиції — центр обраної з мінімальним **Y** на плані, при рівності — з максимальним **X**; інакше серед усіх кінців усіх штрафних ліній (`faultLine`) та сама логіка; якщо немає ні старту, ні ліній — центр поля. Відносний зсув камери до точки погляду зберігається як у попередній фіксованій схемі для центру поля.
- **Розмір WebGL:** обгортка з `ResizeObserver` задає піксельні `width`/`height` для `Canvas`; у `App.css` — **absolute inset 0** на `.app__r3f-canvas-outer` (не PDF), **stretch** на `.app__stage-print-frame`, **`min-height`** на картці (коли `100cqw === 0`, `height` міг бути 0px).
- **Земля:** площина поля — `Ground`, `meshStandardMaterial`, `receiveShadow`; колір з **`fieldGroundCover3d`** (`earth` / `grass` / `sand` у `fieldGround3d.ts`), зберігається в **`.stage.json`** і чернетці сесії.
- Знімок для PDF: у **3D** — `capturePngDataUrl` у `StageView3D` (у т. ч. **`rangeDistanceSigns`** — `RangeDistanceSigns3D`); у **2D** — `captureVisiblePngDataUrl` у `StageCanvas` (PNG поточного кадру канвасу: видимий viewport, сітка, закріплені розміри `planDimensions`, таблички дистанції). Виклик з `App.handleExportPdf` після пару `requestAnimationFrame`. Окремого коду в `exportBriefingPdf.ts` для табличок немає — лише вставка готового PNG.

## PDF брифінгу

- **`exportBriefingPdf.ts`** + **`pdfBriefingLogos.ts`** — заголовок PDF: лого зліва (`fpsu.png`, `ipsc.png`; fallback `.svg`); показ кожного лого керується полями брифінгу **`pdfLogoFpsu`** / **`pdfLogoIpsc`** (зберігаються в `*.stage.json`); базова висота ряду лого — **`PDF_BRIEFING_LOGO_ROW_MM`** (~22 мм); для ФПСУ — додаткові коефіцієнти/зсуви для візуального паритету з IPSC і для обрізки широкого UA-банера. Широкий файл UA+LAT (aspect ≥ порога в коді) — ліва половина аркуша + inset і зріз низу підпису; квадратний **`fpsu.png`** у репо йде без цієї гілки. Між лого й QR — **назва матчу** (`matchName`) / заголовок документа; QR; знімок; бренд; таблиця брифінгу з **`TABLE_FONT_SIZE`** (~10 pt), **`TABLE_CELL_PADDING`**, ширшою колонкою значень. **`fpsu.png`** у репозиторії — офіційний кроп з practical-shooting.org.ua (UPSF). **`pdfFonts.ts`** — Roboto.
- **`a4PrintLayout.ts`** — розміри A4 в мм/px, співвідношення для знімка плану в UI (узгоджено з PDF).

### Макет 2D: міні-карта та інструменти

- У `App.tsx` / `App.css` блок **`.app__plan-map-corner-stack`**: зверху **`StageMinimap`**, під ним **`.app__plan-map-actions`** (рамка, копіювання/вставка, активації, розміри, вимір, видалення, кошик). Верстка без циклічних **%** ширини в стовпчику, щоб згортання міні-карти не ламало layout.

## PWA та встановлення

- **`vite.config.ts`** — `vite-plugin-pwa`: **`registerType: 'prompt'`** — новий service worker не активується сам, поки користувач не натисне оновлення в UI (див. нижче). `workbox.globPatterns` включає `ttf` (шрифти для PDF у кеші), `manifest` (іконки з query **`ASSET_QUERY`**).
- **`main.tsx`** — `registerSW` з `onNeedRefresh` → **`notifyPwaUpdateAvailable()`** (`pwaUpdateGate.ts`). Повернута функція зберігається через **`setPwaApplyUpdate`** і викликається з банера при «Оновити».
- **Обмеження частоти повідомлення** — ключ `localStorage` **`stage-builder-pwa-update-prompt-at`**: банер про нову версію показується не частіше ніж раз на **24 години** (`PWA_UPDATE_PROMPT_COOLDOWN_MS`). Час фіксується при відкритті банера; якщо оновлення є, але інтервал не вийшов, подія не шлеться (без спаму). Після закінчення доби наступний `onNeedRefresh` знову може показати банер.
- **`PwaUpdateBanner.tsx`** — рядок під стрічкою staging у `App.tsx`; кнопки «Оновити» / «Пізніше», рядки в `messages.ts` (`pwa.update*`).
- **`usePwaInstall`** — обробка `beforeinstallprompt` для кнопки встановлення в UI (якщо браузер пропонує).
- У `index.html`: `theme-color`, Apple / OG / Twitter meta; плейсхолдер **`__ASSET_Q__`** підставляється плагіном (той самий bust кешу, що й у конфігу).

## Збірка та якість

```bash
npm run dev       # розробка (Vite)
npm run build     # tsc -b && vite build → dist/
npm test          # Vitest (src/**/*.test.ts)
npm run lint      # ESLint
npm run check     # як у CI: lint + test + build + ro-helper:validate + ro-helper:audit-en
npm run icons     # node scripts/generate-icons-from-preview.mjs
npm run icons:st  # ST на SB-only master з git (за замовч. b2b5854:public/icon-preview.png; ICON_BASE_REF=…) + npm run icons
```

### TypeScript і тести

- `tsconfig.app.json` **виключає** `src/**/*.test.ts` з `tsc -b`; фікстури в тестах мають відповідати доменним типам.
- Unit-тести в `src/domain/`: `field.test.ts` (розмір поля, snap, clamp), `safetyAngles.test.ts` (парсинг кутів, клин безпеки), `fieldEntityReclamp.test.ts` (reclamp після зміни поля, міграція `wall`), `computeMinRounds.test.ts`, `targetSummary.test.ts`, `activationBriefing.test.ts` (списки номерів для BL-004), `stageProjectFile.test.ts` (у т. ч. міграції застарілих типів мішеней у JSON), `fieldResizeImpact.test.ts`, `penaltyZones.test.ts`, `overviewAnchor.test.ts`, `planClipboard.test.ts` (центроїд, вставка), `a4PrintLayout.test.ts` (aspect PNG для PDF).
- Unit-тести в `src/presentation/lib/`: `viewTransform.test.ts` (світ ↔ екран, pan до центру).
- **Перевірка як у CI:** `npm run check` → ESLint, Vitest, `tsc -b`, production `vite build`, **`ro-helper:validate`**, **`ro-helper:audit-en --quiet`** (успішний вихід = готово до push у `main` / `staging`).

### Примітки з код-рев’ю (огляд 3D і домен)

- **`overviewAnchor.ts`:** критерій «нижня / права» точка — **мінімальний Y**, при рівності — **максимальний X** у світових координатах плану (узгоджено з напрямком downrange **+Y** у `safetyAngles.ts`). Підпис `overviewAnchorRelevantSignature` має включати **`sizeM.x`** для `faultLine`, щоб зміна довжини лінії перераховувала камеру.
- **`StageView3D` / `StageNavigator`:** зсув камери до target зафіксований константами `OVERVIEW_CAM_DELTA` та `OVERVIEW_CAMERA_Z_FROM_TZ` (еквівалент колишніх `(11,14.5,18)` відносно `(0,0,-3)` для центру поля). Ефект оновлення орбіти залежить від `anchorSig` і розміру поля, щоб не скидати огляд при русі іншого реквізиту.
- **Sticky-панелі плану** (`App.css` / `index.css`): `--app-sticky-controls-height` має відповідати фактичній висоті смуги 2D/3D; на вузьких екранах ліва панель у drawer — окрема гілка CSS, без `sticky` для колонки.

### Конфігурація Vite / прев’ю ассетів

- Константа **`OG_IMAGE_ASSET_QUERY`** у `src/seo/ogConstants.ts` (імпортується в `vite.config.ts` як `ASSET_QUERY`) — після зміни `public/og-image.png`, PWA-іконок або favicon збільште версію в query і задеплойте (кеш Telegram/CDN); той самий рядок використовує **`middleware.ts`** для **`/v/`** / **`/e/`**.

## SEO та індексація

- **`index.html`** — `title`, `meta description` (за замовчуванням **EN** для кращої видачі в Google англомовним користувачам; узгоджено з OG/Twitter), `canonical`, `hreflang` (uk/en/x-default на той самий URL — мова в UI), Open Graph + Twitter Card, `robots` / `googlebot` (index, follow, прев’ю зображень). **`I18nProvider`** після завантаження оновлює `meta description`, `og:description`, `twitter:description`, `og:image:alt` з `messages.ts` (`seo.*`) відповідно до обраної мови (uk/en). Абсолютні `og:image` / `twitter:image` з query-параметром: плейсхолдер **`__ASSET_Q__`** замінюється на значення з **`src/seo/ogConstants.ts`** — після зміни `public/og-image.png` збільште версію в query і задеплойте (Telegram та інші клієнти інакше можуть показувати старе прев’ю). Оновити кеш прев’ю в Telegram можна через бота **[@WebpageBot](https://t.me/WebpageBot)**.
- **`public/robots.txt`** — `Allow: /` і рядок **`Sitemap:`** на абсолютний URL.
- **`public/sitemap.xml`** / **`sitemap_index.xml`** — головна сторінка (SPA без публічних маршрутів). При зміні домену оновити ці файли, `robots.txt`, `index.html` (canonical, og:url, JSON-LD).
- **JSON-LD** (`WebApplication`) у `index.html`.
- **Vercel** — у `vercel.json` заголовок `Content-Type` для `/sitemap.xml`.
- **Search Console** — після зміни домену додати властивість і надіслати sitemap. Google виконує JS; SSR/prerender — окреме покращення.
- **Staging-білд:** якщо `VITE_SITE_ENV=staging`, плагін `htmlTransformPlugin` у `vite.config.ts` підміняє `robots`/`googlebot` на **noindex, nofollow**, змінює `<title>` на варіант з позначкою staging. У **`App.tsx`** при `import.meta.env.VITE_SITE_ENV === 'staging'` показується стрічка **`app__staging-ribbon`** (рядок `tree.app.stagingRibbon` у `messages.ts`).

## Аналітика

- **Vercel Web Analytics** — у коді підключено `<Analytics />` з `@vercel/analytics/react` у `main.tsx`. У [Vercel Dashboard](https://vercel.com) → проєкт → **Analytics** увімкніть Web Analytics для production (дані після трафіку). Preview-деплої зазвичай не потребують окремого налаштування для тестів.

### Google Analytics 4 (покроково)

Компонент `GoogleAnalytics` (`src/presentation/components/GoogleAnalytics.tsx`) підвантажує `gtag.js` **тільки** якщо задано **`VITE_GA_MEASUREMENT_ID`** і зібрано **production**-бандл (`import.meta.env.PROD`). У `npm run dev` GA не викликається.

SPA-роутінг: автоматичний `page_view` вимкнено (`send_page_view: false`) і відправляється вручну на кожну зміну маршруту (`page_view` з `page_location`/`page_title`). Якщо у GA4 увімкнено Enhanced Measurement → **Page changes based on browser history events**, це може дублювати `page_view` (вимкніть цю опцію або залиште автоматичні перегляди).

1. **Створити ресурс GA4** — [Google Analytics](https://analytics.google.com) → Admin → **Create Property**.
2. **Потік Web** — URL сайту (наприклад `https://shooters-tools.com`).
3. **Measurement ID** — формат `G-XXXXXXXXXX`.
4. **Vercel** — [Environment Variables](https://vercel.com/docs/projects/environment-variables): `VITE_GA_MEASUREMENT_ID` = `G-…`, середовище Production (за бажанням Preview).
5. **Redeploy** — змінні `VITE_*` вбудовуються на **збірці**; після додавання змінної потрібен новий deploy.
6. **Перевірка** — GA4 **Realtime** і запити в Network до `google-analytics.com` / `googletagmanager.com`.
7. **Локально** — `.env` з `VITE_GA_MEASUREMENT_ID`, `npm run build` + `npm run preview` (не змішувати тестовий трафік з продом на одному ID).

**Разом із Vercel Analytics** — можна використовувати паралельно.

**Google Search Console** — за бажанням зв’язати з GA4 у Admin → Product links.

**Приватність і cookies** — GA4 використовує cookie; для ЄС/Великої Британії часто потрібні політика, **consent** перед скриптом, налаштування в GA — у коді проєкту не реалізовано.

**Кастомні події** — `window.gtag('event', …)` після ініціалізації; для TypeScript варто типізувати `window.gtag` або обгортку-модуль.

## CI та деплой

### Три рівні: локально → staging → production

| Середовище | Vercel / гілка | URL | Модуль «Події» |
|------------|----------------|-----|----------------|
| **Local** | — | `npm run dev` | Увімкнено за замовчуванням (`vite dev`; вимкнути: `VITE_ENABLE_MATCH_PORTAL=0`) |
| **Staging** | Проєкт **`stage-builder-staging`**, цільовий **Production Branch** = **`staging`** | [stage-builder-staging.vercel.app](https://stage-builder-staging.vercel.app) | **`VITE_ENABLE_MATCH_PORTAL=1`** у Production env |
| **Production** | Проєкт **`stage-builder`**, гілка **`main`** | [shooters-tools.com](https://shooters-tools.com) | Прапорець **не** заданий — маршрути `/:locale/matches/*` не реєструються |

**Staging (стан 2026-05):** окремий Vercel-проєкт, той самий репозиторій `Paliis/stage-builder`, **той самий Supabase**, що й prod. У Production env staging-проєкту: `VITE_SITE_ENV=staging`, `VITE_ENABLE_MATCH_PORTAL=1`, `VITE_SHARE_PUBLIC_ORIGIN=https://stage-builder-staging.vercel.app`, `VITE_SUPABASE_*`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (як на prod). Демо-події — ті самі дані в БД (seed: `npm run supabase:seed:match-all`). Перевірка каталогу: `/{uk|en}/matches`.

**Захист URL:** пароль на деплой (Deployment Protection) поки **не** увімкнено — на команді потрібен план з **Advanced Deployment Protection**; до увімкнення достатньо noindex + непублічного URL. За потреби — [Deployment Protection](https://vercel.com/paliis-projects/stage-builder-staging/settings/deployment-protection) на `stage-builder-staging`.

**Робочий цикл:** розробка в **`main`** (або PR → `main`); після кожного push у **`main`** гілка **`staging`** автоматично **fast-forward** до того ж коміту (workflow `.github/workflows/sync-staging-from-main.yml`) → Vercel **stage-builder-staging** збирає актуальний код. Ручна синхронізація: **`npm run git:sync-staging`**. Перевірка матчів/оплати — на staging URL; prod — після merge у `main` (матчі за прапорцем). Не залишати `staging` позаду `main` — інакше staging-сайт без нових фіч.

**Vercel CLI:** для login/deploy використовуйте **`npx vercel@latest`** (у `package.json` зафіксовано 41.x — старий CLI може дати `Invalid Compact JWS` після device login). Локальна прив’язка: `.vercel/project.json` → зазвичай **`stage-builder`** (prod); staging — окремий проєкт у Dashboard або `vercel link --project stage-builder-staging`.

**Примітка:** статичний `public/robots.txt` один на всі деплої; noindex для staging — через `htmlTransformPlugin` при `VITE_SITE_ENV=staging` (див. SEO вище).

### CI

- **GitHub Actions** — `.github/workflows/ci.yml`: `npm ci --legacy-peer-deps`, `npm run check` на push/PR у **`main`** та **`staging`**. **Sync** — `.github/workflows/sync-staging-from-main.yml`: після push у **`main`** → `staging` = `main` (ff-only).
- **ESLint (react-hooks 7.x):** правило **`react-hooks/set-state-in-effect`** забороняє синхронно викликати оновлення стану з тіла `useEffect`. Для підвантажень даних з ефекту: **`queueMicrotask(() => void load())`** або **`await Promise.resolve()`** на початку асинхронного `load`, щоб перше `setState` не відбувалося в тому ж синхронному кроці, що й сам ефект; скидання UI при зміні маршруту — також через **`queueMicrotask`**. Для **`react-hooks/preserve-manual-memoization`** залежності `useCallback` узгоджуються з тим, що реально використовується (наприклад **`user`** замість лише **`user?.id`**).
- **Vercel** — `vercel.json`: Vite, `dist/`. **Prod:** `stage-builder` ← `main`. **Staging:** `stage-builder-staging` ← `staging` (рекомендований Production Branch; після зміни — redeploy з Git).

### Як задеплоїти production

1. Локально має проходити **`npm run check`**.
2. Push у **`main`** (або merge PR).
3. Дочекатися деплою в Vercel. Окремого `npm run deploy` у репозиторії немає.

## Відомі напрями покращень (рев’ю)

1. **Розмір `App.tsx`** — великий моноліт; винести панелі брифінгу, хедер, onboarding у окремі модулі.
2. **Розмір бандла 3D** — після збірки чанк `StageView3D` + залежності (Three.js, Drei) займає порядку **~0,9 MB** (raw) / **~0,24 MB** (gzip); **уже** підвантажується через `React.lazy` лише у режимі 3D. Подальший спліт (підмодулі всередині сцени) — лише за потреби, через ускладнення. Поріг попередження Vite про чанки >500 KB можна підняти в `vite.config.ts`, якщо шум у логах заважає — це не помилка збірки.
3. **PDF / знімок** — `exportBriefingPdf` і залежності підвантажуються **динамічно** при експорті; `html2canvas` тягнеться транзитивно — прийнятно для рідкої дії.
4. **Code splitting 2D** — `StageCanvas.tsx` великий; винесення підфункцій малювання — рефакторинг на майбутнє, не критично для продуктивності (один sync-чанк для головного UI).
5. **Дублікат генерації id** — узгодити `newId` і `newEntityId` (спільний `domain/id.ts`).
6. **Тести** — розширити покриття: `targetSpecs.ts`, `swingerGeometry.ts`, `safetyAngles.ts`; гілки помилок `parseStageProjectJson`. E2E (Playwright/Cypress) — опційно для критичних сценаріїв.
7. **Клас зброї в UI** — за потреби знову обмежити палітру мішеней у тулбарі відповідно до `weaponClass`.

### PWA precache

- Збірка повідомляє про **precache** Workbox (порядку кількох MB разом із шрифтами) — очікувано для офлайн; при скаргах на «важкий» перший візит можна звузити `globPatterns` у `vite-plugin-pwa` (компроміс із офлайн-кешем).

## Корисні файли для орієнтації

| Тема | Файл |
|------|------|
| Дані: файл, `localStorage`, Supabase | `docs/DATA_AND_STORAGE.md` |
| Продуктові версії V0 / V1 / V2 | `docs/VERSIONING.md` |
| Зворотний зв’язок (ідеї) | `docs/USER_FEEDBACK.md` |
| Моделі мішеней і реквізиту | `src/domain/models.ts` |
| Габарити мішеней, контур 2D/3D, паперові стійки | `src/domain/targetSpecs.ts` |
| Розмір поля, пресети, snap | `src/domain/field.ts`, `src/application/stageStore.ts` |
| Парсинг / збірка JSON | `src/domain/stageProjectFile.ts` |
| Копіювання на плані | `src/domain/planClipboard.ts`, `StageCanvasHandle` у `StageCanvas.tsx` |
| 2D канвас | `src/presentation/components/StageCanvas.tsx` |
| Вимір, рамка, гарячі клавіші (частина) | `src/App.tsx` |
| Режим розстановки | `src/domain/placementMode.ts`, `StageBuilderToolbar.tsx` |
| Порядок реквізиту в UI | `src/domain/infrastructureProps.ts` |
| 3D | `src/presentation/components/StageView3D.tsx` |
| Координати Three.js | `src/presentation/lib/stageCoordinates3d.ts` |
| PDF | `src/presentation/lib/exportBriefingPdf.ts`, `pdfFonts.ts` |
| A4 / пропорції знімка | `src/domain/a4PrintLayout.ts` |
| Кути безпеки на плані | `src/domain/safetyAngles.ts` |
| Рядки UI / PDF таблиці | `src/i18n/messages.ts` |
| Чернетка сесії | `src/application/sessionDraft.ts`, `SessionDraftPersist.tsx` |
| PWA: реєстрація SW, ліміт банера | `src/main.tsx`, `src/application/pwaUpdateGate.ts` |
| PWA: банер оновлення | `src/presentation/components/PwaUpdateBanner.tsx` |
| PWA + HTML transform | `vite.config.ts` |
| Генерація іконок | `scripts/generate-icons-from-preview.mjs`; **ST** на растрі мішені — `scripts/apply-st-to-icon-preview.mjs` (білий внутрішній восьмикутник, чорний ST, база з фіксованого ref щоб не дублювати ST) + `npm run icons` (`npm run icons:st`) |
