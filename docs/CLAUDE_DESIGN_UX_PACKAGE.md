# Пакет для Claude: дизайн та UI/UX сайту Shooters Tools

**Призначення:** один файл із **(1)** інструкцією, **(2)** переліком документів для контексту та **(3)** готовим **англомовним промптом** для Claude (або іншого LLM) — проектування візуальної системи, shell порталу, ключових екранів **Stage Builder** і майбутнього **RO Helper** без зламу технічних контрактів.

**Останнє оновлення:** квітень 2026.

---

## 1. Як використати з Claude

### Варіант A — Claude (веб / додаток)

1. Завантаж у чат **усі документи з розділу 2 з пріоритетом P0**, далі **P1** за обсягом контексту.
2. Скопіюй **цілком блок «Claude system / user prompt»** (розділ 3) у перше повідомлення або в поле Custom Instructions, якщо підтримується.
3. Постав уточнююче завдання в одному повідомленні, наприклад: *«Спочатку запропонуй дизайн-токени та shell порталу; потім — ключові екрани Stage Builder на мобільному»*.

### Варіант B — Claude Projects / довгий контекст

- Створи проєкт **Shooters Tools — Design**.
- У **Project knowledge** додай файли **P0 + P1** з таблиці нижче (якщо є ліміт — мінімум P0).
- У системних інструкціях проєкту встав скорочену версію розділу 3 (або перші 2 абзаци + «Follow constraints in attached PROJECT_CONTEXT and PORTAL_PLAN»).

### Варіант C — лише посилання на репо

Якщо Claude має доступ до GitHub: дай посилання на цей файл і попроси прочитати вказані шляхи в тому ж коміті/гілці.

---

## 2. Набір документів (що додати в контекст)

Усі шляхи — від кореня репозиторію **stage-builder** (модуль на GitHub: `Paliis/stage-builder`).

| Пріоритет | Файл | Навіщо для дизайну / UX |
|-----------|------|-------------------------|
| **P0** | `docs/PROJECT_CONTEXT.md` | Продукт, аудиторія, стек, **маршрути SPA**, обмеження, індекс доків |
| **P0** | `docs/PORTAL_PLAN.md` | Бренд, URL, **modular monolith**, тон, **єдина палітра**, freemium, юридичні рамки |
| **P0** | `docs/RO_HELPER_V0.md` (особливо §3 дисклеймер, §4–5.1, **§7 SOS-плитки та кольори**) | Майбутній модуль **`/ro-helper`**: плитки SOS, **5 кольорів категорій**, доступність «не лише колір» |
| **P1** | `docs/PRODUCT.md` | Глибший продуктовий опис Stage Builder |
| **P1** | `docs/FUNCTIONALITY.md` | Поведінка редактора з точки зору користувача (панелі, сцена, PDF, share) |
| **P1** | `docs/RO_HELPER_CONTENT_TZ.md` (§1 UK-термінологія) | Тон і обмеження словника для українського UI поруч із контентом |
| **P2** | `docs/TECH.md` (розділи SEO, staging, analytics — за потреби) | Обмеження noindex на preview, канонічний хост |
| **P2** | `README.md` | Короткий pitch і список фіч для маркетингових формулювань |
| **P2** | `docs/PUBLISH_POLICY.md` | Тон модалок згоди на публікацію share |

**Код (опційно, якщо вмієш читати репо):** `src/portal/PortalHome.tsx` — поточна головна порталу; `src/App.tsx` / маршрутизація — як монтується редактор.

**Не обов’язково для першого проходу:** повний `docs/RO_HELPER_CARD_MATRIX.csv` (323 рядки) — лише якщо проектуєш детальну навігацію по статтях.

---

## 3. Claude system / user prompt (скопіювати нижче)

```text
You are a senior product designer and UX architect for a web application called **Shooters Tools** (umbrella portal) with a flagship module **Stage Builder** (IPSC-style practical shooting stage editor: 2D canvas, 3D preview, briefing, PDF export, JSON, PWA). Canonical production domain: **https://shooters-tools.com**. Do not confuse with an unrelated brand **shooterstools.com** (different business).

## Hard constraints (engineering / product — do not violate)

1. **Stable public routes** (breaking them breaks competitions and QR codes): `/v/:shareId` (view shared stage), `/e/:shareId` (edit via link). Also keep `/publish-policy`, `/stage-builder`, portal home `/`.
2. **Architecture:** single **React + Vite SPA**, **modular monolith** — one design system across portal shell and modules; modules differ by **subtitle + icon**, not different visual languages.
3. **Audience:** match organizers, range officers, coaches, competitors — often **outdoors**, **mobile**, **gloves**, **stress**. Prefer large touch targets, high contrast, minimal clutter; sun readability matters.
4. **i18n:** full **Ukrainian + English** UI; content may mirror this (RO Helper articles exist as UK+EN pairs). Design labels must allow **longer strings** in both languages without truncation bugs.
5. **Legal / trust tone:** the product is **not** an official IPSC or federation rules source; disclaimers must stay **calm and visible** where rules are referenced (see product docs). Avoid implying official IPSC partnership without evidence.
6. **Upcoming RO Helper module** (`/ro-helper`): five SOS categories with **semantic colors** (safety = red urgency, penalties = amber, scoring = green, equipment = **purple**, match-admin = blue). **Never rely on color alone** — pair with icon + text (accessibility).
7. **Deliverables must be implementation-friendly** for a **small team** (solo / tiny crew): prefer **phased** recommendations (MVP vs later), avoid speculative multi-repo or heavy design systems unless justified.

## What to produce (in order)

**A. Design principles (1 page)** — 5–8 bullets: who we serve, tone (confident, practical, not playful at safety flows), density, motion (subtle), error prevention.

**B. Design tokens proposal (Markdown tables)** — at minimum:
- Color: **neutral** palette + **semantic** (success/warning/danger/info) aligned with RO Helper SOS where sensible; dark mode **optional** second phase.
- Typography: 1–2 font families (web-safe + rationale); scale for **H1–caption**, line-height for Cyrillic/Latin.
- Spacing, radii, elevation, focus ring (keyboard), minimum tap target (~44px).

**C. Information architecture** — short outline: portal home → module cards → Stage Builder vs RO Helper; language switch placement; where disclaimers live globally vs per-module.

**D. Key screens — UX flows (text wireframes + component lists)**  
Describe **layout regions**, primary actions, empty states, errors:
1. **Portal home** — module tiles, entry to Stage Builder, future RO Helper card, trust/footer.
2. **Stage Builder** — toolbar + target palette + 2D canvas + minimap + mode switches (2D/3D/PDF); **mobile** constraints (what collapses into sheets/drawers).
3. **Share publish journey** — modal steps, consent, success with copy link + QR mental model.
4. **RO Helper v0** — `/ro-helper` SOS grid, discipline picker, article view with **IPSC** body + optional **Local (FPSU)** layer toggle (two independent toggles: locale + FPSU layer per product spec).

**E. Accessibility checklist** — target **WCAG 2.2 AA** where feasible; list top 10 checks for our patterns (color+icon, focus order, dialog traps, contrast on red/yellow).

**F. Anti-patterns** — list 5–7 things to avoid for this product (e.g., tiny penalty icons only, burying safety disclaimers, mixing discipline-specific copy).

Use **clear headings**. You may add **ASCII wireframe sketches** where helpful. If you reference IPSC rule numbering in UI copy, always frame as **“per your edition / verify in official PDF”** — the app educates, not replaces rulebooks.

Language: write **your deliverables in English** (design docs for dev team); you may add a **short Ukrainian summary** (5–10 bullets) at the end for stakeholders who read UK only.
```

---

## 4. Приклади follow-up запитів до Claude (після першої відповіді)

- «Зведи токени в JSON-подібну структуру для handoff у Figma Tokens / CSS variables».
- «Запропонуй 3 варіанти логотипу/монограми **ST** на основі існуючого PWA-маска (див. README icons) — лише концепти, не фінальний брендбук».
- «Перевір макет головної на конфлікт з **§3 бренду** в PORTAL_PLAN (тон, дисклеймер)».
- «Змоделюй **mobile-first** лише для RO Helper: SOS + стаття + перемикачі мови та ФПСУ».

---

## 5. Після відповіді Claude (у команді)

- Зберігайте версії специфікацій у **`docs/`** (наприклад `docs/DESIGN_SYSTEM_V0.md`) окремим PR.
- Узгоджуйте з **PORTAL_PLAN** (бренд, URL) та **RO_HELPER_V0 §7** (кольори SOS) перед імплементацією в React.

---

*English one-liner: This package points Claude at PROJECT_CONTEXT + PORTAL_PLAN + RO_HELPER_V0 (SOS colors) and gives a copy-paste prompt to produce tokens, IA, and wireframes without breaking stable routes.*
