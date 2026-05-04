# Supabase Auth: листи підтвердження та ім’я відправника

Текст **«Confirm your signup»**, **«powered by Supabase»** і **ім’я відправника** задаються **не в коді Stage Builder**, а в **проєкті Supabase** (Dashboard) і/або у **SMTP-провайдера**.

## 1. Змінити текст і вигляд листа

1. У [Supabase Dashboard](https://supabase.com/dashboard) відкрийте проєкт → **Authentication** → **Email Templates**.
2. Окремо редагуються шаблони: **Confirm signup**, **Magic link**, **Reset password** тощо.
3. У HTML можна використовувати змінні Go templates, наприклад:
   - `{{ .ConfirmationURL }}` — посилання для підтвердження;
   - `{{ .SiteURL }}`, `{{ .Email }}` — залежно від типу листа (див. підказки в редакторі шаблону в Dashboard).
4. **Subject** (тема листа) теж задається в цьому ж розділі.

Після зміни шаблону збережіть і надішліть тестову реєстрацію — лист має прийти з новим HTML/темою.

## 2. Інше «від кого» (display name) і свій домен

У **вбудованої** доставки Supabase обмеження на кастомний бренд жорсткіші. Щоб листи йшли **від вашої назви** (наприклад, `Shooters Tools`) і за бажання з **власного домену** (`auth@…`):

1. **Project Settings** → **Authentication** → увімкніть **Custom SMTP** (Postmark, Resend, SendGrid, Amazon SES тощо).
2. У провайдера налаштуйте **From name** (ім’я в поштовому клієнті) та **From email** (після верифікації домену).

Без власного SMTP «альфа-ім’я» та домен залишаються в рамках політики Supabase для вашого тарифу.

## 3. Мова листа (українська / англійська)

У Dashboard зазвичай **один** HTML-шаблон на тип листа для всього проєкту. Варіанти:

- Один шаблон **двомовний** (укр + англ у одному листі);
- або логіка розсилки через **Edge Function** / зовнішній сервіс (складніше, не в цьому репозиторії за замовчуванням).

## 4. Мінімальна довжина пароля в проєкті

У **Authentication** → **Providers** → **Email** (або **Password** / політики залежно від версії UI) перевірте **мінімальну довжину пароля**. У клієнті Stage Builder для форми входу/реєстрації зараз очікується **не менше 8 символів**; якщо в Dashboard встановлено більше (наприклад, 12) — підлаштуйте або політику в Supabase, або текст підказки в i18n, щоб вони збігалися.

## 5. Resend → поля в Supabase Custom SMTP

У [Resend — Send with SMTP](https://resend.com/docs/send-with-smtp) зазначено такі **облікові дані**:

| Поле в Supabase | Значення |
|-----------------|----------|
| **Host** | `smtp.resend.com` |
| **Port** | `587` (STARTTLS) або `465` (SSL) — зазвичай спочатку пробують **587**. |
| **Username** | `resend` |
| **Password** | повний **API key** (рядок `re_…`), не назва ключа «Shooters-Tools». |

**Важливо**

1. У Resend має бути **верифікований домен**; адреса **From** у Supabase (і в шаблонах Auth) має бути з цього домену (наприклад `noreply@ваш-домен`). Для швидкого тесту інколи використовують `onboarding@resend.dev` — лише для перевірки, не для продакшену.
2. Ключ **не варто** вставляти в репозиторій чи в `.env` фронту — лише в **Supabase Dashboard** (SMTP) або в секретах бекенду.
3. Якщо в Resend є обмеження за **типом ключа** — для продакшену краще окремий ключ з мінімальними правами, якщо провайдер це дозволяє (документація Resend щодо permissions).

## 6. Корисні посилання

- [Supabase — Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Supabase — Send emails with custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp)
- [Resend — SMTP credentials](https://resend.com/docs/send-with-smtp)
