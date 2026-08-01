# Дані: де що лежить (файл, браузер, Supabase)

Короткий знімок **поза** Git: що варто знати перед **очищенням хмарної БД Supabase**, перенесенням на інший проєкт або перевстановленням браузера. Очищення локальних даних IDE (Cursor) на worktree **не** чіпає Supabase і **не** змінює збережені користувачем файли.

## Файли користувача (диск)

| Що | Де | Примітка |
|----|-----|----------|
| Експорт / імпорт вправи | `*.stage.json` | Повний контракт — `src/domain/stageProjectFile.ts`: `STAGE_PROJECT_FORMAT`, **`STAGE_PROJECT_VERSION`** (зараз **6**). У знімку сцени — у т. ч. **`rangeDistanceSigns`** (при відкритті **`labelM` clamp 1…999**). Таблички **не** в `planClipboard` (Ctrl+C/V по плану). |
| PDF брифінгу | знімок PNG у `exportBriefingPdf` | Таблички з **`rangeDistanceSigns`** входять у **2D/3D PNG** сцени (див. [FUNCTIONALITY.md §7.2a, §10](./FUNCTIONALITY.md)), не в окрему таблицю PDF. |

## Браузер (`localStorage`)

| Ключ | Модуль | Зміст |
|------|--------|--------|
| `stage-builder-session-draft-v1` | `sessionDraft.ts` | Чернетка: `draftMetaVersion`, `savedAt`, знімок **`stage`** + **`briefing`** (без зовнішньої обгортки `format`/`version` файлу). Містить ті самі поля сцени, що й `*.stage.json`. |
| `stage-builder-locale` | `i18n/storage.ts` | Остання мова UI (`uk` / `en`), якщо не задає URL. |
| `sb-stage-builder-auth` | `supabaseClient.ts` | Сесія Supabase Auth (PKCE); для share достатньо anon, для порталу / матчів — вхід. |
| `stage-builder-onboarding-collapsed` | `App.tsx` | Стан onboarding у редакторі. |
| `stage-builder-view3d-shadows`, `stage-builder-view3d-grayscale` | `App.tsx` | Перемикачі знімка 3D. |
| `stage-builder-briefing-collapsed` | `App.tsx` | `1` — автор згорнув панель брифінгу; без ключа вона відкрита (перший візит). |
| `stage-builder-library-stage-id` | `App.tsx` | Запис у `user_stages`, з яким пов'язана чернетка; без нього після перезавантаження «Зберегти» пропонувало лише «Зберегти як нову». Не читається на share-маршрутах; чиститься при `notFound`, імпорті файлу та «Очистити вправу». |
| `stage-builder-draft-legacy-name-cleared` | `sessionDraft.ts` | Одноразове прибирання назви `Нова вправа`, яку старий парсер підставляв у чернетку замість порожнього поля. |
| `stage-builder-pwa-update-prompt-at` | `pwaUpdateGate.ts` | Час останнього банера «доступне оновлення». |
| `ro-helper-fpsu-layer` | `RoHelperFpsuPrefs.tsx` | Шар ФПСУ в RO Helper. |

Workbox / PWA можуть додавати власні записи кешу (не перелічені тут).

## Supabase (хмара)

| Область | Документ / SQL |
|---------|----------------|
| Share: таблиця **`shared_stages`**, RPC **`fetch_shared_stage`**, RLS | [SUPABASE_SHARED_STAGES.md](./SUPABASE_SHARED_STAGES.md), міграції в **`supabase/migrations/`** |
| «Мої вправи»: таблиця **`user_stages`** (own-row RLS, `payload jsonb` = конверт `.stage.json`) | міграція **`20260801120000_user_stages.sql`**, клієнт `src/application/userStagesLibrary.ts` |
| Квоти `user_stages`: **512 КБ** на `payload` (`CHECK pg_column_size`, як у `shared_stages`) і **200 записів** на акаунт (тригер `enforce_user_stages_quota`) — писати з браузера може будь-хто з anon-ключем, тож ліміти в БД | міграція **`20260801173000_user_stages_quota.sql`**; клієнт віддає `payloadTooLarge` / `quotaExceeded` |
| Матчі, реєстрація, PSC | [SUPABASE_MATCH_ADMIN.md](./SUPABASE_MATCH_ADMIN.md) |
| CLI: логін, link, накат міграцій | [supabase/README.md](../supabase/README.md) |

**Після повного скидання даних у проєкті Supabase** посилання **`/v/:id`**, **`/e/:id`**, публікації та облікові записи користувачів зникають, доки не відновити схему (**`supabase db push`** / застосування міграцій) і не налаштуються знову секрети та змінні середовища на хості (**див. [TECH.md](./TECH.md)**). Код і міграції лишаються в репозиторії.

**Чернетка в браузері та файли `*.stage.json` не резервуються автоматично в хмарі** — у хмарі живуть лише вправи, збережені в акаунт («Мої вправи»); решту зберігає сам користувач.

## Пов’язано

- Формат файлу та домен — **[TECH.md](./TECH.md)** (розділи «Файл вправи», «Чернетка сесії»).
- Env і деплой — **[PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md)** §3.5, **[TECH.md](./TECH.md)** (BL-001, публікація).
