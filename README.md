# Stage Builder

[![CI](https://github.com/Paliis/stage-builder/actions/workflows/ci.yml/badge.svg)](https://github.com/Paliis/stage-builder/actions/workflows/ci.yml)
[![Deploy](https://img.shields.io/badge/live-stage--builder.vercel.app-black?logo=vercel)](https://stage-builder.vercel.app)

**[stage-builder.vercel.app](https://stage-builder.vercel.app)** — безкоштовний онлайн-редактор стрільбищних вправ IPSC.

Розставляйте мішені й реквізит на площадці з метричною сіткою, переглядайте сцену в 3D, готуйте текст брифінгу та експортуйте PDF. Інтерфейс **українською та англійською**, працює офлайн (PWA).

---

## Можливості

- **Площадка** — налаштовуваний розмір (пресети), прив'язка до сітки в метрах.
- **Мішені** — папір IPSC (B2), A4; метал (квадратні пластини за Appendix C3: 15 / 20 / 30 см), кераміка (Ø110 мм), поппери, ківаки (свінгери); no-shoot.
- **Реквізит** — щити, двері, штрафні лінії, бочки, стос шин, качель, рухома платформа, тунель Купера, стартова позиція.
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
- CI (GitHub Actions) перевіряє lint + тести + build на кожному push/PR

Конфігурація: `vercel.json` (Vite framework, `dist/` output).

**SEO:** `robots.txt`, `sitemap.xml` у `public/` (після деплою — `https://stage-builder.vercel.app/sitemap.xml`). Мета-теги та JSON-LD — у `index.html`. Для індексації в Google варто додати сайт у Search Console і вказати sitemap.

## Структура

```
src/
├── domain/           # моделі, геометрія, розрахунки, парсинг *.stage.json
├── application/      # Zustand-стори (сцена, брифінг)
├── presentation/     # React-компоненти (план, 3D, тулбар, міні-карта, PDF)
└── i18n/             # повідомлення UK / EN
```

**Текст мішеней для брифінгу/PDF** формується в `summarizeTargets` (`src/domain/targetSummary.ts`): окремо **метал** (сталь), **кераміка** (тарілки та керамічні ківаки), **папір**, no-shoot. Мінімум пострілів — `computeMinRounds` (папір ×2, сталь/кераміка ×1 на одиницю).

## Технічна документація для розробників

Детальніший опис архітектури, домену, формату `*.stage.json`, PWA, CI та напрямів рефакторингу: **[docs/TECH.md](docs/TECH.md)**.

## Зворотний зв'язок

- Email: parshencevdenis@gmail.com
- Telegram: [@denysparshentsev](https://t.me/denysparshentsev)
- Підтримати проєкт: [Monobank](https://send.monobank.ua/jar/2gUdnYvDXy)

## Ліцензія

Версія 1.0.0. Проєкт `private` в `package.json` (не публікується на npm).

---

*English: **Stage Builder** is a free online IPSC stage designer — 2D metric grid plan, 3D preview, targets and props placement, bilingual UI (UK/EN), JSON project files, PDF briefing export with QR code, and a browser draft saved between visits. Stack: React 19, TypeScript, Vite, Three.js, Zustand. Deployed on Vercel with GitHub Actions CI.*
