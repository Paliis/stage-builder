# Кнопки в порталі «Матчі» — стандарт

Короткий гайд для екранів організатора та публічних сторінок матчів. Детальніше про загальну мову інтерфейсу: [`DESIGN_SYSTEM_V0.md`](./DESIGN_SYSTEM_V0.md).

## Де живуть стилі

Файл: **`src/portal/PortalMatchesUi.css`** — базовий клас **`.portal-btn`** і модифікатори нижче. Сторінки матчів підключають цей CSS через обгортки розділу (наприклад, редагування матчу).

## Модифікатори

| Клас | Коли брати |
|------|-------------|
| `portal-btn portal-btn--primary` | Одна головна дія на блоці/екрані: збереження матчу, «Додати до матчу», підтвердження у модалці, CTA реєстрації. |
| `portal-btn portal-btn--secondary` | Усі другорядні дії однакової важливості: другі кнопки в сайдбарі, «Оновити всі вправи», рядкові дії у таблиці (вгору/вниз/оновити/прибрати), скасування. |
| `portal-btn portal-btn--ghost` | Текстова/легка дія без «плитки» (hover дає легкий фон). |

Розмір:

| Клас | Коли брати |
|------|-------------|
| *(без модифікатора)* | Звичні крупні CTA й кнопки в картках. |
| `portal-btn--compact` | Поряд з інпутом у формі, у щільних таблицях, у тулбарі з кількох кнопок. |

Ширина:

- **`portal-btn--block`** — на всю ширину контейнера (типово сайдбар «Швидкі дії»).
- **`portal-btn--block-xs`** — на мобільній — на всю ширину, з `≥480px` — автоширина (responsive CTA-row).

Посилання, що має виглядати як кнопка, використовуйте **`className="portal-btn …"` на `<Link>`** (клас уже підтримує `inline-flex`).

## Чого не робити

- Не малювати кнопки матчів **інлайн-стилями** без крайньої необхідності — злам з’являється саме між «темним submit» і `portal-btn`.
- Не змішувати на одному рівні ієрархії два primary (утруднює сканування).

## Винятки (не `portal-btn`)

- **Таби перемикання вигляду** (наприклад, таблиця / дошка заявок): клас **`.portal-roster-tab`**, `role="tab"`.
- Нативні **`<select>`** у фільтрах — залишаються контролами форми, не кнопками.

## Приклади

Головна дія + компактність у формі:

```tsx
<button
  type="submit"
  className="portal-btn portal-btn--primary portal-btn--compact"
  disabled={busy}
>
  {busy ? '…' : 'Додати до матчу'}
</button>
```

Другорядкова масова дія:

```tsx
<button
  type="button"
  className="portal-btn portal-btn--secondary portal-btn--compact"
  disabled={locked}
  onClick={onRefreshAll}
>
  Оновити всі вправи до останніх
</button>
```

Сайдбар:

```tsx
<button type="submit" className="portal-btn portal-btn--primary portal-btn--block">
  Зберегти
</button>
<Link className="portal-btn portal-btn--secondary portal-btn--block" to="…">
  Заявки та скводи
</Link>
```

Стан **`:disabled`** обробляється глобально для `.portal-btn` (прозорість + `cursor: not-allowed`).

## Кабінет стрільця (`/account`)

Ті самі класи: сторінка підключає **`PortalMatchesUi.css`**, компонент **`AccountParticipantHub.tsx`**.

- **Зберегти профіль** — `portal-btn--primary` (головна дія форми).
- **Обрати фото** — `portal-btn--secondary` + `portal-btn--compact`.
- **Без фото** — `portal-btn--ghost` + `compact` (легка деструктивна дія поруч із вторинною).
- У таблиці реєстрацій: перехід «Картка» залишається **посиланням** (навігація); **скасувати заявку** — `secondary` + `compact`.

Модалка кропу аватару вже використовує primary/secondary для «Застосувати» / «Скасувати».

### Блок «Організатор матчів» (`PortalAccountPage.tsx`)

- Уже **організатор** (`organizer_status === active`) — кнопка **`matchesPortalOrganizerLink`** → `/matches/my`. Статус **`pending`** — лише текст, без кнопки кабінету.
- **`portal_platform_admins`**: поруч (у тому ж рядку) друга кнопка **`accountPlatformOrganizerApplicationsCta`** → **`/admin/organizers`** (лише коли **`platform_is_platform_admin()`** = true).
- Без ролі — один рядок-тизер і **`portal-btn--primary`** «Подати заявку» (розгортає форму); надсилання форми — окрема primary-кнопка.

---

*Документ узгоджений із кодом станом на травень 2026; див. також [PLANNING_INDEX.md](./PLANNING_INDEX.md) (код **MT**).*