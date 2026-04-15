# Stage Builder — технічна документація

Документ для розробників: архітектура, домен, формати даних, збірка та відомі обмеження.

**Пов’язані документи:** бізнес- і технічний огляд **[PRODUCT.md](./PRODUCT.md)**; **беклог ідей** **[BACKLOG.md](./BACKLOG.md)**; чернетка **видимість / промені 2D** (BL-010 / BL-013) — **[VISIBILITY_AND_SAFETY_RULES.md](./VISIBILITY_AND_SAFETY_RULES.md)**; повний опис функціоналу **[FUNCTIONALITY.md](./FUNCTIONALITY.md)**; продуктові версії **[VERSIONING.md](./VERSIONING.md)**; чернетка зворотного зв’язку **[USER_FEEDBACK.md](./USER_FEEDBACK.md)**; **оптимізація бандла** — **[OPTIMIZATION.md](./OPTIMIZATION.md)**; **план посилання на вправу (BL-001)** — **[BL-001_SHARE_LINK_PLAN.md](./BL-001_SHARE_LINK_PLAN.md)**; **політика публікації (чернетка BL-001)** — **[PUBLISH_POLICY.md](./PUBLISH_POLICY.md)**; **Bluetooth-таймер SG Timer, BLE (BL-014)** — **[BL-014_SG_TIMER_BLE.md](./BL-014_SG_TIMER_BLE.md)**.  
**Важливо:** позначки V0 / V1 / V2 — це продукт, не версія схеми файлу. Версія JSON-вправи — `STAGE_PROJECT_VERSION` у `stageProjectFile.ts` (зараз **1**).

## Посилання на вправу (BL-001)

**Статус:** MVP (посилання, публікація, перегляд/редактор, PDF QR, noindex, OG для ботів) — **[BL-001_SHARE_LINK_PLAN.md](./BL-001_SHARE_LINK_PLAN.md)**.

**База (Supabase):** міграція **`supabase/migrations/20260409120000_shared_stages.sql`** — таблиця **`shared_stages`**, RLS, RPC **`fetch_shared_stage`**. Застосування та перевірка — **[SUPABASE_SHARED_STAGES.md](./SUPABASE_SHARED_STAGES.md)**; локальний smoke-тест мережі — **`node scripts/test-supabase-share.mjs`**. **Data API** у проєкті має бути увімкнено (Dashboard → Integrations → Data API).

**Код:** `src/main.tsx` — **`BrowserRouter`** і маршрути **`/`** (`App`), **`/v/:shareId`**, **`/e/:shareId`** (`ShareStageRoute` → RPC **`fetch_shared_stage`**, гідратація стору). Режим **`/v/`** — **`shareReadOnly`**; **`/e/`** — повний редактор. Обидва передають у **`App`** **`shareViewContext: { shareId }`** (для QR у PDF — завжди URL перегляду **`/v/:id?lang=`**; банер «Відкрити в редакторі» — лише в режимі перегляду, **`target="_blank"`** на **`/e/:id`**). Перед завантаженням share: якщо чернетка в **`localStorage`** «змістовна» (`isSessionDraftMeaningful` у **`sessionDraft.ts`**), показується діалог (файл / відкинути / скасувати). Клієнт Supabase — **`src/lib/supabaseClient.ts`**; змінні **`VITE_SUPABASE_URL`**, **`VITE_SUPABASE_ANON_KEY`** (див. `.env.example`); секрети service role — лише на сервері (Edge / Vercel Function).

**Індексація / прев’ю:** у **`ShareStageRoute`** для **`/v/`** та **`/e/`** оновлюються існуючі **`meta name="robots"`** та **`googlebot`** → **`noindex, nofollow`** (після відходу з маршруту — відновлення з `index.html`). **`middleware.ts`** (Vercel Edge, **`@vercel/edge`**): для типових User-Agent ботів на **`/v/*`** та **`/e/*`** повертається мінімальний HTML з **`og:title`** (з поля **`title`** через RPC **`fetch_shared_stage`**); інакше **`next()`** до SPA. Потрібні **`VITE_SUPABASE_URL`** і **`VITE_SUPABASE_ANON_KEY`** у середовищі Edge.

**Публікація (POST):** **`api/publish-share.ts`** (Vercel Serverless) — **`SUPABASE_SERVICE_ROLE_KEY`**, **`SUPABASE_URL`** або **`VITE_SUPABASE_URL`**; опційно **`VITE_SHARE_PUBLIC_ORIGIN`** для абсолютних **`url`** у відповіді. Логіка валідації/нормалізації: **`src/server/sharePublish.ts`**. Локально повний стек: **`vercel dev`** (або лише деплой на Preview).

## Архітектура

Проєкт дотримується шаруватої структури:

| Шар | Каталог | Відповідальність |
|-----|---------|------------------|
| **Domain** | `src/domain/` | Типи (`models.ts`), геометрія мішеней і реквізиту (`propGeometry.ts`, `swingerGeometry.ts`), константи габаритів (IPSC, A4, кераміка), розрахунки (`computeMinRounds`, `targetSummary`), парсинг/збірка `*.stage.json`, буфер плану (`planClipboard.ts`), кути безпеки (`safetyAngles.ts`), маппінг 3D (`stageCoordinates3d.ts`), опорна точка огляду 3D (`overviewAnchor.ts`), покриття площадки в 3D (`fieldGround3d.ts`), макет A4/PDF (`a4PrintLayout.ts`) |
| **Application** | `src/application/` | Zustand: сцена (`stageStore`, undo/redo через `zundo`), брифінг (`briefingStore`), чернетка `localStorage` (`sessionDraft.ts`), компонент **`SessionDraftPersist.tsx`** (підписка + debounce) |
| **Presentation** | `src/presentation/` | React-компоненти: `StageCanvas`, `StageView3D`, `StageBuilderToolbar`, `StageMinimap`, `GoogleAnalytics`; хуки (`usePwaInstall`); бібліотеки: `exportBriefingPdf`, `pdfFonts`, `viewTransform` |
| **Корінь UI** | `src/App.tsx` | Композиція layout, брифінг-форма, гарячі клавіші, lazy-3D, стрічка staging, посилання на канвас через `ref` (`StageCanvasHandle`) |
| **i18n** | `src/i18n/` | Дерева рядків UK/EN (`messages.ts`), `I18nProvider`, `getMessage` / `formatTemplate`, `localStorage` для мови (`storage.ts`) |

Точка входу: `src/main.tsx` — `hydrateSessionDraft()`, реєстрація PWA (`virtual:pwa-register`), обгортка `I18nProvider`, **`BrowserRouter`** з маршрутами, **Vercel Analytics** і **Google Analytics**.

**Code splitting:** `StageView3D` підвантажується через `React.lazy` у `App.tsx` лише в режимі «3D», всередині `<Suspense>`. Експорт PDF — динамічний `import()` модуля `exportBriefingPdf` у момент натискання кнопки.

## Площадка, пресети та прив’язка

- **Стан сцени** — `StageState` у `stageStore.ts`: `name`, `weaponClass`, **`fieldSizeM`** (`Vec2`: ширина × довжина в метрах), масиви `targets` і `props`. Тип `Stage` у `models.ts` (поля `category`, `maxPoints` тощо) у рантаймі сцени **не** використовується — категорія вправи живе в брифінгу (`StageBriefing.exerciseType` / `StageCategory`).
- **`field.ts`** — `FIELD_SIZE_PRESETS`, `FIELD_SIZE_LIMITS` (мінімум 8 м по кожній осі; **ширина** до 50 м, **довжина** до 100 м), `clampFieldDimensions`, дефолт 30×40. Для пропорцій картки прев’ю в UI: `STAGE_CARD_UI_DEPTH_FACTOR`.
- **Картка 2D/3D** (`App.css`): робоча зона та сітка кластера на **повну ширину**; друга колонка — `1fr` (не обмежується «letterbox»-шириною від метрів поля). Сама картка — **width: 100%** колонки; висота `min(--_plan-cap, 100cqw * h/w)` **без** `aspect-ratio` на контейнері (інакше поєднання з лімітом висоти знову стискало б ширину). Поля розміру в шапці — текстовий ввід з фіксацією при **blur** (чернетка в стейті).
- **Прокрутка сторінки** — смуга перемикання 2D/3D, полів розміру та пресетів (`.app__view-controls-strip`) і ліва панель тулбару на широкому екрані (`min-width: 52.0625rem`) закріплені через `position: sticky`, щоб залишатися в полі зору при довгій сітці. Відступ лівої панелі від верху вьюпорту узгоджується з `--app-sticky-controls-height` у `index.css` (за потреби підлаштувати, якщо зміниться верстка смуги). На вузьких екранах ліва панель — у drawer (overlay), sticky для неї не застосовується.
- **Сітка та snap** — `GRID_SNAP_M = 0.5`; поверх поля на 2D — **шахматка** кроком `GRID_CHESS_M = 1` (дві тонкі заливки, лише видимий viewport; при дуже сильному віддаленні або понад ~8000 клітин у кадрі шахматку пропускаємо — лишаються лінії 0,5 м). Інтер’єри дірок у «матрьошці» штрафних зон **не** перекриваються окремою заливкою — видно ту саму шахматку, що й на решті поля. Для центрів після перетягування: `TARGET_PLACEMENT_SNAP_M` і `PROP_PLACEMENT_SNAP_M` (0,05 м), щоб дрібно позиціонувати мішені й стикувати реквізит.
- **Зміна розміру поля** — `setFieldSizeM` і завантаження файлу викликають `reclampTargetsProps`: усі позиції обмежуються новими межами; реквізит проходить через `migrateProp` (старі типи `wall`/`window` прибираються, `port` → `shieldWithPort`, корекція розміру `tireStack`). У **шапці** (числові поля та пресети) перед `setFieldSizeM` викликається `fieldResizeChangesEntities` (`fieldResizeImpact.ts`); якщо симуляція reclamp змінює сцену — показується `window.confirm` з текстом `toolbar.fieldResizeConfirm`.
- **3D і знімок PDF** — `a4PrintLayout.ts`: `stageViewportAspectRatio`, `pdfSnapshotPixelSize` (ширина колонки PDF × масштаб, висота з aspect). У **`StageView3D`** режим камери `pdf` дає вікно перегляду з тим самим **aspect**, що й PNG для брифінгу; на картці 3D рамка й обгортка канваса (`App.css`) — **вписаний** прямокутник того ж aspect у доступну область (`container-type: size` на картці, `--pdf-aspect`, `min(100cqw, …)`); `capturePngDataUrl` рендерить у розмірі з `pdfSnapshotPixelSize` незалежно від режиму на екрані.

## Розстановка з тулбару (placement)

- Клік по типу мішені або реквізиту в **`StageBuilderToolbar`** увімкнює **`PlacementMode`** (`placementMode.ts`): далі кожен **ЛКМ по 2D-плану** викликає `addTarget` / `addProp` з координатами кліку (snap/clamp у `stageStore`). **Hit-test ігнорується** — можна ставити «поверх» існуючих об’єктів. Повторний клік по тій самій кнопці або **Esc** вимикає режим. **Вимір** і placement **взаємовиключні**. Реалізація кліку — `StageCanvas` (`placementArmed`, `onPlacementWorldClick`).
- **Порядок кнопок реквізиту** — `INFRASTRUCTURE_PROP_ORDER` у `infrastructureProps.ts` (узгоджено з парсером `PROP_TYPES` у `stageProjectFile.ts`); у тулбарі реквізит згруповано (`INFRASTRUCTURE_SHIELDS`, `INFRASTRUCTURE_FAULT_LINE`, `INFRASTRUCTURE_EQUIPMENT`). Мішені — групи в `toolbarTargetGroups.ts`.
- **Генерація `id`** — `newId()` у `stageStore` і `newEntityId()` у `stageProjectFile`: за можливості `crypto.randomUUID()`; на **HTTP (наприклад LAN без TLS)** `crypto.randomUUID` може бути недоступний — тоді fallback на префікс `sb-` + час/випадковість (див. коментар у `stageStore`).

## Клас зброї

- У знімку сцени та в `*.stage.json` зберігається **`weaponClass`**: `handgun` | `rifle` | `shotgun` (`weaponClass.ts`).
- Набори мішеней за класом описані в `weaponClass.ts`; наразі **всі класи отримують той самий повний список** `ALL_TARGET_TYPES`. У `addTarget` фільтрація за класом **вимкнена** (коментар у `stageStore` — UI перемикання класу для обмеження палітри тимчасово прибрано).

## План 2D: лінійки та вимір

- **Лінійки** — `drawViewportFixedRulers` у `StageCanvas.tsx`: смуги **закріплені на вікні** (ліворуч і вздовж низу). Діапазон поділок — **перетин** видимого вікна (`computeWorldViewportRect`) з **межами поля** `[0, fieldWidthM] × [0, fieldHeightM]`, щоб шкала не показувала «зайві» метри за сіткою. Крок — `pickRulerStepM` (мін. **0,5 м**), дрібні поділки при кроці ≥ 1 м. Підпис **«0»** на нижній осі не дублюється.
- **Інструмент вимірювання** — лише в **2D**: кнопка в `app__plan-map-actions`, клавіша **M** (коли `viewMode === '2d'` і фокус не в полі форми). Два **ліві кліки** — кінці відрізка; координати в межах поля, **без** snap сітки. Після двох точок лінія й підпис лишаються; наступний клік починає нову пару. **Esc** скидає незавершений відрізок. У **3D** вимір вимикається; при вимкненні інструмента `App` викликає `StageCanvasHandle.clearMeasure()`.

## План 2D: зона безпеки та попередження

- Текст **«Кути безпеки»** у брифінгу (`briefingStore` / поле `safetyAngles`) парситься як `лівий/правий[/верх]` у **`parseSafetyAngles`** (`safetyAngles.ts`).
- Якщо на плані є реквізит **`startPosition`** і рядок успішно розібрано, на 2D малюється клин **`drawSafetyZone`** (напрямок «вниз по полю» = downrange).
- Мішені, чий центр **поза** цим клином відносно старту, отримують червоний пунктирний контур і маркер **⚠** (`isTargetInSafetyZone` у циклі малювання мішеней у `StageCanvas`).

## План 2D: рамка, копіювання, вставка

- **Режим рамки** (`marqueeModeActive` у `App.tsx` → `StageCanvas`): ЛКМ тягне прямокутник; у світі AABB. У виділення потрапляють об’єкти, у яких **центр** (`position`) всередині прямокутника (`collectIdsInWorldRect` / логіка в канвасі).
- **API канваса** — `StageCanvasHandle`: `getSelectionForCopy()`, `getSpawnCenterWorld()` (центр поточного видимого вікна в світових метрах); виклики з `App.tsx`.
- **Копіювання** — **Ctrl+C** / Cmd+C і кнопка: deep clone виділення; внутрішній буфер у `App`; додатково спроба записати JSON у системний clipboard (помилки ігноруються).
- **Вставка** — **Ctrl+V** / кнопка: `shiftClonesForPaste` і пов’язана логіка в **`planClipboard.ts`**; центр мас набору вирівнюється з `getSpawnCenterWorld`; нові сутності через `pasteCloneEntities` у `stageStore` (нові `id`).
- **Взаємовиключення**: рамка, вимір і placement; перехід у **3D** або **очищення вправи** вимикає рамку й скидає внутрішній буфер.

## Домен: мішені та підрахунки

Повний перелік — **`TargetType`** у `models.ts`. Коротко:

- **Папір:** лише `paperIpscTwoPostGround` / `Stand50` / `Stand100`, `paperA4TwoPostGround` / `Stand50` / `Stand100`, `paperMiniIpscTwoPostGround` / `Stand50` / `Stand100` (низ лиця ≈0,1 м / 0,5 м / 1 м у 3D). У старих `.stage.json`: `paperIpscTwoPost` → `paperIpscTwoPostStand100`; колишні одностійкові `paperIpsc` / `paperA4` / `paperMiniIpsc` → відповідний `*TwoPostStand100`.
- **Метал:** `metalPlate` (квадрат Appendix C3: 15 / 20 / 30 см, поле `metalRectSideCm`), `metalPlateStand50`, `metalPlateStand100`, `popper`, `miniPopper`.
- **Кераміка:** `ceramicPlate` (радіус і колір — `ceramicPlateSpec.ts`).
- **Ківаки:** `swingerSinglePaper` / `Double`, `swingerSingleCeramic` / `Double` (геометрія — `swingerGeometry.ts`).

Допоміжна логіка:

- **`targetSpecs.ts`** — `isPaperTargetType`, `isPaperTwoPostTargetType` (паперова палітра — лише типи з двома стійками), `isCeramicTargetType`, `isSquareSteelPlateTargetType`, тощо. Кріплення: `paperIpscTwoPostStandAnchorsLocalM`, `paperA4TwoPostStandAnchorsLocalM`, `paperMiniIpscTwoPostStandAnchorsLocalM` або узагальнено `paperTwoPostStandAnchorsLocalM(type)`; на 2D — `targetPaperTwoPostStickIndicatorsWorld` (уздовж локального «низу» лиця).
- **`computeMinRounds.ts`** — евристика мінімуму пострілів (папір ×2, сталь/кераміка ×1; подвійний ківак = дві одиниці).
- **`targetSummary.ts`** — текст для брифінгу/PDF (метал, кераміка, папір, NS).
- **`countStageTargetUnits`** — одиниці на плані для підказок UI.

## Домен: реквізит

Повний перелік — **`PropType`** у `models.ts` (двері, штрафна лінія, щити звичайні/подвійні/з портом і варіантами порту, дверцята в порті, бочка, шини, **стіл** `woodTable`, **стілець** `woodChair`, **стійка** `weaponRackPyramid`, качель, платформа, тунель Купера, стартова позиція). Дефолтні розміри та геометрія плану/3D — **`propGeometry.ts`** (у т.ч. спеціалізовані малювалки для щитів з портом, качелі тощо в `StageCanvas` / `StageView3D`).

## Файл вправи (`*.stage.json`)

- Контракт: `stageProjectFile.ts` — `STAGE_PROJECT_FORMAT`, `STAGE_PROJECT_VERSION`, розширення `.stage.json`.
- Вміст: знімок сцени (`name`, `weaponClass`, `fieldSizeM`, `fieldGroundCover3d`, `targets`, `props`, **`penaltyZoneSet`** з `version >= 2`) + об’єкт брифінгу.
- Для квадратних сталевих мішеней у JSON зберігається опційне **`metalRectSideCm`** (15 | 20 | 30).
- При завантаженні: `migrateProp` у `stageStore` (узгоджено з парсером).
- **BL-019** (замкнені контури штрафних зон): у проді — `penaltyZoneSet` у JSON, **`PENALTY_ZONE_CLOSE_EPSILON_M`** = 0,05 у `penaltyZones.ts`; після замикання контуру **`resolveClosedPenaltyRing`** вирішує, чи це новий полігон, чи дірка в існуючому (найменший зовнішній контур, що містить ситуацію), без окремого режиму «дірка в останньому»; на 2D-плані вершини показані маркерами: клік — виділення та перетягування, Delete/Backspace — видалення вершини (`movePenaltyVertex` / `removePenaltyVertex` у `stageStore.ts`); 2D — `StageCanvas.tsx`; 3D — сегменти контуру як «стінки» з тими ж габаритами/кольором, що **`faultLine`** (`PenaltyZonesFaultLines3D` у `StageView3D.tsx`); орієнтація ребра: кут навколо **Y** = `atan2(-dz, dx)` у просторі Three (після `Ry` локальна **+X** дає `(cos θ, 0, −sin θ)`). Деталі — [VISIBILITY_AND_SAFETY_RULES.md §4](./VISIBILITY_AND_SAFETY_RULES.md).

## Стан і undo

- **Сцена** — `useStageStore` + `temporal` (zundo): undo/redo для мішеней, реквізиту, **штрафних зон** (`penaltyZoneSet`), розміру поля, покриття 3D, імені, класу зброї; гарячі клавіші та кнопки в `App.tsx` (`Ctrl+Z` / `Ctrl+Shift+Z` / `Ctrl+Y`, у полях вводу не перехоплюються). Чернетка контуру штрафної зони (`penaltyDraftVertices` у `App.tsx`) **не** в temporal: поки є незамкнені вершини, undo/redo спочатку знімає/повертає останню точку чернетки, інакше — знімок сцени.
- **Брифінг** — `useBriefingStore` **без** undo (зміни брифінгу не відкочуються разом із сценою).

## Чернетка сесії (localStorage)

- Ключ **`stage-builder-session-draft-v1`** (`SESSION_DRAFT_STORAGE_KEY` у `sessionDraft.ts`).
- Обгортка зберігання містить **`draftMetaVersion`** (`SESSION_DRAFT_META_VERSION`), час `savedAt`, знімок `stage` (у т.ч. **`penaltyZoneSet`**) + `briefing`.
- Старт: `hydrateSessionDraft()` у `main.tsx` **до** першого рендеру; парсинг через `parseStageProjectJson`. Після відновлення — `temporal.clear()`. Пошкоджений JSON видаляється зі сховища.
- `SessionDraftPersist` — debounce **450 ms** (`DEBOUNCE_MS`).
- Очистити вправу: кнопка кошика на 2D-карті; `resetSceneToDefaults`, `defaultStageBriefing()`, `temporal.clear`, `clearSessionDraftStorage`.

## 3D

- **`StageView3D.tsx`** — R3F + Drei; імпорт маппінгу площадки X/Y → Three.js через `stageCoordinates3d.ts`.
- **Огляд і режим PDF:** початкова точка огляду (`StageNavigator`) береться з `computeOverviewAnchorWorld2d` (`overviewAnchor.ts`): якщо на сцені є стартові позиції — центр обраної з мінімальним **Y** на плані, при рівності — з максимальним **X**; інакше серед усіх кінців усіх штрафних ліній (`faultLine`) та сама логіка; якщо немає ні старту, ні ліній — центр поля. Відносний зсув камери до точки погляду зберігається як у попередній фіксованій схемі для центру поля.
- **Розмір WebGL:** обгортка з `ResizeObserver` задає піксельні `width`/`height` для `Canvas`; у `App.css` — **absolute inset 0** на `.app__r3f-canvas-outer` (не PDF), **stretch** на `.app__stage-print-frame`, **`min-height`** на картці (коли `100cqw === 0`, `height` міг бути 0px).
- **Земля:** площина поля — `Ground`, `meshStandardMaterial`, `receiveShadow`; колір з **`fieldGroundCover3d`** (`earth` / `grass` / `sand` у `fieldGround3d.ts`), зберігається в **`.stage.json`** і чернетці сесії.
- Знімок сцени для PDF знімається через ref/handle компонента 3D (узгоджено з `App.tsx` / експортом).

## PDF брифінгу

- **`exportBriefingPdf.ts`** — таблиця полів брифінгу, вбудований знімок 3D (після `addImage` — обведення `roundedRect` навколо кадру), QR у верхньому правому куті **сторінки**, бренд-текст і URL по центру під знімком; вертикальний старт знімка не вище за низ QR.
- **`pdfFonts.ts`** — підвантаження **Roboto** (Regular/Bold) у base64 і реєстрація в jsPDF, щоб коректно рендерити кирилицю.
- **`a4PrintLayout.ts`** — розміри A4 в мм/px, співвідношення для знімка плану в UI (узгоджено з PDF).

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
npm run check     # як у CI: lint + test + build
npm run icons     # node scripts/generate-icons-from-preview.mjs
```

### TypeScript і тести

- `tsconfig.app.json` **виключає** `src/**/*.test.ts` з `tsc -b`; фікстури в тестах мають відповідати доменним типам.
- Unit-тести в `src/domain/`: `field.test.ts` (розмір поля, snap, clamp), `safetyAngles.test.ts` (парсинг кутів, клин безпеки), `fieldEntityReclamp.test.ts` (reclamp після зміни поля, міграція `wall`), `computeMinRounds.test.ts`, `targetSummary.test.ts`, `stageProjectFile.test.ts` (у т. ч. міграції застарілих типів мішеней у JSON), `fieldResizeImpact.test.ts`, `penaltyZones.test.ts`, `overviewAnchor.test.ts`, `planClipboard.test.ts` (центроїд, вставка), `a4PrintLayout.test.ts` (aspect PNG для PDF).
- Unit-тести в `src/presentation/lib/`: `viewTransform.test.ts` (світ ↔ екран, pan до центру).
- **Перевірка як у CI:** `npm run check` → ESLint, Vitest, `tsc -b`, production `vite build` (успішний вихід = готово до push у `main` / `staging`).

### Примітки з код-рев’ю (огляд 3D і домен)

- **`overviewAnchor.ts`:** критерій «нижня / права» точка — **мінімальний Y**, при рівності — **максимальний X** у світових координатах плану (узгоджено з напрямком downrange **+Y** у `safetyAngles.ts`). Підпис `overviewAnchorRelevantSignature` має включати **`sizeM.x`** для `faultLine`, щоб зміна довжини лінії перераховувала камеру.
- **`StageView3D` / `StageNavigator`:** зсув камери до target зафіксований константами `OVERVIEW_CAM_DELTA` та `OVERVIEW_CAMERA_Z_FROM_TZ` (еквівалент колишніх `(11,14.5,18)` відносно `(0,0,-3)` для центру поля). Ефект оновлення орбіти залежить від `anchorSig` і розміру поля, щоб не скидати огляд при русі іншого реквізиту.
- **Sticky-панелі плану** (`App.css` / `index.css`): `--app-sticky-controls-height` має відповідати фактичній висоті смуги 2D/3D; на вузьких екранах ліва панель у drawer — окрема гілка CSS, без `sticky` для колонки.

### Конфігурація Vite / прев’ю ассетів

- Константа **`ASSET_QUERY`** у `vite.config.ts` — після зміни `public/og-image.png`, PWA-іконок або favicon збільште версію в query і задеплойте (кеш Telegram/CDN).

## SEO та індексація

- **`index.html`** — `title`, `meta description` (за замовчуванням **EN** для кращої видачі в Google англомовним користувачам; узгоджено з OG/Twitter), `canonical`, `hreflang` (uk/en/x-default на той самий URL — мова в UI), Open Graph + Twitter Card, `robots` / `googlebot` (index, follow, прев’ю зображень). **`I18nProvider`** після завантаження оновлює `meta description`, `og:description`, `twitter:description`, `og:image:alt` з `messages.ts` (`seo.*`) відповідно до обраної мови (uk/en). Абсолютні `og:image` / `twitter:image` з query-параметром: плейсхолдер **`__ASSET_Q__`** замінюється на `ASSET_QUERY` з `vite.config.ts` — після зміни `public/og-image.png` збільште версію в query і задеплойте (Telegram та інші клієнти інакше можуть показувати старе прев’ю). Оновити кеш прев’ю в Telegram можна через бота **[@WebpageBot](https://t.me/WebpageBot)**.
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

1. **Створити ресурс GA4** — [Google Analytics](https://analytics.google.com) → Admin → **Create Property**.
2. **Потік Web** — URL сайту (наприклад `https://stage-builder.vercel.app`).
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

| Середовище | Що це | Типова перевірка |
|------------|--------|------------------|
| **Local** | `npm run dev` або `npm run build` + `npm run preview` | Швидкі зміни без хмари. |
| **Staging** | Окремий деплой на Vercel з гілки **`staging`** | Повна збірка як у проді, стабільний URL. |
| **Production** | `main` → Vercel Production | Бойовий сайт і індексація. |

Щоб мати **постійний staging** (одна адреса для гілки `staging`):

1. У [Vercel Dashboard](https://vercel.com) створіть **другий проєкт**, підключіть той самий репозиторій.
2. **Production Branch** цього проєкту = `staging`.
3. У змінних цього проєкту (Production): **`VITE_SITE_ENV=staging`** — HTML отримає noindex, змінений title і стрічку в UI (див. SEO вище).
4. Робочий цикл: зміни → `staging` → перевірка → merge у `main` для продакшену.

**Примітка:** статичний `public/robots.txt` один на всі деплої; окремий robots для staging лише через middleware / окремий билд-скрипт.

### CI

- **GitHub Actions** — `.github/workflows/ci.yml`: `npm ci --legacy-peer-deps`, `npm run check` на push/PR у **`main`** та **`staging`**.
- **Vercel (production-проєкт)** — `vercel.json`: Vite, `dist/`. Production з гілки `main`.

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
| Генерація іконок | `scripts/generate-icons-from-preview.mjs` |
