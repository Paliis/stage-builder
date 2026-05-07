# Supabase: модуль матчів (BL-025, MVP shotgun)

Файли міграцій (по порядку):

1. **`supabase/migrations/20260501140000_match_admin_mvp.sql`** — таблиці матчу, скводів, заявок, лінків.
2. **`supabase/migrations/20260502140000_platform_match_organizers.sql`** (опційно, для власника порталу): **`organizer_status`**, **`portal_platform_admins`**, RPC **`platform_*`**, RLS — **запис у модуль матчів лише якщо статус `active`**.
3. **`supabase/migrations/20260503120000_match_participant_list_visibility.sql`** — **`participant_list_visibility`** на **`matches`**, RPC **`fetch_public_match_roster`** для публічного ростера без викриття `auth.users`.
4. **`supabase/migrations/20260504140000_public_match_registration_metrics.sql`** — RPC **`fetch_public_match_registration_metrics`** (лише для **`published`**) — кількість зайнятих місць по скводах і сумарні заявки для публічної форми реєстрації без `SELECT match_registrations` для `anon`.
5. **`supabase/migrations/20260505120000_match_prematch_squads.sql`** — опційний **прематч** на картці матчу: **`prematch_enabled`**, цільова кількість скводів **`planned_*`**, колонка **`match_squads.squad_phase`** (`main` \| `prematch`); оновлені RPC метрик та публічного ростера.
6. **`supabase/migrations/20260506140000_match_squad_template_sync.sql`** — **уніфікована сітка скводів**: на **`matches`** додаються **`shooters_per_main_squad`**, **`shooters_per_prematch_squad`**; тригер перераховує **`competitor_limit`** як сума **planned × shooters** для main (+ прематч якщо увімкнено); унікальність **`match_squads (match_id, squad_phase, sort_order)`**; RPC **`organizer_sync_match_squads(p_match_id)`** синхронізує рядки й блокує скорочення при активних заявках.
7. **`supabase/migrations/20260506141000_organizer_registration_roster_rpc.sql`** (+ оновлення **`20260507120000_fetch_organizer_roster_created_at.sql`**, **`20260512130000_fetch_organizer_roster_payment_note.sql`**, **`20260518110000_match_registration_payment_received.sql`**, **`20260522100000_registration_phone_weapon_region.sql`**) — RPC **`fetch_organizer_match_registration_roster(p_match_id)`** для сторінки організатора (з **`display_name`** із **`match_admin_profiles`**, **`registration_created_at`** для сортування на дошці скводів, **`payment_note`**, булево **`payment_received`**, контакт **`phone`** / зброя / регіон заявки з **`match_registrations`**).
8. **`supabase/migrations/20260508100000_match_stage_share_group.sql`** — **`match_stage_links.share_group_id`** (логічна «група» версій **`shared_stages`**), бекфіл **UUID** для існуючих share-рядків, RPC **`organizer_refresh_match_stage_link_latest(p_link_id)`** — оновити **`share_stage_id`** на найсвіжіший **непрострочений** view-знімок у тій самій групі.
9. **`supabase/migrations/20260508201000_share_refresh_snapshot_title_payload.sql`** — той самий RPC: **`title_snapshot`** рахує з **payload** (спершу **`briefing.documentTitle`**, потім **`stage.name`**, далі **`shared_stages.title`**), узгоджено з **`resolveSharePublishedTitle`** у коді publish.
10. **`supabase/migrations/20260509120000_organizer_application_fields.sql`** — текст заявки (**`organizer_application_contact`**, **`organizer_application_past_matches`**), **`organizer_moderation_note`** (видно автору при статусі `blocked`); RLS **`INSERT`** вимагає **`organizer_moderation_note IS NULL`**; оновлення **`platform_list_match_organizers`**, **`platform_set_match_organizer_status(..., p_moderation_note text default null)`**. Сповіщення Slack / email через вебхуки — **[SUPABASE_ORGANIZER_APPLICATION_ALERTS.md](./SUPABASE_ORGANIZER_APPLICATION_ALERTS.md)**.
11. **`supabase/migrations/20260510120000_participant_registration_defaults.sql`** (+ **`20260510130000_participant_registration_defaults_extend.sql`**) — таблиця **`participant_registration_defaults`** (типові **`division`** (id дивізіону залежно від класу зброї), **`classification_grade`**, **`power_factor`**, **`region`**, **`categories`** `text[]`, **`weapon_class`** — id класу зброї з UI-довідника; префіл кабінету / форми; **`SELECT` / `INSERT` / `UPDATE` / `DELETE`** лише власного рядка **`user_id`**). Розширення додає колонки після базової таблиці; за наявності застарілої колонки **`category`** — перенос у **`categories`** і видалення **`category`**.
12. **`supabase/migrations/20260516130000_participant_defaults_name_avatar.sql`** — **`first_name`**, **`last_name`** (для експорту PractiScore **`sh_fn` / `sh_ln`**), **`avatar_url`** (публічний URL фото в **`participant-avatars`** Storage).
13. **`supabase/migrations/20260511100000_match_event_kind_ps_match_level.sql`** — **`matches.match_event_kind`** (тренування / матч / класифікація) та **`matches.ps_match_level`** (`L1`–`L5`, PractiScore), обидва **nullable**.
14. **`supabase/migrations/20260520120000_public_roster_categories_payment.sql`** — публічний RPC **`fetch_public_match_roster`**: у відповіді **`categories`** (JSONB) замість **`classification_grade`** для блоку «Учасники», плюс оновлення коментаря про оплату.
15. **`supabase/migrations/20260521130000_public_roster_registration_status.sql`** — те саме RPC повертає **`registration_status`** (`pending` \| `confirmed`) із **`match_registrations.status`**; показ активних заявок на публічній картці узгоджений із колонкою «Статус» у розділі організатора «Заявки».
16. **`supabase/migrations/20260522100000_registration_phone_weapon_region.sql`** — **`participant_registration_defaults`**: **`phone`**, **`weapon_details`**; **`match_registrations`**: **`phone`**, **`weapon_details`**, знімок **`competitor_region`** при поданні заявки; RPC **`fetch_organizer_match_registration_roster`** повертає ці поля для UI організатора.
17. **`supabase/migrations/20260524120000_match_registrations_competitor_update_cancelled.sql`** — RLS **`UPDATE`** для стрільця: **`status IN ('pending', 'cancelled')`**, щоб після скасування можна було **оновити той самий рядок** (`cancelled` → `pending`) без порушення **`UNIQUE (match_id, competitor_user_id)`**.

Передумога: уже застосовано **`20260409120000_shared_stages.sql`** (`shared_stages` потрібен для FK у `match_stage_links`).

**Apply (вибір способу):**

**Автоматизація в Cursor:** після додавання/зміни файлів у **`supabase/migrations/`** агент застосовує їх на з’єднаний проєкт командою **`npx supabase db push --linked --yes`** (див. правило **`.cursor/rules/supabase-migrations-push.mdc`**). Не залишати лише нагадування користувачу, якщо CLI і link доступні.

| Спосіб | Коли |
|--------|------|
| **SQL Editor** у дашборді | Один раз або без CLI: вставити вміст файлу міграції → **Run**. |
| **Supabase CLI** | Повторне накочування, перевірки в Cursor, менше ручних помилок. |

Кроки CLI (логін, `link`, `db push`): див. **[supabase/README.md](../supabase/README.md)** та npm-скрипти **`npm run supabase:login`**, **`supabase:link`**, **`supabase:push`**.

Корінь проєкту вже містить **`supabase/config.toml`** від `supabase init`; міграції лежать у **`supabase/migrations/`**.

---

## Об’єкти

| Таблиця | Призначення |
|---------|--------------|
| **`match_admin_profiles`** | Ім’я для UI (**`display_name`**), **`organizer_status`**: `pending` / `active` / `blocked`. Самоподача **`INSERT`** з **`user_id = auth.uid()`**, **`organizer_status = pending`**, **`organizer_moderation_note IS NULL`**, опційно **`organizer_application_contact`** (до ~280 сим.), **`organizer_application_past_matches`** (до 2000). Платформа змінює статус через **`platform_set_match_organizer_status`**, може записати **`organizer_moderation_note`** лише коли ставить **`blocked`** (до 600 сим.; при **`active`** / **`pending`** нотатку очищено RPC). Автор **`SELECT`** власного рядка бачить нотатку в **`/{locale}/account`**. Перегляд каталогу — **`platform_list_match_organizers`**, UI **`/{locale}/admin/organizers`**. |
| **`portal_platform_admins`** | `user_id` власника платформи: бачить каталог організаторів і змінює їхній статус через RPC / UI **`/:locale/admin/organizers`** (див. нижче). |
| **`matches`** | Матч: організатор, дата `starts_at`, місце, **`competitor_limit`**, **`match_event_kind`** (`training` \| `match` \| `classification`, опційно — для каталогу / картки), **`ps_match_level`** (`L1`–`L5`, опційно — потрапляє в експорт `.psc` як PractiScore `match_level`), **`participant_list_visibility`**, прематч, скводи, `discipline` (MVP `shotgun`), `ps_match_*`, статус… |
| **`match_squads`** | Скводи: `sort_order`, `capacity`, опційний `squad_starts_at`, **`squad_phase`** — значення **`main`** або **`prematch`**. Рядки вирівнюються через RPC **`organizer_sync_match_squads`**; скорочення блокується, якщо на «зникаючих» місцях лишилися активні заявки. |
| **`match_registrations`** | Одна заявка на пару (**match**, **стрілок**): `division`, клас, PF, `categories` JSONB, `status` pending/confirmed/cancelled, `payment_note`, **`phone`**, **`weapon_details`**, **`competitor_region`** (знімок регіону з профілю на момент заявки), `confirmed_at/by`. Після **скасування** стрілець знов подає заявку через **UPDATE** того ж рядка (**`cancelled` → `pending`**), щоб не порушувати унікальність пари матч/стрілок. |
| **`participant_registration_defaults`** | Один рядок на **стрільця**: типові поля (`division`, `classification_grade`, **`power_factor`**, **`region`**, **`categories`** `text[]`, **`weapon_class`**, **`phone`**, **`weapon_details`**, **`first_name`**, **`last_name`**, **`avatar_url`**) для автопідстановки, фото та експорту (ім’я/прізвище → PractiScore); якщо заявки на цей матч ще немає — префіл у публічну форму (**`/{locale}/account`** або картка матчу). |
| **`match_stage_links`** | Порядок вправ: **`share_stage_id`** → поточний **`shared_stages.id`**, **`share_group_id`** (опційно заповнюється при створенні лінка та бекфілиться з share) — одна група = ланцюжок view-публікацій; **`snapshot_meta`** JSONB; оновлення до останнього view у групі — RPC **`organizer_refresh_match_stage_link_latest`**. |

Тригер **`set_updated_at_match_admin()`** підтримує `updated_at`.

**Realtime:** блок наприкінці міграції додає `match_registrations` до `supabase_realtime`; при помилці (локально / дублікат) пише NOTICE і не падає.

---

## Безпека (RLS, скорочено)

- **`matches`:** читання `anon` лише **`status = published`**, інакще організатор бачить свої чернетки/cancelled тощо; **INSERT / UPDATE / DELETE** — якщо `organizer_id = auth.uid()` **і** (після міграції **`20260502140000_...`**) профіль організатора **`organizer_status = 'active'`**.
- **`match_squads` / `match_stage_links`:** читання, якщо матч видимий (**`published`** для `anon` або організатор власника); публічна картка матчу в порталі (гість) показує **програму** як упорядкований список із **`match_stage_links`**, з посиланнями на перегляд `/v/:share_stage_id`; **зміни** — лише активний організатор того матчу (після платформеної міграції політики використовують **`match_organizer_write_allowed`**).
- **`match_registrations`:** стрілець читає/створює свою заявку на **published** матч; організатор читає та **оновлює** лише коли активний (`organizer_status = 'active'` у профілі); стрілець може перевести **pending → cancelled** і **повторно подати заявку** через **UPDATE** того ж рядка (**cancelled → pending**), див. **`20260524120000_...`**; організатор — підтвердження офлайн оплати (`payment_note`, `status`, `confirmed_*`). **Anonymous** таблицю не бачить (списки без логіну — окремий RPC пізніше).
- **`participant_registration_defaults`:** авторизований користувач бачить і змінює лише власний рядок (**`user_id = auth.uid()`**); для автопідстановки форми та кабінету стрільця.

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
   - **`platform_list_match_organizers()`** — список: email, ім’я, статус, кількість матчів, текст заявки та **`organizer_moderation_note`** (лише для платформеного адміна); після міграції **20260509120000**.
   - **`platform_set_match_organizer_status(p_target_user uuid, p_status text, p_moderation_note text default null)`** — встановити `pending` / `active` / `blocked`; **`p_moderation_note`** використовують при **`blocked`** (видно автору профілю); двоаргументний виклик сумісний (третій аргумент за замовчуванням **`null`**).

3. **UI:** у застосунку — **`/{uk|en}/admin/organizers`** (маршрут з’являється лише з **`VITE_ENABLE_MATCH_PORTAL`**, як і публічна картка матчу). Увійти тим користувачем, чий `user_id` додано в **`portal_platform_admins`**.

4. **Seed:** після обох міграцій скрипт **`supabase/seed/match_admin_test_seed.sql`** додає seed-організатора в **`portal_platform_admins`** і виставляє йому **`organizer_status = 'active'`**, щоб можна було відкрити адмінку локально.

---

## Обліковий запис у шапці порталу

- **`/{locale}/account`** — вхід через Supabase Email, пояснення ролей, подача заявки організатора (форма з опційним контактом та посиланнями), для організатора посилання на **`/{locale}/matches/my`**, кнопка виходу.
- У **`PortalShell`**: «Увійти» або в один ряд — **іконка облікового запису** (email лише в підказці та `aria-label`), кнопка виходу; бейджів ролей немає — статус організатора лише на **`/{locale}/account`**. Компактний режим (**гамбургер**, виїзна панель) якщо **вузьке вікно** (`matchMedia` **≤ 959px`) **або** вузький фактичний ряд хедера (**`ResizeObserver`**, те саме — наприклад у вбудованому прев’ю Cursor із широким зовнішнім вікном та вузьким iframe). Кореневий клас **`portal-shell--nav-compact`** скидає конфлікт «широке вікно / компактний ряд»: гамбургер і drawer стилять **за JS**, без прив’язки лише до `(max-width: 959px)`. На ширших рядках у розгорнутому режимі — блок праворуч **flex**, без **`display: contents`** (стабільніше в браузерах).

---

## Організатор — «Мої матчі»

При **`VITE_ENABLE_MATCH_PORTAL`**: **`/{locale}/matches/my`** — список; **`/{locale}/matches/my/new`** — створення; **`/{locale}/matches/my/:matchId`** — картка матчу (прематч, **кількість скводів** та **стрільці на скводі**; ліміт обчислюється автоматично); **`/{locale}/matches/my/:matchId/roster`** — перерозподіл заявок по скводах. Публічна картка — **`/{locale}/matches/:matchId`**. Запис у **`matches`** — лише активний організатор (RLS); після збереження застосунок викликає **`organizer_sync_match_squads`**.

---

## Тестові дані (seed)

Файл **`supabase/seed/match_admin_test_seed.sql`** — вставити в **SQL Editor** і виконати (**Run**) під роллю **postgres** (як і міграція). Або з кореня репо (після **`npm run supabase:link`**): **`npm run supabase:seed:match-all`** — див. **`supabase/README.md`**.

**Якщо `auth.users` порожня:** скрипт сам створить **два** тестових користувачі + записи в `auth.identities` (`stagebuilder.seed.md@local.test`, `stagebuilder.seed.shooter@local.test`, один пароль `SeedOnly_ChangeMe_9` — змінити або видалити після тесту). На початку файлу виконується `CREATE EXTENSION IF NOT EXISTS pgcrypto` (якщо відмовить — увімкни **pgcrypto** у Extensions). Повторний запуск **пропускається**, якщо матч з такою назвою вже є — спочатку `DELETE`, як у кінці файлу.

**Якщо користувачі вже є:** перший за `created_at` — організатор матчу, останній — перший стрілець у заявці; за потреби друга заявка — організатор на другому скводі. Один користувач дає лише одну заявку.

Створюється опублікований матч **`Seed: Test shotgun match`**, два **main**-скводи та 1–2 початкові заявки; заявка стрільця `comp_id` одразу **`confirmed`** з тестовою `payment_note`. Далі додається **по чотири підтверджених тестових стрільця** (`stagebuilder.seed.extra.main1.u1…u4@local.test`, `…main2…`) у кожен main-сквод — зручно для режиму **Дошка скводів**. У профілях — українські ПІБ для карток ростера; пароль нових юзерів той самий **`SeedOnly_ChangeMe_9`**.

Якщо матч уже існує після старішого запуску seed **без** цих 8 заявок, виконай під **postgres**: **`supabase/seed/match_admin_seed_add_extra_board_shooters.sql`** (повтор безпечний — не дублює email/заявки).

**Матч «Тестовий матч (CLI)» до 65 стрільців:** **`supabase/seed/match_admin_fill_test_match_cli_65_shooters.sql`** створює синтетичних учасників (`confirmed`) і розподіляє їх по скводах за залишком місткості (**сума `capacity` ≥ 65**). За замовчуванням шукає матч за **`title`**, або задай **`p_match_id`** у блоці `DECLARE`. CLI (**після link**): **`npm run supabase:seed:test-match-cli-65`**. Опційно виставляє **`payment_received = true`** для тестового рядка (окремий прапор у БД, не впливає на публічну таблицю після **`20260521130000_public_roster_registration_status`**). Email формату `stagebuilder.cli65.<random>@local.test`, пароль **`SeedOnly_ChangeMe_9`** — змінити або видалити після тесту.

**Не seed-матч** (інша назва / UUID з URL організатора картки матчу): ті самі 8 людей із тими самими email — файл **`supabase/seed/match_admin_attach_extra_board_testers_by_match_uuid.sql`**: у блокі `DECLARE` замінити **`mid`** з нульового UUID на потрібний **`match.id`**. Потрібні щонайменше **два** main-скводи. Приклад із CLI (**після link**): `npx supabase db query --linked -f supabase/seed/match_admin_attach_extra_board_testers_by_match_uuid.sql`. Не записуй файл із BOM (краще редактор «UTF-8» без BOM) — інакше `db query` може впасти з помилкою синтаксису.

**Імпорт ростеру з реального PSC (приклад):** **`supabase/seed/klassifikatsiyni_rushnytsia_etap2_2026_from_psc_stage1_roster.sql`** — створює опублікований матч «…Етап 2 2026р.», **5** підтверджених учасників з PractiScore-експорту (усі були без поділу на скводи в PS → **один** main-сквод), без вправ. Перед виконанням задати або **`v_org_id`**, або мати активного організатора в профілі. Застосувати з кореня: **`npm run supabase:seed:klassifikatsiyni-etap2`** (**після** `npm run supabase:link` і бажано наявного активного організатора або рядка **`v_org_id`** у файлі).

**Примітка про каталог матчів у UI:** публічний хаб **`/:locale/matches`** показує лише майбутні або сьогоднішні за **`starts_at`** (UTC, від початку дня). Якщо матч із сиду «в минулому» — у списку не з’явиться, але прямий **`/:locale/matches/<uuid>`** відкриється.

Публічна сторінка матчу показує таблицю **Учасники** лише якщо в картці матчу **`participant_list_visibility = open`**. RPC **`fetch_public_match_roster`** (міграції **`20260520120000_…`**, **`20260521130000_public_roster_registration_status`**) повертає активні заявки **`pending` та `confirmed`**: сквод, фаза, ім’я, дивізіон, **`categories`**, статус (**той самий `match_registrations.status`**, що в розділі організатора «Заявки» — колонка «Підтвердження» на картці). Без **`payment_note`** і без **`user.id`**.

**Примітка.** Окремо в таблиці заявок є **`payment_received`** (чи отримано внесок); на публічній картці вона **не** дублюється в останній колонці — звертайтесь до організаторської таблиці / майбутнього UX, якщо потрібна окрема ознака оплати.

**Перевірка:** Table Editor → **`match_registrations`** — мають з’явитися рядки. Кнопка **Insert** вручну під RLS часто не підходить без сесії того ж користувача — seed через SQL обходить RLS.

**Вправи матчу (програма):** на сторінці редагування організатора **`/{locale}/matches/my/:matchId`** блок **«Вправи програми»** — вставка URL перегляду **`/v/:id`** або короткого id (`s…`), порядок (↑/↓), прибирання рядка; **«Оновити до останньої»** викликає RPC **`organizer_refresh_match_stage_link_latest`** (потрібні **`share_group_id`** у рядку та нова view-публікація в тій самій групі). Кнопка **«Оновити всі вправи до останніх»** послідовно оновлює кожен рядок тим самим RPC.

**Видалення seed:** у кінці файлу закоментовано `DELETE FROM matches WHERE title = 'Seed: Test shotgun match'` (каскад прибере скводи й заявки).

---

## Edge Functions (опційно, матчі)

Код у репозиторії: **`supabase/functions/organizer-application-notify/`** — листи про нові заявки організатора (Resend, Database Webhook, секрети). Деталі: [SUPABASE_ORGANIZER_APPLICATION_ALERTS.md](./SUPABASE_ORGANIZER_APPLICATION_ALERTS.md).

---

- [SUPABASE_SHARED_STAGES.md](./SUPABASE_SHARED_STAGES.md)
- [TECH.md](./TECH.md)
