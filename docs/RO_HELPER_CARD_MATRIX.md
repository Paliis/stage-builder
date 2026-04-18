# RO Helper — матриця всіх карток

**Призначення:** повний перелік логічних карток для модуля RO Helper: **`card_id`**, **`slug`**, **`discipline`**, **`category`**, підказки якорів IPSC та орієнтир для шару ФПСУ. Стани **`status_uk` / `status_en`** ведуть у таблиці або імпортуються з CSV у Notion / Excel.

**Останнє оновлення:** квітень 2026.

**Машиночитана матриця:** [RO_HELPER_CARD_MATRIX.csv](./RO_HELPER_CARD_MATRIX.csv) (UTF-8 BOM для Excel).

**Регенерація після зміни slug/складу тем:**

```bash
python scripts/gen_ro_helper_matrix.py
```

Якщо `RO_HELPER_CARD_MATRIX.csv` відкритий у Excel і запис блокується, згенеруйте в інший файл і підмініть після закриття:

```bash
python scripts/gen_ro_helper_matrix.py --out docs/RO_HELPER_CARD_MATRIX.new.csv
```

---

## 1. Колонки CSV

| Колонка | Опис |
|---------|------|
| `card_id` | Сквозний ідентифікатор **C26…C333** (перші **51** рядки збігаються з [RO_HELPER_CARD_REGISTRY.md](./RO_HELPER_CARD_REGISTRY.md) §2). |
| `slug` | Стабільний slug теми; **повторюється** між дисциплінами; унікальність рядка = `slug` + `discipline`. |
| `discipline` | `handgun` \| `pcc` \| `rifle` \| `mini_rifle` \| `shotgun` |
| `category` | `safety` \| `penalties` \| `scoring` \| `equipment` \| `match-admin` |
| `label_en` / `label_uk` | Коротка назва для трекера (UK — для контенту; EN — для імпорту). |
| `ipsc_anchor_hint` | Підказка якоря (часто за **handgun Jan 2026**); для інших дисциплін — **перевірити PDF**. |
| `fpsu_section_hint` | Грубий мапінг на розділи [Правил ФПСУ 2020](https://upsf.org.ua/rules/upsf/2020/index?type=rules); точний параграф — після рев’ю. |
| `status_uk` / `status_en` | За замовчуванням `todo`. |
| `notes` | Винятки за дисципліною (див. §2). |

---

## 2. Винятки в матриці (не 5×)

| Умова | Рядки |
|--------|--------|
| **`wrong-ammo-shot`** | Лише **`shotgun`** (`C76`). |
| **`burst-or-automatic-fire`** | Лише **`pcc`**, **`rifle`**, **`mini_rifle`** (`C102`–`C104`): правило **10.2.12** у цих PDF; у **handgun** пункту **10.2.12** немає; у **shotgun** **10.2.12** — про **набій**, не burst (окремий slug вище). |
| **`external-safety-long-gun`** | Лише **`pcc`**, **`rifle`**, **`mini_rifle`**, **`shotgun`** (`C320`–`C323`): без **handgun** (у HG **10.5.11** — інший зміст; палець — `trigger-finger`). |

Усі інші рядки в CSV: **повний декарт** «тема × 5 дисциплін» (окрім винятків у таблиці вище).

---

## 3. Підсумок кількості рядків

| `category` | Кількість рядків у CSV |
|--------------|-------------------------|
| `penalties` | 79 |
| `safety` | 64 |
| `scoring` | 75 |
| `equipment` | 50 |
| `match-admin` | 40 |
| **Усього** | **308** |

Перевірка: `penalties` = 51 (реєстр) + 25 (5 додаткових slug × 5 дисциплін) + 3 (burst лише для 3 long gun) = **79**; `safety` = 50 (базові теми ×5) + 5 (`metal-target-min-distance-dq`) + 5 (`ammo-in-safety-area`) + 4 (`external-safety-long-gun` без handgun) = **64**; `scoring` = 70 + 5 (`popper-calibration`) = **75**; `equipment` = 45 + 5 (`trigger-pull-check`) = **50**.

---

## 4. Доповнення за аудитом (C310–C333)

Додано окремі картки для «сліпих зон» безпеки, скорингу та екіпірування: **`metal-target-min-distance-dq`**, **`ammo-in-safety-area`**, **`external-safety-long-gun`**, **`popper-calibration`**, **`trigger-pull-check`**. У CSV для `trigger-finger` якір **10.5.9–10.5.11** (HG Jan 2026); для **`disappearing-targets-scoring`** у `notes` зафіксовано розведення **9.9.2** (рух / зникаюча мішень) та логіки активатора.

---

## 5. Узгодження зі спекою v0

Slug **`md-ro-roles`**, **`protests-arbitration`**, **`reshoots`** узгоджені з [RO_HELPER_V0.md §8.5](./RO_HELPER_V0.md#85-match-admin-match-admin).

---

## 6. Зв’язок з іншими документами

- [RO_HELPER_CARD_REGISTRY.md](./RO_HELPER_CARD_REGISTRY.md) — деталізація penalties **C26–C76** та рев’ю IPSC Ref.  
- [RO_HELPER_IPSC_FPSU_TOPIC_MAP.md](./RO_HELPER_IPSC_FPSU_TOPIC_MAP.md) — глави rulebook і логіка ФПСУ.  
- [RO_HELPER_V0.md](./RO_HELPER_V0.md) — маршрути, frontmatter, парність UK+EN.
