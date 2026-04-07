# Stage Builder — технічна документація

Документ для розробників: архітектура, домен, формати даних, збірка та відомі обмеження.

**Продуктові версії V0 / V1** (що входить у який зріз, накопичувальний опис V1) — у **[VERSIONING.md](./VERSIONING.md)**. Це окремо від `STAGE_PROJECT_VERSION` у `stageProjectFile.ts` (версія схеми `*.stage.json`).

## Архітектура

Проєкт дотримується шаруватої структури:

| Шар | Каталог | Відповідальність |
|-----|---------|------------------|
| **Domain** | `src/domain/` | Типи (`models.ts`), геометрія мішеней/реквізиту, розрахунки (мін. постріли, підсумок мішеней), парсинг/збірка `*.stage.json`, константи IPSC-подібних габаритів |
| **Application** | `src/application/` | Zustand-стори: сцена (`stageStore`, undo/redo через `zundo`), брифінг (`briefingStore`) |
| **Presentation** | `src/presentation/` | React: `App.tsx`, Canvas 2D, Three.js 3D, тулбар, міні-карта, експорт PDF, хуки |
| **i18n** | `src/i18n/` | Дерева рядків UK/EN, провайдер, `localStorage` для мови |

Корінь UI — `src/main.tsx` → `App.tsx`. **Code splitting:** модуль `StageView3D` (Three.js, R3F) підвантажується через `React.lazy` лише в режимі «3D»; `exportBriefingPdf` (jsPDF, qrcode, autotable) — через динамічний `import()` при експорті PDF. Це зменшує початковий JS для користувачів, які лишаються в 2D.

## План 2D: лінійки та вимір

- **Лінійки** — `drawFieldRulers` у `StageCanvas.tsx`: вісь **Y** вздовж **лівого** краю поля в світових метрах; вісь **X** вздовж лінії **`y = 0`** (нижня межа поля). Крок поділок залежить від масштабу (`pickRulerStepM`, мінімальний кандидат **0,5 м**); при основному кроці ≥ 1 м додатково малюються **дрібні** поділки (половина кроку). Довжина рисок у світі обмежена знизу через **мінімум у пікселях** (`rulerTickLenWorldM`), щоб при масштабі «вмістити поле» лінійка лишалась видимою. Підпис **«0»** на осях не дублюється (один раз на лівій осі для `y = 0`).
- **Інструмент вимірювання** — лише в **2D**. Увімкнення: кнопка поруч із табами 2D/3D (`view.measureTool`, `view.measureToolTitle`) і клавіша **M**, коли `viewMode === '2d'` і фокус не в полі форми (`App.tsx`). Два послідовні **ліві кліки** задають кінці відрізка; координати **обмежуються полем**, **без** прив’язки до сітки. Після двох точок лінія (пунктир) і число відстані **залишаються** на полотні; **наступний клік** починає нову пару (нова точка A). **Esc** скидає поточний незавершений відрізок (є A або B). У режимі **3D** вимір вимикається. Оверлей малюється лише коли режим увімкнений; при вимкненні `App` викликає `StageCanvasHandle.clearMeasure()`, щоб скинути збережені точки. Формат підпису — `view.measureDistanceMeters` у `messages.ts`, через `formatTemplate` з `formatMeasureDistance` у пропсах канвасу.

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

- **`index.html`** — `title`, `meta description` (UK), `canonical`, `hreflang` (uk/en/x-default на той самий URL — мова в UI), Open Graph + Twitter Card, `robots` / `googlebot` (index, follow, прев’ю зображень). Абсолютні `og:image` / `twitter:image` з query-бастом з `vite.config.ts` (`ASSET_QUERY`): після зміни `public/og-image.png` збільште версію в query і задеплойте — інакше Telegram/інші клієнти можуть показувати старе прев’ю. У Telegram можна надіслати посилання боту **[@WebpageBot](https://t.me/WebpageBot)** (оновлення кешу прев’ю).
- **`public/robots.txt`** — `Allow: /` і рядок **`Sitemap:`** на абсолютний URL.
- **`public/sitemap.xml`** — одна URL-адреса головної сторінки (SPA без маршрутів). Якщо з’явиться власний домен — оновити домен у `sitemap.xml`, `robots.txt`, `index.html` (canonical, og:url, JSON-LD).
- **JSON-LD** (`WebApplication`) у `index.html` для розуміння сервісу пошуковиками.
- **Vercel** — у `vercel.json` заголовок `Content-Type` для `/sitemap.xml`.
- **Після змін домену** — [Google Search Console](https://search.google.com/search-console): додати властивість, підтвердити, надіслати sitemap `https://…/sitemap.xml`. Для повного рендеру сторінки Google вже виконує JS; додатковий SSR/prerender — окреме покращення.

## Аналітика

- **Vercel Web Analytics** — у коді підключено `<Analytics />` з `@vercel/analytics/react` у `main.tsx`. У [Vercel Dashboard](https://vercel.com) → проєкт → **Analytics** увімкніть Web Analytics для production (дані з’являться після трафіку). Preview-деплої зазвичай не потребують окремого налаштування для тестів.

### Google Analytics 4 (покроково)

У проєкті вже є компонент `GoogleAnalytics` (`src/presentation/components/GoogleAnalytics.tsx`): він підвантажує `gtag.js` **тільки** якщо задано змінну середовища `VITE_GA_MEASUREMENT_ID` і зібрано **production**-бандл (`import.meta.env.PROD`). У режимі `npm run dev` GA **не** викликається, щоб не забруднювати звіти.

1. **Створити ресурс GA4** — увійдіть у [Google Analytics](https://analytics.google.com) → **Admin** (шестерня) → у колонці **Account** створіть акаунт (якщо ще немає) → у колонці **Property** натисніть **Create Property**, заповніть назву, часовий пояс, валюту.
2. **Потік даних (Web)** — після створення ресурсу оберіть **Web**, вкажіть **Website URL** (наприклад `https://stage-builder.vercel.app`) і назву потоку → **Create stream**.
3. **Measurement ID** — на сторінці потоку скопіюйте **Measurement ID** у форматі `G-XXXXXXXXXX` (не плутати з legacy Universal Analytics).
4. **Vercel** — [Project → Settings → Environment Variables](https://vercel.com/docs/projects/environment-variables): додайте `VITE_GA_MEASUREMENT_ID` = `G-XXXXXXXXXX`, середовище **Production** (за бажанням також **Preview** для тесту preview-URL). Збережіть.
5. **Redeploy** — Vite підставляє `VITE_*` **на етапі збірки**: після додавання змінної виконайте **Redeploy** останнього production-деплою (або порожній commit / push у `main`), інакше в клієнтському JS старий бандл без ID.
6. **Перевірка** — у GA4 відкрийте **Reports → Realtime** і відкрийте production-сайт у браузері; протягом хвилини має з’явитися активний користувач. У **Network** (DevTools) мають бути запити до `google-analytics.com` / `googletagmanager.com`.
7. **Локальна перевірка збірки** — скопіюйте `.env.example` у `.env`, розкоментуйте/додайте `VITE_GA_MEASUREMENT_ID=G-…`, виконайте `npm run build` і `npm run preview`, зайдіть на `localhost` — у Realtime також має бути візит (не використовуйте той самий ID для довгої розробки, щоб не змішувати тест і прод).

**Разом із Vercel Analytics** — обидва інструменти можуть працювати паралельно: Vercel дає швидкий огляд у своєму дашборді, GA4 — глибші звіти, аудиторії, експорт у BigQuery (на платних планах GA), інтеграції.

**Google Search Console** — за бажанням у **Admin → Product links** зв’яжіть ресурс GA4 з Search Console, щоб бачити пошукові запити в контексті аналітики (потрібні права на обидві властивості).

**Приватність і cookies** — GA4 використовує файли cookie та обробку персональних даних; для відвідувачів з ЄС/Великої Британії тощо часто потрібні **політика конфіденційності**, механізм **згоди (consent)** перед завантаженням скрипта та налаштування в **Admin → Data collection** (наприклад consent mode, якщо підключите банер). Це не реалізовано в коді проєкту — відповідальність на власнику сайту.

**Кастомні події** — за потреби можна викликати `window.gtag('event', 'event_name', { ... })` після ініціалізації; для чистого TypeScript варто оголосити тип для `window.gtag` або винести обгортку в окремий модуль.

## CI та деплой

### Три рівні: локально → staging → production

| Середовище | Що це | Типова перевірка |
|------------|--------|------------------|
| **Local** | `npm run dev` (порт Vite) або `npm run build` + `npm run preview` | Швидкі зміни UI/логіки без хмари. |
| **Staging** | Окремий деплой на Vercel з гілки **`staging`** (див. нижче) | Повна збірка як у проді, стабільний URL для команди/клієнта. |
| **Production** | Поточний бойовий сайт (`main` → Vercel Production) | Те, що бачать користувачі та індексує пошук. |

У **одному** Vercel-проєкті за замовчуванням лише **`main`** дає Production URL; інші гілки отримують **Preview** з унікальним URL на кожен commit (зручно для PR, але URL «плаває»). Щоб мати **постійний staging** (одна й та сама адреса для гілки `staging`):

1. У [Vercel Dashboard](https://vercel.com) створіть **другий проєкт** (наприклад `stage-builder-staging`), підключіть **той самий** GitHub-репозиторій.
2. У налаштуваннях цього проєкту: **Production Branch** = `staging` (не `main`).
3. Після першого push у гілку `staging` з’явиться стабільний домен виду `…vercel.app` — це і є **staging**.
4. Робочий цикл: зміни → merge/push у **`staging`** → перевірка на staging URL → коли все ок — merge **`staging` → `main`** (або PR у `main`) для продакшену.

**Змінні середовища (staging-проєкт на Vercel):**

- Обов’язково для «маркованого» staging у коді: **`VITE_SITE_ENV=staging`** (Environment Variables → Production у цьому проєкті, бо для нього production-гілка = `staging`). Тоді збірка підставляє **`noindex`** у `index.html`, змінює `<title>` і показує жовту стрічку в UI.
- Скопіюйте інші змінні з production за потреби; для GA можна **не** задавати `VITE_GA_MEASUREMENT_ID` (аналітика не підвантажиться) або окремий тестовий потік GA4.

**SEO / індексація:** додатково можна увімкнути **Deployment Protection** на staging-проєкті. Статичний `public/robots.txt` у репозиторії один на всі деплої — для окремого `robots.txt` на staging потрібні були б Edge middleware / окремий билд-скрипт.

### CI

- **GitHub Actions** — `.github/workflows/ci.yml`: `npm ci --legacy-peer-deps`, `npm run check` на push/PR у **`main`** та **`staging`**.
- **Vercel (production-проєкт)** — `vercel.json`: Vite, `dist/`. Production з гілки `main`.

### Як задеплоїти production

1. Переконайтесь, що локально проходить **`npm run check`**.
2. Закомітьте зміни в **`main`** і виконайте **`git push origin main`** (або merge PR у `main`).
3. У [Vercel Dashboard](https://vercel.com) дочекайтесь завершення **Deployment** для production-гілки; після успіху оновиться бойовий URL проєкту.

Окремого скрипта `npm run deploy` у репозиторії немає — деплой тригериться **Git**-подією на підключеному репозиторії.

## Відомі напрями покращень (рев’ю)

1. **Розмір `App.tsx`** — великий монолітний компонент; логічно винести панелі брифінгу, хедер, onboarding у окремі модулі.
2. **Code splitting** — додатково можна винести важкі частини брифінгу або мінімізувати чанк `StageCanvas`, якщо знадобиться.
3. **Дублікат генерації id** — `newId` у `stageStore` та `newEntityId` у `stageProjectFile`; можна винести в спільний `domain/id.ts`.
4. **Покриття тестами** — розширити тести для `targetSpecs`/`swingerGeometry` кутових випадків і для критичних гілок `stageProjectFile` (вже є базові тести).

## Корисні файли для орієнтації

| Тема | Файл |
|------|------|
| Продуктові версії V0 / V1 | `docs/VERSIONING.md` |
| Моделі сцени | `src/domain/models.ts` |
| 2D канвас (мішені, лінійки, вимір) | `src/presentation/components/StageCanvas.tsx` |
| Увімкнення виміру (M, кнопка, 2D/3D) | `src/App.tsx` |
| 3D | `src/presentation/components/StageView3D.tsx` |
| PDF | `src/presentation/lib/exportBriefingPdf.ts` |
| Рядки UI/PDF | `src/i18n/messages.ts` |
| Генерація іконок | `scripts/generate-icons-from-preview.mjs` |
