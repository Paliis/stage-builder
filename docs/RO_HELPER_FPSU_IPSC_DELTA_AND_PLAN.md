# ФПСУ 2020 ↔ IPSC Jan 2026: дельти, план батчів і пріоритетні картки

**Статус:** робочий артефакт аудиту за [RO_HELPER_FPSU_IPSC_REVIEW_AGENT_PROMPT.md](./RO_HELPER_FPSU_IPSC_REVIEW_AGENT_PROMPT.md).  
**Машиночитна таблиця:** [RO_HELPER_FPSU_IPSC_DELTA_MATRIX.csv](./RO_HELPER_FPSU_IPSC_DELTA_MATRIX.csv) (колонки узгоджені з промптом + `row_id`, `discipline_scope`, `batch`).  
**Останнє оновлення:** квітень 2026.

---

## 1. Межі цього документа

- **Не** замінює ручну звірку первинників. Значення `delta_type` **`stricter_local`** і **`identical`** (у сенсі «зміст збігається») у масштабі всіх 308 карток можна ставити **лише після** порівняння відповідних абзаців IPSC PDF і тексту ФПСУ на [upsf.org.ua](https://upsf.org.ua/rules/upsf/2020/index?type=rules) — згідно з [RO_HELPER_V0 §4.1](./RO_HELPER_V0.md#41-хто-фіксує-відмінності-фпсу-від-ipsc).
- У CSV переважно **`needs_legal_review`**: зафіксовано **де шукати** український шар (частина ФПСУ + URL якоря) і який **IPSC-якір** у матриці карток (`ipsc_anchor_hint` у [RO_HELPER_CARD_MATRIX.csv](./RO_HELPER_CARD_MATRIX.csv)).
- Структурні відмінності (п’ять PDF vs один документ, римські частини vs Ch.8–11) — **`wording_only`** на рівні нумерації/організації тексту, без автоматичного висновку про «ідентичність норм».

---

## 2. Таблиця дельт (скорочено; повна — у CSV)

| `row_id` | Приклад `card_id` | `slug` (або тема) | IPSC (якір) | ФПСУ (орієнтир) | `delta_type` | `priority` |
|----------|-------------------|-------------------|-------------|-----------------|--------------|------------|
| META-01 | — | структура документів | 5 PDF Jan 2026 | єдиний документ 2020 | `wording_only` | P1 |
| META-03 | — | словник термінів | глосарій у PDF | XIV п.2 → МКПС | `needs_legal_review` | P1 |
| META-04 | — | multigun | — | XIII | `no_direct_mapping` | P3 |
| T-SAFE-01 | C105 | `break-180` | 10.5.2 | II п.7; IV; XI | `needs_legal_review` | P1 |
| T-SAFE-02 | C110 | `accidental-discharge` | 10.4 | XI §4 AD | `needs_legal_review` | P1 |
| T-SAFE-03 | C115 | `trigger-finger` | 10.5.9–11 | XI §5 | `needs_legal_review` | P1 |
| T-PEN-01 | C26 | `procedural-fault` | 10.1 | XI §1 | `needs_legal_review` | P1 |
| T-PEN-03 | C36 | `failure-to-engage` | 9.5.6; 10.2.7 | X; XI | `needs_legal_review` | P1 |
| T-SCR-01 | C160 | `scoring-methods` | 9.2 | X §2 | `needs_legal_review` | P2 |
| … | … | … | … | … | … | … |

Повні рядки з `summary_uk` та `evidence_url` — у [RO_HELPER_FPSU_IPSC_DELTA_MATRIX.csv](./RO_HELPER_FPSU_IPSC_DELTA_MATRIX.csv).

---

## 3. План батчового оновлення карток

Усі батчі: **UK + EN** для кожного зміненого `slug`; **`fpsu_delta_verified: false`** до підпису рев’юера; **`fpsu_refs`** заповнювати лише зі стабільними URL або однозначною назвою підпункту після звірки. Не змінювати **`card_id`** / **`slug`**.

| Батч | Охоплення | Дії | Критерій готовності батчу |
|------|-----------|-----|---------------------------|
| **B0-glossary** | [RO_HELPER_IPSC_FPSU_GLOSSARY.md](./RO_HELPER_IPSC_FPSU_GLOSSARY.md) | Верифікація рядків з «Орієнтир ФПСУ», зокрема ролі (RO/RM), після читання II, IX, XII на сайті ФПСУ | Немає суперечливих UK-термінів для наступних карток; зафіксовано рішення щодо MCPS (XIV п.2) |
| **B1-safety** | `category=safety` (рядки матриці з `ipsc_anchor` у Ch.10.3–10.7, 8, 2) | Для кожного `slug` × 5 дисциплін: IPSC-текст з `primary_url`, блок «Локально (ФПСУ)» лише з підтвердженою дельтою | Рев’ю DQ-карток вибірково «друга думка» ([RO_HELPER_V0 §2.1](./RO_HELPER_V0.md#21-чекліст-ревю-перед-релізом-статті) п.6) |
| **B2-penalties** | `category=penalties` | Аналогічно; окремо long-gun картки **10.2.12** ([topic map §2.2](./RO_HELPER_IPSC_FPSU_TOPIC_MAP.md#22-міждисциплінна-відмінність-10212-перевірено-по-ваших-pdf)) | Немає плутанини HG vs SG/RF/PCC у цитатах |
| **B3-scoring** | `category=scoring` | Числа та зони **лише** з таблиць PDF обраної дисципліни; ФПСУ X + додатки | У картці зазначено, якщо цифри «лише IPSC» для міжнародного матчу |
| **B4-equipment** | `category=equipment` | Ch.4–5 + appendix vs VI–VII + додатки ФПСУ | Хронограф/PF узгоджені з таблицями |
| **B5-match-admin** | `category=match-admin` | Ch.3,6,7,11,12 vs II,V,VIII,XII тощо | WSB/арбітраж — узгоджені з глосарієм |

**Порядок:** B0 → **B1** → **B2** → B3 → B4 → B5 (можна зміщувати, якщо команда узгодить, але безпека + процедурні штрафи логічно першими).

**Ризики:** де політика матчу / Level може перевизначати — у тексті залишати дисклеймер на Match Book; **`needs_legal_review`** для меж між «національним класом» і IPSC-division.

---

## 4. Пріоритетний список із 20 `card_id` (перший прохід коду/контенту)

Орієнтир: **handgun** як еталон для дублювання формулювань на інші дисципліни; плюс окремі **discipline-specific** картки.

| № | `card_id` | `slug` | `discipline` | Чому в топі |
|---|-----------|--------|--------------|-------------|
| 1 | C105 | `break-180` | handgun | Безпека / сектор ствола |
| 2 | C110 | `accidental-discharge` | handgun | AD / DQ |
| 3 | C115 | `trigger-finger` | handgun | DQ / типова помилка |
| 4 | C120 | `dropped-gun` | handgun | DQ |
| 5 | C125 | `unsafe-gun-handling` | handgun | Загальна DQ-рамка |
| 6 | C130 | `dq-general` | handgun | Контекст 10.3 |
| 7 | C135 | `prohibited-substances` | handgun | 10.7 |
| 8 | C26 | `procedural-fault` | handgun | База процедурних штрафів |
| 9 | C31 | `foot-fault` | handgun | Найчастіші процедури |
| 10 | C36 | `failure-to-engage` | handgun | Перетин 9.x і 10.x |
| 11 | C41 | `significant-advantage` | handgun | Тлумачення позиції |
| 12 | C51 | `mandatory-reload` | handgun | Процедура COF |
| 13 | C61 | `unauthorized-assistance` | handgun | Ch.8 / IX ФПСУ |
| 14 | C160 | `scoring-methods` | handgun | Методи підрахунку |
| 15 | C170 | `hits-misses-noshoot-values` | handgun | Числа / зони |
| 16 | C175 | `paper-scoring-policy` | handgun | 9.5 |
| 17 | C76 | `wrong-ammo-shot` | shotgun | Специфіка **10.2.12 SG** |
| 18 | C102 | `burst-or-automatic-fire` | pcc | Long-gun **10.2.12** |
| 19 | C103 | `burst-or-automatic-fire` | rifle | Те саме |
| 20 | C104 | `burst-or-automatic-fire` | mini_rifle | Те саме |

Після цього етапу розгортати ті самі `slug` на **решту дисциплін** за [RO_HELPER_CARD_MATRIX.csv](./RO_HELPER_CARD_MATRIX.csv) (×5), з перевіркою `primary_url` кожної дисципліни.

---

## 5. Перевірки репозиторію

- `npm run build`
- Перевірка пакета карток за матрицею та базовою якістю: `npm run ro-helper:validate` (також входить у `npm run check`).
- Повторне заповнення `fpsu_refs` і блоку посилань у «Локально (ФПСУ)» / «Local (FPSU)» (після зміни мапінгу): `npm run ro-helper:inject-fpsu-refs` — джерело URL: [scripts/data/ro-helper-fpsu-urls.mjs](../scripts/data/ro-helper-fpsu-urls.mjs).
- За змінами в INDEX/матриці — узгодження з [content/ro-helper/INDEX.md](../content/ro-helper/INDEX.md) і колонкою `notes` у CSV (за домовленістю команди).

---

## 6. Зв’язані документи

- [RO_HELPER_IPSC_FPSU_TOPIC_MAP.md](./RO_HELPER_IPSC_FPSU_TOPIC_MAP.md) — мапінг глав і відмінність **10.2.12**
- [RO_HELPER_IPSC_FPSU_GLOSSARY.md](./RO_HELPER_IPSC_FPSU_GLOSSARY.md) — EN↔UK
- [RO_HELPER_V0.md](./RO_HELPER_V0.md) — §4, §4.1, frontmatter
