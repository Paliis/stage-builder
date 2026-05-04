# Індекс планування та беклогів (Shooters Tools)

**Єдина точка входу:** куди дивитися, **яким розділом продукту** займаємося і **як позначати задачу** в чатах і комітах.

**Оновлювати:** коли з’являється новий «розділ» (модуль), окремий беклог або схема ID — додати рядок у [§ 2](#2-карта-розділів-продукту) і підрозділ у [§ 3](#3-деталі-по-розділах).

**Зв’язок:** загальний беклог **[BACKLOG.md](./BACKLOG.md)** (`BL-NNN`); модуль **«Матчі»** має окремі **`MA-*`** у **[BACKLOG_MATCHES.md](./BACKLOG_MATCHES.md)**.

---

## 1. Як говорити про поточну роботу

### Шаблон (модуль «Матчі» — є фази A–F + R)

```text
Розділ: Матчі — фаза <A|B|…|F|R> — задача MA-<фаза><NN> — <короткий зміст>
```

**Приклад:** `Матчі — фаза B — MA-B01 — підтвердження заявок і примітка про оплату`

### Шаблон (інші розділи — зазвичай лише BL або назва теми)

```text
Розділ: <Редактор | Портал | Share | RO Helper | …> — BL-<NNN> — <тема>
```

або без BL, якщо це сирий запис у USER_FEEDBACK:

```text
Розділ: RO Helper — тема «термінологія картки X» (див. RO_HELPER_V0)
```

### У комітах (англійською, коротко)

- Матчі: `matches(MA-B01): confirm registration flow`
- Загальний: `backlog(BL-032): dimension label overlap`

---

## 2. Карта розділів продукту

| Код | Розділ (як називати в чаті) | Головний план / огляд | Беклог або задачі |
|-----|----------------------------|------------------------|-------------------|
| **SB** | **Редактор** / Stage Builder | [PRODUCT.md](./PRODUCT.md), [FUNCTIONALITY.md](./FUNCTIONALITY.md), [TECH.md](./TECH.md) | [BACKLOG.md](./BACKLOG.md) — рядки **BL-*** (редактор, геометрія, PDF, …) |
| **SH** | **Share** / хмарне посилання на вправу | [BL-001_SHARE_LINK_PLAN.md](./BL-001_SHARE_LINK_PLAN.md), [SUPABASE_SHARED_STAGES.md](./SUPABASE_SHARED_STAGES.md) | **BL-001** + план у тому ж файлі (етапи A–F у специфікації) |
| **PT** | **Портал** (shell, бренд, URL, модулі, freemium) | [PORTAL_PLAN.md](./PORTAL_PLAN.md), [DESIGN_SYSTEM_V0.md](./DESIGN_SYSTEM_V0.md) | Стратегічні рядки **[BACKLOG.md](./BACKLOG.md)** + чорнові ідеї [USER_FEEDBACK.md](./USER_FEEDBACK.md) |
| **MT** | **Матчі** (реєстрація, PSC, кабінет організатора) | [MATCH_REGISTRATION_AND_PSC_PLAN.md](./MATCH_REGISTRATION_AND_PSC_PLAN.md), [MATCH_PORTAL_PRODUCT_PLAN.md](./MATCH_PORTAL_PRODUCT_PLAN.md), [MATCH_ADMIN_ARCHITECTURE.md](./MATCH_ADMIN_ARCHITECTURE.md) | **[BACKLOG_MATCHES.md](./BACKLOG_MATCHES.md)** (`MA-<фаза><NN>`) + епік у [BACKLOG.md](./BACKLOG.md) (**BL-025** … **BL-028**, **BL-033** …) |
| **RH** | **RO Helper** | [RO_HELPER_V0.md](./RO_HELPER_V0.md), [RO_HELPER_CONTENT_TZ.md](./RO_HELPER_CONTENT_TZ.md) | Контент і матриці в `docs/RO_*`; ідеї — [USER_FEEDBACK.md](./USER_FEEDBACK.md); за потреби окремі `BL-*` у [BACKLOG.md](./BACKLOG.md) |
| **IN** | Інфра / якість / реліз | [TECH.md](./TECH.md), [VERSIONING.md](./VERSIONING.md) | CI, деплой — зазвичай без окремого беклогу; фічі — **BL-*** |

**Правило:** якщо задача **не про матчі** — поки що використовуй **`BL-NNN`** із загального [BACKLOG.md](./BACKLOG.md). Тільки модуль Матчі має **другий рівень** нумерації **`MA-*`**, щоб не змішувати фази A–F з іншими фічами.

---

## 3. Деталі по розділах

### Розділ **Матчі** (`MT`)

1. Фази **A–F** — у [MATCH_REGISTRATION_AND_PSC_PLAN.md §4](./MATCH_REGISTRATION_AND_PSC_PLAN.md#4-фази-реалізації).
2. Розбиття на задачі **`MA-A01` … `MA-F02`** + продуктова **фаза R** — у [BACKLOG_MATCHES.md](./BACKLOG_MATCHES.md).
3. Зв’язок **BL ↔ MA** — таблиця наприкінці **BACKLOG_MATCHES.md**.
4. Схема БД: [SUPABASE_MATCH_ADMIN.md](./SUPABASE_MATCH_ADMIN.md).

### Розділ **Портал** (`PT`)

- Дорожня карта модулів і правила меж — [PORTAL_PLAN.md](./PORTAL_PLAN.md).
- Прев’ю / staging UI — [PORTAL_PREVIEWS.md](./PORTAL_PREVIEWS.md).

### Розділ **Share** (`SH`)

- Епік **BL-001**; техніка share — [SUPABASE_SHARED_STAGES.md](./SUPABASE_SHARED_STAGES.md), [PUBLISH_POLICY.md](./PUBLISH_POLICY.md).

### Розділ **Редактор** (`SB`)

- Великі напрямки (штрафні зони, активації, share, …) — зведена таблиця в [BACKLOG.md](./BACKLOG.md).
- Окремі глибокі спеки: [BL-004_ACTIVATIONS.md](./BL-004_ACTIVATIONS.md), [VISIBILITY_AND_SAFETY_RULES.md](./VISIBILITY_AND_SAFETY_RULES.md), [PLAN_FIELD_PDF_GRID.md](./PLAN_FIELD_PDF_GRID.md), тощо.

### Розділ **RO Helper** (`RH`)

- Реєстр документів — у [PROJECT_CONTEXT.md §5](./PROJECT_CONTEXT.md) (файли `RO_HELPER_*`).

---

## 4. Глобальні ідентифікатори

| Префікс | Де визначено | Значення |
|---------|----------------|----------|
| **BL-NNN** | [BACKLOG.md](./BACKLOG.md) | Скрізний беклог репозиторію; один лічильник для всіх напрямків. |
| **MA-XNN** | [BACKLOG_MATCHES.md](./BACKLOG_MATCHES.md) | Лише **модуль Матчі**: **X** = фаза (A–F або **R**), **NN** = номер у фазі. |

Нові модулі з власною фазовою нумерацією (на кшталт `MA-*`) варто заводити **лише після** явної домовленості — щоб не розмножити префікси.

---

## 5. Швидкі посилання на «планові» файли

| Файл | Призначення |
|------|-------------|
| [BACKLOG.md](./BACKLOG.md) | Головний беклог **BL-001**… |
| [BACKLOG_MATCHES.md](./BACKLOG_MATCHES.md) | Матчі: **MA-*** |
| [PORTAL_PLAN.md](./PORTAL_PLAN.md) | Стратегія порталу |
| [MATCH_REGISTRATION_AND_PSC_PLAN.md](./MATCH_REGISTRATION_AND_PSC_PLAN.md) | Матчі: фази A–F, PSC |
| [MATCH_PORTAL_PRODUCT_PLAN.md](./MATCH_PORTAL_PRODUCT_PLAN.md) | Матчі: короткий продуктовий план кроків |
| [SUPABASE_AUTH_EMAIL.md](./SUPABASE_AUTH_EMAIL.md) | Supabase Auth: шаблони листів, SMTP, ім’я відправника |
| [BL-001_SHARE_LINK_PLAN.md](./BL-001_SHARE_LINK_PLAN.md) | Share / посилання на вправу |
| [USER_FEEDBACK.md](./USER_FEEDBACK.md) | Чернетка ідей до грумінгу |

---

## 6. Історія змін цього індексу

| Дата | Зміни |
|------|--------|
| 2026-05-01 | Перша версія: карта розділів SB/SH/PT/MT/RH/IN, шаблони фраз, зв’язок BL та MA. |
