/** Inline copy for `/ro-helper/demo` — mirrors `content/ro-helper/.../break-180.md` (update both when text changes). */

export type DemoSection = {
  id: string
  heading: string
  paragraphs?: string[]
  bullets?: string[]
  ordered?: string[]
  /** Shown only when the FPSU layer toggle is on */
  onlyWhenFpsuOn?: boolean
}

export type DemoCardBundle = {
  title: string
  sections: DemoSection[]
}

export const break180DemoByLocale: Record<'uk' | 'en', DemoCardBundle> = {
  uk: {
    title: 'Порушення кутів безпеки (180°)',
    sections: [
      {
        id: 'what',
        heading: 'Що це',
        paragraphs: [
          'Правило «180 градусів» — фундаментальний принцип безпечного поводження зі зброєю в IPSC. **Ствол зброї** має залишатися **спрямованим** у межах безпечного сектора (зазвичай — у бік мішеней відносно лінії валу). Якщо **напрямок стволу** перетинає умовну межу, паралельну задньому валу (або межі, визначені в письмовому брифінгу, WSB), це критична загроза безпеці.',
        ],
      },
      {
        id: 'ro',
        heading: 'Що робить RO',
        ordered: [
          '**Зупинка:** негайно подати гучну й чітку команду **«STOP!»**.',
          '**Контроль зброї:** підійти до стрільця лише якщо це безпечно; переконатися, що вогонь припинено й зброя спрямована безпечно.',
          '**Розряджання:** наказати розрядити зброю та показати порожній патронник (за процедурою правил / брифінгу).',
          '**Вилучення:** після перевірки безпеки наказати вкласти зброю в кобуру. За **10.5.2** порушення кутів безпеки зазвичай тягне **дискваліфікацію (DQ)** — уточніть формулювання в актуальному PDF Handgun для вашої редакції. Після DQ за цим правилом стрілець **не продовжує** матч.',
          '**Документування:** повідомити Range Master; у скоршиті зафіксувати **«DQ — п. 10.5.2 (180° / muzzle safe angles)»**, час і місце події.',
        ],
      },
      {
        id: 'ipsc',
        heading: 'IPSC (Jan 2026)',
        paragraphs: [
          'За **10.5.2** DQ застосовується, якщо у будь-який момент під час виконання вправи **ствол зброї** **спрямований** «назад» (далі ніж на **90°** від медіанної перпендикулярної лінії до заднього валу) або за межі кутів, **явно вказаних у WSB**.',
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
          '**«Розслаблена рука»:** після серії по мішені збоку стрілець розвертає корпус для руху, а рука з пістолетом «відстає» — **ствол зброї** перетинає лінію 180°.',
          '**Перезаряджання під час руху:** пістолет піднімають занадто високо біля обличчя й розвертають боком; у поєднанні з кроком **ствол** легко виходить за межі сектора.',
          '**Маніпуляції з кобурою:** «наосліп» після команд завершення, коли **ствол зброї** задирається вгору й назад.',
        ],
      },
    ],
  },
  en: {
    title: 'Muzzle Safe Angles (180° Rule)',
    sections: [
      {
        id: 'what',
        heading: 'What this is',
        paragraphs: [
          'The “180-degree rule” is a fundamental IPSC safety principle. It requires the muzzle to stay **downrange** within the **designated safe sector**. If the muzzle crosses the imaginary line parallel to the backstop (or boundaries specified in the briefing), that is a **critical safety violation**.',
        ],
      },
      {
        id: 'ro',
        heading: 'What the RO does',
        ordered: [
          '**Stop:** Immediately issue a loud, clear **“STOP!”** command.',
          '**Control:** Approach the competitor (only if safe), ensure they cease fire, and hold the firearm in a safe direction.',
          '**Unload:** Direct the competitor to unload and show clear per match procedures.',
          '**Holster / dismissal:** After safety is verified, order the firearm holstered. Under **10.5.2**, a muzzle-safe-angle breach is normally a **match disqualification (DQ)** — confirm exact wording in the current **Handgun** PDF. The competitor does not continue the match after a DQ under this rule.',
          '**Report:** Summon the Range Master. Record **“DQ — Rule 10.5.2 (180° / muzzle safe angles)”** on the scoresheet, with time and location of the violation.',
        ],
      },
      {
        id: 'ipsc',
        heading: 'IPSC (Jan 2026)',
        paragraphs: [
          'Per **10.5.2**, disqualification applies if, at any time during the course of fire, the competitor allows the muzzle to point rearwards (**further than 90°** from the median perpendicular line to the backstop), or outside **muzzle safe angles** specified in the **Written Stage Briefing (WSB)**.',
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
  },
}
