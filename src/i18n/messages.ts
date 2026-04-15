export type Locale = 'uk' | 'en'

/** Вкладені рядки; доступ через шлях «крапкою», напр. app.title */
export type MessageTree = {
  app: {
    title: string
    onboardingTitle: string
    onboardingLead: string
    onboardingBenefits: string[]
    onboardingHowTitle: string
    onboardingS1Title: string
    onboardingS1Text: string
    onboardingS2Title: string
    onboardingS2Text: string
    onboardingS3Title: string
    onboardingS3Text: string
    onboardingS4Title: string
    onboardingS4Text: string
    onboardingS5Title: string
    onboardingS5Text: string
    onboardingS6Title: string
    onboardingS6Text: string
    onboardingNote: string
    onboardingCta: string
    onboardingReopen: string
    contextHint: string
    toolbarDrawerOpen: string
    toolbarDrawerClose: string
    /** Показується лише при VITE_SITE_ENV=staging */
    stagingRibbon: string
  }
  stats: {
    targets: string
    props: string
    minRounds: string
  }
  toolbar: {
    aria: string
    targetsHeading: string
    targetsAria: string
    infrastructureHeading: string
    infrastructureAria: string
    infrastructureHint: string
    /** Підпис над блоком кнопок «стіл / стілець / стійка» у панелі інфраструктури */
    furnitureGroupLabel: string
    targetsNsAria: string
    /** @deprecated Підпис NS замінено підгрупами «Штрафні мішені». */
    targetsNsCaption: string
    /** Підгрупи мішеней (двохрівневий тулбар). */
    groupPaper: string
    groupMetal: string
    groupCeramic: string
    groupMoving: string
    penaltyTargetsHeading: string
    groupPenaltyPaper: string
    groupPenaltyMetal: string
    groupPenaltyCeramic: string
    infraGroupShields: string
    infraGroupFaultLines: string
    infraGroupEquipment: string
    fieldSizeOption: string
    fieldSizeLabel: string
    fieldSizeHint: string
    fieldSizeWidthAria: string
    fieldSizeLengthAria: string
    fieldSizePresetsAria: string
    fieldSizePresetsPlaceholder: string
    /** Підтвердження зміни розміру поля, якщо об’єкти змістяться */
    fieldResizeConfirm: string
    /** Підказка, коли обрано тип — клацати по 2D-плану. */
    placementClickPlan: string
    placementCancelEsc: string
    /** Підказка про розстановку на вузькому екрані (одне торкання = один об’єкт + вихід). */
    placementHintNarrow: string
    /** Короткий текст для title кнопок у режимі розстановки на вузькому екрані. */
    placementArmedTitleNarrow: string
    /** Розділ інструментів штрафної зони (BL-019). */
    penaltyZonesHeading: string
    penaltyZonesAria: string
    /** Один інструмент: зовнішній контур або дірка (за геометрією після замикання). */
    penaltyZoneContour: string
    /** Підказка: клік біля першої точки замикає контур. */
    penaltyZoneCloseHint: string
    /** Повідомлення з VISIBILITY §4.3 — чернетка контуру ще не замкнена. */
    penaltyContourUnclosed: string
  }
  props: {
    shield: string
    shieldDouble: string
    shieldWithPort: string
    shieldPortLow: string
    shieldPortHigh: string
    shieldPortSlanted: string
    shieldWithPortDoor: string
    door: string
    faultLine: string
    barrel: string
    tireStack: string
    woodTable: string
    woodChair: string
    weaponRackPyramid: string
    seesaw: string
    movingPlatform: string
    cooperTunnel: string
    startPosition: string
  }
  weapon: {
    sectionTitle: string
    aria: string
    handgun: string
    rifle: string
    shotgun: string
    mismatchHint: string
  }
  targets: {
    paperIpscTwoPostGround: string
    paperIpscTwoPostStand50: string
    paperIpscTwoPostStand100: string
    paperA4TwoPostGround: string
    paperA4TwoPostStand50: string
    paperA4TwoPostStand100: string
    paperMiniIpscTwoPostGround: string
    paperMiniIpscTwoPostStand50: string
    paperMiniIpscTwoPostStand100: string
    metalPlate: string
    metalPlateStand50: string
    metalPlateStand100: string
    popper: string
    miniPopper: string
    ceramicPlate: string
    swingerSinglePaper: string
    swingerDoublePaper: string
    swingerSingleCeramic: string
    swingerDoubleCeramic: string
    noShootPaperTwoPostGround: string
    noShootPaperTwoPostStand50: string
    noShootPaperTwoPostStand100: string
    noShootPaperA4TwoPostGround: string
    noShootPaperA4TwoPostStand50: string
    noShootPaperA4TwoPostStand100: string
    noShootPaperMiniTwoPostGround: string
    noShootPaperMiniTwoPostStand50: string
    noShootPaperMiniTwoPostStand100: string
    noShootMetal: string
    noShootMetalStand50: string
    noShootMetalStand100: string
    noShootPopper: string
    noShootMiniPopper: string
    noShootCeramicPlate: string
    noShootSwingerSinglePaper: string
    noShootSwingerDoublePaper: string
    noShootSwingerSingleCeramic: string
    noShootSwingerDoubleCeramic: string
  }
  view: {
    tabsAria: string
    plan2d: string
    visual3d: string
    camAria: string
    camOverview: string
    camShooter: string
    /** Кадр 1:1 з PNG у PDF (aspect як у знімка) */
    camPdf: string
    camPdfTitle: string
    /** Покриття площадки в 3D (земля / трава / пісок) */
    groundCoverLabel: string
    groundCoverAria: string
    groundEarth: string
    groundGrass: string
    groundSand: string
    threeDControls: string
    threeDControlsDetail: string
    plan2dControls: string
    plan2dControlsDetail: string
    controlsDetails: string
    controlsDetailsTooltip: string
    minimapAria: string
    /** Підказка під час lazy-load чанку Three.js / R3F */
    loading3d: string
    /** Кнопка режиму вимірювання на 2D-плані */
    measureTool: string
    measureToolTitle: string
    /** `{{m}}` — відформатована відстань у метрах */
    measureDistanceMeters: string
    marqueeMode: string
    marqueeModeTitle: string
    copySelection: string
    copySelectionTitle: string
    pasteSelection: string
    pasteSelectionTitle: string
    /** Група кнопок «Назад / Повторити» біля вкладок 2D/3D */
    undoRedoGroupAria: string
    undoPlan: string
    undoPlanTitle: string
    redoPlan: string
    redoPlanTitle: string
    planMapActionsAria: string
    /** Видалити лише виділені об’єкти (не всю вправу) */
    deleteSelection: string
    deleteSelectionTitle: string
    /** Нижня панель після довгого тапу */
    selectionSheetTitle: string
    selectionSheetHint: string
    selectionSheetCopy: string
    selectionSheetDismiss: string
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
    clear: string
    clearAria: string
    clearConfirm: string
    hint: string
    loadErrorJson: string
    loadErrorShape: string
    loadErrorVersion: string
    fileGroupAria: string
  }
  share: {
    loading: string
    invalidId: string
    notFoundOrExpired: string
    loadError: string
    envMissing: string
    backHome: string
    draftConflictTitle: string
    draftConflictBody: string
    draftSave: string
    draftDiscard: string
    draftCancel: string
    /** Header / menu — open publish dialog */
    publishButton: string
    publishTitle: string
    publishIntro: string
    publishConsentBefore: string
    publishConsentLinkText: string
    publishConsentAfter: string
    publishGetView: string
    publishGetEdit: string
    publishBusy: string
    publishViewLabel: string
    publishEditLabel: string
    publishCopy: string
    publishCopyFallback: string
    publishClose: string
    publishNeedConsent: string
    publishError: string
    publishRateLimited: string
    publishTooLarge: string
    publishNotConfigured: string
    publishNetworkError: string
    /** Server returned HTML or non-JSON (wrong route, platform error, etc.). */
    publishErrorHtmlResponse: string
    /** Link on `/v/` share page — open same snapshot in editor (new tab). */
    openInEditor: string
  }
  footer: {
    feedbackHeading: string
    feedbackText: string
    feedbackEmail: string
    feedbackTelegram: string
    supportHeading: string
    supportText: string
    supportLink: string
    installHeading: string
    installText: string
    installButton: string
  }
  pwa: {
    installButton: string
    installHint: string
    updateMessage: string
    updateNow: string
    updateLater: string
    updateAriaLabel: string
  }
  /** Meta / Open Graph / Twitter — синхронізуються з `locale` у `I18nProvider` */
  seo: {
    metaDescription: string
    ogImageAlt: string
  }
  pdfBranding: {
    generatedBy: string
  }
}

export const ukMessages: MessageTree = {
  app: {
    title: 'Stage Builder',
    onboardingTitle: 'Stage Builder',
    onboardingLead:
      'Конструктор сцен для практичної стрільби. Ви можете:',
    onboardingBenefits: [
      'переглянути вправу в 3D з точки зору стрільця',
      'підрахувати, скільки реквізиту потрібно для накриття',
      'перевірити, чи мішені надійно приховані за щитами й декором',
      'оцінити позиції та видимість мішеней',
      'зібрати брифінг і отримати PDF для друку',
      'міряти відстані на плані, виділяти групи об’єктів і дублювати їх',
      'надсилати файл іншим організаторам або зберігати як шаблон',
      'побудувати новий варіант на основі вже зібраної вправи',
    ],
    onboardingHowTitle: 'Крок за кроком',
    onboardingS1Title: '1. Майданчик і сітка',
    onboardingS1Text:
      'Розмір поля — у верхній панелі: введіть ширину й довжину в метрах (8–50 × 8–100 м) або оберіть пресет.\nКрок сітки 0,5 м. Уздовж краю плану — метричні лінійки з поділками від 0,5 м.\nМасштаб: коліщатко або pinch. Зсув: пробіл або середня кнопка миші + перетягування.',
    onboardingS2Title: '2. План 2D: об’єкти та інструменти',
    onboardingS2Text:
      'Розстановка: оберіть тип у бічній панелі (мішень, щит, реквізит) → клацайте по плану. Кожен клік додає один об’єкт у точці курсора (навіть поверх інших). Вийти з режиму: Esc або знову та сама кнопка типу.\n\nПісля виходу: клік — виділити; перетягування — перемістити (прив’язка до сітки вмикається сама). «↻» — поворот. На клавіатурі: Delete / Backspace — видалити виділене. На телефоні: кнопка з хрестиком біля карти — те саме; довгий тап по плану (~0,5 с) з виділенням відкриває меню дій. Нижня червона кнопка з кошиком — очистити всю вправу (не плутати з видаленням виділення).\n\nВимір: іконка лінійки біля карти або клавіша M у 2D — два кліки задають відрізок і довжину в метрах; Esc скасовує незавершений вимір.\nРамка на карті — виділити зону. Копія / вставка: Ctrl+C / Ctrl+V або кнопки «Копія» / «Вставити»; копія з’являється в тій частині плану, яку зараз видно.',
    onboardingS3Title: '3. Мішені, NS і реквізит',
    onboardingS3Text:
      'NS (No-Shoot) — окремі кнопки в палітрі.\nШтрафна лінія: тягніть помаранчевий маркер, щоб змінити довжину; другий кінець нерухомий.\nКвадратний метал: [ і ] — розмір лиця 15 / 20 / 30 см (типові габарити IPSC).\n\nТакож у палітрі: Mini IPSC, метал на стійці (у 3D видно висоту лиця близько 50 см або 1 м), міні-поппер.\nРеквізит: щити з портами (зокрема з дверцятами в отворі), стіл, стілець, стійка для довгоствольної зброї.\n\nЯкщо на плані є стартова позиція, у брифінгу в полі «Кути безпеки» можна ввести, наприклад, 90/90/90 — на плані з’являться допоміжні сектори, мішені поза ними підсвічуються. Це підказка для перевірки схеми, не заміна рішення РО чи регламенту.',
    onboardingS4Title: '4. Перегляд 3D',
    onboardingS4Text:
      'Перемкніть режим у верхньому меню на 3D.\nОбертання — ліва кнопка миші, наближення — коліщатко.\nПеревіряйте видимість через порти щитів і кути. Режим «Зона стрільця» — погляд учасника.\nДля мішеней на стійках зверніть увагу на висоту лиця від підлоги.',
    onboardingS5Title: '5. Брифінг і PDF',
    onboardingS5Text:
      'Заповніть таблицю брифінгу: назва, процедура, старт, боєприпаси, кути безпеки тощо. Лічильник мішеней і орієнтовний мінімум пострілів оновлюються автоматично.\n\n«Завантажити PDF» — таблиця плюс знімок 3D. Перед експортом відкрийте 3D, щоб на знімку було те саме, що на екрані. Поле «Кути безпеки» потрапляє в PDF разом з іншими рядками.',
    onboardingS6Title: '6. Збереження',
    onboardingS6Text:
      '«Зберегти вправу» створює файл .stage.json: геометрія сцени та текст брифінгу. Його можна відкрити пізніше або передати колегам.\nЧернетка зберігається в цьому браузері між візитами, доки не очистите вправу кнопкою смітника на карті.',
    onboardingNote:
      'Працює в браузері або як встановлений додаток. Коли вийде нова версія, зверху може з’явитися смуга з кнопкою «Оновити». Нагадування про оновлення не частіші за раз на 24 години.',
    onboardingCta: 'Почати роботу',
    onboardingReopen: '\u0406\u043d\u0441\u0442\u0440\u0443\u043a\u0446\u0456\u044f',
    contextHint: '\u0417\u0430\u0440\u0430\u0437: \u043f\u043e\u043b\u0435 {{w}}\u00d7{{h}} \u043c, \u0441\u0456\u0442\u043a\u0430 {{grid}} \u043c.',
    toolbarDrawerOpen: '\u041c\u0456\u0448\u0435\u043d\u0456 \u0442\u0430 \u043e\u0431\u2019\u0454\u043a\u0442\u0438',
    toolbarDrawerClose: '\u0421\u0445\u043e\u0432\u0430\u0442\u0438 \u043f\u0430\u043d\u0435\u043b\u044c',
    stagingRibbon:
      '\u0422\u0435\u0441\u0442\u043e\u0432\u0435 \u0441\u0435\u0440\u0435\u0434\u043e\u0432\u0438\u0449\u0435 (staging). \u0414\u043b\u044f \u0431\u043e\u044e \u0432\u0438\u043a\u043e\u0440\u0438\u0441\u0442\u043e\u0432\u0443\u0439\u0442\u0435 stage-builder.vercel.app.',
  },
  stats: {
    targets: '\u041c\u0456\u0448\u0435\u043d\u0456',
    props: '\u041e\u0431\u2019\u0454\u043a\u0442\u0438',
    minRounds: '\u041e\u0446\u0456\u043d\u043a\u0430 \u043c\u0456\u043d. \u043f\u043e\u0441\u0442\u0440\u0456\u043b\u0456\u0432 (\u043e\u0440\u0456\u0454\u043d\u0442\u043e\u0432\u043d\u043e)',
  },
  toolbar: {
    aria: '\u041f\u0430\u043d\u0435\u043b\u044c \u0440\u0435\u0434\u0430\u043a\u0442\u043e\u0440\u0430: \u043c\u0456\u0448\u0435\u043d\u0456 \u0442\u0430 \u0456\u043d\u0444\u0440\u0430\u0441\u0442\u0440\u0443\u043a\u0442\u0443\u0440\u0430',
    targetsHeading: '\u041c\u0456\u0448\u0435\u043d\u0456',
    targetsAria: '\u0414\u043e\u0434\u0430\u0442\u0438 \u043c\u0456\u0448\u0435\u043d\u0456 \u043d\u0430 \u043f\u043b\u0430\u043d (\u0443\u0441\u0456 \u043e\u0441\u043d\u043e\u0432\u043d\u0456 \u0442\u0438\u043f\u0438, IPSC-\u0441\u0442\u0438\u043b\u044c)',
    infrastructureHeading: '\u0406\u043d\u0444\u0440\u0430\u0441\u0442\u0440\u0443\u043a\u0442\u0443\u0440\u0430',
    infrastructureAria: '\u0414\u043e\u0434\u0430\u0442\u0438 \u0440\u0435\u043a\u0432\u0456\u0437\u0438\u0442 \u0456 \u043a\u043e\u043d\u0441\u0442\u0440\u0443\u043a\u0446\u0456\u0457 \u043f\u043b\u043e\u0449\u0430\u0434\u043a\u0438',
    infrastructureHint:
      '\u0429\u0438\u0442\u0438, \u0434\u0432\u0435\u0440\u0456, \u0448\u0442\u0440\u0430\u0444\u043d\u0456 \u043b\u0456\u043d\u0456\u0457 \u0442\u0430 \u0456\u043d\u0448\u0438\u0439 \u0440\u0435\u043a\u0432\u0456\u0437\u0438\u0442 \u2014 \u043e\u0434\u043d\u0430\u043a\u043e\u0432\u0438\u0439 \u043d\u0430\u0431\u0456\u0440 \u0434\u043b\u044f \u0431\u0443\u0434\u044c-\u044f\u043a\u043e\u0457 \u0434\u0438\u0441\u0446\u0438\u043f\u043b\u0456\u043d\u0438.',
    furnitureGroupLabel: '\u0421\u0442\u0456\u043b, \u0441\u0442\u0456\u043b\u0435\u0446\u044c, \u0441\u0442\u0456\u0439\u043a\u0430 \u0434\u043b\u044f \u0437\u0431\u0440\u043e\u0457',
    targetsNsAria: '\u0414\u043e\u0434\u0430\u0442\u0438 no-shoot (NS) \u043c\u0456\u0448\u0435\u043d\u0456 \u2014 \u0432\u043b\u0443\u0447\u0430\u043d\u043d\u044f \u043d\u0435 \u0437\u0430\u0440\u0430\u0445\u043e\u0432\u0443\u044e\u0442\u044c\u0441\u044f',
    targetsNsCaption: 'NS:',
    groupPaper: '\u041f\u0430\u043f\u0456\u0440',
    groupMetal: '\u041c\u0435\u0442\u0430\u043b',
    groupCeramic: '\u041a\u0435\u0440\u0430\u043c\u0456\u043a\u0430',
    groupMoving: '\u0420\u0443\u0445\u043e\u043c\u0456',
    penaltyTargetsHeading: '\u0428\u0442\u0440\u0430\u0444\u043d\u0456 \u043c\u0456\u0448\u0435\u043d\u0456',
    groupPenaltyPaper: '\u041f\u0430\u043f\u0456\u0440',
    groupPenaltyMetal: '\u041c\u0435\u0442\u0430\u043b',
    groupPenaltyCeramic: '\u041a\u0435\u0440\u0430\u043c\u0456\u043a\u0430',
    infraGroupShields: '\u0429\u0438\u0442\u0438',
    infraGroupFaultLines: '\u0428\u0442\u0440\u0430\u0444\u043d\u0456 \u043b\u0456\u043d\u0456\u0457 \u0442\u0430 \u0437\u043e\u043d\u0438',
    infraGroupEquipment: '\u041e\u0431\u043b\u0430\u0434\u043d\u0430\u043d\u043d\u044f',
    fieldSizeOption: '{{w}} \u00d7 {{h}} \u043c',
    fieldSizeLabel: '\u041f\u043b\u043e\u0449\u0430\u0434\u043a\u0430 (\u0448\u0438\u0440 \u00d7 \u0434\u043e\u0432)',
    fieldSizeHint:
      '\u0417\u043c\u0456\u043d\u044e\u0454 \u0441\u0456\u0442\u043a\u0443 2D, \u043c\u0435\u0436\u0456, 3D \u0456 PDF. \u041e\u0431\u2019\u0454\u043a\u0442\u0438 \u0441\u0442\u0438\u0441\u043a\u0430\u044e\u0442\u044c\u0441\u044f \u0434\u043e \u043d\u043e\u0432\u0438\u0445 \u043c\u0435\u0436 (\u0441\u043f\u0440\u043e\u0449\u0435\u043d\u043e \u0437\u0430 \u0446\u0435\u043d\u0442\u0440\u043e\u043c). \u0414\u0456\u0430\u043f\u0430\u0437\u043e\u043d: \u0448\u0438\u0440\u0438\u043d\u0430 8\u201350 \u043c, \u0434\u043e\u0432\u0436\u0438\u043d\u0430 8\u2013100 \u043c, \u043a\u0440\u043e\u043a 0,5 \u043c.',
    fieldSizeWidthAria: '\u0428\u0438\u0440\u0438\u043d\u0430 \u043f\u043b\u043e\u0449\u0430\u0434\u043a\u0438, \u043c',
    fieldSizeLengthAria: '\u0414\u043e\u0432\u0436\u0438\u043d\u0430 \u043f\u043b\u043e\u0449\u0430\u0434\u043a\u0438, \u043c',
    fieldSizePresetsAria: '\u0428\u0432\u0438\u0434\u043a\u0438\u0439 \u0432\u0438\u0431\u0456\u0440 \u0440\u043e\u0437\u043c\u0456\u0440\u0443 \u0437 \u043f\u0440\u0435\u0441\u0435\u0442\u0456\u0432',
    fieldSizePresetsPlaceholder: '\u041f\u0440\u0435\u0441\u0435\u0442\u0438\u2026',
    fieldResizeConfirm:
      '\u041d\u043e\u0432\u0438\u0439 \u0440\u043e\u0437\u043c\u0456\u0440 \u043f\u043b\u043e\u0449\u0430\u0434\u043a\u0438 \u043c\u0435\u043d\u0448\u0438\u0439 \u0437\u0430 \u043f\u043e\u0442\u043e\u0447\u043d\u0438\u0439: \u043c\u0456\u0448\u0435\u043d\u0456 \u0442\u0430 \u0440\u0435\u043a\u0432\u0456\u0437\u0438\u0442 \u0431\u0443\u0434\u0443\u0442\u044c \u0437\u043c\u0456\u0449\u0435\u043d\u0456 \u0432\u0441\u0435\u0440\u0435\u0434\u0438\u043d\u0443 \u043d\u043e\u0432\u0438\u0445 \u043c\u0435\u0436. \u041f\u0440\u043e\u0434\u043e\u0432\u0436\u0438\u0442\u0438?',
    placementClickPlan:
      '\u041a\u043b\u0430\u0446\u043d\u0456\u0442\u044c \u043f\u043e \u043f\u043b\u0430\u043d\u0443, \u0449\u043e\u0431 \u043f\u043e\u0441\u0442\u0430\u0432\u0438\u0442\u0438. \u041f\u043e\u0432\u0442\u043e\u0440\u043d\u0438\u0439 \u043a\u043b\u0456\u043a \u043f\u043e \u0442\u0438\u043f\u0443 \u0432 \u043c\u0435\u043d\u044e \u2014 \u0432\u0438\u0439\u0442\u0438 \u0437 \u0440\u0435\u0436\u0438\u043c\u0443.',
    placementCancelEsc: 'Esc \u2014 \u0441\u043a\u0430\u0441\u0443\u0432\u0430\u0442\u0438 \u0440\u0435\u0436\u0438\u043c \u0440\u043e\u0437\u0441\u0442\u0430\u043d\u043e\u0432\u043a\u0438.',
    placementHintNarrow:
      '\u041d\u0430 \u0432\u0443\u0437\u044c\u043a\u043e\u043c\u0443 \u0435\u043a\u0440\u0430\u043d\u0456 \u043e\u0434\u043d\u0435 \u0442\u043e\u0440\u043a\u0430\u043d\u043d\u044f \u043f\u043e \u043f\u043b\u0430\u043d\u0443 \u0441\u0442\u0430\u0432\u0438\u0442\u044c \u043e\u0434\u0438\u043d \u043e\u0431\u2019\u0454\u043a\u0442 \u0456 \u0432\u0438\u043c\u0438\u043a\u0430\u0454 \u0440\u0435\u0436\u0438\u043c. Esc \u2014 \u0441\u043a\u0430\u0441\u0443\u0432\u0430\u0442\u0438 (\u0437 \u043a\u043b\u0430\u0432\u0456\u0430\u0442\u0443\u0440\u0438).',
    placementArmedTitleNarrow:
      '\u0422\u043e\u0440\u043a\u043d\u0456\u0442\u044c \u043f\u043b\u0430\u043d \u2014 \u043f\u043e\u0441\u0442\u0430\u0432\u0438\u0442\u0438 \u0456 \u0432\u0438\u0439\u0442\u0438 \u0437 \u0440\u0435\u0436\u0438\u043c\u0443. Esc \u2014 \u0441\u043a\u0430\u0441\u0443\u0432\u0430\u0442\u0438 (\u043a\u043b\u0430\u0432\u0456\u0430\u0442\u0443\u0440\u0430).',
    penaltyZonesHeading: '\u0428\u0442\u0440\u0430\u0444\u043d\u0456 \u0437\u043e\u043d\u0438',
    penaltyZonesAria:
      '\u041d\u0430\u043c\u0430\u043b\u044c\u043e\u0432\u0443\u0432\u0430\u0442\u0438 \u0437\u0430\u043c\u043a\u043d\u0435\u043d\u0456 \u043a\u043e\u043d\u0442\u0443\u0440\u0438: \u0434\u0456\u0440\u043a\u0430 \u0432\u0438\u0437\u043d\u0430\u0447\u0430\u0454\u0442\u044c\u0441\u044f \u0430\u0432\u0442\u043e\u043c\u0430\u0442\u0438\u0447\u043d\u043e, \u044f\u043a\u0449\u043e \u043a\u043e\u043d\u0442\u0443\u0440 \u0437\u0430\u043c\u043a\u043d\u0443\u0442\u043e \u0432\u0441\u0435\u0440\u0435\u0434\u0438\u043d\u0456 \u0456\u043d\u0448\u043e\u0457 \u0437\u043e\u043d\u0438',
    penaltyZoneContour: '\u041a\u043e\u043d\u0442\u0443\u0440 \u0448\u0442\u0440\u0430\u0444\u043d\u043e\u0457 \u0437\u043e\u043d\u0438',
    penaltyZoneCloseHint:
      '\u041a\u043b\u0430\u0446\u043d\u0456\u0442\u044c \u0431\u043b\u0438\u0437\u044c\u043a\u043e \u0434\u043e \u043f\u0435\u0440\u0448\u043e\u0457 \u0442\u043e\u0447\u043a\u0438 (\u0434\u043e\u043f\u0443\u0441\u043a 5 \u0441\u043c), \u0449\u043e\u0431 \u0437\u0430\u043c\u043a\u043d\u0443\u0442\u0438. \u0412\u0441\u0435\u0440\u0435\u0434\u0438\u043d\u0456 \u0456\u0441\u043d\u0443\u044e\u0447\u043e\u0457 \u0437\u043e\u043d\u0438 \u2014 \u0434\u0456\u0440\u043a\u0430. \u0412\u0435\u0440\u0448\u0438\u043d\u0438 \u2014 \u043a\u043b\u0456\u043a \u0434\u043b\u044f \u0432\u0438\u0434\u0456\u043b\u0435\u043d\u043d\u044f \u0442\u0430 \u043f\u0435\u0440\u0435\u0442\u044f\u0433\u0443\u0432\u0430\u043d\u043d\u044f; Delete / Backspace \u2014 \u0432\u0438\u0434\u0430\u043b\u0438\u0442\u0438 \u0432\u0435\u0440\u0448\u0438\u043d\u0443 (\u043f\u0440\u0438 \u043c\u0435\u043d\u0448\u0435 \u043d\u0456\u0436 3 \u0442\u043e\u0447\u043a\u0430\u0445 \u0443 \u043a\u043e\u043d\u0442\u0443\u0440\u0456 \u2014 \u0432\u0435\u0441\u044c \u043f\u043e\u043b\u0456\u0433\u043e\u043d \u0430\u0431\u043e \u0434\u0456\u0440\u043a\u0443).',
    penaltyContourUnclosed: '\u041a\u043e\u043d\u0442\u0443\u0440 \u0448\u0442\u0440\u0430\u0444\u043d\u043e\u0457 \u0437\u043e\u043d\u0438 \u043d\u0435 \u0437\u0430\u043c\u043a\u043d\u0435\u043d\u0438\u0439',
  },
  weapon: {
    sectionTitle: '\u041a\u043b\u0430\u0441 \u0437\u0431\u0440\u043e\u0457',
    aria: '\u041a\u043b\u0430\u0441 \u0437\u0431\u0440\u043e\u0457 \u0437\u0431\u0435\u0440\u0456\u0433\u0430\u0454\u0442\u044c\u0441\u044f \u0443 \u0444\u0430\u0439\u043b\u0456 \u0432\u043f\u0440\u0430\u0432\u0438; \u0443 \u0440\u0435\u0434\u0430\u043a\u0442\u043e\u0440\u0456 \u0434\u043e\u0441\u0442\u0443\u043f\u043d\u0456 \u0443\u0441\u0456 \u043e\u0441\u043d\u043e\u0432\u043d\u0456 \u0442\u0438\u043f\u0438 \u043c\u0456\u0448\u0435\u043d\u0435\u0439.',
    handgun: '\u041f\u0456\u0441\u0442\u043e\u043b\u0435\u0442',
    rifle: '\u041a\u0430\u0440\u0430\u0431\u0456\u043d',
    shotgun: '\u0420\u0443\u0448\u043d\u0438\u0446\u044f',
    mismatchHint:
      '\u041f\u0435\u0440\u0435\u0432\u0456\u0440\u044f\u0439\u0442\u0435 \u043c\u0456\u0448\u0435\u043d\u0456 \u0442\u0430 \u0442\u0435\u043a\u0441\u0442 \u0431\u0440\u0438\u0444\u0456\u043d\u0433\u0443 \u0437\u0433\u0456\u0434\u043d\u043e \u0437 \u0440\u0435\u0433\u043b\u0430\u043c\u0435\u043d\u0442\u043e\u043c \u0437\u043c\u0430\u0433\u0430\u043d\u043d\u044f.',
  },
  targets: {
    paperIpscTwoPostGround: '+ \u041f\u0430\u043f\u0456\u0440 IPSC, \u043d\u0438\u0437\u044c\u043a\u043e',
    paperIpscTwoPostStand50: '+ \u041f\u0430\u043f\u0456\u0440 IPSC, \u043d\u0438\u0437 50 \u0441\u043c',
    paperIpscTwoPostStand100: '+ \u041f\u0430\u043f\u0456\u0440 IPSC, \u043d\u0438\u0437 1 \u043c',
    paperA4TwoPostGround: '+ A4, \u043d\u0438\u0437\u044c\u043a\u043e',
    paperA4TwoPostStand50: '+ A4, \u043d\u0438\u0437 50 \u0441\u043c',
    paperA4TwoPostStand100: '+ A4, \u043d\u0438\u0437 1 \u043c',
    paperMiniIpscTwoPostGround: '+ Mini IPSC, \u043d\u0438\u0437\u044c\u043a\u043e',
    paperMiniIpscTwoPostStand50: '+ Mini IPSC, \u043d\u0438\u0437 50 \u0441\u043c',
    paperMiniIpscTwoPostStand100: '+ Mini IPSC, \u043d\u0438\u0437 1 \u043c',
    metalPlate: '+ \u041c\u0435\u0442\u0430\u043b (\u043a\u0432\u0430\u0434\u0440.)',
    metalPlateStand50: '+ \u041c\u0435\u0442\u0430\u043b, \u0441\u0442\u0456\u0439\u043a\u0430 50 \u0441\u043c',
    metalPlateStand100: '+ \u041c\u0435\u0442\u0430\u043b, \u0441\u0442\u0456\u0439\u043a\u0430 1 \u043c',
    popper: '+ \u041f\u043e\u043f\u043f\u0435\u0440',
    miniPopper: '+ \u041c\u0456\u043d\u0456-\u043f\u043e\u043f\u043f\u0435\u0440',
    ceramicPlate: '+ \u041a\u0435\u0440\u0430\u043c\u0456\u043a\u0430',
    swingerSinglePaper: '+ \u041a\u0456\u0432\u0430\u043a 1\u00d7 \u043f\u0430\u043f\u0456\u0440',
    swingerDoublePaper: '+ \u041a\u0456\u0432\u0430\u043a 2\u00d7 \u043f\u0430\u043f\u0456\u0440',
    swingerSingleCeramic: '+ \u041a\u0456\u0432\u0430\u043a 1\u00d7 \u043a\u0435\u0440.',
    swingerDoubleCeramic: '+ \u041a\u0456\u0432\u0430\u043a 2\u00d7 \u043a\u0435\u0440.',
    noShootPaperTwoPostGround: '+ NS IPSC, \u043d\u0438\u0437\u044c\u043a\u043e',
    noShootPaperTwoPostStand50: '+ NS IPSC, \u043d\u0438\u0437 50 \u0441\u043c',
    noShootPaperTwoPostStand100: '+ NS IPSC, \u043d\u0438\u0437 1 \u043c',
    noShootPaperA4TwoPostGround: '+ NS A4, \u043d\u0438\u0437\u044c\u043a\u043e',
    noShootPaperA4TwoPostStand50: '+ NS A4, \u043d\u0438\u0437 50 \u0441\u043c',
    noShootPaperA4TwoPostStand100: '+ NS A4, \u043d\u0438\u0437 1 \u043c',
    noShootPaperMiniTwoPostGround: '+ NS Mini IPSC, \u043d\u0438\u0437\u044c\u043a\u043e',
    noShootPaperMiniTwoPostStand50: '+ NS Mini IPSC, \u043d\u0438\u0437 50 \u0441\u043c',
    noShootPaperMiniTwoPostStand100: '+ NS Mini IPSC, \u043d\u0438\u0437 1 \u043c',
    noShootMetal: '+ NS \u043c\u0435\u0442\u0430\u043b',
    noShootMetalStand50: '+ NS \u043c\u0435\u0442\u0430\u043b 50 \u0441\u043c',
    noShootMetalStand100: '+ NS \u043c\u0435\u0442\u0430\u043b 1 \u043c',
    noShootPopper: '+ NS \u043f\u043e\u043f\u043f\u0435\u0440',
    noShootMiniPopper: '+ NS \u043c\u0456\u043d\u0456',
    noShootCeramicPlate: '+ NS \u043a\u0435\u0440\u0430\u043c\u0456\u043a\u0430',
    noShootSwingerSinglePaper: '+ NS \u043a\u0456\u0432\u0430\u043a 1\u00d7 \u043f\u0430\u043f\u0456\u0440',
    noShootSwingerDoublePaper: '+ NS \u043a\u0456\u0432\u0430\u043a 2\u00d7 \u043f\u0430\u043f\u0456\u0440',
    noShootSwingerSingleCeramic: '+ NS \u043a\u0456\u0432\u0430\u043a 1\u00d7 \u043a\u0435\u0440.',
    noShootSwingerDoubleCeramic: '+ NS \u043a\u0456\u0432\u0430\u043a 2\u00d7 \u043a\u0435\u0440.',
  },
  props: {
    shield: '+ \u0429\u0438\u0442',
    shieldDouble: '+ \u0429\u0438\u0442 2\u00d72 \u043c',
    shieldWithPort: '+ \u0429\u0438\u0442 \u0437 \u043f\u043e\u0440\u0442\u043e\u043c',
    shieldPortLow: '+ \u0429\u0438\u0442, \u043d\u0438\u0437\u044c\u043a\u0438\u0439 \u043f\u043e\u0440\u0442',
    shieldPortHigh: '+ \u0429\u0438\u0442, \u0432\u0438\u0441\u043e\u043a\u0438\u0439 \u043f\u043e\u0440\u0442',
    shieldPortSlanted: '+ \u0429\u0438\u0442, \u043a\u043e\u0441\u0438\u0439 \u043f\u043e\u0440\u0442',
    shieldWithPortDoor: '+ \u0429\u0438\u0442, \u0434\u0432\u0435\u0440\u0446\u044f\u0442\u0430 \u0432 \u043f\u043e\u0440\u0442\u0456',
    door: '+ \u0414\u0432\u0435\u0440\u0456',
    faultLine: '+ \u0428\u0442\u0440\u0430\u0444\u043d\u0430 \u043b\u0456\u043d\u0456\u044f',
    barrel: '+ \u0411\u043e\u0447\u043a\u0430',
    tireStack: '+ \u0421\u0442\u043e\u0441 \u0448\u0438\u043d',
    woodTable: '+ \u0421\u0442\u0456\u043b (\u0434\u0435\u0440\u0435\u0432\u2019\u044f\u043d\u0438\u0439)',
    woodChair: '+ \u0421\u0442\u0456\u043b\u0435\u0446\u044c',
    weaponRackPyramid: '+ \u041f\u0456\u0440\u0430\u043c\u0456\u0434\u0430 \u0434\u043b\u044f \u0437\u0431\u0440\u043e\u0457 (\u0440\u0443\u0448\u043d\u0438\u0446\u044f)',
    seesaw: '+ \u041a\u0430\u0447\u0435\u043b\u044c',
    movingPlatform: '+ \u0420\u0443\u0445. \u043f\u043b\u0430\u0442\u0444\u043e\u0440\u043c\u0430',
    cooperTunnel: '+ \u0422\u0443\u043d\u0435\u043b\u044c \u041a\u0443\u043f\u0435\u0440\u0430',
    startPosition: '+ \u0421\u0442\u0430\u0440\u0442',
  },
  view: {
    tabsAria: '\u0420\u0435\u0436\u0438\u043c \u043f\u0435\u0440\u0435\u0433\u043b\u044f\u0434\u0443',
    plan2d: '\u041f\u043b\u0430\u043d 2D',
    visual3d: '3D-\u043f\u0435\u0440\u0435\u0433\u043b\u044f\u0434',
    camAria: '\u041a\u0430\u043c\u0435\u0440\u0430 3D',
    camOverview: '\u041e\u0433\u043b\u044f\u0434 (\u0437\u0430\u0433\u0430\u043b\u044c\u043d\u0438\u0439)',
    camShooter: '\u0417\u043e\u043d\u0430 \u0441\u0442\u0440\u0456\u043b\u044c\u0446\u044f',
    camPdf: '\u042f\u043a \u0443 PDF',
    camPdfTitle:
      '\u041a\u0430\u0434\u0440 \u0442\u0430\u043a\u043e\u0433\u043e \u0436 \u0441\u043f\u0456\u0432\u0432\u0456\u0434\u043d\u043e\u0448\u0435\u043d\u043d\u044f \u0441\u0442\u043e\u0440\u0456\u043d, \u0449\u043e \u0439 \u0437\u043d\u0456\u043c\u043e\u043a 3D \u0443 \u0431\u0440\u0438\u0444\u0456\u043d\u0433\u0443 (\u0440\u0430\u043c\u043a\u0430 \u2014 \u043c\u0435\u0436\u0456 \u043a\u0430\u0434\u0440\u0443)',
    groundCoverLabel: '\u041f\u043e\u043a\u0440\u0438\u0442\u0442\u044f:',
    groundCoverAria: '\u041f\u043e\u043a\u0440\u0438\u0442\u0442\u044f \u043f\u043b\u043e\u0449\u0430\u0434\u043a\u0438 \u0432 3D',
    groundEarth: '\u0417\u0435\u043c\u043b\u044f',
    groundGrass: '\u0422\u0440\u0430\u0432\u0430',
    groundSand: '\u041f\u0456\u0441\u043e\u043a',
    threeDControls:
      '\u041e\u0431\u0435\u0440\u0442\u0430\u043d\u043d\u044f \u2014 \u043f\u0435\u0440\u0435\u0442\u044f\u0433\u0443\u0432\u0430\u043d\u043d\u044f\u043c \u043c\u0438\u0448\u0435\u044e; \u043c\u0430\u0441\u0448\u0442\u0430\u0431 \u2014 \u043a\u043e\u043b\u0456\u0449\u0430\u0442\u043a\u043e\u043c \u0430\u0431\u043e \u0437\u0432\u0435\u0434\u0435\u043d\u043d\u044f\u043c \u043f\u0430\u043b\u044c\u0446\u0456\u0432. \u0414\u043e\u0434\u0430\u0432\u0430\u0442\u0438 \u0442\u0430 \u0440\u0443\u0445\u0430\u0442\u0438 \u043e\u0431\u2019\u0454\u043a\u0442\u0438 \u043a\u0440\u0430\u0449\u0435 \u0432 \u0440\u0435\u0436\u0438\u043c\u0456 \u00ab\u041f\u043b\u0430\u043d 2D\u00bb (\u043f\u0440\u0438\u0432\u2019\u044f\u0437\u043a\u0430 \u0434\u043e \u0441\u0456\u0442\u043a\u0438).',
    threeDControlsDetail:
      'Режим «Як у PDF» показує той самий кадр, що потрапить у документ (рамка — межі кадру). Знімок для PDF має ті ж пропорції. У PDF: QR у верхньому правому куті сторінки; посилання та «згенеровано…» — по центру під знімком.',
    plan2dControls:
      '\u041c\u0430\u0441\u0448\u0442\u0430\u0431 \u2014 \u043a\u043e\u043b\u0456\u0449\u0430\u0442\u043a\u043e \u0430\u0431\u043e pinch. \u041f\u0435\u0440\u0435\u0442\u044f\u0433\u043d\u0456\u0442\u044c \u043f\u043e\u0440\u043e\u0436\u043d\u0454 \u043c\u0456\u0441\u0446\u0435 \u2014 \u0437\u0441\u0443\u0432 \u043f\u043b\u0430\u043d\u0443. \u041a\u043b\u0456\u043a \u043f\u043e \u043e\u0431\u2019\u0454\u043a\u0442\u0443 \u2014 \u0432\u0438\u0434\u0456\u043b\u0435\u043d\u043d\u044f, \u043f\u0435\u0440\u0435\u0442\u044f\u0433\u0443\u0432\u0430\u043d\u043d\u044f \u2014 \u0440\u0443\u0445. \u00ab\u21bb\u00bb \u0431\u0456\u043b\u044f \u043e\u0431\u2019\u0454\u043a\u0442\u0430 \u2014 \u043f\u043e\u0432\u043e\u0440\u043e\u0442 \u043a\u0440\u043e\u043a\u0430\u043c\u0438. Delete \u0430\u0431\u043e Backspace \u2014 \u0432\u0438\u0434\u0430\u043b\u0438\u0442\u0438.',
    plan2dControlsDetail:
      '\u041f\u0456\u0434 \u043a\u0443\u0440\u0441\u043e\u0440\u043e\u043c \u043f\u043e\u043a\u0430\u0437\u0443\u0454\u0442\u044c\u0441\u044f \u0432\u0443\u0437\u043e\u043b \u0441\u0456\u0442\u043a\u0438 \u0432 \u043c\u0435\u0442\u0440\u0430\u0445. \u041f\u0430\u043d\u043e\u0440\u0430\u043c\u0430: \u0441\u0435\u0440\u0435\u0434\u043d\u044f \u043a\u043d\u043e\u043f\u043a\u0430 \u043c\u0438\u0448\u0456 \u0430\u0431\u043e \u043f\u0440\u043e\u0431\u0456\u043b \u0456 \u043f\u0435\u0440\u0435\u0442\u044f\u0433\u0443\u0432\u0430\u043d\u043d\u044f. \u0428\u0442\u0440\u0430\u0444\u043d\u0430 \u043b\u0456\u043d\u0456\u044f: \u043f\u043e\u043c\u0430\u0440\u0430\u043d\u0447\u0435\u0432\u0438\u0439 \u043c\u0430\u0440\u043a\u0435\u0440 \u2014 \u0434\u043e\u0432\u0436\u0438\u043d\u0430 (\u0456\u043d\u0448\u0438\u0439 \u043a\u0456\u043d\u0435\u0446\u044c \u043d\u0435\u0440\u0443\u0445\u043e\u043c\u0438\u0439); \u0440\u0443\u0447\u043a\u0430 \u21bb \u0431\u0456\u043b\u044f \u0442\u043e\u0433\u043e \u043a\u0456\u043d\u0446\u044f \u2014 \u043e\u0431\u0435\u0440\u0442\u0430\u043d\u043d\u044f \u043d\u0430\u0432\u043a\u043e\u043b\u043e \u043f\u043e\u043c\u0430\u0440\u0430\u043d\u0447\u0435\u0432\u043e\u0433\u043e. \u041c\u0435\u0442\u0430\u043b\u0435\u0432\u0430 \u043a\u0432\u0430\u0434\u0440\u0430\u0442\u043d\u0430 \u043f\u043b\u0430\u0441\u0442\u0438\u043d\u0430 (\u0432\u0438\u0434\u0456\u043b\u0435\u043d\u0430): [ \u0456 ] \u2014 \u0441\u0442\u043e\u0440\u043e\u043d\u0430 \u0437\u0430 Appendix C3 (15 / 20 / 30 \u0441\u043c).',
    controlsDetails: '\u0414\u043e\u043a\u043b\u0430\u0434\u043d\u0456\u0448\u0435',
    controlsDetailsTooltip: '\u041f\u0456\u0434\u043a\u0430\u0437\u043a\u0438 \u0437 \u043a\u0435\u0440\u0443\u0432\u0430\u043d\u043d\u044f \u043f\u043b\u0430\u043d\u043e\u043c 2D \u0442\u0430 \u043f\u0435\u0440\u0435\u0433\u043b\u044f\u0434\u043e\u043c 3D',
    minimapAria:
      '\u041c\u0456\u043d\u0456-\u043a\u0430\u0440\u0442\u0430 \u043f\u043b\u043e\u0449\u0430\u0434\u043a\u0438: \u0441\u0438\u043d\u0456 \u0442\u043e\u0447\u043a\u0438-\u043f\u0430\u043f\u0456\u0440 \u0456 \u043c\u0435\u0442\u0430\u043b, \u043f\u043e\u043c\u0430\u0440\u0430\u043d\u0436\u0435\u0432\u0456 \u043a\u0432\u0430\u0434\u0440\u0430\u0442\u0438-\u0440\u0435\u043a\u0432\u0456\u0437\u0438\u0442, \u0440\u043e\u0436\u0435\u0432\u0430 \u0440\u0430\u043c\u043a\u0430-\u0432\u0438\u0434\u0438\u043c\u0438\u0439 \u0444\u0440\u0430\u0433\u043c\u0435\u043d\u0442. \u041a\u043b\u0430\u0446\u043d\u0456\u0442\u044c, \u0449\u043e\u0431 \u043f\u043e\u043a\u0430\u0437\u0430\u0442\u0438 \u0446\u044e \u0442\u043e\u0447\u043a\u0443 \u0432 \u0446\u0435\u043d\u0442\u0440\u0456 \u043f\u043b\u0430\u043d\u0443.',
    loading3d: '\u0417\u0430\u0432\u0430\u043d\u0442\u0430\u0436\u0435\u043d\u043d\u044f 3D\u2026',
    measureTool: '\u0412\u0438\u043c\u0456\u0440',
    measureToolTitle:
      '\u0412\u0438\u043c\u0456\u0440\u044e\u0432\u0430\u043d\u043d\u044f \u0432\u0456\u0434\u0441\u0442\u0430\u043d\u0456: \u0434\u0432\u0430 \u043a\u043b\u0456\u043a\u0438 \u043f\u043e \u043f\u043b\u0430\u043d\u0443. \u041d\u0430\u0441\u0442\u0443\u043f\u043d\u0438\u0439 \u043a\u043b\u0456\u043a \u2014 \u043d\u043e\u0432\u0430 \u043f\u0430\u0440\u0430. Esc \u2014 \u0441\u043a\u0438\u043d\u0443\u0442\u0438 \u043b\u0456\u043d\u0456\u044e. \u041a\u043b\u0430\u0432\u0456\u0448\u0430 M.',
    measureDistanceMeters: '{{m}} \u043c',
    marqueeMode: '\u0420\u0430\u043c\u043a\u0430',
    marqueeModeTitle:
      '\u0412\u0438\u0434\u0456\u043b\u0435\u043d\u043d\u044f \u0437\u043e\u043d\u043e\u044e: \u043f\u0440\u043e\u0442\u044f\u0433\u043d\u0456\u0442\u044c \u043f\u043e \u043f\u043b\u0430\u043d\u0443. \u041f\u043e\u043f\u0430\u0434\u0430\u044e\u0442\u044c \u043e\u0431\u2019\u0454\u043a\u0442\u0438, \u0447\u0438\u0439 \u0446\u0435\u043d\u0442\u0440 \u0432\u0441\u0435\u0440\u0435\u0434\u0438\u043d\u0456 \u0440\u0430\u043c\u043a\u0438. Esc \u2014 \u0432\u0438\u043c\u043a\u043d\u0443\u0442\u0438 \u0440\u0435\u0436\u0438\u043c.',
    copySelection: '\u041a\u043e\u043f\u0456\u044f',
    copySelectionTitle:
      '\u041a\u043e\u043f\u0456\u044e\u0432\u0430\u0442\u0438 \u0432\u0438\u0434\u0456\u043b\u0435\u043d\u0435 (Ctrl+C). \u0421\u043f\u043e\u0447\u0430\u0442\u043a\u0443 \u2014 \u0432\u043d\u0443\u0442\u0440\u0456\u0448\u043d\u0454 \u0437\u0431\u0435\u0440\u0456\u0433\u0430\u043d\u043d\u044f \u0442\u0430\u043a\u043e\u0436 \u0443 \u0431\u0443\u0444\u0435\u0440 \u043e\u0431\u043c\u0456\u043d\u0443.',
    pasteSelection: '\u0412\u0441\u0442\u0430\u0432\u0438\u0442\u0438',
    pasteSelectionTitle:
      '\u0412\u0441\u0442\u0430\u0432\u0438\u0442\u0438 \u043a\u043e\u043f\u0456\u044e \u0432 \u0446\u0435\u043d\u0442\u0440 \u043f\u043e\u0442\u043e\u0447\u043d\u043e\u0433\u043e \u0432\u0438\u0434\u0443 (Ctrl+V).',
    undoRedoGroupAria: '\u0406\u0441\u0442\u043e\u0440\u0456\u044f \u0437\u043c\u0456\u043d \u043f\u043b\u0430\u043d\u0443',
    undoPlan: '\u0412\u0456\u0434\u043c\u0456\u043d\u0438\u0442\u0438',
    undoPlanTitle:
      '\u0412\u0456\u0434\u043c\u0456\u043d\u0438\u0442\u0438 \u043e\u0441\u0442\u0430\u043d\u043d\u044e \u0437\u043c\u0456\u043d\u0443 \u043d\u0430 \u043f\u043b\u0430\u043d\u0456 (Ctrl+Z \u0430\u0431\u043e \u2318+Z).',
    redoPlan: '\u041f\u043e\u0432\u0442\u043e\u0440\u0438\u0442\u0438',
    redoPlanTitle:
      '\u041f\u043e\u0432\u0442\u043e\u0440\u0438\u0442\u0438 \u0441\u043a\u0430\u0441\u043e\u0432\u0430\u043d\u0443 \u0434\u0456\u044e (Ctrl+Shift+Z, Ctrl+Y \u0430\u0431\u043e \u2318+Shift+Z).',
    planMapActionsAria:
      'Дії на 2D-плані: рамка, копія, вставка, вимір, видалити виділене, очистити всю вправу',
    deleteSelection: 'Видалити виділене',
    deleteSelectionTitle:
      'Прибрати з плану лише виділені об’єкти (як Delete на клавіатурі). Червона кнопка з кошиком нижче — очистити всю вправу.',
    selectionSheetTitle: 'Виділення',
    selectionSheetHint: 'Тримайте палець ~0,5 с на плані, коли об’єкти вже виділені.',
    selectionSheetCopy: 'Копіювати',
    selectionSheetDismiss: 'Закрити',
  },
  briefing: {
    summary: '\u0422\u0435\u043a\u0441\u0442 \u0434\u043b\u044f PDF (\u0442\u0430\u0431\u043b\u0438\u0446\u044f \u0431\u0440\u0438\u0444\u0456\u043d\u0433\u0443)',
    documentTitle: '\u0417\u0430\u0433\u043e\u043b\u043e\u0432\u043e\u043a \u0434\u043e\u043a\u0443\u043c\u0435\u043d\u0442\u0430',
    exerciseType: '\u0422\u0438\u043f \u0432\u043f\u0440\u0430\u0432\u0438',
    targetsText: '\u041c\u0456\u0448\u0435\u043d\u0456 (\u0442\u0435\u043a\u0441\u0442)',
    recommendedShots:
      '\u0420\u0435\u043a\u043e\u043c\u0435\u043d\u0434\u043e\u0432\u0430\u043d\u0430 \u043a\u0456\u043b\u044c\u043a\u0456\u0441\u0442\u044c \u043f\u043e\u0441\u0442\u0440\u0456\u043b\u0456\u0432 (\u043e\u0440\u0456\u0454\u043d\u0442\u043e\u0432\u043d\u043e)',
    allowedAmmo: '\u0414\u043e\u043f\u0443\u0441\u0442\u0438\u043c\u0438\u0439 \u0442\u0438\u043f \u043d\u0430\u0431\u043e\u0457\u0432',
    maxPoints: '\u041c\u0430\u043a\u0441. \u043e\u0447\u043e\u043a',
    startSignal: '\u0421\u0442\u0430\u0440\u0442\u043e\u0432\u0438\u0439 \u0441\u0438\u0433\u043d\u0430\u043b',
    readyCondition: '\u041f\u043e\u043b\u043e\u0436\u0435\u043d\u043d\u044f \u0433\u043e\u0442\u043e\u0432\u043d\u043e\u0441\u0442\u0456',
    startPosition: '\u0421\u0442\u0430\u0440\u0442\u043e\u0432\u0430 \u043f\u043e\u0437\u0438\u0446\u0456\u044f',
    procedure: '\u041f\u0440\u043e\u0446\u0435\u0434\u0443\u0440\u0430 \u0432\u0438\u043a\u043e\u043d\u0430\u043d\u043d\u044f',
    safetyAngles: '\u041a\u0443\u0442\u0438 \u0431\u0435\u0437\u043f\u0435\u043a\u0438',
    applyFromScene: '\u041f\u0456\u0434\u0441\u0442\u0430\u0432\u0438\u0442\u0438 \u00ab\u041c\u0456\u0448\u0435\u043d\u0456\u00bb \u0442\u0430 \u043f\u043e\u0441\u0442\u0440\u0456\u043b\u0456\u0432 \u0437 \u0441\u0446\u0435\u043d\u0438',
    downloadPdf: '\u0417\u0430\u0432\u0430\u043d\u0442\u0430\u0436\u0438\u0442\u0438 PDF',
    downloadPdfBusy: '\u0417\u0431\u0456\u0440\u043a\u0430 PDF\u2026',
    hintBefore: '\u0429\u043e\u0431 \u0443 PDF \u043f\u043e\u0442\u0440\u0430\u043f\u0438\u0432 \u0437\u043d\u0456\u043c\u043e\u043a \u0441\u0446\u0435\u043d\u0438, \u0432\u0456\u0434\u043a\u0440\u0438\u0439\u0442\u0435',
    hintEm: '\u00ab3D-\u043f\u0435\u0440\u0435\u0433\u043b\u044f\u0434\u00bb',
    hintAfter:
      ', \u0437\u0430\u0447\u0435\u043a\u0430\u0439\u0442\u0435, \u043f\u043e\u043a\u0438 \u043a\u0430\u0440\u0442\u0438\u043d\u043a\u0430 \u043e\u043d\u043e\u0432\u0438\u0442\u044c\u0441\u044f, \u043f\u043e\u0442\u0456\u043c \u043d\u0430\u0442\u0438\u0441\u043d\u0456\u0442\u044c \u00ab\u0417\u0430\u0432\u0430\u043d\u0442\u0430\u0436\u0438\u0442\u0438 PDF\u00bb.',
    category: {
      short: '\u041a\u043e\u0440\u043e\u0442\u043a\u0430',
      medium: '\u0421\u0435\u0440\u0435\u0434\u043d\u044f',
      long: '\u0414\u043e\u0432\u0433\u0430',
    },
  },
  pdf: {
    rowExerciseType: '\u0422\u0438\u043f \u0432\u043f\u0440\u0430\u0432\u0438',
    rowTargets: '\u041c\u0456\u0448\u0435\u043d\u0456',
    rowRecommendedShots:
      '\u0420\u0435\u043a\u043e\u043c\u0435\u043d\u0434\u043e\u0432\u0430\u043d\u0430 \u043a\u0456\u043b\u044c\u043a\u0456\u0441\u0442\u044c \u043f\u043e\u0441\u0442\u0440\u0456\u043b\u0456\u0432 (\u043e\u0440\u0456\u0454\u043d\u0442\u043e\u0432\u043d\u043e)',
    rowAllowedAmmo: '\u0414\u043e\u043f\u0443\u0441\u0442\u0438\u043c\u0438\u0439 \u0442\u0438\u043f \u043d\u0430\u0431\u043e\u0457\u0432',
    rowMaxPoints: '\u041c\u0430\u043a\u0441\u0438\u043c\u0430\u043b\u044c\u043d\u0430 \u043a\u0456\u043b\u044c\u043a\u0456\u0441\u0442\u044c \u043e\u0447\u043e\u043a',
    rowStartSignal: '\u0421\u0442\u0430\u0440\u0442\u043e\u0432\u0438\u0439 \u0441\u0438\u0433\u043d\u0430\u043b',
    rowReadyCondition: '\u041f\u043e\u043b\u043e\u0436\u0435\u043d\u043d\u044f \u0433\u043e\u0442\u043e\u0432\u043d\u043e\u0441\u0442\u0456',
    rowStartPosition: '\u0421\u0442\u0430\u0440\u0442\u043e\u0432\u0430 \u043f\u043e\u0437\u0438\u0446\u0456\u044f',
    rowProcedure: '\u041f\u0440\u043e\u0446\u0435\u0434\u0443\u0440\u0430 \u0432\u0438\u043a\u043e\u043d\u0430\u043d\u043d\u044f',
    rowSafetyAngles: '\u041a\u0443\u0442\u0438 \u0431\u0435\u0437\u043f\u0435\u043a\u0438',
    sceneAlt: '\u0412\u0456\u0437\u0443\u0430\u043b\u0456\u0437\u0430\u0446\u0456\u044f \u0441\u0446\u0435\u043d\u0438',
    noSnapshot:
      '\u0417\u043d\u0456\u043c\u043e\u043a 3D \u0432\u0456\u0434\u0441\u0443\u0442\u043d\u0456\u0439 \u2014 \u0432\u0456\u0434\u043a\u0440\u0438\u0439\u0442\u0435 \u00ab3D-\u043f\u0435\u0440\u0435\u0433\u043b\u044f\u0434\u00bb, \u0437\u0430\u0447\u0435\u043a\u0430\u0439\u0442\u0435 \u043d\u0430 \u0441\u0446\u0435\u043d\u0443 \u0439 \u0435\u043a\u0441\u043f\u043e\u0440\u0442\u0443\u0439\u0442\u0435 PDF \u0437\u043d\u043e\u0432\u0443.',
    imageLoadError: '\u041d\u0435 \u0432\u0434\u0430\u043b\u043e\u0441\u044f \u0437\u0430\u0432\u0430\u043d\u0442\u0430\u0436\u0438\u0442\u0438 \u0437\u043d\u0456\u043c\u043e\u043a \u0434\u043b\u044f PDF',
  },
  common: {
    exportFail: '\u041d\u0435 \u0432\u0434\u0430\u043b\u043e\u0441\u044f \u0437\u0456\u0431\u0440\u0430\u0442\u0438 PDF',
    langSwitcher: '\u041c\u043e\u0432\u0430',
    langUk: '\u0423\u041a',
    langEn: 'EN',
    dash: '\u2014',
  },
  project: {
    save: '\u0417\u0431\u0435\u0440\u0435\u0433\u0442\u0438 \u0432\u043f\u0440\u0430\u0432\u0443\u2026',
    open: '\u0412\u0456\u0434\u043a\u0440\u0438\u0442\u0438 \u0432\u043f\u0440\u0430\u0432\u0443\u2026',
    clear: '\u041e\u0447\u0438\u0441\u0442\u0438\u0442\u0438 \u0432\u043f\u0440\u0430\u0432\u0443',
    clearAria:
      '\u041e\u0447\u0438\u0441\u0442\u0438\u0442\u0438 \u0432\u043f\u0440\u0430\u0432\u0443: \u0441\u043a\u0438\u043d\u0443\u0442\u0438 \u043f\u043b\u0430\u043d, \u0431\u0440\u0438\u0444\u0456\u043d\u0433 \u0456 \u0447\u0435\u0440\u043d\u0435\u0442\u043a\u0443',
    clearConfirm:
      '\u0421\u043a\u0438\u043d\u0443\u0442\u0438 \u043f\u043b\u0430\u043d, \u0431\u0440\u0438\u0444\u0456\u043d\u0433 \u0456 \u0447\u0435\u0440\u043d\u0435\u0442\u043a\u0443 \u0432 \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u0456? \u0426\u044e \u0434\u0456\u044e \u043d\u0435 \u043c\u043e\u0436\u043d\u0430 \u0441\u043a\u0430\u0441\u0443\u0432\u0430\u0442\u0438. \u0417\u0431\u0435\u0440\u0435\u0436\u0435\u043d\u0456 \u0444\u0430\u0439\u043b\u0438 .stage.json \u043d\u0430 \u0434\u0438\u0441\u043a\u0443 \u043d\u0435 \u0437\u043c\u0456\u043d\u044f\u0442\u044c\u0441\u044f.',
    hint: 'JSON (*.stage.json): \u0441\u0446\u0435\u043d\u0430, \u043e\u0431\u2019\u0454\u043a\u0442\u0438, \u0431\u0440\u0438\u0444\u0456\u043d\u0433. \u0427\u0435\u0440\u043d\u0435\u0442\u043a\u0430 \u0442\u0430\u043a\u043e\u0436 \u0437\u0431\u0435\u0440\u0456\u0433\u0430\u0454\u0442\u044c\u0441\u044f \u0432 \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u0456 (\u043c\u0456\u0436 \u0432\u0456\u0437\u0438\u0442\u0430\u043c\u0438).',
    loadErrorJson: '\u0424\u0430\u0439\u043b \u043d\u0435 \u0454 \u043a\u043e\u0440\u0435\u043a\u0442\u043d\u0438\u043c JSON.',
    loadErrorShape: '\u041d\u0435\u0432\u0456\u0434\u043e\u043c\u0438\u0439 \u0444\u043e\u0440\u043c\u0430\u0442 \u0430\u0431\u043e \u043f\u043e\u0448\u043a\u043e\u0434\u0436\u0435\u043d\u0456 \u0434\u0430\u043d\u0456 \u0432\u043f\u0440\u0430\u0432\u0438.',
    loadErrorVersion: '\u041d\u0435\u043f\u0456\u0434\u0442\u0440\u0438\u043c\u0443\u0432\u0430\u043d\u0430 \u0432\u0435\u0440\u0441\u0456\u044f \u0444\u0430\u0439\u043b\u0443. \u041e\u043d\u043e\u0432\u0456\u0442\u044c Stage Builder.',
    fileGroupAria: '\u0417\u0431\u0435\u0440\u0435\u0436\u0435\u043d\u043d\u044f \u0442\u0430 \u0437\u0430\u0432\u0430\u043d\u0442\u0430\u0436\u0435\u043d\u043d\u044f \u0444\u0430\u0439\u043b\u0443 \u0432\u043f\u0440\u0430\u0432\u0438',
  },
  share: {
    loading: '\u0417\u0430\u0432\u0430\u043d\u0442\u0430\u0436\u0435\u043d\u043d\u044f \u0432\u043f\u0440\u0430\u0432\u0438\u2026',
    invalidId: '\u041d\u0435\u0432\u0456\u0434\u043e\u043c\u0438\u0439 \u0456\u0434\u0435\u043d\u0442\u0438\u0444\u0456\u043a\u0430\u0442\u043e\u0440 \u043f\u043e\u0441\u0438\u043b\u0430\u043d\u043d\u044f.',
    notFoundOrExpired:
      '\u0412\u043f\u0440\u0430\u0432\u0443 \u043d\u0435 \u0437\u043d\u0430\u0439\u0434\u0435\u043d\u043e \u0430\u0431\u043e \u0442\u0435\u0440\u043c\u0456\u043d \u0434\u0456\u0457 \u043f\u043e\u0441\u0438\u043b\u0430\u043d\u043d\u044f \u043c\u0438\u043d\u0443\u0432.',
    loadError: '\u041d\u0435 \u0432\u0434\u0430\u043b\u043e\u0441\u044f \u0437\u0430\u0432\u0430\u043d\u0442\u0430\u0436\u0438\u0442\u0438 \u0432\u043f\u0440\u0430\u0432\u0443 \u0437 \u0441\u0435\u0440\u0432\u0435\u0440\u0430.',
    envMissing:
      '\u041d\u0430\u043b\u0430\u0448\u0442\u0443\u0432\u0430\u043d\u043d\u044f Supabase \u043d\u0430 \u043a\u043b\u0456\u0454\u043d\u0442\u0456 \u0432\u0456\u0434\u0441\u0443\u0442\u043d\u0454. \u0414\u043b\u044f \u0440\u043e\u0437\u0440\u043e\u0431\u043d\u0438\u043a\u0430: \u0434\u043e\u0434\u0430\u0439\u0442\u0435 VITE_SUPABASE_URL \u0442\u0430 VITE_SUPABASE_ANON_KEY \u0443 .env.local.',
    backHome: '\u041d\u0430 \u0433\u043e\u043b\u043e\u0432\u043d\u0443',
    draftConflictTitle: '\u0417\u0431\u0435\u0440\u0435\u0436\u0435\u043d\u0430 \u0447\u0435\u0440\u043d\u0435\u0442\u043a\u0430 \u0432 \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u0456',
    draftConflictBody:
      'Щоб відкрити вправу за посиланням, оберіть: зберегти чернетку файлом, відкинути її або скасувати.',
    draftSave:
      '\u0417\u0431\u0435\u0440\u0435\u0433\u0442\u0438 \u0444\u0430\u0439\u043b\u043e\u043c\u2026',
    draftDiscard: '\u0412\u0456\u0434\u043a\u0438\u043d\u0443\u0442\u0438 \u0447\u0435\u0440\u043d\u0435\u0442\u043a\u0443',
    draftCancel: '\u0421\u043a\u0430\u0441\u0443\u0432\u0430\u0442\u0438',
    publishButton: '\u041f\u043e\u0434\u0456\u043b\u0438\u0442\u0438\u0441\u044f\u2026',
    publishTitle: '\u041f\u043e\u0434\u0456\u043b\u0438\u0442\u0438\u0441\u044f \u043f\u043e\u0441\u0438\u043b\u0430\u043d\u043d\u044f\u043c',
    publishIntro:
      '\u041a\u043e\u0436\u043d\u0430 \u043f\u0443\u0431\u043b\u0456\u043a\u0430\u0446\u0456\u044f \u0441\u0442\u0432\u043e\u0440\u044e\u0454 \u043d\u043e\u0432\u0435 \u043f\u043e\u0441\u0438\u043b\u0430\u043d\u043d\u044f \u043d\u0430 \u0437\u043d\u0456\u043c\u043e\u043a \u0432\u043f\u0440\u0430\u0432\u0438 (\u0434\u0456\u044f 365 \u0434\u043d\u0456\u0432). \u0421\u0442\u0430\u0440\u0456 \u043f\u043e\u0441\u0438\u043b\u0430\u043d\u043d\u044f \u043d\u0435 \u0437\u043c\u0456\u043d\u044e\u044e\u0442\u044c\u0441\u044f.',
    publishConsentBefore: '\u041e\u0437\u043d\u0430\u0439\u043e\u043c\u043b\u0435\u043d\u0438\u0439(-\u0430) \u0437',
    publishConsentLinkText: '\u043f\u043e\u043b\u0456\u0442\u0438\u043a\u043e\u044e \u043f\u0443\u0431\u043b\u0456\u043a\u0430\u0446\u0456\u0457',
    publishConsentAfter: '.',
    publishGetView: '\u041f\u043e\u0441\u0438\u043b\u0430\u043d\u043d\u044f \u0434\u043b\u044f \u043f\u0435\u0440\u0435\u0433\u043b\u044f\u0434\u0443',
    publishGetEdit: '\u041f\u043e\u0441\u0438\u043b\u0430\u043d\u043d\u044f \u0434\u043b\u044f \u0440\u0435\u0434\u0430\u043a\u0442\u043e\u0440\u0430',
    publishBusy: '\u0417\u0430\u0447\u0435\u043a\u0430\u0439\u0442\u0435\u2026',
    publishViewLabel: '\u041f\u0435\u0440\u0435\u0433\u043b\u044f\u0434 (\u0441\u0442\u0440\u0456\u043b\u0446\u0456)',
    publishEditLabel: '\u0420\u0435\u0434\u0430\u043a\u0442\u043e\u0440',
    publishCopy: '\u041a\u043e\u043f\u0456\u044e\u0432\u0430\u0442\u0438',
    publishCopyFallback: '\u0421\u043a\u043e\u043f\u0456\u044e\u0439\u0442\u0435 \u043f\u043e\u0441\u0438\u043b\u0430\u043d\u043d\u044f \u0432\u0440\u0443\u0447\u043d\u0443:',
    publishClose: '\u0417\u0430\u043a\u0440\u0438\u0442\u0438',
    publishNeedConsent:
      '\u041f\u043e\u0441\u0442\u0430\u0432\u0442\u0435 \u0433\u0430\u043b\u043e\u0447\u043a\u0443 \u0437\u0433\u043e\u0434\u0438 \u0437 \u043f\u043e\u043b\u0456\u0442\u0438\u043a\u043e\u044e \u043f\u0443\u0431\u043b\u0456\u043a\u0430\u0446\u0456\u0457.',
    publishError: '\u041d\u0435 \u0432\u0434\u0430\u043b\u043e\u0441\u044f \u043e\u043f\u0443\u0431\u043b\u0456\u043a\u0443\u0432\u0430\u0442\u0438',
    publishRateLimited:
      '\u0414\u043e\u0441\u044f\u0433\u043d\u0443\u0442\u043e \u043b\u0456\u043c\u0456\u0442\u0443 \u043f\u0443\u0431\u043b\u0456\u043a\u0430\u0446\u0456\u0439 \u043d\u0430 \u0441\u044c\u043e\u0433\u043e\u0434\u043d\u0456. \u0421\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u0437\u0430\u0432\u0442\u0440\u0430.',
    publishTooLarge: '\u0412\u043f\u0440\u0430\u0432\u0430 \u0437\u0430\u0432\u0435\u043b\u0438\u043a\u0430 \u0434\u043b\u044f \u043f\u0443\u0431\u043b\u0456\u043a\u0430\u0446\u0456\u0457.',
    publishNotConfigured:
      '\u041f\u0443\u0431\u043b\u0456\u043a\u0430\u0446\u0456\u044f \u043d\u0430 \u0446\u044c\u043e\u043c\u0443 \u0441\u0435\u0440\u0435\u0434\u043e\u0432\u0438\u0449\u0456 \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u043d\u0430 (\u043d\u0435\u043c\u0430\u0454 \u043d\u0430\u043b\u0430\u0448\u0442\u0443\u0432\u0430\u043d\u044c \u0441\u0435\u0440\u0432\u0435\u0440\u0430).',
    publishNetworkError:
      '\u041c\u0435\u0440\u0435\u0436\u0430 \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u043d\u0430 \u0430\u0431\u043e \u0441\u0435\u0440\u0432\u0435\u0440 \u043d\u0435 \u0432\u0456\u0434\u043f\u043e\u0432\u0456\u0432.',
    openInEditor: '\u0412\u0456\u0434\u043a\u0440\u0438\u0442\u0438 \u0432 \u0440\u0435\u0434\u0430\u043a\u0442\u043e\u0440\u0456 (\u043d\u043e\u0432\u0430 \u0432\u043a\u043b\u0430\u0434\u043a\u0430)',
    publishErrorHtmlResponse:
      '\u0421\u0435\u0440\u0432\u0435\u0440 \u043f\u043e\u0432\u0435\u0440\u043d\u0443\u0432 HTML \u0437\u0430\u043c\u0456\u0441\u0442\u044c JSON \u2014 \u043f\u0435\u0440\u0435\u0432\u0456\u0440\u0442\u0435 \u0434\u0435\u043f\u043b\u043e\u0439 /api/publish-share \u0442\u0430 \u0437\u043c\u0456\u043d\u043d\u0456 Vercel (SUPABASE_SERVICE_ROLE_KEY, URL).',
  },
  footer: {
    feedbackHeading: '\u0417\u0432\u043e\u0440\u043e\u0442\u043d\u0438\u0439 \u0437\u0432\u2019\u044f\u0437\u043e\u043a',
    feedbackText: '\u0417\u043d\u0430\u0439\u0448\u043b\u0438 \u043f\u043e\u043c\u0438\u043b\u043a\u0443, \u043c\u0430\u0454\u0442\u0435 \u043f\u0440\u043e\u043f\u043e\u0437\u0438\u0446\u0456\u044e \u0447\u0438 \u0432\u0456\u0434\u0433\u0443\u043a? \u041d\u0430\u043f\u0438\u0448\u0456\u0442\u044c:',
    feedbackEmail: 'Email',
    feedbackTelegram: 'Telegram',
    supportHeading: '\u041f\u0456\u0434\u0442\u0440\u0438\u043c\u0430\u0442\u0438 \u043f\u0440\u043e\u0454\u043a\u0442',
    supportText: 'Stage Builder \u2014 \u0431\u0435\u0437\u043a\u043e\u0448\u0442\u043e\u0432\u043d\u0438\u0439 \u0456 \u0432\u0456\u0434\u043a\u0440\u0438\u0442\u0438\u0439. \u042f\u043a\u0449\u043e \u0432\u0456\u043d \u0432\u0430\u043c \u043a\u043e\u0440\u0438\u0441\u043d\u0438\u0439, \u043c\u043e\u0436\u0435\u0442\u0435 \u043f\u0456\u0434\u0442\u0440\u0438\u043c\u0430\u0442\u0438 \u0440\u043e\u0437\u0440\u043e\u0431\u043a\u0443:',
    supportLink: '\u041f\u0456\u0434\u0442\u0440\u0438\u043c\u0430\u0442\u0438 (Monobank)',
    installHeading: '\u0412\u0441\u0442\u0430\u043d\u043e\u0432\u0438\u0442\u0438 \u0434\u043e\u0434\u0430\u0442\u043e\u043a',
    installText: '\u0414\u043e\u0434\u0430\u0439\u0442\u0435 Stage Builder \u043d\u0430 \u0440\u043e\u0431\u043e\u0447\u0438\u0439 \u0441\u0442\u0456\u043b \u0434\u043b\u044f \u0448\u0432\u0438\u0434\u043a\u043e\u0433\u043e \u0434\u043e\u0441\u0442\u0443\u043f\u0443 \u0442\u0430 \u0440\u043e\u0431\u043e\u0442\u0438 \u043e\u0444\u043b\u0430\u0439\u043d.',
    installButton: '\u0412\u0441\u0442\u0430\u043d\u043e\u0432\u0438\u0442\u0438',
  },
  pwa: {
    installButton: '\u0412\u0441\u0442\u0430\u043d\u043e\u0432\u0438\u0442\u0438 \u0434\u043e\u0434\u0430\u0442\u043e\u043a',
    installHint: '\u041f\u0440\u0430\u0446\u044e\u0454 \u043e\u0444\u043b\u0430\u0439\u043d \u043d\u0430 \u0441\u0442\u0440\u0456\u043b\u044c\u0431\u0438\u0449\u0456',
    updateMessage:
      '\u0414\u043e\u0441\u0442\u0443\u043f\u043d\u0430 \u043d\u043e\u0432\u0430 \u0432\u0435\u0440\u0441\u0456\u044f \u0434\u043e\u0434\u0430\u0442\u043a\u0443. \u041e\u043d\u043e\u0432\u0456\u0442\u044c, \u0449\u043e\u0431 \u043e\u0442\u0440\u0438\u043c\u0430\u0442\u0438 \u043e\u0441\u0442\u0430\u043d\u043d\u0456 \u0437\u043c\u0456\u043d\u0438.',
    updateNow: '\u041e\u043d\u043e\u0432\u0438\u0442\u0438',
    updateLater: '\u041f\u0456\u0437\u043d\u0456\u0448\u0435',
    updateAriaLabel: '\u0414\u043e\u0441\u0442\u0443\u043f\u043d\u0435 \u043e\u043d\u043e\u0432\u043b\u0435\u043d\u043d\u044f \u0434\u043e\u0434\u0430\u0442\u043a\u0443',
  },
  seo: {
    metaDescription:
      '\u041a\u043e\u043d\u0441\u0442\u0440\u0443\u043a\u0442\u043e\u0440 \u0441\u0442\u0440\u0456\u043b\u044c\u0431\u0438\u0449\u043d\u0438\u0445 \u0432\u0440\u0430\u0432: \u043c\u0456\u0448\u0435\u043d\u0456 \u0439 \u0440\u0435\u043a\u0432\u0456\u0437\u0438\u0442 \u043d\u0430 \u043f\u043b\u0430\u043d\u0456, 3D-\u043f\u0435\u0440\u0435\u0433\u043b\u044f\u0434, \u0431\u0440\u0438\u0444\u0456\u043d\u0433 \u0443 PDF. \u0411\u0435\u0437\u043a\u043e\u0448\u0442\u043e\u0432\u043d\u0438\u0439 \u043e\u043d\u043b\u0430\u0439\u043d-\u0440\u0435\u0434\u0430\u043a\u0442\u043e\u0440.',
    ogImageAlt:
      'Stage Builder \u2014 \u043f\u043b\u0430\u043d \u0441\u0446\u0435\u043d\u0438, \u043c\u0456\u0448\u0435\u043d\u0456, \u0435\u043a\u0441\u043f\u043e\u0440\u0442 \u0431\u0440\u0438\u0444\u0456\u043d\u0433\u0443 \u0432 PDF',
  },
  pdfBranding: {
    generatedBy: '\u0417\u0433\u0435\u043d\u0435\u0440\u043e\u0432\u0430\u043d\u043e \u0432 Stage Builder',
  },
}

export const enMessages: MessageTree = {
  app: {
    title: 'Stage Builder',
    onboardingTitle: 'Stage Builder',
    onboardingLead: 'A practical shooting stage designer. You can:',
    onboardingBenefits: [
      'preview the stage in 3D from the shooter’s perspective',
      'estimate how much equipment you need to build it',
      'check whether targets stay hidden behind barriers and props',
      'review positions and how visible each target is',
      'fill in a briefing and get a print-ready PDF',
      'measure on the plan, select groups of objects, and duplicate them',
      'send the file to other match staff or keep it as a template',
      'reuse an existing stage as a starting point for a new layout',
    ],
    onboardingHowTitle: 'Step by step',
    onboardingS1Title: '1. Range and grid',
    onboardingS1Text:
      'Set the field size in the top bar: enter width and length in metres (8–50 × 8–100 m) or pick a preset.\nGrid step is 0.5 m. Metric rulers along the plan edge show ticks from 0.5 m.\nZoom: scroll or pinch. Pan: Space or middle mouse button + drag.',
    onboardingS2Title: '2. 2D plan: objects and tools',
    onboardingS2Text:
      'Placement: pick a type in the sidebar (target, wall, prop), then click the plan. Each click adds one object at the cursor (even on top of others). Exit placement: Esc or click the same type button again.\n\nAfter that: click to select; drag to move (grid snap is on). «↻» rotates in steps. Keyboard: Delete / Backspace removes the selection. Phone: the X button by the map does the same; long-press the plan (~0.5 s) with a selection to open quick actions. The red trash button at the bottom clears the entire exercise — not the same as deleting the selection.\n\nMeasure: ruler icon by the map, or M in 2D — two clicks set a segment and length in metres; Esc cancels an unfinished line.\nMarquee on the map selects a region. Copy / paste: Ctrl+C / Ctrl+V or Copy / Paste; the duplicate lands in the part of the plan you are viewing.',
    onboardingS3Title: '3. Targets, NS, and props',
    onboardingS3Text:
      'NS (No-Shoot) targets have their own buttons in the palette.\nPenalty line: drag the orange marker to change length; the other end stays fixed.\nSquare steel: [ and ] change face size (15 / 20 / 30 cm, typical IPSC-style sizes).\n\nThe palette also has Mini IPSC paper, steel on a stand (in 3D you see face height about 50 cm or 1 m from the floor), and a mini popper.\nProps include walls with ports (including a door in the port), a table, chair, and long-gun rack.\n\nWith a start position on the plan, the briefing field «Safety angles» can take values like 90/90/90 — helper sectors appear on the plan and targets outside are highlighted. That is a layout aid, not a substitute for the RO or the rulebook.',
    onboardingS4Title: '4. 3D view',
    onboardingS4Text:
      'Switch the top menu to 3D.\nOrbit with the left mouse button; zoom with the scroll wheel.\nCheck visibility through ports and angles. «Shooter’s view» shows the stage from the competitor’s perspective.\nFor plates on stands, note face height above the ground.',
    onboardingS5Title: '5. Briefing and PDF',
    onboardingS5Text:
      'Fill the briefing table: title, procedure, start, ammunition, safety angles, and so on. Target count and estimated minimum shots update automatically.\n\n«Download PDF» includes the table plus a 3D snapshot. Open 3D first so the snapshot matches what you see on screen. The safety angles row is included like the other fields.',
    onboardingS6Title: '6. Saving',
    onboardingS6Text:
      '«Save stage» writes a .stage.json file: full scene geometry and briefing text. Reload it later or share it with other organizers.\nA draft is stored in this browser between visits until you clear the stage with the trash button on the map.',
    onboardingNote:
      'Runs in the browser or as an installed app. When a new version is available, a bar may appear at the top with an Update button. Update prompts are shown at most once every 24 hours.',
    onboardingCta: 'Continue',
    onboardingReopen: 'Guide',
    contextHint: 'Current field: {{w}}\u00d7{{h}} m, grid {{grid}} m.',
    toolbarDrawerOpen: 'Targets & objects',
    toolbarDrawerClose: 'Hide panel',
    stagingRibbon:
      'Staging environment — not the live site. Use stage-builder.vercel.app for production.',
  },
  stats: {
    targets: 'Targets',
    props: 'Objects',
    minRounds: 'Est. min. shots (indicative)',
  },
  toolbar: {
    aria: 'Editor panel: targets and infrastructure',
    targetsHeading: 'Targets',
    targetsAria: 'Add targets to the range plan (full standard set)',
    infrastructureHeading: 'Infrastructure',
    infrastructureAria: 'Add range props and structures',
    infrastructureHint:
      'Walls, doors, penalty lines, and other props — the same palette for any discipline.',
    furnitureGroupLabel: 'Table, chair & rack',
    targetsNsAria: 'Add no-shoot (NS) targets \u2014 hits do not score',
    targetsNsCaption: 'NS:',
    groupPaper: 'Paper',
    groupMetal: 'Steel',
    groupCeramic: 'Ceramic',
    groupMoving: 'Moving',
    penaltyTargetsHeading: 'Penalty targets',
    groupPenaltyPaper: 'Paper',
    groupPenaltyMetal: 'Steel',
    groupPenaltyCeramic: 'Ceramic',
    infraGroupShields: 'Walls',
    infraGroupFaultLines: 'Penalty lines & zones',
    infraGroupEquipment: 'Equipment',
    fieldSizeOption: '{{w}} \u00d7 {{h}} m',
    fieldSizeLabel: 'Range (w \u00d7 l)',
    fieldSizeHint:
      'Updates 2D grid, bounds, 3D, and PDF. Objects are clamped into the new bounds (simplified). Width 8–50 m, length 8–100 m, step 0.5 m.',
    fieldSizeWidthAria: 'Range width, m',
    fieldSizeLengthAria: 'Range length, m',
    fieldSizePresetsAria: 'Quick size presets',
    fieldSizePresetsPlaceholder: 'Presets…',
    fieldResizeConfirm:
      'The new stage size is smaller than the current one: some targets or props will be moved inward to fit. Continue?',
    placementClickPlan:
      'Click the plan to place. Click the same type again in the menu to leave placement mode.',
    placementCancelEsc: 'Esc — cancel placement mode.',
    placementHintNarrow:
      'On a narrow screen, one tap on the plan places one item and exits placement mode. Esc still cancels (with a keyboard).',
    placementArmedTitleNarrow:
      'Tap the plan to place and exit mode. Esc — cancel (keyboard).',
    penaltyZonesHeading: 'Penalty zones',
    penaltyZonesAria:
      'Draw closed outlines: a hole is detected automatically when you close a contour inside an existing zone',
    penaltyZoneContour: 'Penalty zone outline',
    penaltyZoneCloseHint:
      'Click near the first point (within 5 cm) to close. Inside an existing zone, the closed contour becomes a hole. Click a vertex to select and drag; Delete or Backspace removes the vertex (fewer than three vertices removes the whole polygon or hole).',
    penaltyContourUnclosed: 'Penalty zone outline is not closed',
  },
  weapon: {
    sectionTitle: 'Weapon class',
    aria: 'Weapon class is stored in the stage file; the editor exposes the full target set.',
    handgun: 'Handgun',
    rifle: 'Rifle',
    shotgun: 'Shotgun',
    mismatchHint: 'Align targets and briefing wording with your match rules.',
  },
  targets: {
    paperIpscTwoPostGround: '+ IPSC paper, low',
    paperIpscTwoPostStand50: '+ IPSC paper, bottom 50 cm',
    paperIpscTwoPostStand100: '+ IPSC paper, bottom 1 m',
    paperA4TwoPostGround: '+ A4 paper, low',
    paperA4TwoPostStand50: '+ A4 paper, bottom 50 cm',
    paperA4TwoPostStand100: '+ A4 paper, bottom 1 m',
    paperMiniIpscTwoPostGround: '+ Mini IPSC paper, low',
    paperMiniIpscTwoPostStand50: '+ Mini IPSC paper, bottom 50 cm',
    paperMiniIpscTwoPostStand100: '+ Mini IPSC paper, bottom 1 m',
    metalPlate: '+ Steel plate',
    metalPlateStand50: '+ Steel plate, 50 cm stand',
    metalPlateStand100: '+ Steel plate, 1 m stand',
    popper: '+ Popper',
    miniPopper: '+ Mini popper',
    ceramicPlate: '+ Ceramic',
    swingerSinglePaper: '+ Swinger 1\u00d7 paper',
    swingerDoublePaper: '+ Swinger 2\u00d7 paper',
    swingerSingleCeramic: '+ Swinger 1\u00d7 ceramic',
    swingerDoubleCeramic: '+ Swinger 2\u00d7 ceramic',
    noShootPaperTwoPostGround: '+ NS IPSC paper, low',
    noShootPaperTwoPostStand50: '+ NS IPSC paper, bottom 50 cm',
    noShootPaperTwoPostStand100: '+ NS IPSC paper, bottom 1 m',
    noShootPaperA4TwoPostGround: '+ NS A4 paper, low',
    noShootPaperA4TwoPostStand50: '+ NS A4 paper, bottom 50 cm',
    noShootPaperA4TwoPostStand100: '+ NS A4 paper, bottom 1 m',
    noShootPaperMiniTwoPostGround: '+ NS Mini IPSC paper, low',
    noShootPaperMiniTwoPostStand50: '+ NS Mini IPSC paper, bottom 50 cm',
    noShootPaperMiniTwoPostStand100: '+ NS Mini IPSC paper, bottom 1 m',
    noShootMetal: '+ NS steel',
    noShootMetalStand50: '+ NS steel 50 cm',
    noShootMetalStand100: '+ NS steel 1 m',
    noShootPopper: '+ NS popper',
    noShootMiniPopper: '+ NS mini',
    noShootCeramicPlate: '+ NS ceramic',
    noShootSwingerSinglePaper: '+ NS swinger 1\u00d7 paper',
    noShootSwingerDoublePaper: '+ NS swinger 2\u00d7 paper',
    noShootSwingerSingleCeramic: '+ NS swinger 1\u00d7 ceramic',
    noShootSwingerDoubleCeramic: '+ NS swinger 2\u00d7 ceramic',
  },
  props: {
    shield: '+ Wall',
    shieldDouble: '+ Wall 2\u00d72 m',
    shieldWithPort: '+ Wall w/ port',
    shieldPortLow: '+ Low port wall',
    shieldPortHigh: '+ High port wall',
    shieldPortSlanted: '+ Slanted port wall',
    shieldWithPortDoor: '+ Wall w/ door',
    door: '+ Door',
    faultLine: '+ Penalty line',
    barrel: '+ Barrel',
    tireStack: '+ Tire stack',
    woodTable: '+ Wood table',
    woodChair: '+ Chair',
    weaponRackPyramid: '+ Weapon rack (pyramid, rifle)',
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
    camPdf: 'PDF frame',
    camPdfTitle:
      'Same aspect ratio as the 3D snapshot in the briefing PDF (dashed frame shows the crop).',
    groundCoverLabel: 'Surface:',
    groundCoverAria: '3D stage ground cover',
    groundEarth: 'Earth',
    groundGrass: 'Grass',
    groundSand: 'Sand',
    threeDControls:
      'Drag to orbit; scroll or pinch to zoom. Add and move objects in \u00ab2D plan\u00bb (grid snap).',
    threeDControlsDetail:
      'Use «PDF frame» to preview the same crop as the briefing snapshot (dashed outline). The exported PNG uses the same proportions. In the PDF the QR sits in the page top-right; the brand line and URL are centered below the image.',
    plan2dControls:
      'Wheel or pinch to zoom. Drag empty space to pan. Click an object to select, drag to move, purple \u21bb to rotate in steps. Delete or Backspace removes the selection.',
    plan2dControlsDetail:
      'Grid coordinates under the cursor show meters. Pan with middle mouse or Space+drag. Penalty line: the orange dot changes length (opposite end fixed); the \u21bb handle rotates around that orange end. Square steel plate (selected): [ and ] \u2014 Appendix C3 side (15 / 20 / 30 cm).',
    controlsDetails: 'More about controls',
    controlsDetailsTooltip: 'More about 2D plan and 3D view controls',
    minimapAria:
      'Stage minimap: blue dots are targets, orange squares are props; pink frame is the current view. Click to center the plan on that point.',
    loading3d: 'Loading 3D\u2026',
    measureTool: 'Measure',
    measureToolTitle:
      'Distance: two clicks on the plan. Next click starts a new pair. Esc clears the line. M key toggles.',
    measureDistanceMeters: '{{m}} m',
    marqueeMode: 'Marquee',
    marqueeModeTitle:
      'Drag on the plan to select. Objects whose center lies inside the box are selected. Esc exits the mode.',
    copySelection: 'Copy',
    copySelectionTitle:
      'Copy selection (Ctrl+C). Also saved to the internal buffer; tries system clipboard when allowed.',
    pasteSelection: 'Paste',
    pasteSelectionTitle: 'Paste copy centered in the current view (Ctrl+V).',
    undoRedoGroupAria: 'Plan edit history',
    undoPlan: 'Undo',
    undoPlanTitle: 'Undo last plan change (Ctrl+Z or ⌘+Z).',
    redoPlan: 'Redo',
    redoPlanTitle: 'Redo undone change (Ctrl+Shift+Z, Ctrl+Y, or ⌘+Shift+Z).',
    planMapActionsAria:
      '2D plan actions: marquee, copy, paste, measure, delete selection, clear entire exercise',
    deleteSelection: 'Delete selection',
    deleteSelectionTitle:
      'Remove only selected objects from the plan (same as Delete key). The red trash button below clears the whole exercise.',
    selectionSheetTitle: 'Selection',
    selectionSheetHint: 'Long-press the plan with something selected to open this menu.',
    selectionSheetCopy: 'Copy',
    selectionSheetDismiss: 'Close',
  },
  briefing: {
    summary: 'PDF copy (briefing table)',
    documentTitle: 'Document title',
    exerciseType: 'Exercise type',
    targetsText: 'Targets (text)',
    recommendedShots: 'Recommended round count (indicative)',
    allowedAmmo: 'Permitted ammunition',
    maxPoints: 'Max points',
    startSignal: 'Start signal',
    readyCondition: 'Ready condition',
    startPosition: 'Start position',
    procedure: 'Course of fire',
    safetyAngles: 'Safety angles',
    applyFromScene: 'Fill targets & shots from scene',
    downloadPdf: 'Download PDF',
    downloadPdfBusy: 'Building PDF\u2026',
    hintBefore: 'To include a scene snapshot in the PDF, open',
    hintEm: '\u00ab3D view\u00bb',
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
    rowRecommendedShots: 'Recommended round count (indicative)',
    rowAllowedAmmo: 'Permitted ammunition',
    rowMaxPoints: 'Maximum score',
    rowStartSignal: 'Start signal',
    rowReadyCondition: 'Ready condition',
    rowStartPosition: 'Start position',
    rowProcedure: 'Course of fire',
    rowSafetyAngles: 'Safety angles',
    sceneAlt: 'Stage visualization',
    noSnapshot:
      'No 3D snapshot \u2014 switch to "3D view", load the scene, and export again.',
    imageLoadError: 'Failed to load image for PDF',
  },
  common: {
    exportFail: 'Could not build PDF',
    langSwitcher: 'Language',
    langUk: 'UK',
    langEn: 'EN',
    dash: '\u2014',
  },
  project: {
    save: 'Save stage\u2026',
    open: 'Open stage\u2026',
    clear: 'Clear stage',
    clearAria: 'Clear stage: reset plan, briefing, and browser draft',
    clearConfirm:
      'Reset the plan, briefing, and browser draft? This cannot be undone. Saved .stage.json files on disk are not changed.',
    hint: 'JSON (*.stage.json): layout, props, briefing. A draft is also kept in this browser between visits.',
    loadErrorJson: 'File is not valid JSON.',
    loadErrorShape: 'Unknown format or invalid stage data.',
    loadErrorVersion: 'Unsupported file version. Update Stage Builder.',
    fileGroupAria: 'Save and open stage file',
  },
  share: {
    loading: 'Loading stage\u2026',
    invalidId: 'Invalid share link identifier.',
    notFoundOrExpired: 'Stage not found or the link has expired.',
    loadError: 'Could not load the stage from the server.',
    envMissing:
      'Supabase is not configured on the client. For local dev, add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local.',
    backHome: 'Home',
    draftConflictTitle: 'Saved browser draft',
    draftConflictBody:
      'To open this shared stage, choose what to do with your current draft in this browser.',
    draftSave: 'Save as file\u2026',
    draftDiscard: 'Discard draft',
    draftCancel: 'Cancel',
    publishButton: 'Share\u2026',
    publishTitle: 'Share via link',
    publishIntro:
      'Each publish creates a new link to a snapshot of your stage (valid 365 days). Older links stay unchanged.',
    publishConsentBefore: 'I have read and agree to the',
    publishConsentLinkText: 'publishing policy',
    publishConsentAfter: '.',
    publishGetView: 'Link for view (shooters)',
    publishGetEdit: 'Link for editor',
    publishBusy: 'Please wait\u2026',
    publishViewLabel: 'View (read-only)',
    publishEditLabel: 'Editor',
    publishCopy: 'Copy',
    publishCopyFallback: 'Copy the link manually:',
    publishClose: 'Close',
    publishNeedConsent: 'Please accept the publishing policy.',
    publishError: 'Could not publish',
    publishRateLimited: 'Daily publish limit reached. Try again tomorrow.',
    publishTooLarge: 'Stage is too large to publish.',
    publishNotConfigured:
      'Publishing is not available in this environment (server not configured).',
    publishNetworkError: 'Network error or the server did not respond.',
    openInEditor: 'Open in editor (new tab)',
    publishErrorHtmlResponse:
      'Server returned HTML instead of JSON — check deployment of /api/publish-share and Vercel env (SUPABASE_SERVICE_ROLE_KEY, Supabase URL).',
  },
  footer: {
    feedbackHeading: 'Feedback',
    feedbackText: 'Found a bug, have a suggestion, or want to leave a review? Reach out:',
    feedbackEmail: 'Email',
    feedbackTelegram: 'Telegram',
    supportHeading: 'Support the project',
    supportText: 'Stage Builder is free and open. If you find it useful, consider supporting development:',
    supportLink: 'Donate (Monobank)',
    installHeading: 'Install the app',
    installText: 'Add Stage Builder to your home screen for quick access and offline use.',
    installButton: 'Install',
  },
  pwa: {
    installButton: 'Install app',
    installHint: 'Works offline at the range',
    updateMessage: 'A new version of the app is available. Refresh to get the latest changes.',
    updateNow: 'Update now',
    updateLater: 'Later',
    updateAriaLabel: 'App update available',
  },
  seo: {
    metaDescription:
      'Design practical shooting stages: 2D plan, 3D preview, targets, props, and PDF briefing export. Free online editor.',
    ogImageAlt: 'Stage Builder — stage plan, targets, PDF briefing export',
  },
  pdfBranding: {
    generatedBy: 'Generated in Stage Builder',
  },
}

export const messagesByLocale: Record<Locale, MessageTree> = {
  uk: ukMessages,
  en: enMessages,
}
