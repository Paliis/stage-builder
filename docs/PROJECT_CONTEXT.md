# Shooters Tools / Stage Builder — повний контекст проєкту

**Призначення цього файлу:** один документ для **онбордингу**, **LLM-контексту**, партнерів і розробників — зведений **бізнес-** і **технічний** знімок стану репозиторію та посилання на детальні джерела. Деталі поведінки редактора — [FUNCTIONALITY.md](./FUNCTIONALITY.md); глибока технічна реалізація — [TECH.md](./TECH.md); продуктовий огляд — [PRODUCT.md](./PRODUCT.md).

**Останнє оновлення документа:** квітень 2026.

---

## 1. Знімок продукту

| Поле | Значення |
|------|----------|
| **Портал (umbrella)** | **Shooters Tools** — домен канону **[https://shooters-tools.com](https://shooters-tools.com)** |
| **Модуль редактора** | **Stage Builder** — безкоштовний веб-редактор вправ у дусі **IPSC** (2D план у метрах, 3D, брифінг, PDF, файл `*.stage.json`, PWA, UK/EN) |
| **URL редактора** | **`/stage-builder`** на тому ж домені |
| **Репозиторій** | GitHub: `Paliis/stage-builder` (приватний npm-пакет не публікується) |
| **Деплой** | **Vercel** з гілки `main`; CI — **GitHub Actions** (`npm run check`) на `main` і `staging` |
| **Legacy-хост** | `stage-builder.vercel.app` → редірект на канон (див. `vercel.json`) |

**Не ціль продукту:** заміна офіційних правил IPSC, рішень RM/арбітражу чи сертифікованого софту змагань — інструмент **допомагає** готувати матеріали та зменшувати непорозуміння.

---

## 2. Бізнес-контекст

### 2.1. Аудиторія та цінність

- **Організатори / RO** — швидка схема майданчика й передача учасникам.
- **Тренери / клуби** — плани та брифінги без настільного CAD.
- **Стрілки** — 3D-огляд, відстані, розташування мішеней.

**Ключова цінність:** швидкість (клік по плану після вибору типу), метрична точність (сітка, лінійки, вимір **M**), реалістичні габарити мішеней (двостійковий папір, висоти лиця тощо), **PDF** зі знімком 3D і QR, **файл JSON** для обміну, **чернетка** в `localStorage`, **PWA** для офлайну після відвідування.

### 2.2. Монетизація та зростання

- Зараз — **безкоштовно** для кінцевого користувача редактора.
- **Портальна стратегія:** навколо Stage Builder — модулі (RO Helper, Hit Factor тощо) з **одного SPA** і деплою; freemium/PRO — у перспективі, без «зрізання» базового сценарію редактора. Детально — [PORTAL_PLAN.md](./PORTAL_PLAN.md).

### 2.3. Обмеження (бізнес-рівень)

- Мінімум пострілів у UI — **орієнтовна** евристика, не регламент змагання.
- Кути безпеки на плані — **візуальна підказка**, не юридична перевірка.
- Синхронізація між пристроями — **файл**, **посилання share**, власні процеси користувача; повноцінного облікового запису «хмара для всіх даних редактора» немає (share — окремий епік BL-001).

### 2.4. Зворотний зв’язок

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
| **Server / SEO** | `src/server/`, `src/seo/`, `src/lib/` | Публікація share, канонічний origin, Supabase client |

Точка входу: `src/main.tsx` → гідратація чернетки, PWA, роутер, аналітика.

### 3.3. Маршрути SPA (`BrowserRouter`)

| Шлях | Призначення |
|------|-------------|
| `/` | Головна порталу (`PortalHome`) |
| `/stage-builder` | Повний редактор (`App`) |
| `/publish-policy` | Політика публікації (текст для модалки share) |
| `/v/:shareId` | Перегляд опублікованої вправи (**стабільний публічний контракт**, QR у PDF) |
| `/e/:shareId` | Редактор за посиланням (**стабільний контракт**) |

Share-роути: `noindex`; OG для ботів — Edge **`middleware.ts`** + дані з Supabase.

### 3.4. Дані

- **Файл вправи:** `*.stage.json`, версія формату **`STAGE_PROJECT_VERSION`** (зараз **3** — штрафні зони, активації) у `stageProjectFile.ts`.
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
| Share / Supabase | [BL-001_SHARE_LINK_PLAN.md](./BL-001_SHARE_LINK_PLAN.md), [SUPABASE_SHARED_STAGES.md](./SUPABASE_SHARED_STAGES.md), [PUBLISH_POLICY.md](./PUBLISH_POLICY.md) |
| Активації | [BL-004_ACTIVATIONS.md](./BL-004_ACTIVATIONS.md) |
| BLE-таймер (дослідження) | [BL-014_SG_TIMER_BLE.md](./BL-014_SG_TIMER_BLE.md) |
| Штрафні зони / видимість (чернетка правил) | [VISIBILITY_AND_SAFETY_RULES.md](./VISIBILITY_AND_SAFETY_RULES.md) |
| Оптимізація бандла | [OPTIMIZATION.md](./OPTIMIZATION.md) |
| Сітка поля / PDF (план) | [PLAN_FIELD_PDF_GRID.md](./PLAN_FIELD_PDF_GRID.md) |

---

## 5. Повний реєстр `docs/` (індекс файлів)

| Файл | Короткий зміст |
|------|----------------|
| **PROJECT_CONTEXT.md** | Цей файл — зведений бізнес + техніка + індекс |
| **PRODUCT.md** | Бізнес + технічний огляд продукту (дублює частину контексту глибше в A/B) |
| **TECH.md** | Головна технічна документація: share, архітектура, домен, PWA, SEO, CI |
| **FUNCTIONALITY.md** | Повний опис функцій для користувача та логіки UI |
| **VERSIONING.md** | Продуктові етапи V0/V1/V2, тексти для користувачів |
| **BACKLOG.md** | Таблиця BL-001…, стратегічний беклог, процес грумінгу |
| **PORTAL_PLAN.md** | Стратегія порталу, бренд, URL, модульність |
| **USER_FEEDBACK.md** | Чернетка збору відгуків |
| **PUBLISH_POLICY.md** | Політика публікації share |
| **BL-001_SHARE_LINK_PLAN.md** | План і статус посилань на вправу |
| **BL-004_ACTIVATIONS.md** | Специфіка активацій на плані |
| **BL-014_SG_TIMER_BLE.md** | SG Timer BLE API, обмеження Web Bluetooth |
| **SUPABASE_SHARED_STAGES.md** | Застосування міграцій, RLS, smoke-тест |
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
| Реалізувати фічу в редакторі | [FUNCTIONALITY.md](./FUNCTIONALITY.md) → [TECH.md](./TECH.md) → код у `src/domain/` |
| Share / Supabase / деплой секретів | [TECH.md](./TECH.md) (розділ BL-001) → [SUPABASE_SHARED_STAGES.md](./SUPABASE_SHARED_STAGES.md) |
| Новий модуль на порталі | [PORTAL_PLAN.md](./PORTAL_PLAN.md) → [TECH.md](./TECH.md) |
| Дизайн / UI-UX (Claude та зовнішні дизайнери) | [DESIGN_SYSTEM_V0.md](./DESIGN_SYSTEM_V0.md), [CLAUDE_DESIGN_UX_PACKAGE.md](./CLAUDE_DESIGN_UX_PACKAGE.md) → [PORTAL_PLAN.md](./PORTAL_PLAN.md), [RO_HELPER_V0.md](./RO_HELPER_V0.md) §7 |
| Контент RO Helper | [RO_HELPER_V0.md](./RO_HELPER_V0.md) + TZ/реєстр |
| Ідея в беклог | [BACKLOG.md](./BACKLOG.md) (наступний вільний BL у таблиці) |

---

*English (one line): This file is the single onboarding snapshot for the Shooters Tools portal and Stage Builder module—business positioning, technical stack, routes, env groups, doc index, and pointers to PRODUCT.md / TECH.md / FUNCTIONALITY.md.*
