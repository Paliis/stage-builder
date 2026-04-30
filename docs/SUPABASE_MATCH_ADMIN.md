# Supabase: модуль матчів (BL-025, MVP shotgun)

Файли міграцій (по порядку):

1. **`supabase/migrations/20260501140000_match_admin_mvp.sql`** — таблиці матчу, скводів, заявок, лінків.
2. **`supabase/migrations/20260502140000_platform_match_organizers.sql`** (опційно, для власника порталу): **`organizer_status`**, **`portal_platform_admins`**, RPC **`platform_*`**, RLS — **запис у модуль матчів лише якщо статус `active`**.
3. **`supabase/migrations/20260503120000_match_participant_list_visibility.sql`** — **`participant_list_visibility`** на **`matches`**, RPC **`fetch_public_match_roster`** для публічного ростера без викриття `auth.users`.

Передумога: уже застосовано **`20260409120000_shared_stages.sql`** (`shared_stages` потрібен для FK у `match_stage_links`).

**Apply:** Dashboard → SQL Editor → вставити вміст міграції → **Run**.

---

## Об’єкти

| Таблиця | Призначення |
|---------|--------------|
| **`match_admin_profiles`** | Ім’я для UI (`user_id` = `auth.users`); **`organizer_status`**: `pending` (новий), `active` (може керувати матчами), `blocked` (без запису в модуль). Самостійно змінити статус організатор не може (оновлення колонки лише через платформений RPC). |
| **`portal_platform_admins`** | `user_id` власника платформи: бачить каталог організаторів і змінює їхній статус через RPC / UI **`/:locale/admin/organizers`** (див. нижче). |
| **`matches`** | Матч: організатор, дата `starts_at`, місце, ліміт `competitor_limit`, **`participant_list_visibility`** (`open` \| `closed` — чи показувати публічно підтверджених учасників на картці), **`discipline` зараз лише `'shotgun'`**, `ps_match_*` під PSC (nullable), статус draft/published/… |
| **`match_squads`** | Скводи матчу: `sort_order`, `capacity`, опційний `squad_starts_at`. |
| **`match_registrations`** | Одна заявка на пару (**match**, **стрілок**): `division`, клас, PF, `categories` JSONB, `status` pending/confirmed/cancelled, `payment_note`, `confirmed_at/by`. |
| **`match_stage_links`** | Порядок вправ: `share_stage_id` → `shared_stages.id`, `snapshot_meta` JSONB. |

Тригер **`set_updated_at_match_admin()`** підтримує `updated_at`.

**Realtime:** блок наприкінці міграції додає `match_registrations` до `supabase_realtime`; при помилці (локально / дублікат) пише NOTICE і не падає.

---

## Безпека (RLS, скорочено)

- **`matches`:** читання `anon` лише **`status = published`**, інакще організатор бачить свої чернетки/cancelled тощо; **INSERT / UPDATE / DELETE** — якщо `organizer_id = auth.uid()` **і** (після міграції **`20260502140000_...`**) профіль організатора **`organizer_status = 'active'`**.
- **`match_squads` / `match_stage_links`:** читання, якщо матч видимий (published або власник); **зміни** — лише активний організатор того матчу (після платформеної міграції політики використовують **`match_organizer_write_allowed`**).
- **`match_registrations`:** стрілець читає/створює свою заявку на **published** матч; організатор читає та **оновлює** лише коли активний (`organizer_status = 'active'` у профілі); стрілець може перевести **pending → cancelled**; організатор — підтвердження офлайн оплати (`payment_note`, `status`, `confirmed_*`). **Anonymous** таблицю не бачить (списки без логіну — окремий RPC пізніше).

**Особливість:** умова **`status = confirmed`** вимагає одночасного заповнення `confirmed_at` і `confirmed_by`.

---

## Service role

Для майбутніх Edge/API з **service_role** видачі `GRANT ... TO service_role` на всі таблиці цього модуля включено з RLS bypass у стандартній поведінці Supabase.

---

## Власник порталу (після `20260502140000_platform_match_organizers.sql`)

1. **Перший адмін:** у **SQL Editor** під роллю **postgres** (або **service_role** у скрипті на бекенді):

   ```sql
   INSERT INTO public.portal_platform_admins (user_id)
   VALUES ('<uuid з auth.users>'::uuid)
   ON CONFLICT DO NOTHING;
   ```

2. **RPC (роль `authenticated`):**
   - **`platform_is_platform_admin()`** — чи поточний користувач у `portal_platform_admins`.
   - **`platform_list_match_organizers()`** — список: email, ім’я, статус, кількість матчів (лише для платформеного адміна).
   - **`platform_set_match_organizer_status(p_target_user uuid, p_status text)`** — встановити `pending` / `active` / `blocked` (створює рядок у `match_admin_profiles`, якщо його ще не було).

3. **UI:** у застосунку — **`/{uk|en}/admin/organizers`** (маршрут з’являється лише з **`VITE_ENABLE_MATCH_PORTAL`**, як і публічна картка матчу). Увійти тим користувачем, чий `user_id` додано в **`portal_platform_admins`**.

4. **Seed:** після обох міграцій скрипт **`supabase/seed/match_admin_test_seed.sql`** додає seed-організатора в **`portal_platform_admins`** і виставляє йому **`organizer_status = 'active'`**, щоб можна було відкрити адмінку локально.

---

## Тестові дані (seed)

Файл **`supabase/seed/match_admin_test_seed.sql`** — вставити в **SQL Editor** і виконати (**Run**) під роллю **postgres** (як і міграція).

**Якщо `auth.users` порожня:** скрипт сам створить **два** тестових користувачі + записи в `auth.identities` (`stagebuilder.seed.md@local.test`, `stagebuilder.seed.shooter@local.test`, один пароль `SeedOnly_ChangeMe_9` — змінити або видалити після тесту). На початку файлу виконується `CREATE EXTENSION IF NOT EXISTS pgcrypto` (якщо відмовить — увімкни **pgcrypto** у Extensions). Повторний запуск **пропускається**, якщо матч з такою назвою вже є — спочатку `DELETE`, як у кінці файлу.

**Якщо користувачі вже є:** перший за `created_at` — організатор матчу, останній — перший стрілець у заявці; за потреби друга заявка — організатор на другому скводі. Один користувач дає лише одну заявку.

Створюється опублікований матч **`Seed: Test shotgun match`**, два скводи, 1–2 заявки; заявка стрільця `comp_id` одразу переводиться в **`confirmed`** з тестовою `payment_note`.

**Перевірка:** Table Editor → **`match_registrations`** — мають з’явитися рядки. Кнопка **Insert** вручну під RLS часто не підходить без сесії того ж користувача — seed через SQL обходить RLS.

**Видалення seed:** у кінці файлу закоментовано `DELETE FROM matches WHERE title = 'Seed: Test shotgun match'` (каскад прибере скводи й заявки).

---
- [SUPABASE_SHARED_STAGES.md](./SUPABASE_SHARED_STAGES.md)
- [TECH.md](./TECH.md)
