/** Inline copy for `/ro-helper/demo?card=…` — sync with `content/ro-helper/...` when articles change. */

/** Official IPSC downloads hub (per discipline). Avoid `/rules`, which resolves to Rules FAQs, not the rulebooks. */
export const IPSC_RULE_BOOKS_HUB_URL = 'https://www.ipsc.org/ipsc-rules/rule-books/'

/**
 * English **IPSC Handgun Competition Rules, January 2026 Edition** (Final 29 Dec 2025).
 * Same publication as linked from ipsc.org Rule Books; direct `wp-content` URL on ipsc.org is not stable in tooling,
 * so this mirror is used for a reliable PDF link. If it breaks, download Handgun Jan 2026 from `IPSC_RULE_BOOKS_HUB_URL`.
 */
export const IPSC_HANDGUN_JAN_2026_PDF_EN_URL =
  'https://ipsc-pl.org/images/przepisy_2026/IPSC%20Handgun%20Competition%20Rules%20-%20Jan%202026%20Edition%20-%20Final%2029%20Dec%202025.pdf'

export type DemoSection = {
  id: string
  heading: string
  paragraphs?: string[]
  bullets?: string[]
  ordered?: string[]
  onlyWhenFpsuOn?: boolean
}

export type DemoCardBundle = {
  title: string
  sections: DemoSection[]
}

export type DemoCardCategory = 'safety' | 'penalties'

export type DemoCardDefinition = {
  cardId: string
  slug: string
  discipline: string
  category: DemoCardCategory
  ipscEdition: string
  /** Shown after § in the meta line */
  ruleRef: string
  /** IPSC rulebook chapter number (string for display), e.g. Handgun Ch. 10 for penalties/DQ */
  ipscChapter: string
  /** Primary PDF for this card’s discipline/edition (English rulebook) */
  primaryRulesPdfUrl: string
  contentByLocale: Record<'uk' | 'en', DemoCardBundle>
}

const break180Uk: DemoCardBundle = {
  title: 'Порушення кутів безпеки (180°)',
  sections: [
    {
      id: 'what',
      heading: 'Що це',
      paragraphs: [
        'Правило «180 градусів» — фундаментальний принцип безпечного поводження зі зброєю в IPSC. **Ствол зброї** має залишатися **спрямованим** у межах безпечного сектора (зазвичай — у бік мішеней відносно лінії валу). Якщо **напрямок стволу** перетинає умовну межу, паралельну задньому валу (або межі, визначені в **письмовому брифінгу до вправи (WSB)**), це критична загроза безпеці.',
      ],
    },
    {
      id: 'ro',
      heading: 'Що робить суддя змагань (RO)',
      ordered: [
        '**Зупинка:** негайно подати гучну й чітку команду **«STOP!»**.',
        '**Контроль зброї:** підійти до спортсмена лише якщо це безпечно; переконатися, що вогонь припинено й зброя спрямована безпечно.',
        '**Розряджання:** наказати розрядити зброю та показати порожній патронник (за процедурою правил / брифінгу).',
        '**Вилучення:** після перевірки безпеки наказати вкласти зброю в кобуру. За **10.5.2** порушення кутів безпеки зазвичай тягне **дискваліфікацію (DQ)** — звірте формулювання в офіційному PDF **IPSC Handgun Competition Rules** вашої редакції (на картці — **Jan 2026**), **розділ 10**. Після DQ за цим правилом спортсмен **не продовжує** матч.',
        '**Документування:** повідомити **головного суддю змагань (RM)**; у **заліковому листі** зафіксувати **«DQ — п. 10.5.2 (180° / muzzle safe angles)»**, час і місце події.',
      ],
    },
    {
      id: 'ipsc',
      heading: 'IPSC (Jan 2026)',
      paragraphs: [
        'За **10.5.2** DQ застосовується, якщо у будь-який момент під час **виконання вправи (COF)** **ствол зброї** **спрямований** «назад» (далі ніж на **90°** від медіанної перпендикулярної лінії до заднього валу) або за межі кутів, **явно вказаних у письмовому брифінгу до вправи (WSB)**.',
      ],
      bullets: [
        'Правило діє також під час переміщення, усунення затримок і перезаряджання.',
        'Винятки щодо кобури (вкладання / виймання) залежать від редакції правил і дивізіону — перевіряйте первинник.',
      ],
    },
    {
      id: 'fpsu',
      heading: 'Локально (ФПСУ)',
      onlyWhenFpsuOn: true,
      paragraphs: [
        'Якщо змагання проводять за правилами **ФПСУ / UPSF**, орієнтиром для національної нумерації та можливих відмінностей є **офіційний текст правил ФПСУ**; звіряйте з цим якорем IPSC (**10.5.2**) під час рев’ю (поле **`fpsu_delta_verified`** лишається **false**, доки рев’юер не підтвердить текст за **RO_HELPER_V0 §4.1**). На вправах з **рухом у бік валу** варта підвищена увага: зброя має однозначно залишатися в безпечному секторі згідно зі сценою та валами.',
      ],
    },
    {
      id: 'mistakes',
      heading: 'Типові помилки',
      bullets: [
        '**«Розслаблена рука»:** після серії по мішені збоку спортсмен розвертає корпус для руху, а рука з пістолетом «відстає» — **ствол зброї** перетинає лінію 180°.',
        '**Перезаряджання під час руху:** пістолет піднімають занадто високо біля обличчя й розвертають боком; у поєднанні з кроком **ствол** легко виходить за межі сектора.',
        '**Маніпуляції з кобурою:** «наосліп» після команд завершення, коли **ствол зброї** задирається вгору й назад.',
      ],
    },
  ],
}

const break180En: DemoCardBundle = {
  title: 'Muzzle Safe Angles (180° Rule)',
  sections: [
    {
      id: 'what',
      heading: 'What this is',
      paragraphs: [
        'The “180-degree rule” is a fundamental IPSC safety principle. It requires the muzzle to stay **downrange** within the **designated safe sector**. If the muzzle crosses the imaginary line parallel to the backstop (or boundaries specified in the **Written Stage Briefing (WSB)**), that is a **critical safety violation**.',
      ],
    },
    {
      id: 'ro',
      heading: 'What the Range Officer (RO) does',
      ordered: [
        '**Stop:** Immediately issue a loud, clear **“STOP!”** command.',
        '**Control:** Approach the competitor (only if safe), ensure they cease fire, and hold the firearm in a safe direction.',
        '**Unload:** Direct the competitor to unload and show clear per match procedures.',
        '**Holster / dismissal:** After safety is verified, order the firearm holstered. Under **10.5.2**, a muzzle-safe-angle breach is normally a **match disqualification (DQ)** — confirm exact wording in the official **IPSC Handgun Competition Rules** PDF for your edition (this card uses **Jan 2026**), **Chapter 10**. The competitor does not continue the match after a DQ under this rule.',
        '**Report:** Summon the **Range Master (RM)**. Record **“DQ — Rule 10.5.2 (180° / muzzle safe angles)”** on the **scoresheet**, with time and location of the violation.',
      ],
    },
    {
      id: 'ipsc',
      heading: 'IPSC (Jan 2026)',
      paragraphs: [
        'Per **10.5.2**, disqualification applies if, at any time during the **course of fire (COF)**, the competitor allows the muzzle to point rearwards (**further than 90°** from the median perpendicular line to the backstop), or outside **muzzle safe angles** specified in the **Written Stage Briefing (WSB)**.',
      ],
      bullets: [
        'This applies during **movement**, **malfunction clearance**, and **reloading**.',
        '**Holstering / unholstering:** exceptions depend on **division rules** and the rulebook edition — verify the primary source.',
      ],
    },
    {
      id: 'fpsu',
      heading: 'Local (FPSU)',
      onlyWhenFpsuOn: true,
      paragraphs: [
        'For matches run under **FPSU / UPSF** rules, treat the **official FPSU rulebook** as authoritative for local numbering and any national nuance; compare with this IPSC anchor (**10.5.2**) during review (`fpsu_delta_verified` stays **false** until a reviewer signs off per **RO_HELPER_V0 §4.1**). ROs should stay especially alert on stages with **uprange movement**—the firearm must remain clearly oriented within the safe sector defined by the stage and berms.',
      ],
    },
    {
      id: 'mistakes',
      heading: 'Common mistakes',
      bullets: [
        '**“Lagging arm”:** After engaging a lateral target, the competitor moves while the gun arm lags, rotating the muzzle past the 180° line.',
        '**Reloading on the move:** The handgun is brought high toward the chest and canted; combined with torso rotation, that often breaks the safe angle.',
        '**Blind holstering:** Holstering without visual control after a **“Holster”** (or related) command, so the muzzle tips up and rearward.',
      ],
    },
  ],
}

const proceduralUk: DemoCardBundle = {
  title: 'Процедурні штрафи (загальні)',
  sections: [
    {
      id: 'what',
      heading: 'Що це',
      paragraphs: [
        '**Процедурний штраф (procedural)** — це штрафні очки за порушення **процедури** **виконання вправи (COF)** або умов **письмового брифінгу до вправи (WSB)**, коли порушення **не** підпадає під інші спеціальні правила розділу про штрафи. У **IPSC Handgun Competition Rules** базову логіку задає **10.1** (підпункти **10.1.1–10.1.2** — уточнення за первинником). Типовий орієнтир для дисципліни **Handgun**: **−10 залікових балів за один procedural** за подією, якщо правила не встановлюють інше для конкретного випадку.',
      ],
    },
    {
      id: 'ro',
      heading: 'Що робить суддя змагань (RO)',
      ordered: [
        '**Зафіксувати факт:** що саме зробив (або не зробив) спортсмен і в який момент **виконання вправи (COF)** (відносно пострілів, позицій, перезарядження тощо).',
        '**Звірити з письмовим брифінгом до вправи (WSB):** чи дійсно порушено **умови вправи** (за текстом WSB) або загальні процедурні вимоги; за потреби звернутися до **старшого судді на лінії (CRO)** або **головного суддю змагань (RM)**, якщо трактування неоднозначне.',
        '**Застосувати штраф:** додати відповідну кількість **procedural(s)** на **заліковому листі** згідно з **10.1** та (за наявності) спеціальними пунктами для цього типу порушення.',
        '**Пояснити спортсмену:** коротко, за який елемент **виконання вправи (COF)** нараховано procedural (без суперечки на лінії; оскарження — за процедурою **9.6**).',
        '**Документувати:** запис має бути **чітким і перевірним** (наприклад, «1 procedural — п. 10.1 / заступ за лінією на постріл N» — формулювання після звірки з PDF).',
      ],
    },
    {
      id: 'ipsc',
      heading: 'IPSC (Jan 2026)',
      bullets: [
        '**10.1** визначає рамку **загальних процедурних штрафів** за порушення процедури / **письмового брифінгу до вправи (WSB)**, коли не застосовується окремий пункт з детальним описом.',
        'Деталі кількості procedural за одиницю події (наприклад, за **постріл** чи за **епізод**) і винятки — **лише з офіційного PDF** **IPSC Handgun Competition Rules** вашої редакції (на картці — **Jan 2026**), **розділ 10** (**10.1.1**, **10.1.2** тощо).',
        'Загальна **стеля** процедурних на **одному виконанні вправи (COF)** (якщо передбачена правилами) — окрема тема (**10.2.3**); на цій картці зосередьтесь на тому, **чи взагалі** нараховано procedural і скільки разів за подію згідно з первинником.',
      ],
    },
    {
      id: 'fpsu',
      heading: 'Локально (ФПСУ)',
      onlyWhenFpsuOn: true,
      paragraphs: [
        'Для змагань за правилами **ФПСУ / UPSF** нумерація та формулювання штрафів можуть відрізнятися від IPSC. Порівнюйте з **офіційним текстом ФПСУ** і фіксуйте відмінності лише після рев’ю (**`fpsu_delta_verified`** залишається **false** до підпису за **RO_HELPER_V0 §4.1**).',
      ],
    },
    {
      id: 'mistakes',
      heading: 'Типові помилки',
      bullets: [
        '**Плутання з іншими штрафами:** наприклад, **заступ** — окремий пункт (**10.2.1**); не підміняйте його загальним «procedural», якщо правило явно вимагає іншого підходу.',
        '**Занадто загальний запис у заліковому листі:** «procedural» без прив’язки до пострілу / зони / умови **письмового брифінгу до вправи (WSB)** — потім неможливо перевірити або оскарити коректно.',
        '**Подвійне покарання:** одна й та сама дія не повинна давати **два** штрафи за одним і тим самим правилом — перевіряйте логіку **виконання вправи (COF)** і текст **WSB**.',
      ],
    },
  ],
}

const proceduralEn: DemoCardBundle = {
  title: 'Procedural penalties (general)',
  sections: [
    {
      id: 'what',
      heading: 'What this is',
      paragraphs: [
        'A **procedural penalty** applies when the competitor violates **procedure** for the **course of fire (COF)** or the **Written Stage Briefing (WSB)**, and the situation is **not** covered by a more specific penalty rule later in Chapter 10. In the **IPSC Handgun Competition Rules**, the baseline framework is **10.1** (see **10.1.1–10.1.2** in the primary source). Typical **Handgun** guidance: **−10 match points per procedural** per occurrence unless the rules specify a different treatment for a particular case.',
      ],
    },
    {
      id: 'ro',
      heading: 'What the Range Officer (RO) does',
      ordered: [
        '**Capture the fact:** what the competitor did or failed to do, and when during the **course of fire (COF)** (relative to shots, positions, reloads, etc.).',
        '**Check the WSB:** confirm the stage conditions or general procedural requirements were actually breached; involve the **Chief Range Officer (CRO)** or **Range Master (RM)** if interpretation is unclear.',
        '**Apply the penalty:** add the correct number of **procedural(s)** on the scoresheet per **10.1** and any more specific rule that governs that breach.',
        '**Brief the competitor:** state briefly which element of the **COF** triggered the procedural (no debate on the line; challenges follow **9.6**).',
        '**Document clearly:** the entry must be **auditable** (for example, “1 procedural — 10.1 / foot fault on shot N” — adjust wording after verification against the PDF).',
      ],
    },
    {
      id: 'ipsc',
      heading: 'IPSC (Jan 2026)',
      bullets: [
        '**10.1** frames **general procedural penalties** for procedure / briefing breaches when no other detailed penalty clause applies.',
        'How many procedurals apply per unit of fault (e.g. per **shot** vs per **episode**) and any exceptions come **only** from the official **IPSC Handgun Competition Rules** PDF for your edition (this card uses **Jan 2026**), **Chapter 10** (**10.1.1**, **10.1.2**, etc.).',
        'Any **cap** on procedurals for a single **course of fire (COF)** (if the rules provide one) is a separate topic (**10.2.3**); this card focuses on **whether** a procedural is due and **how many** apply per the primary source.',
      ],
    },
    {
      id: 'fpsu',
      heading: 'Local (FPSU)',
      onlyWhenFpsuOn: true,
      paragraphs: [
        'For matches under **FPSU / UPSF** rules, numbering and penalty mechanics may differ from IPSC. Compare the **official FPSU text** and record deltas only after reviewer sign-off (**`fpsu_delta_verified`** stays **false** until **RO_HELPER_V0 §4.1**).',
      ],
    },
    {
      id: 'mistakes',
      heading: 'Common mistakes',
      bullets: [
        '**Wrong bucket:** e.g. a **foot fault** is anchored under **10.2.1** — do not relabel it as a vague “10.1 only” procedural if the rulebook assigns a specific treatment.',
        '**Vague scoresheet notes:** “procedural” with no link to shot / area / WSB condition makes verification and protests harder.',
        '**Double punishment:** the same act should not produce **two** penalties under the same rule logic — re-read the **COF** and **WSB**.',
      ],
    },
  ],
}

export const DEMO_CARD_DEFS: Record<string, DemoCardDefinition> = {
  C105: {
    cardId: 'C105',
    slug: 'break-180',
    discipline: 'handgun',
    category: 'safety',
    ipscEdition: 'Jan 2026',
    ruleRef: '10.5.2',
    ipscChapter: '10',
    primaryRulesPdfUrl: IPSC_HANDGUN_JAN_2026_PDF_EN_URL,
    contentByLocale: { uk: break180Uk, en: break180En },
  },
  C26: {
    cardId: 'C26',
    slug: 'procedural-fault',
    discipline: 'handgun',
    category: 'penalties',
    ipscEdition: 'Jan 2026',
    ruleRef: '10.1',
    ipscChapter: '10',
    primaryRulesPdfUrl: IPSC_HANDGUN_JAN_2026_PDF_EN_URL,
    contentByLocale: { uk: proceduralUk, en: proceduralEn },
  },
}

/** Ordered list for UI “known cards” links */
export const DEMO_CARD_IDS = Object.keys(DEMO_CARD_DEFS).sort((a, b) => {
  const na = parseInt(a.replace(/\D/g, ''), 10)
  const nb = parseInt(b.replace(/\D/g, ''), 10)
  return na - nb
})

export function normalizeDemoCardParam(raw: string | null): string {
  if (raw == null) return 'C105'
  const t = raw.trim().replace(/^#/, '').toUpperCase()
  if (t === '') return 'C105'
  return t
}

export function resolveDemoCard(cardParam: string | null): {
  def: DemoCardDefinition
  invalidRequested: boolean
  requestedId: string
} {
  const emptyQuery = cardParam == null || cardParam.trim() === ''
  const requestedId = normalizeDemoCardParam(cardParam)
  if (emptyQuery) {
    return { def: DEMO_CARD_DEFS.C105, invalidRequested: false, requestedId: 'C105' }
  }
  const def = DEMO_CARD_DEFS[requestedId]
  if (def) return { def, invalidRequested: false, requestedId }
  return { def: DEMO_CARD_DEFS.C105, invalidRequested: true, requestedId }
}
