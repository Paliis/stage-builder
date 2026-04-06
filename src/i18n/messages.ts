export type Locale = 'uk' | 'en'

/** Вкладені рядки; доступ через шлях «крапкою», напр. app.title */
export type MessageTree = {
  app: {
    title: string
    /** Онбординг під заголовком */
    onboardingTitle: string
    onboardingLead: string
    onboardingP1: string
    onboardingP2: string
    onboardingP3: string
    onboardingP4: string
    onboardingP5: string
    onboardingDismiss: string
    onboardingReopen: string
    /** Після згортання; плейсхолдери {{w}}, {{h}}, {{grid}} */
    contextHint: string
    /** Бічна панель (drawer) з мішенями та об'єктами на малих екранах */
    toolbarDrawerOpen: string
    toolbarDrawerClose: string
  }
  stats: {
    targets: string
    props: string
    minRounds: string
  }
  toolbar: {
    /** Загальний заголовок панелі додавання */
    aria: string
    targetsHeading: string
    targetsAria: string
    infrastructureHeading: string
    infrastructureAria: string
    /** Коротка підказка: інфра не залежить від класу зброї */
    infrastructureHint: string
    /** Aria для ряду кнопок штрафних мішеней (NS) */
    targetsNsAria: string
    /** Короткий підпис перед кнопками штрафних мішеней */
    targetsNsCaption: string
    /** Плейсхолдери {{w}}, {{h}} */
    fieldSizeOption: string
    fieldSizeLabel: string
    fieldSizeHint: string
  }
  props: {
    shield: string
    shieldDouble: string
    shieldWithPort: string
    door: string
    faultLine: string
    barrel: string
    tireStack: string
    seesaw: string
    movingPlatform: string
    cooperTunnel: string
    startPosition: string
  }
  weapon: {
    /** Заголовок секції (як «Мішені») */
    sectionTitle: string
    aria: string
    handgun: string
    rifle: string
    shotgun: string
    /** Коли на сцені є мішені поза набором для обраного класу */
    mismatchHint: string
  }
  targets: {
    paperIpsc: string
    paperA4: string
    metalPlate: string
    popper: string
    miniPopper: string
    ceramicPlate: string
    swingerSinglePaper: string
    swingerDoublePaper: string
    swingerSingleCeramic: string
    swingerDoubleCeramic: string
    noShootPaper: string
    noShootPaperA4: string
    noShootMetal: string
    noShootPopper: string
    noShootMiniPopper: string
  }
  view: {
    tabsAria: string
    plan2d: string
    visual3d: string
    camAria: string
    camOverview: string
    camShooter: string
    /** Коротка підказка; деталі — у threeDControlsDetail */
    threeDControls: string
    threeDControlsDetail: string
    plan2dControls: string
    plan2dControlsDetail: string
    /** Короткий підпис <summary> (щоб не ламав смугу керування) */
    controlsDetails: string
    /** Повна підказка при наведенні на summary */
    controlsDetailsTooltip: string
    /** Доступність міні-карти 2D-плану */
    minimapAria: string
  }
  briefing: {
    summary: string
    documentTitle: string
    exerciseType: string
    targetsText: string
    recommendedShots: string
    allowedAmmo: string
    maxPoints: string
    startSignal: string
    readyCondition: string
    startPosition: string
    procedure: string
    safetyAngles: string
    applyFromScene: string
    downloadPdf: string
    downloadPdfBusy: string
    hintBefore: string
    hintEm: string
    hintAfter: string
    category: {
      short: string
      medium: string
      long: string
    }
  }
  pdf: {
    rowExerciseType: string
    rowTargets: string
    rowRecommendedShots: string
    rowAllowedAmmo: string
    rowMaxPoints: string
    rowStartSignal: string
    rowReadyCondition: string
    rowStartPosition: string
    rowProcedure: string
    rowSafetyAngles: string
    sceneAlt: string
    noSnapshot: string
    imageLoadError: string
  }
  common: {
    exportFail: string
    langSwitcher: string
    langUk: string
    langEn: string
    dash: string
  }
  project: {
    save: string
    open: string
    hint: string
    loadErrorJson: string
    loadErrorShape: string
    loadErrorVersion: string
    fileGroupAria: string
  }
  footer: {
    feedbackHeading: string
    feedbackText: string
    feedbackEmail: string
    feedbackTelegram: string
    supportHeading: string
    supportText: string
    supportLink: string
  }
  pdfBranding: {
    generatedBy: string
  }
}

export const ukMessages: MessageTree = {
  app: {
    title: 'Stage Builder',
    onboardingTitle: 'Коротко про редактор',
    onboardingLead:
      'Stage Builder збирає стрільбищну вправу на площадці в реальних метрах: мішені й реквізит на плані, об’ємний перегляд і підготовка брифінгу до PDF.',
    onboardingP1:
      'План 2D з метричною сіткою — додавайте мішені та інфраструктуру, рухайте й обертайте; зручно прив’язка до кроку сітки.',
    onboardingP2:
      '3D-перегляд — оцінити вигляд сцени зверху або «зони стрільця»; знімок для PDF відповідає пропорціям вікна 3D.',
    onboardingP3:
      'Мішені: папір IPSC і A4, метал (сторони за Appendix C3), кераміка, поппери, ківаки; окремо кнопки штрафних (NS).',
    onboardingP4:
      'Таблиця брифінгу й експорт PDF: заголовок, знімок сцени (відкрийте 3D перед експортом) і поля як у класифікаційних вправах.',
    onboardingP5:
      'Розмір площадки та крок сітки — у рядку перемикання 2D/3D. Збереження «Вправа» дає файл *.stage.json з усією сценою й текстом брифінгу.',
    onboardingDismiss: 'Зрозуміло, сховати',
    onboardingReopen: 'Показати, що вміє редактор',
    contextHint: 'Зараз: поле {{w}}×{{h}} м, сітка {{grid}} м.',
    toolbarDrawerOpen: 'Мішені та об\u2019єкти',
    toolbarDrawerClose: 'Сховати панель',
  },
  stats: {
    targets: 'Мішені',
    props: 'Об’єкти',
    minRounds: 'Оцінка мін. пострілів',
  },
  toolbar: {
    aria: 'Панель редактора: мішені та інфраструктура',
    targetsHeading: 'Мішені',
    targetsAria: 'Додати мішені залежно від класу зброї',
    infrastructureHeading: 'Інфраструктура',
    infrastructureAria: 'Додати об’єкти інфраструктури (для всіх класів зброї)',
    infrastructureHint:
      'Однакові для пістолета, карабіна та рушниці. Від класу залежить лише список основних мішеней вище.',
    targetsNsAria: 'Додати no-shoot (NS) мішені — влучання не зараховуються',
    targetsNsCaption: 'NS:',
    fieldSizeOption: '{{w}} × {{h}} м',
    fieldSizeLabel: 'Площадка (шир × дов)',
    fieldSizeHint:
      'Змінює сітку 2D, межі, 3D і PDF. Об’єкти стискаються до нових меж (спрощено за центром).',
  },
  weapon: {
    sectionTitle: 'Клас зброї',
    aria: 'Оберіть клас зброї — від цього залежить список основних мішеней',
    handgun: 'Пістолет',
    rifle: 'Карабін',
    shotgun: 'Рушниця',
    mismatchHint:
      'Увага: на плані є мішені не з набору для цього класу. Вони не зникають — перевірте текст брифінгу.',
  },
  targets: {
    paperIpsc: '+ Папір IPSC',
    paperA4: '+ A4 папір',
    metalPlate: '+ Метал (квадр.)',
    popper: '+ Поппер',
    miniPopper: '+ Міні-поппер',
    ceramicPlate: '+ Кераміка',
    swingerSinglePaper: '+ Ківак 1× папір',
    swingerDoublePaper: '+ Ківак 2× папір',
    swingerSingleCeramic: '+ Ківак 1× кер.',
    swingerDoubleCeramic: '+ Ківак 2× кер.',
    noShootPaper: '+ NS папір IPSC',
    noShootPaperA4: '+ NS A4',
    noShootMetal: '+ NS метал',
    noShootPopper: '+ NS поппер',
    noShootMiniPopper: '+ NS міні',
  },
  props: {
    shield: '+ Щит',
    shieldDouble: '+ Щит 2×2 м',
    shieldWithPort: '+ Щит з портом',
    door: '+ Двері',
    faultLine: '+ Штрафна лінія',
    barrel: '+ Бочка',
    tireStack: '+ Стос шин',
    seesaw: '+ Качель',
    movingPlatform: '+ Рух. платформа',
    cooperTunnel: '+ Тунель Купера',
    startPosition: '+ Старт',
  },
  view: {
    tabsAria: 'Режим перегляду',
    plan2d: 'План 2D',
    visual3d: '3D-перегляд',
    camAria: 'Камера 3D',
    camOverview: 'Огляд (загальний)',
    camShooter: 'Зона стрільця',
    threeDControls:
      'Обертання — перетягуванням мишею; масштаб — коліщатком або зведенням пальців. Додавати та рухати об’єкти краще в режимі «План 2D» (прив’язка до сітки).',
    threeDControlsDetail:
      'Знімок для PDF має ті ж пропорції, що й картка 3D у вікні (ширший за старий надвисокий кадр), щоб у документі краще вміщалася площадка.',
    plan2dControls:
      'Масштаб — коліщатко або pinch. Перетягніть порожнє місце — зсув плану. Клік по об’єкту — виділення, перетягування — рух. «↻» біля об’єкта — поворот кроками. Delete або Backspace — видалити.',
    plan2dControlsDetail:
      'Під курсором показується вузол сітки в метрах. Панорама: середня кнопка миші або пробіл і перетягування. Штрафна лінія: помаранчевий маркер — довжина (інший кінець нерухомий); ручка ↻ біля того кінця — обертання навколо помаранчевого. Металева квадратна пластина (виділена): [ і ] — сторона за Appendix C3 (15 / 20 / 30 см).',
    controlsDetails: 'Докладніше',
    controlsDetailsTooltip: 'Підказки з керування планом 2D та переглядом 3D',
    minimapAria:
      'Міні-карта площадки: сині точки-папір і метал, помаранжеві квадрати-реквізит, рожева рамка-видимий фрагмент. Клацніть, щоб показати цю точку в центрі плану.',
  },
  briefing: {
    summary: 'Текст для PDF (таблиця брифінгу)',
    documentTitle: 'Заголовок документа',
    exerciseType: 'Тип вправи',
    targetsText: 'Мішені (текст)',
    recommendedShots: 'Рекомендована кількість пострілів',
    allowedAmmo: 'Допустимий тип набоїв',
    maxPoints: 'Макс. очок',
    startSignal: 'Стартовий сигнал',
    readyCondition: 'Положення готовності',
    startPosition: 'Стартова позиція',
    procedure: 'Процедура виконання',
    safetyAngles: 'Кути безпеки',
    applyFromScene: 'Підставити «Мішені» та пострілів з сцени',
    downloadPdf: 'Завантажити PDF',
    downloadPdfBusy: 'Збірка PDF…',
    hintBefore: 'Щоб у PDF потрапив знімок сцени, відкрийте',
    hintEm: '«3D-перегляд»',
    hintAfter:
      ', зачекайте, поки картинка оновиться, потім натисніть «Завантажити PDF».',
    category: {
      short: 'Коротка',
      medium: 'Середня',
      long: 'Довга',
    },
  },
  pdf: {
    rowExerciseType: 'Тип вправи',
    rowTargets: 'Мішені',
    rowRecommendedShots: 'Рекомендована кількість пострілів',
    rowAllowedAmmo: 'Допустимий тип набоїв',
    rowMaxPoints: 'Максимальна кількість очок',
    rowStartSignal: 'Стартовий сигнал',
    rowReadyCondition: 'Положення готовності',
    rowStartPosition: 'Стартова позиція',
    rowProcedure: 'Процедура виконання',
    rowSafetyAngles: 'Кути безпеки',
    sceneAlt: 'Візуалізація сцени',
    noSnapshot:
      'Знімок 3D відсутній — відкрийте «3D-перегляд», зачекайте на сцену й експортуйте PDF знову.',
    imageLoadError: 'Не вдалося завантажити знімок для PDF',
  },
  common: {
    exportFail: 'Не вдалося зібрати PDF',
    langSwitcher: 'Мова',
    langUk: 'УК',
    langEn: 'EN',
    dash: '—',
  },
  project: {
    save: 'Зберегти вправу…',
    open: 'Відкрити вправу…',
    hint: 'JSON (*.stage.json): сцена, об’єкти, таблиця брифінгу.',
    loadErrorJson: 'Файл не є коректним JSON.',
    loadErrorShape: 'Невідомий формат або пошкоджені дані вправи.',
    loadErrorVersion: 'Непідтримувана версія файлу. Оновіть Stage Builder.',
    fileGroupAria: 'Збереження та завантаження файлу вправи',
  },
  footer: {
    feedbackHeading: 'Зворотний зв\u2019язок',
    feedbackText: 'Знайшли помилку, маєте пропозицію чи відгук? Напишіть:',
    feedbackEmail: 'Email',
    feedbackTelegram: 'Telegram',
    supportHeading: 'Підтримати проєкт',
    supportText: 'Stage Builder — безкоштовний і відкритий. Якщо він вам корисний, можете підтримати розробку:',
    supportLink: 'Підтримати (Monobank)',
  },
  pdfBranding: {
    generatedBy: 'Згенеровано в Stage Builder',
  },
}

export const enMessages: MessageTree = {
  app: {
    title: 'Stage Builder',
    onboardingTitle: 'At a glance',
    onboardingLead:
      'Stage Builder lays out a shooting course in real meters: targets and props on a plan, a 3D preview, and briefing content ready for PDF.',
    onboardingP1:
      '2D plan with a metric grid — add targets and infrastructure, move and rotate them; positions snap to the grid step.',
    onboardingP2:
      '3D view — check the stage from above or the shooter view; the PDF snapshot matches the 3D card proportions in the app.',
    onboardingP3:
      'Targets include IPSC and A4 paper, steel (Appendix C3 sizes), ceramic, poppers, swingers; separate buttons for no-shoots (NS).',
    onboardingP4:
      'Fill the briefing table and export PDF: title, scene image (open 3D first for a useful snapshot), and fields similar to classification briefs.',
    onboardingP5:
      'Field size and grid step are set next to the 2D/3D tabs. Save project writes a *.stage.json with the full stage and briefing text.',
    onboardingDismiss: 'Got it, hide this',
    onboardingReopen: 'Show what the app does',
    contextHint: 'Current field: {{w}}×{{h}} m, grid {{grid}} m.',
    toolbarDrawerOpen: 'Targets & objects',
    toolbarDrawerClose: 'Hide panel',
  },
  stats: {
    targets: 'Targets',
    props: 'Objects',
    minRounds: 'Est. min. shots',
  },
  toolbar: {
    aria: 'Editor panel: targets and infrastructure',
    targetsHeading: 'Targets',
    targetsAria: 'Add targets for the selected weapon class',
    infrastructureHeading: 'Infrastructure',
    infrastructureAria: 'Add range infrastructure (same for all weapon classes)',
    infrastructureHint:
      'Same items for every weapon class. Only the main target buttons above change with the class you pick.',
    targetsNsAria: 'Add no-shoot (NS) targets — hits do not score',
    targetsNsCaption: 'NS:',
    fieldSizeOption: '{{w}} × {{h}} m',
    fieldSizeLabel: 'Range (w × l)',
    fieldSizeHint:
      'Updates 2D grid, bounds, 3D, and PDF. Objects are clamped into the new bounds (simplified).',
  },
  weapon: {
    sectionTitle: 'Weapon class',
    aria: 'Pick a class — it controls which main targets you can add',
    handgun: 'Handgun',
    rifle: 'Rifle',
    shotgun: 'Shotgun',
    mismatchHint:
      'Some targets on the plan are not in the list for this class. They stay on the stage — review your briefing text.',
  },
  targets: {
    paperIpsc: '+ IPSC paper',
    paperA4: '+ A4 paper',
    metalPlate: '+ Steel plate',
    popper: '+ Popper',
    miniPopper: '+ Mini popper',
    ceramicPlate: '+ Ceramic',
    swingerSinglePaper: '+ Swinger 1× paper',
    swingerDoublePaper: '+ Swinger 2× paper',
    swingerSingleCeramic: '+ Swinger 1× ceramic',
    swingerDoubleCeramic: '+ Swinger 2× ceramic',
    noShootPaper: '+ NS IPSC paper',
    noShootPaperA4: '+ NS A4',
    noShootMetal: '+ NS steel',
    noShootPopper: '+ NS popper',
    noShootMiniPopper: '+ NS mini',
  },
  props: {
    shield: '+ Shield',
    shieldDouble: '+ Shield 2×2 m',
    shieldWithPort: '+ Shield w/ port',
    door: '+ Door',
    faultLine: '+ Penalty line',
    barrel: '+ Barrel',
    tireStack: '+ Tire stack',
    seesaw: '+ Seesaw',
    movingPlatform: '+ Moving platform',
    cooperTunnel: '+ Cooper tunnel',
    startPosition: '+ Start',
  },
  view: {
    tabsAria: 'View mode',
    plan2d: '2D plan',
    visual3d: '3D view',
    camAria: '3D camera',
    camOverview: 'Overview',
    camShooter: "Shooter's view",
    threeDControls:
      'Drag to orbit; scroll or pinch to zoom. Add and move objects in «2D plan» (grid snap).',
    threeDControlsDetail:
      'The PDF snapshot matches the 3D card proportions in the app (wider than the old extra-tall frame) so the stage fits better on the page.',
    plan2dControls:
      'Wheel or pinch to zoom. Drag empty space to pan. Click an object to select, drag to move, purple ↻ to rotate in steps. Delete or Backspace removes the selection.',
    plan2dControlsDetail:
      'Grid coordinates under the cursor show meters. Pan with middle mouse or Space+drag. Penalty line: the orange dot changes length (opposite end fixed); the ↻ handle rotates around that orange end. Square steel plate (selected): [ and ] — Appendix C3 side (15 / 20 / 30 cm).',
    controlsDetails: 'More about controls',
    controlsDetailsTooltip: 'More about 2D plan and 3D view controls',
    minimapAria:
      'Stage minimap: blue dots are targets, orange squares are props; pink frame is the current view. Click to center the plan on that point.',
  },
  briefing: {
    summary: 'PDF copy (briefing table)',
    documentTitle: 'Document title',
    exerciseType: 'Exercise type',
    targetsText: 'Targets (text)',
    recommendedShots: 'Recommended round count',
    allowedAmmo: 'Permitted ammunition',
    maxPoints: 'Max points',
    startSignal: 'Start signal',
    readyCondition: 'Ready condition',
    startPosition: 'Start position',
    procedure: 'Course of fire',
    safetyAngles: 'Safety angles',
    applyFromScene: 'Fill targets & shots from scene',
    downloadPdf: 'Download PDF',
    downloadPdfBusy: 'Building PDF…',
    hintBefore: 'To include a scene snapshot in the PDF, open',
    hintEm: '«3D view»',
    hintAfter:
      ', wait until the view updates, then click Download PDF.',
    category: {
      short: 'Short',
      medium: 'Medium',
      long: 'Long',
    },
  },
  pdf: {
    rowExerciseType: 'Exercise type',
    rowTargets: 'Targets',
    rowRecommendedShots: 'Recommended round count',
    rowAllowedAmmo: 'Permitted ammunition',
    rowMaxPoints: 'Maximum score',
    rowStartSignal: 'Start signal',
    rowReadyCondition: 'Ready condition',
    rowStartPosition: 'Start position',
    rowProcedure: 'Course of fire',
    rowSafetyAngles: 'Safety angles',
    sceneAlt: 'Stage visualization',
    noSnapshot:
      'No 3D snapshot — switch to “3D view”, load the scene, and export again.',
    imageLoadError: 'Failed to load image for PDF',
  },
  common: {
    exportFail: 'Could not build PDF',
    langSwitcher: 'Language',
    langUk: 'UK',
    langEn: 'EN',
    dash: '—',
  },
  project: {
    save: 'Save stage…',
    open: 'Open stage…',
    hint: 'JSON (*.stage.json): layout, props, briefing fields.',
    loadErrorJson: 'File is not valid JSON.',
    loadErrorShape: 'Unknown format or invalid stage data.',
    loadErrorVersion: 'Unsupported file version. Update Stage Builder.',
    fileGroupAria: 'Save and open stage file',
  },
  footer: {
    feedbackHeading: 'Feedback',
    feedbackText: 'Found a bug, have a suggestion, or want to leave a review? Reach out:',
    feedbackEmail: 'Email',
    feedbackTelegram: 'Telegram',
    supportHeading: 'Support the project',
    supportText: 'Stage Builder is free and open. If you find it useful, consider supporting development:',
    supportLink: 'Donate (Monobank)',
  },
  pdfBranding: {
    generatedBy: 'Generated in Stage Builder',
  },
}

export const messagesByLocale: Record<Locale, MessageTree> = {
  uk: ukMessages,
  en: enMessages,
}
