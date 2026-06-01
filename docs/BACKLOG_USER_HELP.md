# Беклог: користувацька довідка та онбординг (UH)

**Код розділу:** **UH** (User Help).  
**Епік у загальному беклозі:** **BL-037** → [BACKLOG.md](./BACKLOG.md).  
**План фаз:** [USER_HELP_ONBOARDING_PLAN.md](./USER_HELP_ONBOARDING_PLAN.md).  
**Контент-план:** [USER_HELP_CONTENT_PLAN.md](./USER_HELP_CONTENT_PLAN.md).  
**Файли контенту:** `content/user-help/`.  
**Прогрес:** [content/user-help/PROGRESS.md](../content/user-help/PROGRESS.md).

**Оновлювати:** при зміні статусу задачі або завершенні шару.

---

## Як позначати в чаті

```text
Розділ: UH — шар <T|V|P> — UH-<шар><NN> — <короткий зміст>
```

**Приклад:** `UH — шар V — UH-V01 — зйомка first-stage-full (OBS)`

**У комітах (контент, без коду):** `docs(uh): UH-V02 publish master video URL`

---

## Три шари (не змішувати в одному спринті без потреби)

| Шар | Код | Що входить | Хто / де |
|-----|-----|------------|----------|
| **T — Text** | `UH-T*` | Markdown, FAQ, статті UK/EN, рев’ю, in-app тексти | `content/user-help/`, `messages.ts` (пізніше) |
| **V — Video** | `UH-V*` | Сценарії, зйомка, монтаж, субтитри, публікація, нарізка рілсів | OBS / CapCut; **не** залежить від деплою коду |
| **P — Product** | `UH-P*` | `/help`, embed відео, онбординг у App, context hints, footer | `src/`, Vercel |

**Порядок за замовчуванням:** **T** (чернетки готові) → **V** (майстер-відео) → **P** (вбудувати в сайт).  
Шар **V** можна вести **паралельно** з дописуванням T, але публікація help з відео — після **UH-V03** + мінімум **UH-T10**.

**Інструменти зйомки (рішення 2026-05):** фінал — **OBS + CapCut**; Loom — лише **чернетка/рев’ю** (не публічний канал).

---

## Шар T — Text (контент)

| ID | Задача | Статус | Примітка |
|----|--------|--------|----------|
| UH-T00 | Каркас `content/user-help/`, manifest, плани | **done** | UH-00…02 |
| UH-T10 | Quick start + first-stage UK (повний текст) | partial | чернетки є |
| UH-T11 | Решта статей SB P0–P1 UK | partial | 10 статей, дописати EN пізніше |
| UH-T12 | FAQ UK повний | **done** | `uk/faq.md` |
| UH-T13 | FAQ EN | todo | після рев’ю UK |
| UH-T14 | Статті matches / account / portal UK | partial | |
| UH-T15 | In-app діалог (скорочений) → `messages.ts` | todo | `onboarding/in-app-dialog.md` |
| UH-T16 | Рев’ю 1× RO/організатор | todo | UH-18 |

---

## Шар V — Video (продакшн, окремий трек)

**Стратегія:** один **майстер** `first-stage-full` (~2 хв) → короткі рілси = **нарізка**, не окремі зйомки.

| ID | Задача | Статус | Артефакт |
|----|--------|--------|----------|
| UH-V00 | Production pack `first-stage-full` + SRT | **done** | [production/first-stage-full.md](../content/user-help/videos/production/first-stage-full.md) |
| UH-V01 | Репетиція / чернетка (Loom або OBS без монтажу) | todo | опційно |
| UH-V02 | **Зйомка** майстера (OBS, 1:45–2:00) | **todo** | демо «Демо вправи», 20×30 |
| UH-V03 | Монтаж: субтитри UK, титри, CTA | todo | `first-stage-full.uk.srt` |
| UH-V04 | Публікація (YouTube / Telegram) + `publishedUrl` | todo | `videos/manifest.json` |
| UH-V05 | Нарізка 5 extract-рілсів з майстера | todo | field-size … save-stage-file |
| UH-V06 | EN субтитри / другий VO (опційно) | backlog | |
| UH-V07 | **Матчі стрілець:** `matches-shooter-register-full` (~1:15) | **ready-for-shoot** | [matches-shooter-register-full.md](../content/user-help/videos/production/matches-shooter-register-full.md) |
| UH-V08 | **Матчі організатор:** `matches-organizer-full` (~2:00) | **ready-for-shoot** | [matches-organizer-full.md](../content/user-help/videos/production/matches-organizer-full.md) |
| UH-V09 | Нарізки `matches-find-and-register`, `matches-organizer-create` | todo | після V07/V08 |
| UH-V10 | RO Helper: `ro-helper-search` (45 с) | backlog | |

**Гайд зйомки:** [RECORDING_GUIDE.md](../content/user-help/videos/RECORDING_GUIDE.md).

---

## Шар P — Product (інтеграція в застосунок)

| ID | Задача | Статус | Код / docs |
|----|--------|--------|------------|
| UH-P01 | `scripts/build-user-help.mjs` + markdown → JSON/HTML | todo | UH-41 |
| UH-P02 | Маршрут `/:locale/help` + хаб | todo | UH-40 |
| UH-P03 | In-app онбординг 4 кроки + «Детальніше» | todo | UH-42 |
| UH-P04 | Context hints (перший раз у режимі) | todo | UH-43, `context-hints.md` |
| UH-P05 | Посилання help у footer / PortalHome | todo | UH-45 |
| UH-P06 | Embed `first-stage-full` у статтях | todo | після UH-V04 |
| UH-P07 | SEO sitemap `/help` | todo | UH-44 |

**Блокер:** **UH-P06** залежить від **UH-V04** (URL відео). **UH-P02** можна робити з текстом без відео.

---

## Зведення статусів (2026-05-21)

| Шар | Готово | В роботі | Далі |
|-----|--------|----------|------|
| **T** | каркас, FAQ UK | статті | рев’ю → EN |
| **V** | сценарій майстера | — | **UH-V02 зйомка** |
| **P** | — | — | після V або паралельно P01–P02 |

---

## Зв’язок BL ↔ UH

| BL | Тема | Шари UH |
|----|------|---------|
| **BL-037** | Користувацька довідка та онбординг (епік) | T + V + P |

*Наступні дрібні фічі help у коді (якщо з’являться) — нові **BL-038+** або рядки **UH-P*** без нового BL.*

---

## Журнал

| Дата | Подія |
|------|--------|
| 2026-05-21 | Створено BACKLOG_USER_HELP; шари T / V / P; відео = окремий трек V |
| 2026-05-21 | Майстер `first-stage-full` замість окремих коротких зйомок P0 |
