# Supabase (BL-001)

- **`migrations/`** — SQL для Postgres у проєкті Supabase. Застосування вручну: **SQL Editor** у дашборді → вставити вміст файлу → **Run**.
- Докладна інструкція та перевірка: **[docs/SUPABASE_SHARED_STAGES.md](../docs/SUPABASE_SHARED_STAGES.md)**.
- Локальна перевірка API: з кореня репозиторію **`node scripts/test-supabase-share.mjs`** (див. той самий документ).

Якщо пізніше підключите [Supabase CLI](https://supabase.com/docs/guides/cli), той самий каталог можна використовувати з `supabase db push` / `migration up`.
