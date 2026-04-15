# Supabase: таблиця `shared_stages` (BL-001)

Опис схеми та безпеки для **посилань на вправу**. Після застосування міграції перевірте **Integrations → Data API** (має бути увімкнено).

---

## Покроково: що зробити в Supabase (Dashboard)

### Крок 1. Увійти й відкрити проєкт

1. Перейдіть на [supabase.com/dashboard](https://supabase.com/dashboard) і увійдіть у **організацію**, де лежить проєкт **StageBuilder** (або як він у вас названий).
2. У списку **Projects** натисніть на потрібний проєкт (наприклад **main PRODUCTION** / **Production**).

Переконайтеся, що проєкт **не на паузі** (FREE-проєкти після простою можуть ставитися на pause — тоді кнопка **Restore** у дашборді).

---

### Крок 2. Увімкнути Data API (якщо ще не увімкнено)

1. **Project Settings** (шестерня) → **Integrations** або в пошуку налаштувань знайдіть **Data API**.
2. У блоці **Data API** / **Enable Data API** перемикач має бути **увімкнено** (зелений).
3. Якщо змінювали щось — натисніть **Save**.

Без цього клієнт і PostgREST не зможуть звертатися до бази через API (у тому числі до RPC `fetch_shared_stage`).

---

### Крок 3. Застосувати SQL-міграцію (схема BL-001)

1. У лівому меню відкрийте **SQL Editor**.
2. Натисніть **+ New query** (новий порожній запит).
3. У локальному репозиторії відкрийте файл  
   **`supabase/migrations/20260409120000_shared_stages.sql`**  
   і **скопіюйте весь вміст** цього файлу (від першого рядка коментаря до останнього `GRANT`).
4. Вставте в редактор у браузері.
5. Натисніть **Run** (або скорочення клавіатурою, якщо вказано в UI).

**Очікуваний результат:** повідомлення про успішне виконання, **без** червоних помилок Postgres. Якщо з’явиться помилка на кшталт «already exists» — можливо, міграцію вже запускали; тоді або пропустіть крок, або зверніться до розробника (можливо, потрібна виправлена міграція / ручний дроп).

---

### Крок 4. Перевірити, що таблиця з’явилась

1. У меню відкрийте **Table Editor**.
2. У списку схеми **`public`** знайдіть таблицю **`shared_stages`**.
3. Відкрийте її: мають бути колонки `id`, `mode`, `payload`, `title`, `locale`, `created_at`, `expires_at`, тощо (як у міграції).

Після першого запуску таблиця може бути **порожня** — це нормально.

---

### Крок 5. Перевірити RLS

1. У **Table Editor** на таблиці **`shared_stages`** (або через **Authentication → Policies**) переконайтеся, що для таблиці увімкнено **RLS** (Row Level Security).

У нашій міграції для `anon` **немає** політики «відкрити всі рядки» — тому прямий перегляд усіх посилань через API з anon key **недоступний**. Читання одного посилання зробить RPC **`fetch_shared_stage`** (наступний крок у SQL).

---

### Крок 6. Перевірити функцію `fetch_shared_stage` у SQL Editor

1. Знову **SQL Editor** → **New query**.
2. Виконайте по черзі (можна одним блоком):

```sql
SELECT public.fetch_shared_stage('nonexistent-id');
```

Має повернутися **`null`** (немає такого id).

Потім тестовий запис і видалення (як у розділі «Перевірка після Run» нижче) — переконайтеся, що `fetch_shared_stage('test_share_001')` повертає **JSON** об’єкт, а після `DELETE` — знову **null**.

---

### Крок 7. Скопіювати ключі для застосунку (не публікувати в git)

1. **Project Settings** → **API** (або **Settings → API** залежно від версії UI).
2. Знайдіть:
   - **Project URL** — це базовий URL на кшталт `https://xxxx.supabase.co` → для змінної **`VITE_SUPABASE_URL`**.
   - **anon public** / **Publishable key** — довгий ключ → для **`VITE_SUPABASE_ANON_KEY`**.
3. Додайте їх у **Vercel** → ваш проєкт → **Settings → Environment Variables** (Production і за потреби Preview) і локально в **`.env.local`** (файл не комітити).

**Ніколи не вставляйте у фронтенд і не комітьте:**

- **`service_role`** / **secret** key — лише змінні оточення **серверних** функцій (Vercel Serverless / Supabase Edge Function), де створюватимуться нові рядки в `shared_stages`.

---

### Крок 8. (Опційно) Перевірити RPC через API

Коли в коді з’явиться `@supabase/supabase-js`, достатньо:

```ts
const { data, error } = await supabase.rpc('fetch_shared_stage', { lookup_id: 'test_share_001' })
```

Альтернатива без коду: у документації Supabase **REST** можна викликати RPC через HTTP; для щоденної роботи зручніше SQL Editor.

---

### Крок 9. Що робити далі (не в Supabase UI)

- Реалізувати **створення** рядків (INSERT) через **сервер** з **service role** (квота, розмір, idempotency) — див. [BL-001_SHARE_LINK_PLAN.md](./BL-001_SHARE_LINK_PLAN.md), етап B.
- Підключити **Vite** env і клієнтський виклик `fetch_shared_stage` при відкритті `/v/:id`.

---

## Застосування міграції (коротко)

1. Відкрийте [Supabase Dashboard](https://supabase.com/dashboard) → ваш проєкт → **SQL Editor** → **New query**.
2. Вставте весь вміст файлу **`supabase/migrations/20260409120000_shared_stages.sql`** з репозиторію.
3. Натисніть **Run**. Має виконатися без помилок.

## Що створюється

| Об’єкт | Призначення |
|--------|-------------|
| **`shared_stages`** | Знімок вправи: `id`, `mode` (`view` \| `edit`), `payload` (JSONB), `title`, `locale`, `expires_at`, `edit_token_hash`, `schema_version`, `share_group_id`, `idempotency_key`. Обмеження розміру **payload ≤ 512 KB** (`pg_column_size`). |
| **RLS** | Увімкнено; прямий **SELECT/INSERT/UPDATE** для `anon` на таблицю **не** відкритий (немає витоку списку всіх посилань). |
| **`fetch_shared_stage(lookup_id)`** | **RPC** з правами **`SECURITY DEFINER`**: повертає **один** рядок як JSONB за `id`, якщо запис **не прострочений** (`expires_at > now()`). Виклик дозволено ролям **`anon`** і **`authenticated`** — зручно для клієнта з **anon key**. |
| **Індекси** | `expires_at` (обслуговування / майбутні задачі); унікальний частковий індекс на **`idempotency_key`** (не null). |

**Вставка** нових рядків у MVP — лише з бекенду з **service role** (Edge Function / Vercel Serverless), не з браузера напряму в таблицю.

## Перевірка після Run

У **SQL Editor** (тест під роллю postgres; не використовуйте service key у браузері):

```sql
-- Має повернути NULL (немає рядка)
SELECT public.fetch_shared_stage('nonexistent-id');

-- Тестовий рядок (потім видалити)
INSERT INTO public.shared_stages (id, mode, payload, title, expires_at)
VALUES (
  'test_share_001',
  'view',
  '{"stage":{}}'::jsonb,
  'Test stage',
  now() + interval '365 days'
);

SELECT public.fetch_shared_stage('test_share_001');

DELETE FROM public.shared_stages WHERE id = 'test_share_001';
```

## Клієнт (наступний крок у коді)

Виклик з `@supabase/supabase-js`:

```ts
const { data, error } = await supabase.rpc('fetch_shared_stage', {
  lookup_id: shareId,
})
// data — jsonb один об'єкт або null
```

## Ключі API

- **Project URL** і **anon key** — **Settings → API** (для `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`).
- **service_role** — лише на сервері (створення записів), ніколи у фронтенд-бандл.

**Пов’язано:** [BL-001_SHARE_LINK_PLAN.md](./BL-001_SHARE_LINK_PLAN.md), [TECH.md](./TECH.md).
