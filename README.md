# Stage Builder

[![CI](https://github.com/Paliis/stage-builder/actions/workflows/ci.yml/badge.svg)](https://github.com/Paliis/stage-builder/actions/workflows/ci.yml)
[![Deploy](https://img.shields.io/badge/live-shooters--tools.com-black?logo=vercel)](https://shooters-tools.com)

**[shooters-tools.com](https://shooters-tools.com)** — портал Shooters Tools; **Stage Builder** (редактор вправ) — за шляхом [`/stage-builder`](https://shooters-tools.com/stage-builder). Старий хост `stage-builder.vercel.app` редіректить на канонічний домен.

Розставляйте мішені й реквізит на площадці з метричною сіткою, переглядайте сцену в 3D, готуйте текст брифінгу та експортуйте PDF. Інтерфейс **українською та англійською**, працює офлайн (PWA).

---

## Можливості

- **Площадка** — налаштовуваний розмір (пресети), прив'язка до сітки в метрах; мішені й реквізит додаються **кліками по плану** після вибору типу в панелі.
- **Мішені** — папір IPSC (B2), A4, Mini IPSC (кожен — три **висоти** нижнього краю лиця: біля землі / 50 см / 1 м); метал (квадратні пластини за Appendix C3: 15 / 20 / 30 см), кераміка (Ø110 мм), поппери, ківаки (свінгери); no-shoot.
- **Реквізит** — щити (у т. ч. з портом і дверцятами), двері, штрафні лінії, бочки, стос шин, **стіл і стілець**, стійка для зброї, качель, рухома платформа, тунель Купера, стартова позиція.
- **2D план** — панорама, зум, **міні-карта** у правому нижньому куті та **стовпчик інструментів під нею** (рамка, копіювання/вставка, активації, розміри, **оголошені дистанції**, лінійка, видалення виділеного, кошик); переміщення, обертання; `[`/`]` для зміни сторони металевої пластини; **закріплені розміри** (кнопка «Розміри»): клік по мішені всередині контуру — до центру, по реквізиту чи порожньому полю — у точку кліку; зберігаються у файлі впраси.
- **3D перегляд** — камера «огляд», «зона стрільця» та **«як у PDF»**; у **верхньому правому куті** кадру — перемикачі **«Без тіней»** та **«Чорно-біле»** для знімка в PDF; покриття площадки (земля / трава / пісок) зберігається у вправі.
- **PDF брифінг** — таблиця полів як у класифікаційних вправах; опційно **лого ФПСУ та IPSC** і **рядок назви матчу** в шапці; знімок (2D із сіткою, розмірами та **табличками дистанцій** або 3D — з урахуванням перемикачів знімка); **ширший гаризонтальний кадр** для 3D PNG під друк; QR і підпис; після деплою нової версії сайту при відкритій старій вкладці можливе повідомлення про **оновлення сторінки**, якщо браузер не підвантажить модуль експорту PDF.
- **Файл вправи** — збереження / відкриття `*.stage.json` (сцена + брифінг).
- **Поділитися посиланням** — після згоди з політикою публікації (текст у модалці та на сторінці `/publish-policy`) можна отримати URL перегляду або редактора (хмара Supabase; див. `docs/BL-001_SHARE_LINK_PLAN.md`).
- **Чернетка в браузері** — сцена й брифінг автоматично зберігаються в `localStorage` між візитами (окремо від файлу вправи).
- **Очистити вправу** — іконка кошика в **стовпчику інструментів під міні-картою** (правий нижній кут 2D); після підтвердження скидаються план, брифінг і чернетка (файли `.stage.json` на диску не змінюються).
- **PWA** — сервіс-воркер, офлайн-режим, встановлення на домашній екран.
- **Двомовність** — повний інтерфейс UK / EN.
- **Модуль матчів (портал)** — каталог **`/:locale/matches`**, кабінет організатора, реєстрація, експорт **`.psc`**; показ у збірці лише якщо **`VITE_ENABLE_MATCH_PORTAL=1`** (прод може лишатися без маршрутів матчів). Докладно: **[docs/MATCH_PORTAL_PRODUCT_PLAN.md](docs/MATCH_PORTAL_PRODUCT_PLAN.md)**, карта задач **[docs/PLANNING_INDEX.md](docs/PLANNING_INDEX.md)** (розділ **MT**).

Габарити мішеней узгоджені з доменною логікою (`src/domain`): IPSC B2, Appendix C3, Ø110 мм кераміка тощо.

## Технології

| Шар | Стек |
|-----|------|
| UI | React 19, TypeScript |
| Стан | Zustand + zundo (undo/redo) |
| Збірка | Vite 8, vite-plugin-pwa |
| 2D план | Canvas 2D |
| 3D | Three.js, React Three Fiber, Drei |
| PDF | jsPDF, jspdf-autotable, qrcode |
| Тести | Vitest |
| Лінт | ESLint |
| CI/CD | GitHub Actions, Vercel |

## Розробка

```bash
npm install          # залежності
npm run dev          # розробка (http://localhost:5173)
npm run build        # TypeScript + production bundle → dist/
npm run preview      # перегляд збірки
npm test             # unit-тести
npm run lint         # ESLint
npm run check        # lint + тести + build (як у CI)
```

## Деплой

Проєкт автоматично деплоїться на **Vercel** з гілки `main`:

- Push в `main` → production deploy на [shooters-tools.com](https://shooters-tools.com)
- Pull request → preview deploy з унікальним URL
- CI (GitHub Actions) перевіряє lint + тести + build на push/PR у **`main`** і **`staging`**

**Staging (перевірка перед продом, демо «Події»):** окремий Vercel-проєкт **`stage-builder-staging`** → [stage-builder-staging.vercel.app](https://stage-builder-staging.vercel.app) (той самий Supabase, що prod). Env: **`VITE_SITE_ENV=staging`**, **`VITE_ENABLE_MATCH_PORTAL=1`**, Supabase-ключі як на prod; **Production Branch** = `staging`. Prod (`main` → shooters-tools.com) модуль матчів у збірці **вимкнено**. Детально — `docs/TECH.md` → **«CI та деплой»**.

Конфігурація: `vercel.json` (Vite framework, `dist/` output).

**Публікація посилань (share):** у змінних Vercel задайте **`SUPABASE_SERVICE_ROLE_KEY`**, **`SUPABASE_URL`** або **`VITE_SUPABASE_URL`**; опційно **`VITE_SHARE_PUBLIC_ORIGIN`** (явний канонічний хост для URL). Якщо змінну не задано, сервер і бандл використовують системну **`VERCEL_PROJECT_PRODUCTION_URL`** (production-домен проєкту **без** піддомену preview на кшталт `*-account-projects.vercel.app`). Для **OG-прев’ю** в Telegram тощо Edge-**`middleware.ts`** додає **`og:image`** (той самий **`/og-image.png`**, що й головна), **`og:description`**, **`twitter:*`**, і звертається до Supabase через **`VITE_SUPABASE_URL`** та **`VITE_SUPABASE_ANON_KEY`**. Звичайний **`npm run dev`** не виконує serverless і middleware — для перевірки **`POST /api/publish-share`** і прев’ю: **`vercel dev`** (потрібен **`api/publish-share.js`** у репо після **`npm run build`**) або preview/production deploy. Файл **`api/publish-share.js`** зберігається в Git — його оновлюють після змін у **`publishShareApiHandler`**. У **`api/package.json`** задано **`"type": "commonjs"`** (корінь репо — `"module"`), інакше serverless падає на Vercel.

**SEO:** `robots.txt`, `sitemap*.xml` у `public/` (канонічний хост — `https://shooters-tools.com`). Мета-теги та JSON-LD — у `index.html` (плейсхолдер `__SITE_ORIGIN__` підставляє `vite build`). Для індексації в Google варто додати сайт у Search Console і вказати sitemap.

**Аналітика:** [Vercel Web Analytics](https://vercel.com/docs/analytics) у `main.tsx` (`@vercel/analytics/react`) — увімкніть у проєкті на Vercel. **Google Analytics 4:** додайте в Vercel змінну `VITE_GA_MEASUREMENT_ID` = Measurement ID з GA4 (`G-…`), зробіть redeploy; приклад — `.env.example`. Покрокова інструкція (потік Web, перевірка Realtime, Search Console, приватність) — `docs/TECH.md` → «Аналітика» → **Google Analytics 4 (покроково)**.

## Структура

```
src/
├── domain/           # моделі, геометрія, розрахунки, парсинг *.stage.json
├── application/      # Zustand-стори (сцена, брифінг)
├── presentation/     # React-компоненти (план, 3D, тулбар, міні-карта, PDF)
├── portal/           # портал Shooters Tools: shell, матчі, RO Helper, Hit Factor, акаунт
├── server/           # serverless-хендлери (share, PSC export) — збірка в api/*.js
└── i18n/             # повідомлення UK / EN
```

**Текст мішеней для брифінгу/PDF** формується в `summarizeTargets` (`src/domain/targetSummary.ts`): окремо **метал** (сталь), **кераміка** (тарілки та керамічні ківаки), **папір**, no-shoot. Мінімум пострілів — `computeMinRounds` (папір ×2, сталь/кераміка ×1 на одиницю). Кнопка підстановки з сцени в брифінгу оновлює також **макс. очки** як рекомендовані постріли × **5** (`BRIEFING_SCENE_SYNC_POINTS_PER_SCORING_HIT` у `stageBriefing.ts`).

## Документація

- **Повний контекст проєкту** (бізнес + техніка, маршрути, env, індекс усіх файлів у `docs/`): **[docs/PROJECT_CONTEXT.md](docs/PROJECT_CONTEXT.md)**
- **Дані** (`*.stage.json`, ключі `localStorage`, Supabase після скидання БД): **[docs/DATA_AND_STORAGE.md](docs/DATA_AND_STORAGE.md)**
- **Бізнес- і технічний опис продукту** (аудиторія, цінність, сценарії, стек, архітектура, посилання на деталі): **[docs/PRODUCT.md](docs/PRODUCT.md)**
- **Беклог ідей** (грумінг, пріоритети): **[docs/BACKLOG.md](docs/BACKLOG.md)**; **карта планування по розділах** (Матчі, Портал, Редактор…): **[docs/PLANNING_INDEX.md](docs/PLANNING_INDEX.md)**
- **Видимість / безпека 2D** (чернетка правил для BL-010 / BL-013): **[docs/VISIBILITY_AND_SAFETY_RULES.md](docs/VISIBILITY_AND_SAFETY_RULES.md)**
- **Повний опис функціоналу** (можливості для користувачів і логіка редактора): **[docs/FUNCTIONALITY.md](docs/FUNCTIONALITY.md)**
- **Зведений план модуля «Матчі»** (каталог, PSC, організатори): **[docs/MATCH_PORTAL_PRODUCT_PLAN.md](docs/MATCH_PORTAL_PRODUCT_PLAN.md)**, беклог **MA‑*** — **[docs/BACKLOG_MATCHES.md](docs/BACKLOG_MATCHES.md)**
- **Технічна документація для розробників** (архітектура, домен, формат `*.stage.json`, PWA, CI): **[docs/TECH.md](docs/TECH.md)**

## Версійність продукту

Продуктові етапи **V0** (до налаштовуваного поля), **V1** (розмір поля та розширення до уніфікації паперу), **V2** (поточна лінія: уніфікований папір на двох стійках тощо) — у **[docs/VERSIONING.md](docs/VERSIONING.md)**.

## Зворотний зв'язок

- Збір відгуків для розробки (чернетка): [docs/USER_FEEDBACK.md](docs/USER_FEEDBACK.md)
- Telegram: [@denysparshentsev](https://t.me/denysparshentsev)
- Підтримати проєкт: [Monobank](https://send.monobank.ua/jar/2gUdnYvDXy)

## Ліцензія

У `package.json` вказано semver **1.0.0** (npm); продуктові етапи **V0 / V1 / V2** див. [docs/VERSIONING.md](docs/VERSIONING.md). Проєкт `private` (не публікується на npm).

---

*English: **Stage Builder** is a free online IPSC stage designer — 2D metric grid plan with a minimap and a vertical tool stack underneath, 3D preview (including PDF-matched framing, optional flat lighting and grayscale for the PDF snapshot), bilingual UI (UK/EN), JSON project files, classified-style PDF briefings with optional FPSU/IPSC logos and a match-name line, QR, and a browser draft saved between visits. If PDF export fails after a deploy with an old tab open, the UI suggests refreshing. Product milestones V0/V1/V2 are documented in `docs/VERSIONING.md`. Stack: React 19, TypeScript, Vite, Three.js, Zustand. Deployed on Vercel with GitHub Actions CI.*
