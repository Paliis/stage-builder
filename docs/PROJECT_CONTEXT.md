# Shooters Tools — повний контекст проєкту (портал + Stage Builder)

**Єдина карта планів і беклогів по розділах продукту** (наприклад «Матчі — фаза B — MA-B01» або «Портал — BL‑…»): **[PLANNING_INDEX.md](./PLANNING_INDEX.md)**.

**Призначення цього файлу:** один документ для **онбордингу**, **LLM-контексту**, партнерів і розробників — зведений **бізнес-** і **технічний** знімок стану репозиторію та посилання на детальні джерела. **Структура бізнес-опису в [PRODUCT.md](./PRODUCT.md)** вже відштовхується від порталу **Shooters Tools** і лише потім занурюється в редактор; цей файл дублює знімок на рівні маршрутів і env.

Детально поведінка **Stage Builder** — [FUNCTIONALITY.md](./FUNCTIONALITY.md); інженерія — [TECH.md](./TECH.md).

**Останнє оновлення документа:** травень 2026 (узгоджено з перебудовою **[PRODUCT.md](./PRODUCT.md)** — портальний контур і додані сценарії винесені в основу огляду).

---

## 1. Знімок продукту

| Поле | Значення |
|------|----------|
| **Що за продукт** | **Shooters Tools** — один сайт (**SPA** на **Vercel**): портальна оболонка **`/:locale`** + модулі (див. [PRODUCT.md §A.1](./PRODUCT.md#a1-позиціонування-порталу)) |
| **Ключові модулі** | **Stage Builder** (`/stage-builder`), **Матчі** (за env), **RO Helper**, **Hit Factor**, **акаунт**, share **`/v/*`**, **`/e/*`** — зведено в таблиці **PRODUCT §A.1** |
| **Модуль редактора** | **Stage Builder** — 2D/3D план вправ, брифінг, PDF, `*.stage.json`, PWA (повна поведінка — FUNCTIONALITY) |
| **URL редактора** | **`/stage-builder`** (поза `PortalShell` у тій самій збірці) |
| **Репозиторій** | GitHub: `Paliis/stage-builder` (приватний npm-пакет не публікується) |
| **Деплой** | **Vercel** з гілки `main`; CI — **GitHub Actions** (`npm run check`) на `main` і `staging` |
| **Модуль «Матчі» (опційно на проді)** | Каталог, реєстрація, кабінет організатора, **`.psc`** — увімкнення збіркою **`VITE_ENABLE_MATCH_PORTAL`**. Бізнес-опис — **§2.5**; техніка — **§3.2–3.3** |

**Не ціль продукту:** заміна офіційних правил IPSC, рішень RM/арбітражу чи сертифікованого софту змагань — інструмент **допомагає** готувати матеріали та зменшувати непорозуміння.

---

## 2. Бізнес-контекст

Репозиторій вирішує **різні класи задач**: не лише «намалюй вправу», а й підготовку до матчів, роботу з учасниками та довідкові утиліти — див. об’єднану таблицю **[PRODUCT §A.4](./PRODUCT.md#a4-проблема--рішення-не-лише-план-вправ)**.

### 2.1. Аудиторія та цінність (портал + редактор)

**Без переходу в Stage Builder:**

- стрілець — **матч-каталог**, **заявка**, **акаунт**; на змаганні — **Hit Factor**, **RO Helper**;
- організатор / клуб — оголошення, **борд реєстрації**, **PSC** через модуль матчів; модерація ролей;
- платформа — політики публікації (**share**) та узгодження rollout (прапорці збірки).

**У редакторі й share:**

- **організація майданчика** — точні схеми, PDF, зв’язок з реальним IPSC-дизайном вправ.

**Не ціль:** заміна регламенту змагань чи офіційного софту — див. [PRODUCT §A.1](./PRODUCT.md#a1-позиціонування-порталу) та **PRODUCT §A.9**.

### 2.2. Де зараз акцент робіт у репозиторії

Цінність **не зводиться лише до білдеру**. Планування й беклог ведуться **по розділах** ([PLANNING_INDEX.md](./PLANNING_INDEX.md)): типово поруч активні **матчі** (**MT**, **BL-025…**), **портал** (**PT**, **BACKLOG**, **USER_FEEDBACK**), **share** (**SH**, **BL-001**) і **редактор** (**SB**, геометрія тощо в **BACKLOG.md**).

### 2.3. Монетизація та зростання

- Зараз — **безкоштовно** для типового користувача сайту в обраній моделі.
- **Портальна стратегія:** модулі з **одного деплою**; freemium/PRO — у перспективі ([PORTAL_PLAN.md](./PORTAL_PLAN.md)); базовий сценарій **Stage Builder** не «різається» задля монетизації порталу.

### 2.4. Портал Shooters Tools (загально)

Один SPA, **`PortalShell`**, локаль **`/uk`** / **`/en`**. Деталізація модулів — **[PRODUCT §A.1](./PRODUCT.md#a1-позиціонування-порталу)** та **[PORTAL_PLAN.md](./PORTAL_PLAN.md)**.

### 2.5. Модуль «Матчі»

Узагальнено — **[PRODUCT §A.6](./PRODUCT.md#a6-модуль-матчі-докладніше)** та **[MATCH_PORTAL_PRODUCT_PLAN.md](./MATCH_PORTAL_PRODUCT_PLAN.md)**. **На проді** маршрути матчів — лише при **`VITE_ENABLE_MATCH_PORTAL=1`** ([MATCH_REGISTRATION_AND_PSC_PLAN.md §1.4](./MATCH_REGISTRATION_AND_PSC_PLAN.md)).

### 2.6. Обмеження (бізнес-рівень)

- Мінімум пострілів у UI — **орієнтовна** евристика, не регламент змагання.
- Кути безпеки на плані — **візуальна підказка**, не юридична перевірка.
- Синхронізація між пристроями — **файл**, **посилання share**, власні процеси користувача; повноцінного облікового запису «хмара для всіх даних редактора» немає (share — окремий епік BL-001).
- **Акаунт порталу** (Supabase) потрібен для **реєстрації на матчі** та налаштувань стрільця (**§2.5**); він **не** є хмарним сховищем усіх проєктів **Stage Builder** (див. **PRODUCT §A.9**).

### 2.7. Зворотний зв’язок

- [USER_FEEDBACK.md](./USER_FEEDBACK.md), [README.md](../README.md) (email, Telegram, підтримка).

---

## 3. Технічний контекст

### 3.1. Стек

| Шар | Технології |
|-----|------------|
| UI | React 19, TypeScript |
| Стан | Zustand; undo/redo (`zundo`) — **лише сцена** |
| Збірка | Vite 8, `vite-plugin-pwa` |
| 2D | Canvas 2D |
| 3D | Three.js, React Three Fiber, Drei (lazy) |
| PDF | jsPDF, jspdf-autotable, qrcode; Roboto для кирилиці |
| Якість | ESLint, Vitest; `npm run check` = lint + тести + production build |
| Хмара (share) | Supabase (Postgres, RLS, RPC); Vercel Serverless + Edge middleware |

### 3.2. Архітектура каталогів (`src/`)

| Шар | Шлях | Роль |
|-----|------|------|
| **Domain** | `src/domain/` | Моделі, геометрія, габарити IPSC, парсинг/збірка `*.stage.json`, штрафні зони, активації (BL-004), кути безпеки, PDF layout, clipboard |
| **Application** | `src/application/` | `stageStore`, `briefingStore`, чернетка сесії, PWA gate |
| **Presentation** | `src/presentation/` | `StageCanvas`, `StageView3D`, тулбар, міні-карта, PDF, банери |
| **i18n** | `src/i18n/` | UK/EN у `messages.ts` |
| **Портал** | `src/portal/` | `PortalShell`, головна, **`src/portal/matches/*`** (реєстрація, PSC ZIP через **`POST /api/match-export-psc`**), акаунт, адмінка організаторів; стилі кнопок — [MATCHES_PORTAL_BUTTONS.md](./MATCHES_PORTAL_BUTTONS.md) |
| **RO Helper** | `src/ro-helper/` | Markdown, glob контенту, ФПСУ; **Quick Cite**; клієнтський **Helmet** (title/description); lazy-чанк з `src/portal/roHelperLazyRoutes.ts` |
| **Server / SEO** | `src/server/`, `src/seo/`, `src/lib/` | Публікація share, канонічний origin, Supabase client |

Точка входу: `src/main.tsx` → гідратація чернетки, PWA, роутер, аналітика.

### 3.3. Маршрути SPA (`BrowserRouter`)

| Шлях | Призначення |
|------|-------------|
| **`/`** | Редірект на **`/${locale}`** (пріоритет сегмента URL, інакше `storage` / браузер) |
| **`/:locale`**, **`/:locale/hit-factor`**, **`/:locale/publish-policy`**, **`/:locale/tools/ro-helper/...`** | Портал: **`PortalShell`** (шапка, мова, футер, SEO `canonical` / `hreflang`) |
| **`/:locale`** | Головна порталу (`PortalHome`) |
| **`/:locale/hit-factor`** | Hit Factor calculator |
| **`/:locale/publish-policy`** | Політика публікації |
| **`/:locale/tools/ro-helper`** | RO Helper — вибір дисципліни |
| **`/:locale/tools/ro-helper/:discipline`** | Сторінка дисципліни |
| **`/:locale/tools/ro-helper/:discipline/:category`** | Список статей |
| **`/:locale/tools/ro-helper/:discipline/:category/:slug`** | Стаття |
| **`/:locale/matches`** | Матчі: публічний список майбутніх опублікованих подій — пошук, дати, календар (на вузьких екранах — бічна панель з крайньою вкладкою, як панель інструментів у Stage Builder) (**якщо** `VITE_ENABLE_MATCH_PORTAL`) |
| **`/:locale/matches/my`**, **`/:locale/matches/:matchId`**, **`/:locale/admin/organizers`** | Матчі: кабінет організатора, редактор і ростер, адмінка (**той самий прапорець**); керування показує UI лише за **`organizer_status` = active** для інших статусів — пояснювальний екран без кнопки «створити матч» |
| **`/hit-factor`**, **`/publish-policy`**, **`/ro-helper`**, **`/ro-helper/*`**, **`/tools/ro-helper`**, **`/tools/ro-helper/*`** | Legacy → відповідний шлях під **`/:locale`** (`legacyPortalRedirects.tsx`) |
| `/stage-builder` | Повний редактор (`App`) — **поза** `PortalShell` |
| `/v/:shareId` | Перегляд опублікованої вправи (**стабільний публічний контракт**, QR у PDF) |
| `/e/:shareId` | Редактор за посиланням (**стабільний контракт**) |

Share-роути: `noindex`; OG для ботів — Edge **`middleware.ts`** + дані з Supabase.

### 3.4. Дані

- Зведена таблиця ключів і сценарій після скидання БД — **[DATA_AND_STORAGE.md](./DATA_AND_STORAGE.md)**.
- **Файл вправи:** `*.stage.json`, версія формату **`STAGE_PROJECT_VERSION`** (зараз **6** у `stageProjectFile.ts`).
- **Чернетка:** ключ `stage-builder-session-draft-v1` у `localStorage`, debounce ~450 ms.
- **Брифінг:** окремий стор **без** undo (undo лише для сцени).

### 3.5. Змінні середовища (коротко)

Повний приклад — [`.env.example`](../.env.example). Важливі групи:

| Група | Змінні (приклад) | Призначення |
|-------|------------------|-------------|
| Supabase (клієнт) | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Завантаження share, клієнт |
| Supabase (сервер) | `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL` або `VITE_SUPABASE_URL` | `POST /api/publish-share` |
| Канон URL | `VITE_SHARE_PUBLIC_ORIGIN`, `VITE_PUBLIC_SITE_ORIGIN` | Посилання в API, QR, OG; fallback — `VERCEL_PROJECT_PRODUCTION_URL` + нормалізація legacy |
| Staging | `VITE_SITE_ENV=staging` | noindex, стрічка в UI (лише staging-проєкт) |
| Аналітика | `VITE_GA_MEASUREMENT_ID` | GA4 (опційно); Vercel Analytics окремо в коді |

Після змін handler публікації: **`npm run build`** і commit згенерованого **`api/publish-share.js`** (CommonJS).

### 3.6. Іконки та бренд на PWA

- Мастер: `public/icon-preview.png` (1024×1024).
- Накладення монограми **ST** на **SB-only** растр із фіксованого git-ref (за замовчуванням `b2b5854`), щоб повторні запуски не дублювали шар: **`npm run icons:st`**; env **`ICON_BASE_REF`** для перевизначення бази. Деталі — [TECH.md](./TECH.md) → «Генерація іконок».

### 3.7. Версійність і беклог

- **V0 / V1 / V2** у [VERSIONING.md](./VERSIONING.md) — **продуктові** етапи, **не** semver npm і **не** версія JSON-файлу.
- **BL-NNN** — скрізна нумерація ідей у [BACKLOG.md](./BACKLOG.md); окремі спеки — файли `BL-*_*.md`.

---

## 4. Модулі та супутні продукти (документація)

| Модуль / тема | Документ |
|---------------|----------|
| Портал, URL, roadmap, freemium | [PORTAL_PLAN.md](./PORTAL_PLAN.md) |
| RO Helper (контент v0, UK+EN, IPSC/ФПСУ) | [RO_HELPER_V0.md](./RO_HELPER_V0.md), [RO_HELPER_CONTENT_TZ.md](./RO_HELPER_CONTENT_TZ.md), глосарій, topic map, реєстр карток, матриця |
| Share / Supabase | [BL-001_SHARE_LINK_PLAN.md](./BL-001_SHARE_LINK_PLAN.md), [SUPABASE_SHARED_STAGES.md](./SUPABASE_SHARED_STAGES.md), [SUPABASE_MATCH_ADMIN.md](./SUPABASE_MATCH_ADMIN.md), [PUBLISH_POLICY.md](./PUBLISH_POLICY.md), [DATA_AND_STORAGE.md](./DATA_AND_STORAGE.md) |
| Активації | [BL-004_ACTIVATIONS.md](./BL-004_ACTIVATIONS.md) |
| BLE-таймер (дослідження) | [BL-014_SG_TIMER_BLE.md](./BL-014_SG_TIMER_BLE.md) |
| Штрафні зони / видимість (чернетка правил) | [VISIBILITY_AND_SAFETY_RULES.md](./VISIBILITY_AND_SAFETY_RULES.md) |
| Матчі, реєстрація, експорт PSC | [BACKLOG_MATCHES.md](./BACKLOG_MATCHES.md), [MATCH_PORTAL_PRODUCT_PLAN.md](./MATCH_PORTAL_PRODUCT_PLAN.md), [MATCH_REGISTRATION_AND_PSC_PLAN.md](./MATCH_REGISTRATION_AND_PSC_PLAN.md), [MATCH_EXPORT_PSC_STAGE_FIELDS.md](./MATCH_EXPORT_PSC_STAGE_FIELDS.md), [MATCH_ADMIN_ARCHITECTURE.md](./MATCH_ADMIN_ARCHITECTURE.md), [MATCHES_PORTAL_BUTTONS.md](./MATCHES_PORTAL_BUTTONS.md), [SUPABASE_ORGANIZER_APPLICATION_ALERTS.md](./SUPABASE_ORGANIZER_APPLICATION_ALERTS.md) |
| Сітка поля / PDF (план) | [PLAN_FIELD_PDF_GRID.md](./PLAN_FIELD_PDF_GRID.md) |

---

## 5. Повний реєстр `docs/` (індекс файлів)

| Файл | Короткий зміст |
|------|----------------|
| **PLANNING_INDEX.md** | Карта розділів продукту, беклоги (**BL** / **MA-***), шаблони фраз для чатів |
| **PROJECT_CONTEXT.md** | Цей файл — зведений бізнес + техніка + індекс |
| **PRODUCT.md** | Продукт **Shooters Tools** (портал першим рядком); редактор + техніка в **§B** |
| **TECH.md** | Головна технічна документація: share, архітектура, домен, PWA, SEO, CI |
| **FUNCTIONALITY.md** | Повний опис функцій для користувача та логіки UI |
| **VERSIONING.md** | Продуктові етапи V0/V1/V2, тексти для користувачів |
| **BACKLOG.md** | Таблиця BL-001…, стратегічний беклог, процес грумінгу |
| **BACKLOG_MATCHES.md** | Модуль «Матчі»: беклог **`MA-<фаза><NN>`** (фази A–F + R), зв’язок із **BL-025**… |
| **MATCH_PORTAL_PRODUCT_PLAN.md** | Модуль матчів: пронумерований план, беклог BL-033+ |
| **MATCH_REGISTRATION_AND_PSC_PLAN.md** | Матчі, реєстрація, експорт у PractiScore (`.psc`); покроково **§8.6** (MA-C03 / MA-D01 / MA-D02) |
| **MATCH_EXPORT_PSC_STAGE_FIELDS.md** | Поля `match_stages[]`: що береться з share / що з шаблону PSC |
| **MATCH_ADMIN_ARCHITECTURE.md** | Архітектура модуля матчів; прогалини (техніка, ліцензії, операторські реєстрації, продукти); UX-орієнтир [practicarms.ua](https://practicarms.ua/) (§8) |
| **USER_FEEDBACK.md** | Чернетка збору відгуків |
| **PUBLISH_POLICY.md** | Політика публікації share |
| **BL-001_SHARE_LINK_PLAN.md** | План і статус посилань на вправу |
| **BL-004_ACTIVATIONS.md** | Специфіка активацій на плані |
| **BL-014_SG_TIMER_BLE.md** | SG Timer BLE API, обмеження Web Bluetooth |
| **SUPABASE_SHARED_STAGES.md** | Застосування міграцій, RLS, smoke-тест |
| **SUPABASE_MATCH_ADMIN.md** | Таблиці матчів, скводів, заявок, зв’язок зі share; RLS |
| **VISIBILITY_AND_SAFETY_RULES.md** | Правила видимості, штрафні зони (§4), майбутні BL-010/013 |
| **OPTIMIZATION.md** | Оптимізація розміру бандла |
| **PLAN_FIELD_PDF_GRID.md** | План змін сітки / PDF |
| **RO_HELPER_V0.md** | Повна специфікація модуля RO Helper v0 |
| **RO_HELPER_CONTENT_TZ.md** | ТЗ на контент (термінологія, стиль) |
| **RO_HELPER_IPSC_FPSU_GLOSSARY.md** | Глосарій IPSC / ФПСУ |
| **RO_HELPER_IPSC_FPSU_TOPIC_MAP.md** | Карта тем |
| **RO_HELPER_CARD_REGISTRY.md** | Реєстр карток |
| **RO_HELPER_CARD_MATRIX.md** | Матриця карток (Markdown) |
| **RO_HELPER_CARD_MATRIX.csv** | Та сама матриця (CSV) |
| **DATA_AND_STORAGE.md** | Джерела даних поза Git: `*.stage.json`, ключі `localStorage`, Supabase після скидання БД |
| **CLAUDE_DESIGN_UX_PACKAGE.md** | Промпт і список документів для Claude (дизайн / UI-UX порталу) |
| **DESIGN_SYSTEM_V0.md** | Дизайн-система v0.1 (токени, патерни, IA, a11y) — імплементація поетапно |

---

## 6. Корисні команди

```bash
npm install
npm run dev          # Vite, http://localhost:5173
npm run build        # tsc + vite + bundle api
npm run check        # lint + test + build (як CI)
npm run icons:st     # ST на іконці + похідні PNG/favicon/og
```

Локальна перевірка share API / middleware — **`vercel dev`** після `npm run build` (див. README / TECH).

---

## 7. Що читати залежно від задачі

| Задача | Документи |
|--------|-----------|
| Зрозуміти «що за продукт» за 5 хв | Цей файл → [PRODUCT.md](./PRODUCT.md) |
| Що зберігається локально / у хмарі (перед скиданням БД) | [DATA_AND_STORAGE.md](./DATA_AND_STORAGE.md) |
| Реалізувати фічу в редакторі | [FUNCTIONALITY.md](./FUNCTIONALITY.md) → [TECH.md](./TECH.md) → код у `src/domain/` |
| Share / Supabase / деплой секретів | [TECH.md](./TECH.md) (розділ BL-001) → [SUPABASE_SHARED_STAGES.md](./SUPABASE_SHARED_STAGES.md) |
| Новий модуль на порталі | [PORTAL_PLAN.md](./PORTAL_PLAN.md) → [TECH.md](./TECH.md) |
| Новий модуль матчів / PSC | [PLANNING_INDEX.md](./PLANNING_INDEX.md) → **Матчі**, [BACKLOG_MATCHES.md](./BACKLOG_MATCHES.md), [MATCH_PORTAL_PRODUCT_PLAN.md](./MATCH_PORTAL_PRODUCT_PLAN.md), [MATCH_REGISTRATION_AND_PSC_PLAN.md](./MATCH_REGISTRATION_AND_PSC_PLAN.md), [MATCH_ADMIN_ARCHITECTURE.md](./MATCH_ADMIN_ARCHITECTURE.md) → [TECH.md](./TECH.md) Supabase |
| Дизайн / UI-UX (Claude та зовнішні дизайнери) | [DESIGN_SYSTEM_V0.md](./DESIGN_SYSTEM_V0.md), [CLAUDE_DESIGN_UX_PACKAGE.md](./CLAUDE_DESIGN_UX_PACKAGE.md) → [PORTAL_PLAN.md](./PORTAL_PLAN.md), [RO_HELPER_V0.md](./RO_HELPER_V0.md) §7 |
| Контент RO Helper | [RO_HELPER_V0.md](./RO_HELPER_V0.md) + TZ/реєстр |
| Ідея в беклог | [BACKLOG.md](./BACKLOG.md) (наступний вільний BL у таблиці) |

---

*English (one line): Single onboarding snapshot for **Shooters Tools** (portal, matches, helpers, auth) plus **Stage Builder**—routes, env, technical stack pointers, doc index → PRODUCT.md (portal-first narrative) / TECH.md / FUNCTIONALITY.md.*
