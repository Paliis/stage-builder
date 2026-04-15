# Supabase: таблиця `shared_stages` (BL-001)

Опис схеми та безпеки для **посилань на вправу**. Після застосування міграції перевірте **Integrations → Data API** (має бути увімкнено) — як на скріні налаштувань проєкту.

## Застосування міграції

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
