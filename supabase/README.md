# Supabase (BL-001 + матчі)

## Міграції

- **`migrations/`** — SQL для Postgres. Репозиторій уже містить ланцюжок файлів (див. [docs/SUPABASE_SHARED_STAGES.md](../docs/SUPABASE_SHARED_STAGES.md), [docs/SUPABASE_MATCH_ADMIN.md](../docs/SUPABASE_MATCH_ADMIN.md)).

## Варіант A: вручну в дашборді

**Dashboard → SQL Editor** → вставити вміст файлу → **Run** (як раніше).

## Варіант B: Supabase CLI (рекомендовано для агента / CI)

Потрібен [Node.js](https://nodejs.org/) (у проєкті вже є `npm`). CLI викликається через **`npx`** — глобальна установка не обов’язкова.

У **Supabase Dashboard → Settings → Database** перевір версію Postgres: вона має збігатися з **`[db].major_version`** у **`supabase/config.toml`** (зараз **17**). Якщо на проєкті ще **15** — зміни `major_version` на **15** і закоміть, інакше локальний `supabase start`/diff можуть поводитись неконсистентно; **`db push`** зазвичай все одно накочує SQL, але краще тримати синхрон.

### 1. Один раз: логін (лише ти, у браузері)

```bash
npm run supabase:login
```

Або: `npx supabase login`

### 2. Один раз: прив’язка до хмарного проєкту

У **Supabase Dashboard → Project Settings → General** скопіюй **Project ID** (`project-ref`).

```bash
npm run supabase:link
```

CLI запитає пароль бази або використає секрет із дашборду — підказки в терміналі. Після успіху з’явиться **`supabase/.temp/project-ref`** (локально, не комітиться — див. `supabase/.gitignore`).

### 3. Накатити міграції на віддалений проєкт

```bash
npm run supabase:push
```

Це виконує **`supabase db push`**: порівнює локальну папку `migrations/` з віддаленою схемою й застосовує те, що ще не накочено.

Корисно:

```bash
npm run supabase:migration-list
```

### 4. Локальний Docker (“supabase start”)

Опційно для повної локальної копії. На Windows потрібен **Docker Desktop**. Команди: `npx supabase start`, `npx supabase db reset`. Для більшості сценаріїв достатньо **`db push`** на один dev-проєкт у хмарі.

### 5. Секрети

- Не коміть **`.env`**, **`service_role`**, пароль БД.
- Конфіг лінку зберігається під `supabase/.temp/` (ігнорується Git).

---

- **Seed для матчів** ([SUPABASE_MATCH_ADMIN.md](../docs/SUPABASE_MATCH_ADMIN.md)): після **`npm run supabase:link`** (і логіну CLI) виконувати з кореня репо:
  - **`npm run supabase:seed:match-all`** — спочатку повний матчевий seed, потім доповнення з 8 тестовими стрільцями для дошки (другий файл ідempotent);
  - окремо: **`npm run supabase:seed:match-admin`**, **`npm run supabase:seed:match-board-extras`**.
  - Як без CLI: Dashboard → SQL Editor → вставити вміст `seed/*.sql` (варіант A вище).
- Локальний smoke API (share): **`node scripts/test-supabase-share.mjs`** ([SUPABASE_SHARED_STAGES.md](../docs/SUPABASE_SHARED_STAGES.md)).
