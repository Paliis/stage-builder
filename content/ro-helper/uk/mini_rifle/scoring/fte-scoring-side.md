---
title: "FTE — скорингова частина (9.5.6)"
card_id: "C193"
slug: "fte-scoring-side"
category: scoring
locale: uk
discipline: mini_rifle
control_values: "Перевірити PDF Mini Rifle Jan 2026 — 9.5.6 разом із 10.2.7 (залік vs procedural)"
ipsc_edition: "Jan 2026"
ipsc_refs:
  - rule: "9.5.6"
    note: "Failure to engage — scoring side — Mini Rifle"
primary_url: "https://ipsc-pl.org/images/przepisy_2026/IPSC%20Mini%20Rifle%20Competition%20Rules%20-%20Jan%202026%20Edition%20-%20Final%2029%20Dec%202025.pdf"
fpsu_refs:
  - rule: "X §4"
    note: "Підрахунок очок та штрафів"
    url: "https://upsf.org.ua/rules/upsf/2020/10-scoring#4-%D0%BF%D1%96%D0%B4%D1%80%D0%B0%D1%85%D1%83%D0%BD%D0%BE%D0%BA-%D0%BE%D1%87%D0%BE%D0%BA-%D1%82%D0%B0-%D1%88%D1%82%D1%80%D0%B0%D1%84%D1%96%D0%B2"
  - rule: "XI §2"
    note: "Процедурні штрафи — приклади"
    url: "https://upsf.org.ua/rules/upsf/2020/11-penalties-and-disqualifications#2-%D0%BF%D1%80%D0%BE%D1%86%D0%B5%D0%B4%D1%83%D1%80%D0%BD%D1%96-%D1%88%D1%82%D1%80%D0%B0%D1%84%D0%B8-%D0%BE%D0%BA%D1%80%D0%B5%D0%BC%D1%96-%D0%BF%D1%80%D0%B8%D0%BA%D0%BB%D0%B0%D0%B4%D0%B8"
fpsu_delta_verified: false
reviewer: ""
review_date: ""
draft_source: llm
status: draft
---

## Що це

**FTE (failure to engage)** має **два шари** у правилах: **скоринг** (**9.5.6**) і **процедурний штраф** (**10.2.7** — див. картку **C36**). Ця картка про **заліковку**: як записати необстріляну мішень, скільки **miss**, як взаємодіє з **металом** / **папером** тощо — **лише з PDF Mini Rifle Jan 2026**. Для handgun-дубля див. **C190**. RO має **не плутати** «немає отвору» з іншими випадками (не той тип мішені, не зарахований knockdown).

## Що робить суддя змагань (RO)

1. **Переконатися**, що мішень **має бути** обстріляна за **WSB** (не опціональна зона).
2. **Зафіксувати** на листі формат, який вимагає скоринг: кількість **miss** / **FTE** / комбінації за **9.5.6 Mini Rifle**.
3. **Окремо** занести **procedural** за **10.2.7**, якщо PDF вимагає обидва записи.
4. **При сумніві** (мішень закритий іншою мішенню, часткова активація сталі) — **CRO/RM** до фіналізації листа.
5. **Не вигадувати** «половину FTE» — лише дозволені категорії в правилах.

## IPSC (Jan 2026)

- **9.5.6 Mini Rifle** + **10.2.7** читати **разом**; порядок застосування — за текстом PDF. Для **Mini Rifle** використовуйте **розділ 9 Mini Rifle**, а не лише спогади про **handgun**.

## Локально (ФПСУ)
**Первинник — Правила ФПСУ 2020 (офіційний зміст на upsf.org.ua):**

- [X §4 — Підрахунок очок та штрафів](https://upsf.org.ua/rules/upsf/2020/10-scoring#4-%D0%BF%D1%96%D0%B4%D1%80%D0%B0%D1%85%D1%83%D0%BD%D0%BE%D0%BA-%D0%BE%D1%87%D0%BE%D0%BA-%D1%82%D0%B0-%D1%88%D1%82%D1%80%D0%B0%D1%84%D1%96%D0%B2)
- [XI §2 — Процедурні штрафи — приклади](https://upsf.org.ua/rules/upsf/2020/11-penalties-and-disqualifications#2-%D0%BF%D1%80%D0%BE%D1%86%D0%B5%D0%B4%D1%83%D1%80%D0%BD%D1%96-%D1%88%D1%82%D1%80%D0%B0%D1%84%D0%B8-%D0%BE%D0%BA%D1%80%D0%B5%D0%BC%D1%96-%D0%BF%D1%80%D0%B8%D0%BA%D0%BB%D0%B0%D0%B4%D0%B8)


Поле «FTE» у софті має відповідати правилам матчу. **`fpsu_delta_verified`**: **false** до рев’ю за **RO_HELPER_V0 §4.1**.

## Типові помилки

- **Лише procedural без зміни заліковки** або навпаки — якщо PDF вимагає обидва.
- **Плутання з ціллю**, яку можна пропустити за WSB.
- **Пізня зміна** після підпису без **9.6**.
- **Перенесення handgun-прикладів з C190**, коли формулювання **Mini Rifle** відрізняються.
