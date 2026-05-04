# Supabase Auth: листи підтвердження та ім’я відправника

Текст **«Confirm your signup»**, **«powered by Supabase»** і **ім’я відправника** задаються **не в коді Stage Builder**, а в **проєкті Supabase** (Dashboard) і/або у **SMTP-провайдера**.

Цей файл — **довідник** (змінні шаблону, поля SMTP, типові причини `localhost` у листі), а не покроковий мануал. Повний шлях налаштування — у [документації Supabase](https://supabase.com/docs/guides/auth) та провайдера пошти.

Після підтвердження email Supabase редіректить на **`/{locale}/auth/email-callback`** на вашому домені (параметр **`next`** задає клієнт при реєстрації). Ці URL мають бути в **Authentication → URL Configuration → Redirect URLs** (прод, `www`, `localhost` для dev).

## 1. Шаблони листів (коротко)

У Dashboard: **Authentication** → **Email Templates** — шаблони **Confirm signup** тощо; у HTML використовуйте змінні з підказок редактора (`{{ .ConfirmationURL }}`, `{{ .SiteURL }}`). Якщо в шаблоні є **`{{ .Token }}`** (6-значний код), клієнт порталу після реєстрації пропонує ввести код і викликає **`verifyOtp`** — лінк у листі для підтвердження не обов’язковий (можна прибрати `{{ .ConfirmationURL }}`, щоб не провокувати сканери пошти). Тема листа — у тому ж екрані.

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

## 6. Посилання в листі веде на `localhost` (зокрема з телефона)

**Чому так:** у листі підтвердження URL зазвичай будується з **Authentication → URL Configuration** у Supabase і/або з **`emailRedirectTo`**, який фронт передає при `signUp` (у Stage Builder це **поточний origin браузера** + шлях сторінки, наприклад `/uk/account`). Якщо реєстрацію відкрили на **`http://localhost:3000`**, у лист потрапить саме він.

**На телефоні `localhost` — це сам телефон**, не ваш ПК, тому з’являється **ERR_CONNECTION_REFUSED**.

**Що зробити**

1. У Supabase: **Authentication** → **URL Configuration**:
   - **Site URL** — поставте **продакшен-URL** сайту (наприклад `https://shooters-tools.com` або той, що на Vercel), **не** `http://localhost:…`.
   - **Redirect URLs** — додайте маски продакшену (наприклад `https://shooters-tools.com/**`) і за потреби окремо dev (`http://127.0.0.1:5173/**`), якщо тестуєте локально з ПК.
2. Зареєструйте тестового користувача **з браузера на проді** (той самий URL, що в **Site URL**), щоб у листі було **https://…**, а не localhost.
3. Старий лист з localhost можна ігнорувати; після зміни налаштувань надішліть підтвердження ще раз (нова реєстрація або **Resend confirmation** з Dashboard, якщо доступно).

Офіційно: [Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls).

## 7. Корисні посилання

- [Supabase — Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Supabase — Send emails with custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp)
- [Resend — SMTP credentials](https://resend.com/docs/send-with-smtp)
