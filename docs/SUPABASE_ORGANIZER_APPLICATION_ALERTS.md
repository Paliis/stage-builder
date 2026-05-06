# Сповіщення про нові заявки організатора

Після міграції **`20260509120000_organizer_application_fields.sql`** заявки створюються як **`INSERT`** у **`public.match_admin_profiles`** зі **`organizer_status = 'pending'`** (самоподача з **`/{locale}/account`**). Нижче — способи отримати сповіщення без змін фронтенду.

## Email: Resend + Edge Function `organizer-application-notify` (рекомендовано для листів)

У репозиторії є функція **`supabase/functions/organizer-application-notify/`**: вона приймає **Database Webhook** (подія **`INSERT`** на **`match_admin_profiles`**), перевіряє заголовок секретом і надсилає лист через **[Resend](https://resend.com/)** на всі адреси з секрету **`ORGANIZER_NOTIFY_EMAILS`** (через кому чи крапку з комою).

### 1. Resend

1. Створи акаунт / API key у Resend.
2. Для продакшену — **верифікований домен** і **`From`** із цього домену. Для швидкого тесту можна тимчасово **`onboarding@resend.dev`** (обмеження згідно з документацією Resend).

### 2. Секрети Supabase (Edge Functions → Secrets)

**Отримувачі продакшен-листів** — секрет **`ORGANIZER_NOTIFY_EMAILS`**: один рядок із двох адрес через кому (**`parshencevdenis@gmail.com,gpssystemdp@gmail.com`** або з пробілом — функція нормалізує розділювачі). Це офіційно зафіксовані отримувачі для цього порталу; надсилання працюватиме лише коли такий самий рядок записаний у **Edge Functions → Secrets** хмарного проєкту й налаштовані Resend + webhook нижче.

У **Supabase Dashboard → Project Settings → Edge Functions → Secrets** (або CLI):

```bash
npx supabase secrets set RESEND_API_KEY=re_xxxxxxxx
npx supabase secrets set RESEND_FROM='Shooters Tools <noreply@твій-домен>'
npx supabase secrets set ORGANIZER_NOTIFY_EMAILS='parshencevdenis@gmail.com,gpssystemdp@gmail.com'
npx supabase secrets set ORGANIZER_NOTIFY_WEBHOOK_SECRET='вигадуй-довгий-випадковий-рядок'
npx supabase secrets set PORTAL_BASE_URL='https://твій-публічний-сайт'
```

**`PORTAL_BASE_URL`** — опційно: у листі буде посилання на **`{PORTAL_BASE_URL}/uk/admin/organizers`**. Якщо не задати — у лишиться лише текст підказки без URL.

### 3. Деплой функції

Вебхук викликає функцію **без JWT користувача**, тому після першого деплою вимикай перевірку JWT для цієї функції:

```bash
npx supabase functions deploy organizer-application-notify --no-verify-jwt
```

### 4. Database Webhook

1. **Dashboard → Database → Webhooks** → **Create a new hook**.
2. **Table:** `public.match_admin_profiles`.
3. **Events:** **Insert**.
4. **HTTP Request:**
   - **URL:**  
     `https://<PROJECT_REF>.supabase.co/functions/v1/organizer-application-notify`  
     (`PROJECT_REF` — **Project Settings → General → Reference ID**.)
   - **HTTP method:** POST.
   - **Headers:** додати  
     **`x-organizer-notify-secret`** = той самий рядок, що **`ORGANIZER_NOTIFY_WEBHOOK_SECRET`**.

Фільтрувати в UI необов’язково: функція сама реагує лише на **`INSERT`** із **`organizer_status = pending`** та без **`organizer_moderation_note`** (як типова самоподача заявника).

---

## Альтернатива: лише Slack / Make / Zapier (без Resend)

1. У дашборді Supabase: **Database** → **Webhooks** → **Create a new hook**.
2. **Table:** `public.match_admin_profiles`.
3. **Events:** Insert.
4. **HTTP Request:** POST на Incoming Webhook **Slack** або ендпойнт **Make / Zapier** (далі з їхнього боку — відправка email).

Приклад ідеї для Slack:

```json
{
  "text": "New organizer application: {{ record.user_id }}"
}
```

(поля залежать від формату payload у вашій версії Supabase — подивіться тестовий виклик webhook у дашборді.)

---

## Поля заявки (для шаблону листа / повідомлення)

- **`record.user_id`** — UUID заявника.
- **`organizer_application_contact`** — контакт із форми.
- **`organizer_application_past_matches`** — текст / посилання на минулі матчі.
- **Email** у **`auth.users`** у тілі INSERT webhook **не приходить**; дивитись у **Dashboard → Authentication** або в адмінці **`/admin/organizers`** після **`platform_list_match_organizers`**.

Деталі схеми та RPC: **[SUPABASE_MATCH_ADMIN.md](./SUPABASE_MATCH_ADMIN.md)**.
