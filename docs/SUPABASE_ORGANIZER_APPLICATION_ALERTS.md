# Сповіщення про нові заявки організатора

Після міграції **`20260509120000_organizer_application_fields.sql`** заявки створюються як `INSERT` у **`match_admin_profiles`** зі **`organizer_status = 'pending'`**. Події в БД можна переслати в Slack, email через сервіс розсилок або власний HTTP-ендпойнт **без змін коду фронтенду**.

## Варіант A: Supabase Database Webhooks (рекомендовано для старту)

1. У дашборді Supabase: **Database** → **Webhooks** → **Create a new hook**.
2. **Table:** `public.match_admin_profiles`.
3. **Events:** Insert (за потреби також Update, якщо згодом зміниться логіка).
4. **HTTP Request:** POST на URL Incoming Webhook **Slack** або ендпойнта **Make / Zapier**.
5. **Filters (якщо підтримується інтерфейсом):** залишити лише рядки з `organizer_status = 'pending'` і, за бажанням, `matches_count` з подальшого запиту — або перевірити `record.organizer_status` у тілі шаблону webhook.

Шаблон тіла залежить від провайдера; для Slack зазвичай достатньо JSON на кшталт:

```json
{
  "text": "New organizer application: {{ record.user_id }}"
}
```

(підставте поля з payload webhook згідно з документацією Supabase).

## Варіант B: Edge Function + тригер HTTP

Якщо потрібен підпис секретом або складна логіка, додайте Edge Function і викликайте її через **Database Webhook** із заголовком `Authorization: Bearer <secret>`; секрет тримається в змінних оточення проєкту Supabase.

## Поля заявки (для шаблону повідомлення)

- **`organizer_application_contact`** — контакт із форми заявника.
- **`organizer_application_past_matches`** — текст / посилання на минулі матчі.
- **`email`** із **`auth.users`** доступний платформеному адміну лише через RPC/UI; для webhook на INSERT використовуйте **`record.user_id`** і за потреби окремий запит або розширення події (залежить від конфігурації).

Деталі схеми та RPC: **[SUPABASE_MATCH_ADMIN.md](./SUPABASE_MATCH_ADMIN.md)**.
