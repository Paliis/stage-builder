# Stage Builder

[![CI](https://github.com/Paliis/stage-builder/actions/workflows/ci.yml/badge.svg)](https://github.com/Paliis/stage-builder/actions/workflows/ci.yml)
[![Deploy](https://img.shields.io/badge/live-stage--builder.vercel.app-black?logo=vercel)](https://stage-builder.vercel.app)

**[stage-builder.vercel.app](https://stage-builder.vercel.app)** — безкоштовний онлайн-редактор стрільбищних вправ IPSC.

Розставляйте мішені й реквізит на площадці з метричною сіткою, переглядайте сцену в 3D, готуйте текст брифінгу та експортуйте PDF. Інтерфейс **українською та англійською**, працює офлайн (PWA).

---

## Можливості

- **Площадка** — налаштовуваний розмір (пресети), прив'язка до сітки в метрах; мішені й реквізит додаються **кліками по плану** після вибору типу в панелі.
- **Мішені** — папір IPSC (B2), A4, Mini IPSC (кожен — три **висоти** нижнього краю лиця: біля землі / 50 см / 1 м); метал (квадратні пластини за Appendix C3: 15 / 20 / 30 см), кераміка (Ø110 мм), поппери, ківаки (свінгери); no-shoot.
- **Реквізит** — щити (у т. ч. з портом і дверцятами), двері, штрафні лінії, бочки, стос шин, **стіл і стілець**, стійка для зброї, качель, рухома платформа, тунель Купера, стартова позиція.
- **2D план** — панорама, зум, міні-карта, переміщення, обертання; `[`/`]` для зміни сторони металевої пластини.
- **3D перегляд** — камера «огляд» і «зона стрільця», тіні, знімок для PDF.
- **PDF брифінг** — таблиця полів як у класифікаційних вправах, знімок 3D-сцени, QR-код на додаток.
- **Файл вправи** — збереження / відкриття `*.stage.json` (сцена + брифінг).
- **Чернетка в браузері** — сцена й брифінг автоматично зберігаються в `localStorage` між візитами (окремо від файлу вправи).
- **Очистити вправу** — іконка кошика внизу справа на 2D-карті; після підтвердження скидаються план, брифінг і чернетка (файли `.stage.json` на диску не змінюються).
- **PWA** — сервіс-воркер, офлайн-режим, встановлення на домашній екран.
- **Двомовність** — повний інтерфейс UK / EN.

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

- Push в `main` → production deploy на [stage-builder.vercel.app](https://stage-builder.vercel.app)
- Pull request → preview deploy з унікальним URL
- CI (GitHub Actions) перевіряє lint + тести + build на push/PR у **`main`** і **`staging`**

**Staging (перевірка перед продом):** окремий Vercel-проєкт з **Production Branch** = `staging` і тим самим репозиторієм дає стабільний URL для прев’ю змін до merge в `main`. У змінних цього проєкту задайте **`VITE_SITE_ENV=staging`** — тоді HTML отримає `noindex` і з’явиться попереджувальна стрічка в інтерфейсі. Детально — `docs/TECH.md` → **«CI та деплой»**.

Конфігурація: `vercel.json` (Vite framework, `dist/` output).

**SEO:** `robots.txt`, `sitemap.xml` у `public/` (після деплою — `https://stage-builder.vercel.app/sitemap.xml`). Мета-теги та JSON-LD — у `index.html`. Для індексації в Google варто додати сайт у Search Console і вказати sitemap.

**Аналітика:** [Vercel Web Analytics](https://vercel.com/docs/analytics) у `main.tsx` (`@vercel/analytics/react`) — увімкніть у проєкті на Vercel. **Google Analytics 4:** додайте в Vercel змінну `VITE_GA_MEASUREMENT_ID` = Measurement ID з GA4 (`G-…`), зробіть redeploy; приклад — `.env.example`. Покрокова інструкція (потік Web, перевірка Realtime, Search Console, приватність) — `docs/TECH.md` → «Аналітика» → **Google Analytics 4 (покроково)**.

## Структура

```
src/
├── domain/           # моделі, геометрія, розрахунки, парсинг *.stage.json
├── application/      # Zustand-стори (сцена, брифінг)
├── presentation/     # React-компоненти (план, 3D, тулбар, міні-карта, PDF)
└── i18n/             # повідомлення UK / EN
```

**Текст мішеней для брифінгу/PDF** формується в `summarizeTargets` (`src/domain/targetSummary.ts`): окремо **метал** (сталь), **кераміка** (тарілки та керамічні ківаки), **папір**, no-shoot. Мінімум пострілів — `computeMinRounds` (папір ×2, сталь/кераміка ×1 на одиницю).

## Документація

- **Бізнес- і технічний опис продукту** (аудиторія, цінність, сценарії, стек, архітектура, посилання на деталі): **[docs/PRODUCT.md](docs/PRODUCT.md)**
- **Беклог ідей** (грумінг, пріоритети): **[docs/BACKLOG.md](docs/BACKLOG.md)**
- **Повний опис функціоналу** (можливості для користувачів і логіка редактора): **[docs/FUNCTIONALITY.md](docs/FUNCTIONALITY.md)**
- **Технічна документація для розробників** (архітектура, домен, формат `*.stage.json`, PWA, CI): **[docs/TECH.md](docs/TECH.md)**

## Версійність продукту

Продуктові етапи **V0** (до налаштовуваного поля), **V1** (розмір поля та розширення до уніфікації паперу), **V2** (поточна лінія: уніфікований папір на двох стійках тощо) — у **[docs/VERSIONING.md](docs/VERSIONING.md)**.

## Зворотний зв'язок

- Збір відгуків для розробки (чернетка): [docs/USER_FEEDBACK.md](docs/USER_FEEDBACK.md)
- Email: parshencevdenis@gmail.com
- Telegram: [@denysparshentsev](https://t.me/denysparshentsev)
- Підтримати проєкт: [Monobank](https://send.monobank.ua/jar/2gUdnYvDXy)

## Ліцензія

У `package.json` вказано semver **1.0.0** (npm); продуктові етапи **V0 / V1 / V2** див. [docs/VERSIONING.md](docs/VERSIONING.md). Проєкт `private` (не публікується на npm).

---

*English: **Stage Builder** is a free online IPSC stage designer — 2D metric grid plan, 3D preview, pick a target or prop type then click the plan to place objects, bilingual UI (UK/EN), JSON project files, PDF briefing export with QR code, and a browser draft saved between visits. Product milestones V0/V1/V2 are documented in `docs/VERSIONING.md`. Stack: React 19, TypeScript, Vite, Three.js, Zustand. Deployed on Vercel with GitHub Actions CI.*
