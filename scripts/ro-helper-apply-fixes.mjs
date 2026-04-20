/**
 * Applies batch content fixes proposed by review:
 * 1) UK terminology: дуло/дула/дулом -> ствол/ствола/стволом (content/ro-helper/uk/**)
 * 2) Accidental discharge: add explicit 10.4.2 distance (3 meters) note.
 * 3) Long-gun movement safety: ensure 10.5.11 is referenced and highlighted.
 * 5) Disappearing targets: cite 9.9.2/9.9.3 and clarify malfunction vs true disappearing.
 * 6) Standardize Major/Minor hit values: cite 9.4.1/9.4.2 and add point table + terminology.
 * 7) Popper calibration: add clear RO algorithm (Appendix C1) and reshoot outcome.
 * 8) Procedural cap: highlight 10.2.3 and clarify per-occurrence vs per-shot (unless significant advantage).
 * 14) Match admin: reshoots + course design balance clarifications.
 * 16) Penalties logic: per-shot vs per-occurrence for foot faults; FTE per target + misses; mandatory reload per shot until reload.
 * 17) Paper scoring specifics: radial tears/enlarged holes and touching target ends challenges.
 * 18) Shotgun wrong ammo: procedural per shot, not DQ (unless safety).
 *
 * Usage: node scripts/ro-helper-apply-fixes.mjs
 */
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const roRoot = join(root, 'content', 'ro-helper')

function splitFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\s*\r?\n([\s\S]*)$/)
  if (!m) return { meta: '', body: raw }
  return { meta: m[1], body: m[2] }
}

function joinFrontmatter(meta, body) {
  return `---\n${meta.trimEnd()}\n---\n\n${body.replace(/^\s+/, '')}`.replace(/\r?\n/g, '\n')
}

async function walk(dir) {
  const out = []
  async function rec(d) {
    const entries = await readdir(d, { withFileTypes: true })
    for (const e of entries) {
      const p = join(d, e.name)
      if (e.isDirectory()) await rec(p)
      else if (e.isFile() && e.name.endsWith('.md')) out.push(p)
    }
  }
  await rec(dir)
  return out
}

function replaceUkDulo(text) {
  // order matters: longest first
  return text
    .replaceAll('дулом', 'стволом')
    .replaceAll('дула', 'ствола')
    .replaceAll('дуло', 'ствол')
}

function ensureIpscRef(meta, rule) {
  if (meta.includes(`rule: "${rule}"`) || meta.includes(`rule: '${rule}'`) || meta.includes(`rule: ${rule}`))
    return meta
  if (!meta.includes('ipsc_refs:')) return meta

  // Insert new list item right after `ipsc_refs:` line for minimal churn.
  const lines = meta.split('\n')
  const idx = lines.findIndex((l) => l.trim() === 'ipsc_refs:')
  if (idx === -1) return meta
  lines.splice(idx + 1, 0, `  - rule: \"${rule}\"`, `    note: \"\"`)
  return lines.join('\n')
}

function ensureIpscRefs(meta, rules) {
  let out = meta
  for (const r of rules) out = ensureIpscRef(out, r)
  return out
}

function ensureSection(body, heading, contentLines) {
  const norm = body.replace(/\r?\n/g, '\n')
  if (norm.includes(heading)) return body
  const lines = norm.split('\n')
  const insertAt = (() => {
    const ipsIdx = lines.findIndex((l) => l.trim().toLowerCase() === '## ipsc (jan 2026)')
    if (ipsIdx !== -1) {
      // after IPSC heading and blank line if present
      let i = ipsIdx + 1
      if (lines[i] === '') i++
      return i
    }
    // fallback: after first H2 section
    const h2 = lines.findIndex((l) => /^##\s+/.test(l))
    return h2 === -1 ? 0 : h2 + 1
  })()

  const toInsert = ['', heading, '', ...contentLines, '']
  lines.splice(insertAt, 0, ...toInsert)
  return lines.join('\n')
}

function addAccidentalDischargeDistance(locale, body) {
  const heading = locale === 'uk' ? '### 10.4.2 — постріл у землю (дистанція)' : '### 10.4.2 — shot into the ground (distance)'
  const content =
    locale === 'uk'
      ? ['- **10.4.2**: постріл **у землю** в межах **3 метрів** (3 м) — підстава для **DQ** за правилом.']
      : ['- **10.4.2**: a shot **into the ground** within **3 meters** (3 m) — **DQ** per the rule.']
  return ensureSection(body, heading, content)
}

function addLongGunSafety10511(locale, body) {
  const heading = locale === 'uk' ? '### 10.5.11 — запобіжник під час руху (довгі стволи)' : '### 10.5.11 — safety engaged while moving (long guns)'
  const content =
    locale === 'uk'
      ? [
          '- Для **Rifle / PCC / Shotgun / Mini Rifle** це окрема вимога, не лише «палець поза скобою».',
          '- **DQ за п. 10.5.11: рух зі зброєю, запобіжник якої не вимкнено (не встановлено в положення safe)** — якщо спортсмен не веде вогонь по мішенях.',
        ]
      : [
          '- For **Rifle / PCC / Shotgun / Mini Rifle** this is a separate requirement (not only trigger finger discipline).',
          '- **10.5.11 DQ**: moving with the long gun while the **safety is not engaged** (not in **SAFE**) — unless targets are being engaged.',
        ]
  return ensureSection(body, heading, content)
}

function addDisappearingTargetsClarification(locale, body) {
  const heading =
    locale === 'uk'
      ? '### 9.9.2–9.9.3 — «зникаюча» vs рухома, та збій механіки'
      : '### 9.9.2–9.9.3 — disappearing vs moving, and equipment malfunction'
  const content =
    locale === 'uk'
      ? [
          '- **Зникаюча мішень**: якщо мішень у правилах визначена як «зникаюча», то **відсутність пострілу/влучання** по ній **не тягне** штрафу **Miss/FTE** (логіка **9.9.2–9.9.3**).',
          '- Якщо механізм **зламався** і мішень **не зникла** (залишилась частково видимою / «зависла») — це **збій обладнання** і вирішується як **перестріл (Reshoot) за 4.6.1**.',
          '- Примітка: «рухома, але видима» мішень ≠ «зникаюча». Класифікація — з **WSB** + **9.9.2–9.9.3**.',
        ]
      : [
          '- **Disappearing target**: if a target is legally defined as “disappearing”, **not engaging / not hitting** it does **not** incur **Miss/FTE** (see **9.9.2–9.9.3** logic).',
          '- If the mechanism **malfunctions** and the target **fails to disappear** (remains partially visible / hangs up), treat it as **range equipment failure** → **Reshoot per 4.6.1**.',
          '- Note: “moving but still visible” ≠ “disappearing”. Classify via **WSB** + **9.9.2–9.9.3**.',
        ]
  return ensureSection(body, heading, content)
}

function addHitsValuesTable(locale, body) {
  const heading =
    locale === 'uk' ? '### 9.4.1–9.4.2 — таблиця вартості (Major/Minor)' : '### 9.4.1–9.4.2 — point table (Major/Minor)'
  const content =
    locale === 'uk'
      ? [
          'Перевіряйте числа за PDF вашої дисципліни; для **Jan 2026** (IPSC) типова таблиця:',
          '',
          '| | A | C | D | Miss | Штрафна мішень (No-Shoot) |',
          '|---|---:|---:|---:|---:|---:|',
          '| **Major** | 5 | 4 | 2 | -10 | -10 |',
          '| **Minor** | 5 | 3 | 1 | -10 | -10 |',
        ]
      : [
          'Verify the numbers in your discipline PDF; for **Jan 2026** (IPSC) the typical table is:',
          '',
          '| | A | C | D | Miss | No-Shoot |',
          '|---|---:|---:|---:|---:|---:|',
          '| **Major** | 5 | 4 | 2 | -10 | -10 |',
          '| **Minor** | 5 | 3 | 1 | -10 | -10 |',
        ]
  return ensureSection(body, heading, content)
}

function addPopperCalibrationAlgorithm(locale, body) {
  const heading =
    locale === 'uk'
      ? '### Алгоритм RO: оскарження «непадіння» поппера'
      : '### RO algorithm: popper calibration challenge'
  const content =
    locale === 'uk'
      ? [
          '- **Не чіпати поппер до калібрування!** Не підкручувати, не перевішувати, не «перевіряти руками».',
          '- Зафіксуйте **факти** (серія, положення мішені, умови), зупиніть ескалацію на лінії і передайте **RM/CRO** за процедурою **Appendix C1**.',
          '- **Калібрувальна зброя** / калібрувальний постріл за **Appendix C1**.',
          '- Якщо поппер **падає** від калібрувального пострілу — влучання спортсмена в цей поппер рахуються як **0** (тобто **Miss**).',
          '- Якщо поппер **не падає** від калібрувального пострілу — це **перестріл (Reshoot)** (збій обладнання; див. **4.6.1**).',
        ]
      : [
          '- **Do not touch the popper before calibration.** No adjustments, no “hand tests”.',
          '- Record **facts** (string, target state, conditions), stop arguments on the line, and escalate to **RM/CRO** per **Appendix C1**.',
          '- Use the **calibration gun** / calibration shot procedure per **Appendix C1**.',
          '- If the popper **falls** with the calibration shot — the competitor’s hits on it score **0** (i.e. **Miss**).',
          '- If the popper **does not fall** with the calibration shot — a **Reshoot** is mandatory (range equipment failure; see **4.6.1**).',
        ]
  return ensureSection(body, heading, content)
}

function addProceduralCapClarification(locale, body) {
  const heading =
    locale === 'uk' ? '### 10.2.3 — стеля: «за епізод» vs «за постріл»' : '### 10.2.3 — cap: per occurrence vs per shot'
  const content =
    locale === 'uk'
      ? [
          '- **10.2.3** обмежує кількість procedural **у конкретному контейнері**, який описано в правилі (за **епізод**, за **постріл**, за **мішень**, тощо).',
          '- Типовий кейс: **обидві ноги** поза fault line в одному моменті — це **один епізод** → максимум **один** procedural, **якщо** правило не вимагає інакше.',
          '- Якщо через порушення отримано **значну перевагу** — може застосовуватись інша логіка (див. `significant-advantage`).',
          '- Важливо розрізняти: **“one penalty per occurrence”** vs **“one penalty per shot”** — це різні режими нарахування.',
        ]
      : [
          '- **10.2.3** caps procedural penalties within the specific “container” defined by the rule (per **occurrence**, per **shot**, per **target**, etc.).',
          '- Typical case: **both feet** out at the same moment is a **single occurrence** → maximum **one** procedural, unless the rule explicitly states otherwise.',
          '- If the violation created a **significant advantage**, a different rule path may apply (see `significant-advantage`).',
          '- Keep the distinction clear: **one penalty per occurrence** vs **one penalty per shot** are different counting modes.',
        ]
  return ensureSection(body, heading, content)
}

function addReshootsClarification(locale, body) {
  const heading =
    locale === 'uk'
      ? '### Перестріл (Reshoot): хто призначає і коли це обов’язково'
      : '### Reshoot: who authorizes it and when it is mandatory'
  const content =
    locale === 'uk'
      ? [
          '- **4.6.1 (Range Equipment Failure)**: якщо є **збій обладнання** (таймер, механіка, мішені) — рішення про перестріл приймається за процедурою правил.',
          '- **Критично:** якщо RO **не впевнений**, чи це саме збій обладнання — **тільки Range Master (RM)** має авторизувати перестріл.',
          '- **4.7**: перестріл не є «другим шансом» після помилки спортсмена; застосовується лише за умовами, описаними в правилі.',
          '- **9.10.3**: якщо таймер **не зафіксував час**, перестріл є **обов’язковим**.',
        ]
      : [
          '- **4.6.1 (Range Equipment Failure)**: when there is **range equipment failure** (timer, mechanisms, targets) — reshoot follows the rule procedure.',
          '- **Critical:** if the RO is **unsure** whether it is equipment failure — **only the Range Master (RM)** should authorize a reshoot.',
          '- **4.7**: a reshoot is not a “second chance” after competitor error; apply only as written.',
          '- **9.10.3**: if the timer **fails to record the time**, a reshoot is **mandatory**.',
        ]
  return ensureSection(body, heading, content)
}

function addCourseDesignBalance(locale, body) {
  const heading =
    locale === 'uk' ? '### Баланс: Точність, Швидкість, Потужність' : '### Balance: Accuracy, Speed, Power'
  const content =
    locale === 'uk'
      ? [
          '- **1.1** задає принципи побудови вправ: перш за все **безпека**, далі **справедливість** і **баланс**.',
          '- **1.1.5 (Freestyle):** у більшості випадків спортсмен має право вирішувати **як** виконувати вправу, якщо це не суперечить WSB і правилам.',
          '- Практичний тест балансу: вправа має оцінювати комбінацію **Точності, Швидкості, Потужності** (а не лише один параметр).',
        ]
      : [
          '- **1.1** sets course design principles: **safety first**, then **fairness** and **balance**.',
          '- **1.1.5 (Freestyle):** in most cases the competitor may choose **how** to shoot the COF unless restricted by WSB/rules.',
          '- A practical balance check: the stage should test a mix of **Accuracy, Speed, Power** (not just one).',
        ]
  return ensureSection(body, heading, content)
}

function addFootFaultLogic(locale, body) {
  const heading =
    locale === 'uk'
      ? '### 10.2.1 — «Штраф за випадок» vs «Штраф за кожен постріл»'
      : '### 10.2.1 — “per occurrence” vs “per shot”'
  const content =
    locale === 'uk'
      ? [
          '- Якщо спортсмен **лише заступив** / торкнувся землі поза межами, але **не робив пострілів** у цей момент — зазвичай це **Штраф за випадок (per occurrence)**.',
          '- Якщо спортсмен **робить постріли**, перебуваючи у порушенні меж (або **отримав значну перевагу**) — логіка може переходити в **Штраф за кожен постріл (per shot)**.',
          '- Ключ до рішення: **чи були постріли під час порушення** і **чи є significant advantage** (див. `significant-advantage`).',
        ]
      : [
          '- If the competitor **steps out** / touches outside the boundary but **does not fire** during that moment — this is typically **per occurrence**.',
          '- If the competitor **fires shots** while faulting (or gains a **significant advantage**) — the logic may become **per shot**.',
          '- Decision key: **shots fired while faulting** and **significant advantage** (see `significant-advantage`).',
        ]
  return ensureSection(body, heading, content)
}

function addFteLogic(locale, body) {
  const heading =
    locale === 'uk' ? '### 10.2.7 + 9.5.6 — FTE: «за мішень» + Miss' : '### 10.2.7 + 9.5.6 — FTE: per target + misses'
  const content =
    locale === 'uk'
      ? [
          '- **FTE (Failure To Engage)**: штрафна логіка — **один procedural за кожну мішень** (per target) за **10.2.7**.',
          '- Паралельно застосовуються **Miss** за **невлучання** (заліковка/склад пострілів — за **9.5.6** та таблицями вашого PDF).',
          '- Тобто: **procedural “per target” + misses**, а не “лише miss” і не “procedural за кожен постріл”.',
        ]
      : [
          '- **FTE (Failure To Engage)**: penalty logic is **one procedural per target** under **10.2.7**.',
          '- In addition, apply **Misses** for the un-hit required shots (scoring mechanics per **9.5.6** and your PDF tables).',
          '- Net: **procedural per target + misses**, not “misses only” and not “procedural per shot”.',
        ]
  return ensureSection(body, heading, content)
}

function addMandatoryReloadLogic(locale, body) {
  const heading = locale === 'uk' ? '### 10.2.4 — штраф до перезарядження (per shot)' : '### 10.2.4 — penalty until reload (per shot)'
  const content =
    locale === 'uk'
      ? [
          '- Якщо WSB вимагає перезарядження, а спортсмен **продовжує стріляти без нього**, штраф нараховується як **Штраф за кожен постріл (per shot)**, доки перезарядження **не виконано**.',
          '- Ключовий момент — **постріли після точки, де WSB вимагає reload**.',
        ]
      : [
          '- If the WSB requires a reload and the competitor **keeps firing without reloading**, apply the penalty **per shot** until the reload is **performed**.',
          '- Key moment: **shots fired after the point where the WSB requires the reload**.',
        ]
  return ensureSection(body, heading, content)
}

function addPaperScoringChallengeTouch(locale, body) {
  const heading = locale === 'uk' ? '### 9.6.1 — після доторку оскарження неможливе' : '### 9.6.1 — once touched, no challenge'
  const content =
    locale === 'uk'
      ? [
          '- Якщо **спортсмен** або **RO** **доторкнувся** мішені (або отвір/папір був змінений), результат **не може** бути оскаржений — **9.6.1**.',
          '- Тому перед оглядом/вимірюванням: **не чіпати**, доки не згодні сторони / не покликано CRO/RM за процедурою матчу.',
        ]
      : [
          '- If the **competitor** or an **RO** has **touched** the target (or altered the hole/paper), the score **cannot** be challenged — **9.6.1**.',
          '- Therefore: **do not touch** before agreement / CRO-RM procedure on disputed hits.',
        ]
  return ensureSection(body, heading, content)
}

function addRadialTearsEnlargedHolesRules(locale, body) {
  const heading =
    locale === 'uk'
      ? '### 9.5.4–9.5.5 — розриви та розширені отвори'
      : '### 9.5.4–9.5.5 — radial tears and enlarged holes'
  const content =
    locale === 'uk'
      ? [
          '- **9.5.4 (Radial tears):** промені розриву **не** є частиною отвору кулі. Заліковується лише **сам отвір**, який має **торкатися** лінії зони.',
          '- **9.5.5 (Enlarged holes):** якщо отвір розширено (уламок, кульова нестабільність), RO має ідентифікувати **повний каліберний круг**. Якщо це неможливо — **не зараховувати** як краще влучання.',
        ]
      : [
          '- **9.5.4 (Radial tears):** radial tears are **not** part of the bullet hole. Only the **actual hole** counts, and it must **touch** the scoring line.',
          '- **9.5.5 (Enlarged holes):** if the hole is enlarged (fragment/tumble), the RO must be able to identify a **full-diameter circle**. If not identifiable, **do not award** a higher score.',
        ]
  return ensureSection(body, heading, content)
}

function addWrongAmmoShotLogic(locale, body) {
  const heading = locale === 'uk' ? '### 10.2.12 — неправильний набій: procedural за кожен постріл' : '### 10.2.12 — wrong ammo: procedural per shot'
  const content =
    locale === 'uk'
      ? [
          '- Якщо спортсмен вистрілив **набоєм, не дозволеним для цієї вправи** (напр. slug замість birdshot) — це **procedural за кожен постріл (per shot)**.',
          '- Це **не DQ**, якщо тільки використання набою **не створило** порушення безпеки (тоді працюють safety/DQ правила окремо).',
        ]
      : [
          '- If the competitor fires **ammunition not permitted for that stage** (e.g. slug instead of birdshot), apply **one procedural per shot**.',
          '- This is **not a DQ**, unless it separately violates **range safety** (then safety/DQ rules apply independently).',
        ]
  return ensureSection(body, heading, content)
}

async function main() {
  if (!existsSync(roRoot)) {
    console.error('Missing content root:', roRoot)
    process.exit(1)
  }

  // Step 1: UK terminology replacement across uk pack.
  const ukRoot = join(roRoot, 'uk')
  const ukFiles = await walk(ukRoot)
  for (const p of ukFiles) {
    const raw = await readFile(p, 'utf8')
    const next = replaceUkDulo(raw)
    if (next !== raw) await writeFile(p, next, 'utf8')
  }

  // Step 2: accidental-discharge: add 10.4.2 distance note (3m)
  const adFiles = [
    // uk
    'uk/handgun/safety/accidental-discharge.md',
    'uk/pcc/safety/accidental-discharge.md',
    'uk/rifle/safety/accidental-discharge.md',
    'uk/mini_rifle/safety/accidental-discharge.md',
    'uk/shotgun/safety/accidental-discharge.md',
    // en
    'en/handgun/safety/accidental-discharge.md',
    'en/pcc/safety/accidental-discharge.md',
    'en/rifle/safety/accidental-discharge.md',
    'en/mini_rifle/safety/accidental-discharge.md',
    'en/shotgun/safety/accidental-discharge.md',
  ]
  for (const rel of adFiles) {
    const abs = join(roRoot, ...rel.split('/'))
    const raw = await readFile(abs, 'utf8')
    const { meta, body } = splitFrontmatter(raw)
    const locale = rel.startsWith('uk/') ? 'uk' : 'en'
    const nextBody = addAccidentalDischargeDistance(locale, body)
    const next = joinFrontmatter(meta, nextBody)
    if (next !== raw.replace(/\r?\n/g, '\n')) await writeFile(abs, next, 'utf8')
  }

  // Step 3: movement-and-trigger-safety long guns: add 10.5.11
  const longGunMoveFiles = [
    'uk/pcc/safety/movement-and-trigger-safety.md',
    'uk/rifle/safety/movement-and-trigger-safety.md',
    'uk/shotgun/safety/movement-and-trigger-safety.md',
    'uk/mini_rifle/safety/movement-and-trigger-safety.md',
    'en/pcc/safety/movement-and-trigger-safety.md',
    'en/rifle/safety/movement-and-trigger-safety.md',
    'en/shotgun/safety/movement-and-trigger-safety.md',
    'en/mini_rifle/safety/movement-and-trigger-safety.md',
  ]
  for (const rel of longGunMoveFiles) {
    const abs = join(roRoot, ...rel.split('/'))
    const raw = await readFile(abs, 'utf8')
    const { meta, body } = splitFrontmatter(raw)
    const nextMeta = ensureIpscRef(meta, '10.5.11')
    const locale = rel.startsWith('uk/') ? 'uk' : 'en'
    const nextBody = addLongGunSafety10511(locale, body)
    const next = joinFrontmatter(nextMeta, nextBody)
    if (next !== raw.replace(/\r?\n/g, '\n')) await writeFile(abs, next, 'utf8')
  }

  // Step 5: disappearing targets scoring — add 9.9.2/9.9.3 refs + malfunction/reshoot logic.
  const dtFiles = [
    'uk/handgun/scoring/disappearing-targets-scoring.md',
    'uk/pcc/scoring/disappearing-targets-scoring.md',
    'uk/rifle/scoring/disappearing-targets-scoring.md',
    'uk/mini_rifle/scoring/disappearing-targets-scoring.md',
    'uk/shotgun/scoring/disappearing-targets-scoring.md',
    'en/handgun/scoring/disappearing-targets-scoring.md',
    'en/pcc/scoring/disappearing-targets-scoring.md',
    'en/rifle/scoring/disappearing-targets-scoring.md',
    'en/mini_rifle/scoring/disappearing-targets-scoring.md',
    'en/shotgun/scoring/disappearing-targets-scoring.md',
  ]
  for (const rel of dtFiles) {
    const abs = join(roRoot, ...rel.split('/'))
    const raw = await readFile(abs, 'utf8')
    const { meta, body } = splitFrontmatter(raw)
    const nextMeta = ensureIpscRefs(meta, ['9.9.2', '9.9.3', '4.6.1'])
    const locale = rel.startsWith('uk/') ? 'uk' : 'en'
    const nextBody = addDisappearingTargetsClarification(locale, body)
    const next = joinFrontmatter(nextMeta, nextBody)
    if (next !== raw.replace(/\r?\n/g, '\n')) await writeFile(abs, next, 'utf8')
  }

  // Step 6: hits/miss/no-shoot values — ensure 9.4.1/9.4.2 refs and add table + UK term.
  const hmFiles = [
    'uk/handgun/scoring/hits-misses-noshoot-values.md',
    'uk/pcc/scoring/hits-misses-noshoot-values.md',
    'uk/rifle/scoring/hits-misses-noshoot-values.md',
    'uk/mini_rifle/scoring/hits-misses-noshoot-values.md',
    'uk/shotgun/scoring/hits-misses-noshoot-values.md',
    'en/handgun/scoring/hits-misses-noshoot-values.md',
    'en/pcc/scoring/hits-misses-noshoot-values.md',
    'en/rifle/scoring/hits-misses-noshoot-values.md',
    'en/mini_rifle/scoring/hits-misses-noshoot-values.md',
    'en/shotgun/scoring/hits-misses-noshoot-values.md',
  ]
  for (const rel of hmFiles) {
    const abs = join(roRoot, ...rel.split('/'))
    const raw = await readFile(abs, 'utf8')
    const { meta, body } = splitFrontmatter(raw)
    const nextMeta = ensureIpscRefs(meta, ['9.4.1', '9.4.2'])
    const locale = rel.startsWith('uk/') ? 'uk' : 'en'
    const nextBody = addHitsValuesTable(locale, body)
    const next = joinFrontmatter(nextMeta, nextBody)
    if (next !== raw.replace(/\r?\n/g, '\n')) await writeFile(abs, next, 'utf8')
  }

  // Step 7: popper calibration — add RO algorithm and reshoot outcome (Appendix C1 + 4.6.1).
  const popFiles = [
    'uk/handgun/scoring/popper-calibration.md',
    'uk/pcc/scoring/popper-calibration.md',
    'uk/rifle/scoring/popper-calibration.md',
    'uk/mini_rifle/scoring/popper-calibration.md',
    'uk/shotgun/scoring/popper-calibration.md',
    'en/handgun/scoring/popper-calibration.md',
    'en/pcc/scoring/popper-calibration.md',
    'en/rifle/scoring/popper-calibration.md',
    'en/mini_rifle/scoring/popper-calibration.md',
    'en/shotgun/scoring/popper-calibration.md',
  ]
  for (const rel of popFiles) {
    const abs = join(roRoot, ...rel.split('/'))
    const raw = await readFile(abs, 'utf8')
    const { meta, body } = splitFrontmatter(raw)
    const nextMeta = ensureIpscRefs(meta, ['Appendix C1', '4.6.1'])
    const locale = rel.startsWith('uk/') ? 'uk' : 'en'
    const nextBody = addPopperCalibrationAlgorithm(locale, body)
    const next = joinFrontmatter(nextMeta, nextBody)
    if (next !== raw.replace(/\r?\n/g, '\n')) await writeFile(abs, next, 'utf8')
  }

  // Step 8: procedural cap — add explicit 10.2.3 clarification text.
  const capFiles = [
    'uk/handgun/penalties/procedural-cap.md',
    'uk/pcc/penalties/procedural-cap.md',
    'uk/rifle/penalties/procedural-cap.md',
    'uk/mini_rifle/penalties/procedural-cap.md',
    'uk/shotgun/penalties/procedural-cap.md',
    'en/handgun/penalties/procedural-cap.md',
    'en/pcc/penalties/procedural-cap.md',
    'en/rifle/penalties/procedural-cap.md',
    'en/mini_rifle/penalties/procedural-cap.md',
    'en/shotgun/penalties/procedural-cap.md',
  ]
  for (const rel of capFiles) {
    const abs = join(roRoot, ...rel.split('/'))
    const raw = await readFile(abs, 'utf8')
    const { meta, body } = splitFrontmatter(raw)
    const locale = rel.startsWith('uk/') ? 'uk' : 'en'
    const nextBody = addProceduralCapClarification(locale, body)
    const next = joinFrontmatter(meta, nextBody)
    if (next !== raw.replace(/\r?\n/g, '\n')) await writeFile(abs, next, 'utf8')
  }

  // Step 14: match-admin (C300–C309) — reshoots + course design balance.
  const reshootFiles = [
    'uk/handgun/match-admin/reshoots.md',
    'uk/pcc/match-admin/reshoots.md',
    'uk/rifle/match-admin/reshoots.md',
    'uk/mini_rifle/match-admin/reshoots.md',
    'uk/shotgun/match-admin/reshoots.md',
    'en/handgun/match-admin/reshoots.md',
    'en/pcc/match-admin/reshoots.md',
    'en/rifle/match-admin/reshoots.md',
    'en/mini_rifle/match-admin/reshoots.md',
    'en/shotgun/match-admin/reshoots.md',
  ]
  for (const rel of reshootFiles) {
    const abs = join(roRoot, ...rel.split('/'))
    const raw = await readFile(abs, 'utf8')
    const { meta, body } = splitFrontmatter(raw)
    const nextMeta = ensureIpscRefs(meta, ['4.6.1', '4.7', '9.10.3'])
    const locale = rel.startsWith('uk/') ? 'uk' : 'en'
    const nextBody = addReshootsClarification(locale, body)
    const next = joinFrontmatter(nextMeta, nextBody)
    if (next !== raw.replace(/\r?\n/g, '\n')) await writeFile(abs, next, 'utf8')
  }

  const courseDesignFiles = [
    'uk/handgun/match-admin/course-design-safety-balance.md',
    'uk/pcc/match-admin/course-design-safety-balance.md',
    'uk/rifle/match-admin/course-design-safety-balance.md',
    'uk/mini_rifle/match-admin/course-design-safety-balance.md',
    'uk/shotgun/match-admin/course-design-safety-balance.md',
    'en/handgun/match-admin/course-design-safety-balance.md',
    'en/pcc/match-admin/course-design-safety-balance.md',
    'en/rifle/match-admin/course-design-safety-balance.md',
    'en/mini_rifle/match-admin/course-design-safety-balance.md',
    'en/shotgun/match-admin/course-design-safety-balance.md',
  ]
  for (const rel of courseDesignFiles) {
    const abs = join(roRoot, ...rel.split('/'))
    const raw = await readFile(abs, 'utf8')
    const { meta, body } = splitFrontmatter(raw)
    const nextMeta = ensureIpscRefs(meta, ['1.1', '1.1.5'])
    const locale = rel.startsWith('uk/') ? 'uk' : 'en'
    const nextBody = addCourseDesignBalance(locale, body)
    const next = joinFrontmatter(nextMeta, nextBody)
    if (next !== raw.replace(/\r?\n/g, '\n')) await writeFile(abs, next, 'utf8')
  }

  // Step 16: penalties logic audit (selected range).
  const footFaultFiles = [
    'uk/handgun/penalties/foot-fault.md',
    'uk/pcc/penalties/foot-fault.md',
    'uk/rifle/penalties/foot-fault.md',
    'uk/mini_rifle/penalties/foot-fault.md',
    'uk/shotgun/penalties/foot-fault.md',
    'en/handgun/penalties/foot-fault.md',
    'en/pcc/penalties/foot-fault.md',
    'en/rifle/penalties/foot-fault.md',
    'en/mini_rifle/penalties/foot-fault.md',
    'en/shotgun/penalties/foot-fault.md',
  ]
  for (const rel of footFaultFiles) {
    const abs = join(roRoot, ...rel.split('/'))
    const raw = await readFile(abs, 'utf8')
    const { meta, body } = splitFrontmatter(raw)
    const locale = rel.startsWith('uk/') ? 'uk' : 'en'
    const nextBody = addFootFaultLogic(locale, body)
    const next = joinFrontmatter(meta, nextBody)
    if (next !== raw.replace(/\r?\n/g, '\n')) await writeFile(abs, next, 'utf8')
  }

  const fteFiles = [
    'uk/handgun/penalties/failure-to-engage.md',
    'uk/pcc/penalties/failure-to-engage.md',
    'uk/rifle/penalties/failure-to-engage.md',
    'uk/mini_rifle/penalties/failure-to-engage.md',
    'uk/shotgun/penalties/failure-to-engage.md',
    'en/handgun/penalties/failure-to-engage.md',
    'en/pcc/penalties/failure-to-engage.md',
    'en/rifle/penalties/failure-to-engage.md',
    'en/mini_rifle/penalties/failure-to-engage.md',
    'en/shotgun/penalties/failure-to-engage.md',
  ]
  for (const rel of fteFiles) {
    const abs = join(roRoot, ...rel.split('/'))
    const raw = await readFile(abs, 'utf8')
    const { meta, body } = splitFrontmatter(raw)
    const locale = rel.startsWith('uk/') ? 'uk' : 'en'
    const nextBody = addFteLogic(locale, body)
    const next = joinFrontmatter(meta, nextBody)
    if (next !== raw.replace(/\r?\n/g, '\n')) await writeFile(abs, next, 'utf8')
  }

  const mandatoryReloadFiles = [
    'uk/handgun/penalties/mandatory-reload.md',
    'uk/pcc/penalties/mandatory-reload.md',
    'uk/rifle/penalties/mandatory-reload.md',
    'uk/mini_rifle/penalties/mandatory-reload.md',
    'uk/shotgun/penalties/mandatory-reload.md',
    'en/handgun/penalties/mandatory-reload.md',
    'en/pcc/penalties/mandatory-reload.md',
    'en/rifle/penalties/mandatory-reload.md',
    'en/mini_rifle/penalties/mandatory-reload.md',
    'en/shotgun/penalties/mandatory-reload.md',
  ]
  for (const rel of mandatoryReloadFiles) {
    const abs = join(roRoot, ...rel.split('/'))
    const raw = await readFile(abs, 'utf8')
    const { meta, body } = splitFrontmatter(raw)
    const locale = rel.startsWith('uk/') ? 'uk' : 'en'
    const nextBody = addMandatoryReloadLogic(locale, body)
    const next = joinFrontmatter(meta, nextBody)
    if (next !== raw.replace(/\r?\n/g, '\n')) await writeFile(abs, next, 'utf8')
  }

  // Step 17: paper scoring specifics.
  const paperScoringFiles = [
    'uk/handgun/scoring/paper-scoring-policy.md',
    'uk/pcc/scoring/paper-scoring-policy.md',
    'uk/rifle/scoring/paper-scoring-policy.md',
    'uk/mini_rifle/scoring/paper-scoring-policy.md',
    'uk/shotgun/scoring/paper-scoring-policy.md',
    'en/handgun/scoring/paper-scoring-policy.md',
    'en/pcc/scoring/paper-scoring-policy.md',
    'en/rifle/scoring/paper-scoring-policy.md',
    'en/mini_rifle/scoring/paper-scoring-policy.md',
    'en/shotgun/scoring/paper-scoring-policy.md',
  ]
  for (const rel of paperScoringFiles) {
    const abs = join(roRoot, ...rel.split('/'))
    const raw = await readFile(abs, 'utf8')
    const { meta, body } = splitFrontmatter(raw)
    const nextMeta = ensureIpscRefs(meta, ['9.6.1'])
    const locale = rel.startsWith('uk/') ? 'uk' : 'en'
    const nextBody = addPaperScoringChallengeTouch(locale, body)
    const next = joinFrontmatter(nextMeta, nextBody)
    if (next !== raw.replace(/\r?\n/g, '\n')) await writeFile(abs, next, 'utf8')
  }

  const radialFiles = [
    'uk/handgun/scoring/radial-tears-enlarged-holes.md',
    'uk/pcc/scoring/radial-tears-enlarged-holes.md',
    'uk/rifle/scoring/radial-tears-enlarged-holes.md',
    'uk/mini_rifle/scoring/radial-tears-enlarged-holes.md',
    'uk/shotgun/scoring/radial-tears-enlarged-holes.md',
    'en/handgun/scoring/radial-tears-enlarged-holes.md',
    'en/pcc/scoring/radial-tears-enlarged-holes.md',
    'en/rifle/scoring/radial-tears-enlarged-holes.md',
    'en/mini_rifle/scoring/radial-tears-enlarged-holes.md',
    'en/shotgun/scoring/radial-tears-enlarged-holes.md',
  ]
  for (const rel of radialFiles) {
    const abs = join(roRoot, ...rel.split('/'))
    const raw = await readFile(abs, 'utf8')
    const { meta, body } = splitFrontmatter(raw)
    const nextMeta = ensureIpscRefs(meta, ['9.5.5'])
    const locale = rel.startsWith('uk/') ? 'uk' : 'en'
    const nextBody = addRadialTearsEnlargedHolesRules(locale, body)
    const next = joinFrontmatter(nextMeta, nextBody)
    if (next !== raw.replace(/\r?\n/g, '\n')) await writeFile(abs, next, 'utf8')
  }

  // Step 18: shotgun wrong ammo.
  const wrongAmmoFiles = ['uk/shotgun/penalties/wrong-ammo-shot.md', 'en/shotgun/penalties/wrong-ammo-shot.md']
  for (const rel of wrongAmmoFiles) {
    const abs = join(roRoot, ...rel.split('/'))
    const raw = await readFile(abs, 'utf8')
    const { meta, body } = splitFrontmatter(raw)
    const locale = rel.startsWith('uk/') ? 'uk' : 'en'
    const nextBody = addWrongAmmoShotLogic(locale, body)
    const next = joinFrontmatter(meta, nextBody)
    if (next !== raw.replace(/\r?\n/g, '\n')) await writeFile(abs, next, 'utf8')
  }
}

await main()

