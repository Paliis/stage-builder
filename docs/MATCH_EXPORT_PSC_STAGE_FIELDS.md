# PSC export: які поля `match_stages[]` задає Stage Builder портал

**Для робочих задач:** [§8.6 MATCH_REGISTRATION_AND_PSC_PLAN.md](./MATCH_REGISTRATION_AND_PSC_PLAN.md#86-покроковий-план-mac03--mad01--mad02-узгоджена-черга).

**Код:** `computePscStageMetrics` (`src/domain/pscStageMetrics.ts`), `tryPscStageMetricsFromSharePayload` (`src/server/practiscore/sharePayloadPscMetrics.ts`), збірка `buildPortalPractiscoreZip` (`src/server/practiscore/buildPortalPractiscoreZip.ts`), шаблон `matchDefRoundtripTemplate.json`.

---

## 1. Обчислення з share (перед експортом)

| Поле PSC (ефект у JSON) | Джерело |
|-------------------------|---------|
| `stage_poppers` | Кількість popper / metal / ceramic / paper swing steel (за правилами `pscStageMetrics`) |
| Логічний папір як `stage_targets[]` + `stage_numtargs: 0` | **`stage_numtargs`** із сцени + підказки брифінгу (`inferPaperTargetsFromBriefing`), **max(max)** |
| `stage_noshoots` | Є хоч одна NS-мішень на сцені |
| `stage_tppoints` | Максимум з евристики (5× steel + 10× cardboard units) і `briefing.maxPoints`, якщо заданий |
| `stage_poppers_maxnpms` | Завжди **0** на експорті портала (це не лічильник пластин; див. коментар у коді) |

Папір у PSC: масив записів **`{ target_number, target_reqshots }`**; MVP shotgun у коді задає **`target_reqshots: 2`** на картонну одиницю.

---

## 2. Успадковування з «round-trip» шаблону ( shotgun MVP )

Усі експортовані вправи базуються на **клоні `matchDefRoundtripTemplate.json → match_stages[0]`** для решти ключів без зміни на рівні порталу, доки їх явно не мапимо. Наприклад: **`stage_strings`**, **`stage_scoretype`**, **`stage_classictargets`**, **`stage_removeworststring`**, дати модифікації тощо.

---

## 3. Поведінка без `psc_metrics` (узгоджена черга робіт §8.6 крок 1)

Зараз, якщо payload share **не парситься** або метрики не отримані, у ZIP кожна вправа **не повинна** успадковувати одні й ті самі поппери/max points з першого шаблонного стейджа без підстави. Конкретна політика (безпечні нулі проти **`422`** на експорт) — це результат **кроку 1 §8.6**.

---

## 4. Стійкість у часі (`MA-C03`)

На момент 2026-05 метрики **не зберігаються** окремою колонкою в **`match_stage_links`** — експорт кожного разу знову парсить **поточний** payload у **`shared_stages`**. Знімок у БД — **опційний крок 7 §8.6**, якщо потрібна незалежність від майбутніх змін payload.
