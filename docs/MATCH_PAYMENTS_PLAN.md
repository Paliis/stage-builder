# Модуль «Події» — оплата стартових внесків (план)

**Статус:** **Mono MVP реалізовано** на staging ([stage-builder-staging.vercel.app](https://stage-builder-staging.vercel.app)); **не** увімкнено на prod (`VITE_ENABLE_MATCH_PORTAL` вимкнено на shooters-tools.com) — чекліст flip: [MATCH_PORTAL_PRODUCT_PLAN.md §6](./MATCH_PORTAL_PRODUCT_PLAN.md#6-prod-gate-увімкнення-матчів-на-shooters-toolscom).  
**Беклог:** **[BACKLOG_MATCHES.md](./BACKLOG_MATCHES.md)** → фаза **P** (`MA-P04`…`P06` **done**).  
**Зв’язок:** фаза B — [MATCH_REGISTRATION_AND_PSC_PLAN.md §4](./MATCH_REGISTRATION_AND_PSC_PLAN.md#фаза-b--підтвердження-реєстрації-й-облік-оплати-без-платіжних-шлюзів); деплой — [TECH.md](./TECH.md); handoff — [CHAT_HANDOFF.md](./CHAT_HANDOFF.md).

**Останнє оновлення:** 2026-06-01 — E2E тестовий токен api.monobank.ua; webhook + `POST /api/payments/reconcile`.

---

## 1. Що вже є в коді

| Поле / UI | Призначення |
|-----------|-------------|
| `match_registrations.payment_received` | Прапор «внесок отримано» |
| `paid_at`, `payment_provider`, `external_payment_id` | Онлайн Mono (після webhook / reconcile) |
| `participant_payment_option` | `bank_transfer` \| `on_site` при подачі заявки |
| `payment_note` | Текст організатора (офлайн) |
| `matches.entry_fee_*_kop` | Три тарифи внеску (§9) |
| `organizer_payment_providers` | X-Token Mono (service role only) |
| `match_mono_invoices` | `invoice_id` ↔ `registration_id` |
| **MA-B01** | Ростер/заявки: підтвердження + примітка |
| **MA-P04…P06** | Онлайн Mono на staging (див. §7, §11) |

---

## 2. Принципи (не змінювати без окремого рішення)

1. **Не зберігати** номери карток, CVV, IBAN платника, повні чеки з ПД стрільців.
2. **Можна зберігати:** `payment_received`, `paid_at`, `payment_provider`, `external_payment_id` (id замовлення у провайдера) — для idempotency і спорів.
3. **Форма оплати** — завжди на стороні провайдера (redirect / hosted page); мінімальне PCI-навантаження на платформу.
4. **Внески за змагання** — послуга **організатора**; платформа — технічний сервіс (оферта матчу, [правила сайту](../src/i18n/messages.ts) → `legal.siteTermsSections`).

---

## 3. Моделі «хто мерчант»

| Модель | Хто приймає гроші | Onboarding клубу | Складність для платформи |
|--------|-------------------|------------------|---------------------------|
| **A — ключі організатора** | ФОП/ТОВ клубу (LiqPay, Mono acquiring, WayForPay) | Клуб реєструється у провайдера сам; вводить ключі в Shooters Tools | Низька юридично; середня технічно (Vault, webhooks) |
| **B — єдиний мерчант платформи** | ФОП Shooters Tools | Клуби без власного еквайрингу | Висока (договори, розподіл, звітність) |
| **C — маркетплейс / агрегатор** (пропозиція **Portmone**) | Часто платформа + **split** субмерчантам | Клуб підключається **через** платформу | Висока (KYC субмерчантів, договори, комісії на всіх) |

**Узгоджений напрямок обговорення (2026-05):** спочатку **модель A** або покращений **офлайн (0% комісії)**; **Portmone marketplace** — окреме рішення, ближче до **C**, не до «тільки IBAN».

**Не плутати з BL-016–018** ([BACKLOG.md](./BACKLOG.md)): маркетплейс **контенту** (пакети вправ, курси) — інший продуктовий шар, відкладено.

---

## 4. Рівні продукту (дорожня карта)

| Рівень | Організатор | Авто `payment_received` | Комісія еквайрингу |
|--------|-------------|-------------------------|-------------------|
| **0 — зараз** | IBAN / інструкція в тексті матчу; «на місці» | Ні (ручний toggle) | **0%** |
| **1 — покращений офлайн** | Сума внеску, QR (IBAN+сума+код заявки), колонка «Оплачено» в UI | Ні | **0%** |
| **1b — jar** | Одне посилання Monobank jar | Ні | **0%** |
| **2 — онлайн (A)** | Підключення LiqPay / Mono X-Token / WayForPay у профілі | Так (webhook) | ~1,3–2% (тариф ФОП) |
| **3 — маркетплейс (C)** | Реєстрація клубу через Portmone / платформу | Так | За договором Portmone + можлива комісія платформи |

**«Тільки IBAN»** не дає webhook без еквайрингу або доступу до API виписки банку організатора (не цільовий шлях).

---

## 5. Провайдери UA (орієнтир для моделі A)

| Провайдер | Credentials організатора | Webhook | Примітка |
|-----------|-------------------------|---------|----------|
| **LiqPay** | `public_key` + `private_key` | POST `data` + signature | Найпоширеніший; sandbox |
| **Monobank Acquiring** | **X-Token** (одне поле) | `X-Sign` ECDSA | Зручний onboarding; потрібен merchant, не jar |
| **WayForPay** | `merchantAccount` + `SecretKey` | `serviceUrl`, HMAC-MD5 | Popup/redirect; MMS sub-merchants — для маркетплейсу, не MVP |
| **Fondy** | `merchant_id` + secret | `server_callback_url` | Альтернатива |
| **Portmone** | login/password або payeeId; **marketplace** — окремий контур | POST на URL | Складніший onboarding; пропозиція — реєстрація **як маркетплейс** (див. §6) |

**Jar Monobank** (як у footer донату) — **не** merchant API: без автоматичного статусу.

Орієнтовні комісії (не договір): переказ IBAN **0%** еквайрингу; Mono ~**1,3%**; LiqPay ~**1,5%**; WayForPay ~**2%**.

---

## 6. Portmone — маркетплейс (контакт 2026-05)

**Пропозиція:** зареєструвати Shooters Tools **як маркетплейс** (платформа — головний контур еквайрингу, клуби — субмерчанти / split).

**Відмінність від моделі A:** клуб може **не** мати власного LiqPay; платформа бере на себе KYC, договори, можливо єдиний чек. Це наближається до **моделі C** і **WayForPay MMS** (свідомо відкладали в обговоренні).

**Питання на зустріч з Portmone:**

1. Хто **юридично мерчант** у чеку — платформа, клуб, обидва?
2. **Split / виплата** на ФОП організатора — строки, комісії, окремий договір клуб ↔ Portmone?
3. Повна **комісія** (% + фікс); хто платить (організатор / стрілець).
4. **Webhook:** підпис, статуси success/refund; прив’язка `order_id` = `registration_id` → `payment_received`.
5. Вимоги до **маркетплейсу**: KYC субмерчантів, ліміти, **sandbox**, мінімальний оборот.

**Рішення поки не прийнято** — після відповідей оновити §3 і пріоритет MA-P0x.

---

## 7. Технічний потік (модель A / webhook)

```text
Стрілець → POST /api/create-payment { registrationId }  (Bearer session)
         → сервер: organizer mono_x_token (service role), сума з entry_fee_*_kop
         → POST Mono /api/merchant/invoice/create
              merchantPaymInfo.reference = registration_id (UUID)
              merchantPaymInfo.destination = «Внесок: {title матчу}»
              webHookUrl = {origin}/api/payments/webhook/mono
              redirectUrl = {origin}/{locale}/matches/{id}?payment=return
         → redirect на pay.monobank.ua
         → оплата на стороні Mono
         → webhook POST /api/payments/webhook/mono (X-Sign ECDSA, raw body)
         → applyMatchMonoPaymentSuccess: payment_received, paid_at, provider=mono, status=confirmed
```

**План B (якщо webhook не встиг):** після return UI викликає **`POST /api/payments/reconcile`** — `GET` статус інвойсу в Mono, той самий `applyMatchMonoPaymentSuccess`.

**Локальний dev:** webhook URL = `VITE_SHARE_PUBLIC_ORIGIN` (HTTPS staging), redirect = localhost (`resolveMatchPaymentUrls.ts`).

Публічний ростер **не** показує payment id.

---

## 8. UX (узгоджено для Mono MVP)

**Рівень організатора (один раз):** підключення **Monobank Acquiring** — поле **API-токен** у UI (у HTTP-запитах Mono — заголовок `X-Token`; маскується після збереження), кнопка **«Перевірити»** — лише перевірка (**`GET /api/merchant/pubkey`**, без списання).  
**Рівень матчу:** за замовчуванням **офлайн + онлайн** (кнопка «Сплатити онлайн» лише якщо у організатора підключено Mono); **три суми внеску** (див. §9); інструкція для офлайн. Семінари — **ті самі** правила, що й матчі.  
**Стрілець:** після заявки — «Сплатити онлайн»; сума за §9 (тариф за категоріями); після успішного webhook — **оплата зафіксована + участь `confirmed`**.  
**Організатор — заявки:** колонка «Оплачено»; badge «онлайн»; ручний toggle для офлайн.

Зберігання секретів: `organizer_payment_providers.mono_x_token` (RLS revoke для anon/authenticated; запис лише через API з service role). **Vault** — заплановано, поки не в проді-коді. Клієнт бачить лише `token_hint` + `verified_at` (RPC).

---

## 9. Зафіксовані продуктові рішення (2026-05-23)

| Тема | Рішення |
|------|---------|
| Модель мерчанта (перша хвиля) | **A** — X-Token організатора; **тільки Mono** у prod (LiqPay пізніше) |
| Оплата → участь | Webhook success → **`payment_received`** + **`status = confirmed`** (auto-confirm) |
| Неоплачена `pending` | **Безстроково** тримає слот (дедлайн / waitlist — фаза **W**, не блокує Mono MVP) |
| Режим на матчі | За замовчуванням **реквізити/на місці + онлайн**, якщо Mono підключено |
| Комісія еквайрингу | **З ФОП організатора** (стрілець платить заявлену суму тарифу) |
| Семінари | Ті самі правила оплати, що й матчі |
| Перевірка Mono в кабінеті | **Без грошей** — валідність X-Token через API (pubkey) |
| Portmone marketplace | Відкладено (**MA-P08**) |

### Тарифи внеску (три суми на матчі)

Організатор на картці матчу вводить **три суми в UAH** з фіксованими назвами в UI:

| Тариф (UI) | Поле в БД (орієнтир) | Сума застосовується, якщо в заявці є категорія |
|------------|----------------------|-----------------------------------------------|
| **Стандарт** | `entry_fee_standard_kop` | Немає пільгових категорій з таблиці нижче |
| **Військовий** | `entry_fee_military_kop` | `military` |
| **Леді / Юніори** | `entry_fee_lady_junior_kop` | `lady`, `junior`, `lady_junior` |

**Пріоритет:** якщо підходить кілька пільг — береться **найнижча** з трьох сум (найвигідніший для стрільця тариф). Каталог id — `src/portal/shooterProfileCatalog.ts` (`SHOOTER_CATEGORIES`). Інші категорії (сеньйор, super senior, `general` тощо) не змінюють тариф без окремого рішення.

**Онлайн:** `create-payment` рахує суму за категоріями заявки на момент оплати; `reference` / metadata → `registration_id`.

### Ще відкрито (не блокує старт коду)

| Тема | Статус |
|------|--------|
| Portmone marketplace (§6) | Після зустрічі з провайдером |
| Тестовий інвойс 1 UAH у «Перевірити» | Не в MVP |
| Waitlist + `payment_deadline_at` | **MA-W\***, окремо від Mono |

---

## 10. Що не робити

- Зберігати private key у `localStorage` або підписувати платіж на фронті.
- Парсити виписку Monobank організатора без явного договору.
- Обіцяти «ввів IBAN — webhook сам».
- Власна форма введення картки на домені Shooters Tools.

---

## 11. Демо (staging)

**URL:** [stage-builder-staging.vercel.app](https://stage-builder-staging.vercel.app) — `VITE_ENABLE_MATCH_PORTAL=1`, той самий Supabase що prod.

**Онлайн Mono (E2E, 2026-06):** тестовий X-Token з [api.monobank.ua](https://api.monobank.ua/) → організатор `/matches/my` → внески в матчі → стрілець «Сплатити онлайн» → після оплати **підтверджено · Внесок оплачено**. Назва на формі Mono («Test Caption») — з профілю мерчанта в Mono, не з Shooters Tools.

**Без Portmone** — див. §6, **MA-P08**.

---

*Історія: 2026-06-01 — Mono MVP на staging, reconcile API; 2026-05-26 — перша версія; 2026-05-23 — §9 (auto-confirm, 3 тарифи).*
