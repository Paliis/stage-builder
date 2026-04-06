# Stage Builder — технічна документація

Документ для розробників: архітектура, домен, формати даних, збірка та відомі обмеження.

## Архітектура

Проєкт дотримується шаруватої структури:

| Шар | Каталог | Відповідальність |
|-----|---------|------------------|
| **Domain** | `src/domain/` | Типи (`models.ts`), геометрія мішеней/реквізиту, розрахунки (мін. постріли, підсумок мішеней), парсинг/збірка `*.stage.json`, константи IPSC-подібних габаритів |
| **Application** | `src/application/` | Zustand-стори: сцена (`stageStore`, undo/redo через `zundo`), брифінг (`briefingStore`) |
| **Presentation** | `src/presentation/` | React: `App.tsx`, Canvas 2D, Three.js 3D, тулбар, міні-карта, експорт PDF, хуки |
| **i18n** | `src/i18n/` | Дерева рядків UK/EN, провайдер, `localStorage` для мови |

Корінь UI — `src/main.tsx` → `App.tsx`. **Code splitting:** модуль `StageView3D` (Three.js, R3F) підвантажується через `React.lazy` лише в режимі «3D»; `exportBriefingPdf` (jsPDF, qrcode, autotable) — через динамічний `import()` при експорті PDF. Це зменшує початковий JS для користувачів, які лишаються в 2D.

## Домен: мішені та підрахунки

- **Типи мішеней** — `TargetType` у `models.ts` (папір IPSC/A4, метал: пластина/поппери, кераміка, ківаки папір/кераміка).
- **`isPaperTargetType` / `isCeramicTargetType`** (`targetSpecs.ts`) — класифікація для геометрії та тексту. Кераміка окремо від сталі для тексту брифінгу.
- **`computeMinRounds`** (`computeMinRounds.ts`) — евристика мінімуму пострілів: папір ×2, сталь/кераміка ×1 на «одиницю»; подвійний ківак рахується як дві мішені.
- **`summarizeTargets`** (`targetSummary.ts`) — рядок для поля «Мішені» у брифінгу/PDF: метал, **кераміка**, папір, no-shoot (UK/EN).
- **`countStageTargetUnits`** — кількість «одиниць» на плані (подвійний ківак = 2).

## Файл вправи (`*.stage.json`)

- Формат описаний у `stageProjectFile.ts`: константи `STAGE_PROJECT_FORMAT`, `STAGE_PROJECT_VERSION`, розширення `.stage.json`.
- Містить знімок сцени (ім’я, клас зброї, розмір поля, `targets`, `props`) та об’єкт брифінгу.
- При завантаженні застосовуються міграції реквізиту (`migrateProp` у `stageStore.ts`, узгоджено з парсером).

## Стан і undo

- **Сцена** — `useStageStore` з `temporal` (zundo): undo/redo для мішеней, реквізиту, поля.
- **Брифінг** — окремий `useBriefingStore` без undo (зміни брифінгу не відкочуються разом із сценою).

## Чернетка сесії (localStorage)

- Ключ `stage-builder-session-draft-v1` (`SESSION_DRAFT_STORAGE_KEY` у `src/application/sessionDraft.ts`).
- Під час старту `main.tsx` викликає `hydrateSessionDraft()` **до** першого рендеру: обгортка проганяється через `parseStageProjectJson`, той самий контракт що й `*.stage.json`.
- Після відновлення історія undo очищається (`temporal.clear()`). Пошкоджений чернетковий JSON видаляється зі сховища.
- `SessionDraftPersist` у `App.tsx` підписується на обидва стори й зберігає з debounce ~450 ms.
- Очистити вправу: кнопка-іконка кошика у нижньому правому куті 2D-карти (`App.tsx` + `.app__plan-clear-btn`); `window.confirm` з текстом `project.clearConfirm`, далі `resetSceneToDefaults`, `defaultStageBriefing()`, `temporal.clear`, `clearSessionDraftStorage`.

## PWA

- Конфігурація у `vite.config.ts` (`vite-plugin-pwa`): `manifest` (`name`, `short_name`, іконки), `workbox` для прекешу.
- `short_name` використовується як підпис під іконкою на частині платформ; має збігатися з бажаною короткою назвою для домашнього екрана.
- У `index.html`: `theme-color`, `apple-mobile-web-app-title`, OG/Twitter meta.

## Збірка та якість

```bash
npm run dev       # розробка
npm run build     # tsc (app) + vite build → dist/
npm test          # Vitest; файли *.test.ts виключені з tsconfig.app (див. нижче)
npm run lint
npm run check     # як у CI: lint + test + build
```

### TypeScript і тести

- `tsconfig.app.json` **виключає** `src/**/*.test.ts` з перевірки `tsc -b`, тому тестові фікстури повинні вручну відповідати типам домену (`Target.position`, `rotationRad`, тощо).
- Рекомендація: періодично проганяти `tsc` з включеними тестами або тримати фікстури строго типізованими.

## SEO та індексація

- **`index.html`** — `title`, `meta description` (UK), `canonical`, `hreflang` (uk/en/x-default на той самий URL — мова в UI), Open Graph + Twitter Card, `robots` / `googlebot` (index, follow, прев’ю зображень).
- **`public/robots.txt`** — `Allow: /` і рядок **`Sitemap:`** на абсолютний URL.
- **`public/sitemap.xml`** — одна URL-адреса головної сторінки (SPA без маршрутів). Якщо з’явиться власний домен — оновити домен у `sitemap.xml`, `robots.txt`, `index.html` (canonical, og:url, JSON-LD).
- **JSON-LD** (`WebApplication`) у `index.html` для розуміння сервісу пошуковиками.
- **Vercel** — у `vercel.json` заголовок `Content-Type` для `/sitemap.xml`.
- **Після змін домену** — [Google Search Console](https://search.google.com/search-console): додати властивість, підтвердити, надіслати sitemap `https://…/sitemap.xml`. Для повного рендеру сторінки Google вже виконує JS; додатковий SSR/prerender — окреме покращення.

## Аналітика

- **Vercel Web Analytics** — у коді підключено `<Analytics />` з `@vercel/analytics/react` у `main.tsx`. У [Vercel Dashboard](https://vercel.com) → проєкт → **Analytics** увімкніть Web Analytics для production (дані з’являться після трафіку). Preview-деплої зазвичай не потребують окремого налаштування для тестів.
- **Google Analytics 4 (опційно)** — якщо потрібен GA: створити потік даних у GA4, скопіювати **Measurement ID** (`G-…`), додати в Vercel **Environment Variables**: `VITE_GA_MEASUREMENT_ID` = цей ID (для Production; за бажанням Preview). Після redeploy підвантажиться `gtag` лише на production-бандлі (у `dev` вимкнено). Локально можна скопіювати `.env.example` → `.env` і задати змінну для перевірки збірки (`npm run build` + `npm run preview`).
- **Юридичне** — для GA у юрисдикціях з вимогами до cookies/згоди може знадобитися банер згоди та політика приватності; Vercel Analytics зазвичай трактують як менш інвазивні візити/метрики, але остаточне рішення — на стороні власника продукту.

## CI та деплой

- **GitHub Actions** — `.github/workflows/ci.yml`: `npm ci --legacy-peer-deps`, `npm run check` на push/PR у `main`.
- **Vercel** — `vercel.json`: Vite, `dist/`. Production з гілки `main`.

## Відомі напрями покращень (рев’ю)

1. **Розмір `App.tsx`** — великий монолітний компонент; логічно винести панелі брифінгу, хедер, onboarding у окремі модулі.
2. **Code splitting** — додатково можна винести важкі частини брифінгу або мінімізувати чанк `StageCanvas`, якщо знадобиться.
3. **Дублікат генерації id** — `newId` у `stageStore` та `newEntityId` у `stageProjectFile`; можна винести в спільний `domain/id.ts`.
4. **Покриття тестами** — розширити тести для `targetSpecs`/`swingerGeometry` кутових випадків і для критичних гілок `stageProjectFile` (вже є базові тести).

## Корисні файли для орієнтації

| Тема | Файл |
|------|------|
| Моделі сцени | `src/domain/models.ts` |
| 2D малювання мішеней | `src/presentation/components/StageCanvas.tsx` |
| 3D | `src/presentation/components/StageView3D.tsx` |
| PDF | `src/presentation/lib/exportBriefingPdf.ts` |
| Рядки UI/PDF | `src/i18n/messages.ts` |
| Генерація іконок | `scripts/generate-icons-from-preview.mjs` |
