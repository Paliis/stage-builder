# RO Helper — реєстр карток (чернетка)

**Призначення:** єдине джерело для **сквозної нумерації** карток (`card_id`), зв’язку з блоками SOS (`category`), дисципліною та якорями IPSC. Пари **UK + EN** лишаються на рівні Markdown-файлів однієї логічної картки.

**Останнє оновлення:** квітень 2026.

**Звірка Handgun Jan 2026:** нумерація колонки «IPSC Ref (HG 2026, перевірено)» узгоджена з PDF *IPSC Handgun Competition Rules – Jan 2026 Edition – Final 29 Dec 2025* (текст з первинника; дзеркало для зручності: [ipsc-pl.org PDF](https://ipsc-pl.org/images/przepisy_2026/IPSC%20Handgun%20Competition%20Rules%20-%20Jan%202026%20Edition%20-%20Final%2029%20Dec%202025.pdf)). Для **PCC / Rifle / Mini Rifle / Shotgun** ті самі *назви* карток зазвичай лишаються доречними, але **номери правил потрібно переписати після відкриття відповідного PDF** (структура розділів близька, але не гарантована 1:1).

**Код дисципліни** у даних продукту: `handgun` \| `pcc` \| `rifle` \| `mini_rifle` \| `shotgun` (у таблицях Excel/Notion допускалися `minirifle` — мапити на `mini_rifle`).

---

## 1. Ключ унікальності та URL

- **Глобально унікально:** `card_id` (наприклад `#C26`).
- **Семантика теми:** `slug` (kebab-case) може **повторюватися** в різних дисциплінах; стаття однозначно задається парою **`slug` + `discipline`** (і дублюється в шляху або в параметрі — див. [RO_HELPER_V0.md §5](./RO_HELPER_V0.md#5-інформаційна-архітектура-та-url)).
- **`control_values`:** операційна підказка для RO (не заміна rulebook); для процедурних штрафів на handgun v2026 базова величина **−10 очок** за штраф (**10.1.2**).

---

## 2. Блок **Penalties** (`penalties`)

Нижче — ваш приклад **C26–C76** з виправленнями якорів для **handgun 2026** і примітками щодо змісту картки.

| ID | Card Name | Slug | Discipline | Category | IPSC Ref (ваш чернетка) | IPSC Ref (HG 2026, перевірено) | Control Number (Values) | Notes |
|----|-------------|------|------------|----------|-------------------------|--------------------------------|-------------------------|-------|
| C26 | Procedural HG | procedural-fault | handgun | penalties | 10.1 | **10.1** (10.1.1–10.1.2) | −10 pts / procedural | Загальні процедурні штрафи |
| C27 | Procedural Rifle | procedural-fault | rifle | penalties | 10.1 | *перевірити PDF Rifle* | *як у rulebook* | |
| C28 | Procedural PCC | procedural-fault | pcc | penalties | 10.1 | *перевірити PDF PCC* | *як у rulebook* | |
| C29 | Procedural MR | procedural-fault | mini_rifle | penalties | 10.1 | *перевірити PDF Mini Rifle* | *як у rulebook* | |
| C30 | Procedural SG | procedural-fault | shotgun | penalties | 10.1 | *перевірити PDF Shotgun* | *як у rulebook* | |
| C31 | Foot Fault HG | foot-fault | handgun | penalties | 10.2.2001 | **10.2.1** (+ **10.2.1.1** significant advantage while faulting) | 1 procedural / occurrence; per shot if 10.2.1.1 | «2001» → **10.2.1** |
| C32 | Foot Fault Rifle | foot-fault | rifle | penalties | 10.2.2001 | *перевірити* | | |
| C33 | Foot Fault PCC | foot-fault | pcc | penalties | 10.2.2001 | *перевірити* | | |
| C34 | Foot Fault MR | foot-fault | mini_rifle | penalties | 10.2.2001 | *перевірити* | | |
| C35 | Foot Fault SG | foot-fault | shotgun | penalties | 10.2.2001 | *перевірити* | | |
| C36 | FTE HG | failure-to-engage | handgun | penalties | 9.5.2006 | **9.5.6** + процедурно **10.2.7** | procedural per target + misses | «2006» → **9.5.6**; 10.2.7 — процедура за мішень |
| C37 | FTE Rifle | failure-to-engage | rifle | penalties | 9.5.2006 | *перевірити* | | |
| C38 | FTE PCC | failure-to-engage | pcc | penalties | 9.5.2006 | *перевірити* | | |
| C39 | FTE MR | failure-to-engage | mini_rifle | penalties | 9.5.2006 | *перевірити* | | |
| C40 | FTE SG | failure-to-engage | shotgun | penalties | 9.5.2006 | *перевірити* | | |
| C41 | Advantage HG | significant-advantage | handgun | penalties | 10.2.2002 | **10.2.1.1** і/або **10.2.2** (друга частина) | per shot якщо значна перевага | Одна картка може покривати обидва контексти або рознести пізніше |
| C42 | Advantage Rifle | significant-advantage | rifle | penalties | 10.2.2002 | *перевірити* | | |
| C43 | Advantage PCC | significant-advantage | pcc | penalties | 10.2.2002 | *перевірити* | | |
| C44 | Advantage MR | significant-advantage | mini_rifle | penalties | 10.2.2002 | *перевірити* | | |
| C45 | Advantage SG | significant-advantage | shotgun | penalties | 10.2.2002 | *перевірити* | | |
| C46 | Creeping HG | creeping | handgun | penalties | 10.2.2006 | **10.2.6** | 1 procedural | |
| C47 | Creeping Rifle | creeping | rifle | penalties | 10.2.2006 | *перевірити* | | |
| C48 | Creeping PCC | creeping | pcc | penalties | 10.2.2006 | *перевірити* | | |
| C49 | Creeping MR | creeping | mini_rifle | penalties | 10.2.2006 | *перевірити* | | |
| C50 | Creeping SG | creeping | shotgun | penalties | 10.2.2006 | *перевірити* | | |
| C51 | Reload HG | mandatory-reload | handgun | penalties | 10.2.2004 | **10.2.4** | 1 procedural / shot until reload done | |
| C52 | Reload Rifle | mandatory-reload | rifle | penalties | 10.2.2004 | *перевірити* | | |
| C53 | Reload PCC | mandatory-reload | pcc | penalties | 10.2.2004 | *перевірити* | | |
| C54 | Reload MR | mandatory-reload | mini_rifle | penalties | 10.2.2004 | *перевірити* | | |
| C55 | Reload SG | mandatory-reload | shotgun | penalties | 10.2.2004 | *перевірити* | | |
| C56 | Position HG | mandatory-position | handgun | penalties | 10.2.2008 | **10.2.2** (позиція/стан з WSB); **10.2.8** якщо сильна/слабка рука | 1 procedural / occurrence або per shot за 10.2.2 | Уточнити в контенті: загальна позиція (10.2.2) vs strong/weak only (10.2.8) |
| C57 | Position Rifle | mandatory-position | rifle | penalties | 10.2.2008 | *перевірити* | | |
| C58 | Position PCC | mandatory-position | pcc | penalties | 10.2.2008 | *перевірити* | | |
| C59 | Position MR | mandatory-position | mini_rifle | penalties | 10.2.2008 | *перевірити* | | |
| C60 | Position SG | mandatory-position | shotgun | penalties | 10.2.2008 | *перевірити* | | |
| C61 | Assistance HG | unauthorized-assistance | handgun | penalties | 10.2.2009 | **8.6.2** (і контекст **8.6**) | procedural / 10.6 | **Не** 10.2.9; 10.2.9 — re-engagement |
| C62 | Assistance Rifle | unauthorized-assistance | rifle | penalties | 10.2.2009 | *перевірити* | | |
| C63 | Assistance PCC | unauthorized-assistance | pcc | penalties | 10.2.2009 | *перевірити* | | |
| C64 | Assistance MR | unauthorized-assistance | mini_rifle | penalties | 10.2.2009 | *перевірити* | | |
| C65 | Assistance SG | unauthorized-assistance | shotgun | penalties | 10.2.2009 | *перевірити* | | |
| C66 | Sight Picture HG | sight-picture-fault | handgun | penalties | 10.2.2005 | **8.7.1**, **8.7.2** | warning / then procedural | Не з розділу 10.2 |
| C67 | Sight Picture Rifle | sight-picture-fault | rifle | penalties | 10.2.2005 | *перевірити* | | |
| C68 | Sight Picture PCC | sight-picture-fault | pcc | penalties | 10.2.2005 | *перевірити* | | |
| C69 | Sight Picture MR | sight-picture-fault | mini_rifle | penalties | 10.2.2005 | *перевірити* | | |
| C70 | Sight Picture SG | sight-picture-fault | shotgun | penalties | 10.2.2005 | *перевірити* | | |
| C71 | Forbidden Act HG | forbidden-action | handgun | penalties | 10.2.11 | **10.2.11** | 1 procedural / shot | Постріли «над» бар’єром ≥ 1.8 m |
| C72 | Forbidden Act Rifle | forbidden-action | rifle | penalties | 10.2.11 | *перевірити* | | |
| C73 | Forbidden Act PCC | forbidden-action | pcc | penalties | 10.2.11 | *перевірити* | | |
| C74 | Forbidden Act MR | forbidden-action | mini_rifle | penalties | 10.2.11 | *перевірити* | | |
| C75 | Forbidden Act SG | forbidden-action | shotgun | penalties | 10.2.11 | *перевірити* | | |
| C76 | Wrong Ammo SG | wrong-ammo-shot | shotgun | penalties | 10.2.12 | *перевірити PDF Shotgun* | *як у rulebook* | Лише shotgun; пункт підтвердити в SG book |

### Додаткові картки Penalties (рекомендовано додати, ID призначити вручну)

Теми з того ж розділу handgun 2026, корисні для RO, які ще не у списку C26–C76:

| Slug (пропозиція) | Тема (UK) | IPSC Ref HG 2026 | Примітка |
|-------------------|-----------|------------------|----------|
| `procedural-cap` | Максимум процедур при множинних порушеннях | **10.2.3** | Стеля штрафів |
| `cooper-tunnel` | Cooper Tunnel / ушкодження накриття | **10.2.5** | |
| `penalty-in-lieu` | Штраф замість елемента COF (травма тощо) | **10.2.10** – **10.2.10.3** | RM discretion |
| `re-engage-same-location` | Повернення стріляти з тієї ж позиції | **10.2.9** | Не плутати з «assistance» |
| `walkthrough-interference` | Порушення під час інспекції COF | **8.7.2**, **8.7.3** | Частково перетинається з sight-picture |

Кожна з них логічно дублюється ×5 дисциплін, окрім випадків «тільки handgun» (рідко) — перевірка по PDF.

---

## 3. Інші блоки (чернетка тем під IPSC Jan 2026 Handgun TOC)

Нижче — **орієнтир** для майбутніх `card_id`; точні рядки після затвердження пріоритетів.

### Safety & DQ (`safety`)

- Небезпечні постріли / випадковий постріл — **10.4**, **10.5.x** (DQ / safety infractions).
- Окремі картки: `accidental-discharge`, `trigger-finger`, `break-180`, `dropped-gun`, `unsafe-gun-handling`, `sweeping`, `muzzle-at-person`, `unauthorized-loading` (узгодити з [RO_HELPER_V0 §8.1](./RO_HELPER_V0.md#81-safety--dq-safety)) × 5 дисциплін.
- Додати з handgun: **10.5** підпункти за потреби (окремі картки на підтип DQ).

### Scoring (`scoring`)

- Розділ **9**: папір, miss, no-shoot, зникаючі (**9.9**), офіційний час (**9.10**), програми (**9.11**).
- Картки на кшталт: `paper-zones-major-minor`, `steel-scoring`, `no-shoot-hits`, `disappearing-targets`, `score-verification` × 5 дисциплін.

### Equipment (`equipment`)

- Розділи **5** (зброя/спорядження), **Appendix** дивізіонів.
- Картки: `division-overview`, `holster-or-carry`, `ready-conditions`, `chronograph-powerfactor`, `ammunition-mags` × 5 дисциплін.

### Match Admin (`match-admin`)

- Розділ **11** арбітраж, **6** реєстрація/категорії, **4.7** несправності обладнання (перестріл), плюс **3** оголошення матчу.
- Картки: `reshoots`, `protests-arbitration`, `md-ro-roles`, `equipment-failure-stage` × 5 дисциплін.

---

## 4. Статуси та локальний шар ФПСУ

Колонки **Status UK / EN**, **fpsu_delta_verified** ведуть у `content/ro-helper/INDEX.md` або зовнішньому трекері; цей файл фіксує **ідентифікацію** картки та **якорі IPSC**.

---

**Зв’язок:** [RO_HELPER_V0.md](./RO_HELPER_V0.md), [RO_HELPER_CONTENT_TZ.md](./RO_HELPER_CONTENT_TZ.md), [RO_HELPER_IPSC_FPSU_TOPIC_MAP.md](./RO_HELPER_IPSC_FPSU_TOPIC_MAP.md), [RO_HELPER_CARD_MATRIX.md](./RO_HELPER_CARD_MATRIX.md) ([CSV](./RO_HELPER_CARD_MATRIX.csv)).
