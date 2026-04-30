# Supabase: модуль матчів (BL-025, MVP shotgun)

Файл міграції: **`supabase/migrations/20260501140000_match_admin_mvp.sql`**.

Передумога: уже застосовано **`20260409120000_shared_stages.sql`** (`shared_stages` потрібен для FK у `match_stage_links`).

**Apply:** Dashboard → SQL Editor → вставити вміст міграції → **Run**.

---

## Об’єкти

| Таблиця | Призначення |
|---------|--------------|
| **`match_admin_profiles`** | Ім’я для UI (`user_id` = `auth.users`); без колізії з типовою `public.profiles` із шаблонів Supabase. |
| **`matches`** | Матч: організатор, дата `starts_at`, місце, ліміт `competitor_limit`, **`discipline` зараз лише `'shotgun'`**, `ps_match_*` під PSC (nullable), статус draft/published/… |
| **`match_squads`** | Скводи матчу: `sort_order`, `capacity`, опційний `squad_starts_at`. |
| **`match_registrations`** | Одна заявка на пару (**match**, **стрілок**): `division`, клас, PF, `categories` JSONB, `status` pending/confirmed/cancelled, `payment_note`, `confirmed_at/by`. |
| **`match_stage_links`** | Порядок вправ: `share_stage_id` → `shared_stages.id`, `snapshot_meta` JSONB. |

Тригер **`set_updated_at_match_admin()`** підтримує `updated_at`.

**Realtime:** блок наприкінці міграції додає `match_registrations` до `supabase_realtime`; при помилці (локально / дублікат) пише NOTICE і не падає.

---

## Безпека (RLS, скорочено)

- **`matches`:** читання `anon` лише **`status = published`**, інакще організатор бачить свої чернетки/cancelled тощо; запис — лише `organizer_id = auth.uid()`.
- **`match_squads` / `match_stage_links`:** читання, якщо матч видимий (published або власник); зміна — тільки організатор того матчу.
- **`match_registrations`:** стрілець читає/створює свою заявку на **published** матч; організатор — усі по своєму матчу; стрілець може перевести **pending → cancelled**; організатор — підтвердження офлайн оплати (заповнює `payment_note`, `status`, `confirmed_*`). **Anonymous** таблицю не бачить (списки без логіну — окремий RPC пізніше).

**Особливість:** умова **`status = confirmed`** вимагає одночасного заповнення `confirmed_at` і `confirmed_by`.

---

## Service role

Для майбутніх Edge/API з **service_role** видачі `GRANT ... TO service_role` на всі таблиці цього модуля включено з RLS bypass у стандартній поведінці Supabase.

---

## Зв’язок

- [MATCH_REGISTRATION_AND_PSC_PLAN.md](./MATCH_REGISTRATION_AND_PSC_PLAN.md)
- [SUPABASE_SHARED_STAGES.md](./SUPABASE_SHARED_STAGES.md)
- [TECH.md](./TECH.md)
