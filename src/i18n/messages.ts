export type Locale = 'uk' | 'en'

/** Вкладені рядки; доступ через шлях «крапкою», напр. app.title */
export type MessageTree = {
  app: {
    title: string
    onboardingTitle: string
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
    targetsNsAria: string
    targetsNsCaption: string
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
    sectionTitle: string
    aria: string
    handgun: string
    rifle: string
    shotgun: string
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
    threeDControls: string
    threeDControlsDetail: string
    plan2dControls: string
    plan2dControlsDetail: string
    controlsDetails: string
    controlsDetailsTooltip: string
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
    onboardingTitle: '\u0406\u043d\u0441\u0442\u0440\u0443\u043a\u0446\u0456\u044f \u043a\u043e\u0440\u0438\u0441\u0442\u0443\u0432\u0430\u0447\u0430',
    onboardingS1Title: '1. \u041f\u0456\u0434\u0433\u043e\u0442\u043e\u0432\u043a\u0430 \u043c\u0430\u0439\u0434\u0430\u043d\u0447\u0438\u043a\u0430',
    onboardingS1Text:
      '\u041e\u0431\u0435\u0440\u0456\u0442\u044c \u0440\u043e\u0437\u043c\u0456\u0440 \u0441\u0442\u0440\u0456\u043b\u044c\u0431\u0438\u0449\u0430 \u0443 \u0432\u0435\u0440\u0445\u043d\u0456\u0439 \u043f\u0430\u043d\u0435\u043b\u0456 (\u0432\u0456\u0434 20\u00d730 \u043c \u0434\u043e 120 \u043c). \u041a\u0440\u043e\u043a \u0441\u0456\u0442\u043a\u0438 \u2014 0,5 \u043c \u0434\u043b\u044f \u0442\u043e\u0447\u043d\u043e\u0433\u043e \u0434\u043e\u0442\u0440\u0438\u043c\u0430\u043d\u043d\u044f \u0434\u0438\u0441\u0442\u0430\u043d\u0446\u0456\u0439. Zoom \u2014 \u043a\u043e\u043b\u0456\u0449\u0430\u0442\u043a\u043e \u0430\u0431\u043e pinch; \u0437\u0441\u0443\u0432 \u2014 \u043f\u0440\u043e\u0431\u0456\u043b \u0430\u0431\u043e \u0441\u0435\u0440\u0435\u0434\u043d\u044f \u043a\u043d\u043e\u043f\u043a\u0430 \u043c\u0438\u0448\u0456 + \u043f\u0435\u0440\u0435\u0442\u044f\u0433\u0443\u0432\u0430\u043d\u043d\u044f.',
    onboardingS2Title: '2. \u041f\u043e\u0431\u0443\u0434\u043e\u0432\u0430 \u0432\u043f\u0440\u0430\u0432\u0438 (2D \u043f\u043b\u0430\u043d)',
    onboardingS2Text:
      '\u041e\u0431\u0435\u0440\u0456\u0442\u044c \u0435\u043b\u0435\u043c\u0435\u043d\u0442 \u043d\u0430 \u0431\u0456\u0447\u043d\u0456\u0439 \u043f\u0430\u043d\u0435\u043b\u0456 (\u043c\u0456\u0448\u0435\u043d\u044c, \u0449\u0438\u0442, \u0434\u0435\u043a\u043e\u0440\u0430\u0446\u0456\u044e) \u2014 \u0432\u0456\u043d \u0437\u2019\u044f\u0432\u0438\u0442\u044c\u0441\u044f \u043d\u0430 \u043f\u043e\u043b\u0456. \u041a\u043b\u0456\u043a \u2014 \u0432\u0438\u0434\u0456\u043b\u0438\u0442\u0438, \u043f\u0435\u0440\u0435\u0442\u044f\u0433\u0443\u0432\u0430\u043d\u043d\u044f \u2014 \u043f\u0435\u0440\u0435\u043c\u0456\u0441\u0442\u0438\u0442\u0438 (\u043f\u0440\u0438\u0432\u2019\u044f\u0437\u043a\u0430 \u0434\u043e \u0441\u0456\u0442\u043a\u0438 \u0430\u0432\u0442\u043e\u043c\u0430\u0442\u0438\u0447\u043d\u0430). \u00ab\u21bb\u00bb \u0431\u0456\u043b\u044f \u043e\u0431\u2019\u0454\u043a\u0442\u0430 \u2014 \u043f\u043e\u0432\u043e\u0440\u043e\u0442 \u043a\u0440\u043e\u043a\u0430\u043c\u0438. Delete / Backspace \u2014 \u0432\u0438\u0434\u0430\u043b\u0438\u0442\u0438.',
    onboardingS3Title: '3. \u0421\u043f\u0435\u0446\u0438\u0444\u0456\u043a\u0430 \u043e\u0431\u2019\u0454\u043a\u0442\u0456\u0432',
    onboardingS3Text:
      '\u041c\u0456\u0448\u0435\u043d\u0456 \u043c\u043e\u0436\u043d\u0430 \u043f\u043e\u0437\u043d\u0430\u0447\u0438\u0442\u0438 \u044f\u043a NS (No-Shoot) \u043e\u043a\u0440\u0435\u043c\u0438\u043c\u0438 \u043a\u043d\u043e\u043f\u043a\u0430\u043c\u0438. \u0428\u0442\u0440\u0430\u0444\u043d\u0430 \u043b\u0456\u043d\u0456\u044f: \u0442\u044f\u0433\u043d\u0456\u0442\u044c \u043f\u043e\u043c\u0430\u0440\u0430\u043d\u0447\u0435\u0432\u0438\u0439 \u043c\u0430\u0440\u043a\u0435\u0440 \u0434\u043b\u044f \u0434\u043e\u0432\u0436\u0438\u043d\u0438, \u0456\u043d\u0448\u0438\u0439 \u043a\u0456\u043d\u0435\u0446\u044c \u043d\u0435\u0440\u0443\u0445\u043e\u043c\u0438\u0439. \u041c\u0435\u0442\u0430\u043b\u0435\u0432\u0456 \u043f\u043b\u0430\u0441\u0442\u0438\u043d\u0438: \u043a\u043b\u0430\u0432\u0456\u0448\u0456 [ \u0456 ] \u0437\u043c\u0456\u043d\u044e\u044e\u0442\u044c \u0441\u0442\u043e\u0440\u043e\u043d\u0443 (15 / 20 / 30 \u0441\u043c \u0437\u0430 Appendix C3).',
    onboardingS4Title: '4. 3D-\u043f\u0435\u0440\u0435\u0433\u043b\u044f\u0434 \u0442\u0430 \u0430\u0443\u0434\u0438\u0442',
    onboardingS4Text:
      '\u041f\u0435\u0440\u0435\u043c\u043a\u043d\u0456\u0442\u044c\u0441\u044f \u0432 3D \u0443 \u0432\u0435\u0440\u0445\u043d\u044c\u043e\u043c\u0443 \u043c\u0435\u043d\u044e. \u041e\u0431\u0435\u0440\u0442\u0430\u043d\u043d\u044f \u2014 \u043b\u0456\u0432\u0430 \u043a\u043d\u043e\u043f\u043a\u0430, \u043d\u0430\u0431\u043b\u0438\u0436\u0435\u043d\u043d\u044f \u2014 \u043a\u043e\u043b\u0456\u0449\u0430\u0442\u043a\u043e. \u041f\u0435\u0440\u0435\u0432\u0456\u0440\u0442\u0435 \u0432\u0438\u0434\u0438\u043c\u0456\u0441\u0442\u044c \u043c\u0456\u0448\u0435\u043d\u0435\u0439 \u0447\u0435\u0440\u0435\u0437 \u043f\u043e\u0440\u0442\u0438 \u0442\u0430 \u043a\u0443\u0442\u0438 \u0440\u043e\u0437\u0432\u043e\u0440\u043e\u0442\u0443. \u0420\u0435\u0436\u0438\u043c \u00ab\u0417\u043e\u043d\u0430 \u0441\u0442\u0440\u0456\u043b\u044c\u0446\u044f\u00bb \u043f\u043e\u043a\u0430\u0436\u0435 \u043a\u0430\u0440\u0442\u0438\u043d\u0443 \u043e\u0447\u0438\u043c\u0430 \u0443\u0447\u0430\u0441\u043d\u0438\u043a\u0430.',
    onboardingS5Title: '5. \u0411\u0440\u0438\u0444\u0456\u043d\u0433 \u0442\u0430 PDF',
    onboardingS5Text:
      '\u0417\u0430\u043f\u043e\u0432\u043d\u0456\u0442\u044c \u0442\u0430\u0431\u043b\u0438\u0446\u044e \u0431\u0440\u0438\u0444\u0456\u043d\u0433\u0443 (\u043d\u0430\u0437\u0432\u0430, \u043f\u0440\u043e\u0446\u0435\u0434\u0443\u0440\u0430, \u0441\u0442\u0430\u0440\u0442\u043e\u0432\u0430 \u043f\u043e\u0437\u0438\u0446\u0456\u044f). \u0421\u0438\u0441\u0442\u0435\u043c\u0430 \u043f\u0456\u0434\u0440\u0430\u0445\u0443\u0454 \u043c\u0456\u0448\u0435\u043d\u0456 \u0442\u0430 \u043c\u0456\u043d. \u043f\u043e\u0441\u0442\u0440\u0456\u043b\u0438. \u00ab\u0417\u0430\u0432\u0430\u043d\u0442\u0430\u0436\u0438\u0442\u0438 PDF\u00bb \u2014 \u0434\u043e\u043a\u0443\u043c\u0435\u043d\u0442 \u0456\u0437 \u0442\u0430\u0431\u043b\u0438\u0446\u0435\u044e \u0442\u0430 \u0437\u043d\u0456\u043c\u043a\u043e\u043c 3D-\u0441\u0446\u0435\u043d\u0438. \u0414\u043b\u044f \u0437\u043d\u0456\u043c\u043a\u0430 \u0432\u0456\u0434\u043a\u0440\u0438\u0439\u0442\u0435 3D \u043f\u0435\u0440\u0435\u0434 \u0435\u043a\u0441\u043f\u043e\u0440\u0442\u043e\u043c.',
    onboardingS6Title: '6. \u0417\u0431\u0435\u0440\u0435\u0436\u0435\u043d\u043d\u044f',
    onboardingS6Text:
      '\u00ab\u0417\u0431\u0435\u0440\u0435\u0433\u0442\u0438 \u0432\u043f\u0440\u0430\u0432\u0443\u00bb \u2014 \u0444\u0430\u0439\u043b .stage.json \u0456\u0437 \u043f\u043e\u0432\u043d\u043e\u044e \u0433\u0435\u043e\u043c\u0435\u0442\u0440\u0456\u0454\u044e \u0441\u0446\u0435\u043d\u0438 \u0442\u0430 \u0442\u0435\u043a\u0441\u0442\u043e\u043c \u0431\u0440\u0438\u0444\u0456\u043d\u0433\u0443. \u0419\u043e\u0433\u043e \u043c\u043e\u0436\u043d\u0430 \u0437\u0430\u0432\u0430\u043d\u0442\u0430\u0436\u0438\u0442\u0438 \u043f\u0456\u0437\u043d\u0456\u0448\u0435 \u0430\u0431\u043e \u043f\u0435\u0440\u0435\u0441\u043b\u0430\u0442\u0438 \u0456\u043d\u0448\u0438\u043c \u043e\u0440\u0433\u0430\u043d\u0456\u0437\u0430\u0442\u043e\u0440\u0430\u043c.',
    onboardingNote:
      '\u0414\u043e\u0434\u0430\u0442\u043e\u043a \u043f\u0440\u0430\u0446\u044e\u0454 \u044f\u043a PWA \u2014 \u0434\u043e\u0434\u0430\u0439\u0442\u0435 \u043d\u0430 \u0440\u043e\u0431\u043e\u0447\u0438\u0439 \u0441\u0442\u0456\u043b \u0434\u043b\u044f \u043e\u0444\u043b\u0430\u0439\u043d-\u0434\u043e\u0441\u0442\u0443\u043f\u0443 \u043d\u0430 \u0441\u0442\u0440\u0456\u043b\u044c\u0431\u0438\u0449\u0456.',
    onboardingCta: '\u041f\u043e\u0433\u043d\u0430\u043b\u0438 \u0434\u043e \u0440\u043e\u0431\u043e\u0442\u0438!',
    onboardingReopen: '\u0406\u043d\u0441\u0442\u0440\u0443\u043a\u0446\u0456\u044f',
    contextHint: '\u0417\u0430\u0440\u0430\u0437: \u043f\u043e\u043b\u0435 {{w}}\u00d7{{h}} \u043c, \u0441\u0456\u0442\u043a\u0430 {{grid}} \u043c.',
    toolbarDrawerOpen: '\u041c\u0456\u0448\u0435\u043d\u0456 \u0442\u0430 \u043e\u0431\u2019\u0454\u043a\u0442\u0438',
    toolbarDrawerClose: '\u0421\u0445\u043e\u0432\u0430\u0442\u0438 \u043f\u0430\u043d\u0435\u043b\u044c',
  },
  stats: {
    targets: '\u041c\u0456\u0448\u0435\u043d\u0456',
    props: '\u041e\u0431\u2019\u0454\u043a\u0442\u0438',
    minRounds: '\u041e\u0446\u0456\u043d\u043a\u0430 \u043c\u0456\u043d. \u043f\u043e\u0441\u0442\u0440\u0456\u043b\u0456\u0432',
  },
  toolbar: {
    aria: '\u041f\u0430\u043d\u0435\u043b\u044c \u0440\u0435\u0434\u0430\u043a\u0442\u043e\u0440\u0430: \u043c\u0456\u0448\u0435\u043d\u0456 \u0442\u0430 \u0456\u043d\u0444\u0440\u0430\u0441\u0442\u0440\u0443\u043a\u0442\u0443\u0440\u0430',
    targetsHeading: '\u041c\u0456\u0448\u0435\u043d\u0456',
    targetsAria: '\u0414\u043e\u0434\u0430\u0442\u0438 \u043c\u0456\u0448\u0435\u043d\u0456 \u0437\u0430\u043b\u0435\u0436\u043d\u043e \u0432\u0456\u0434 \u043a\u043b\u0430\u0441\u0443 \u0437\u0431\u0440\u043e\u0457',
    infrastructureHeading: '\u0406\u043d\u0444\u0440\u0430\u0441\u0442\u0440\u0443\u043a\u0442\u0443\u0440\u0430',
    infrastructureAria: '\u0414\u043e\u0434\u0430\u0442\u0438 \u043e\u0431\u2019\u0454\u043a\u0442\u0438 \u0456\u043d\u0444\u0440\u0430\u0441\u0442\u0440\u0443\u043a\u0442\u0443\u0440\u0438 (\u0434\u043b\u044f \u0432\u0441\u0456\u0445 \u043a\u043b\u0430\u0441\u0456\u0432 \u0437\u0431\u0440\u043e\u0457)',
    infrastructureHint:
      '\u041e\u0434\u043d\u0430\u043a\u043e\u0432\u0456 \u0434\u043b\u044f \u043f\u0456\u0441\u0442\u043e\u043b\u0435\u0442\u0430, \u043a\u0430\u0440\u0430\u0431\u0456\u043d\u0430 \u0442\u0430 \u0440\u0443\u0448\u043d\u0438\u0446\u0456. \u0412\u0456\u0434 \u043a\u043b\u0430\u0441\u0443 \u0437\u0430\u043b\u0435\u0436\u0438\u0442\u044c \u043b\u0438\u0448\u0435 \u0441\u043f\u0438\u0441\u043e\u043a \u043e\u0441\u043d\u043e\u0432\u043d\u0438\u0445 \u043c\u0456\u0448\u0435\u043d\u0435\u0439 \u0432\u0438\u0449\u0435.',
    targetsNsAria: '\u0414\u043e\u0434\u0430\u0442\u0438 no-shoot (NS) \u043c\u0456\u0448\u0435\u043d\u0456 \u2014 \u0432\u043b\u0443\u0447\u0430\u043d\u043d\u044f \u043d\u0435 \u0437\u0430\u0440\u0430\u0445\u043e\u0432\u0443\u044e\u0442\u044c\u0441\u044f',
    targetsNsCaption: 'NS:',
    fieldSizeOption: '{{w}} \u00d7 {{h}} \u043c',
    fieldSizeLabel: '\u041f\u043b\u043e\u0449\u0430\u0434\u043a\u0430 (\u0448\u0438\u0440 \u00d7 \u0434\u043e\u0432)',
    fieldSizeHint:
      '\u0417\u043c\u0456\u043d\u044e\u0454 \u0441\u0456\u0442\u043a\u0443 2D, \u043c\u0435\u0436\u0456, 3D \u0456 PDF. \u041e\u0431\u2019\u0454\u043a\u0442\u0438 \u0441\u0442\u0438\u0441\u043a\u0430\u044e\u0442\u044c\u0441\u044f \u0434\u043e \u043d\u043e\u0432\u0438\u0445 \u043c\u0435\u0436 (\u0441\u043f\u0440\u043e\u0449\u0435\u043d\u043e \u0437\u0430 \u0446\u0435\u043d\u0442\u0440\u043e\u043c).',
  },
  weapon: {
    sectionTitle: '\u041a\u043b\u0430\u0441 \u0437\u0431\u0440\u043e\u0457',
    aria: '\u041e\u0431\u0435\u0440\u0456\u0442\u044c \u043a\u043b\u0430\u0441 \u0437\u0431\u0440\u043e\u0457 \u2014 \u0432\u0456\u0434 \u0446\u044c\u043e\u0433\u043e \u0437\u0430\u043b\u0435\u0436\u0438\u0442\u044c \u0441\u043f\u0438\u0441\u043e\u043a \u043e\u0441\u043d\u043e\u0432\u043d\u0438\u0445 \u043c\u0456\u0448\u0435\u043d\u0435\u0439',
    handgun: '\u041f\u0456\u0441\u0442\u043e\u043b\u0435\u0442',
    rifle: '\u041a\u0430\u0440\u0430\u0431\u0456\u043d',
    shotgun: '\u0420\u0443\u0448\u043d\u0438\u0446\u044f',
    mismatchHint:
      '\u0423\u0432\u0430\u0433\u0430: \u043d\u0430 \u043f\u043b\u0430\u043d\u0456 \u0454 \u043c\u0456\u0448\u0435\u043d\u0456 \u043d\u0435 \u0437 \u043d\u0430\u0431\u043e\u0440\u0443 \u0434\u043b\u044f \u0446\u044c\u043e\u0433\u043e \u043a\u043b\u0430\u0441\u0443. \u0412\u043e\u043d\u0438 \u043d\u0435 \u0437\u043d\u0438\u043a\u0430\u044e\u0442\u044c \u2014 \u043f\u0435\u0440\u0435\u0432\u0456\u0440\u0442\u0435 \u0442\u0435\u043a\u0441\u0442 \u0431\u0440\u0438\u0444\u0456\u043d\u0433\u0443.',
  },
  targets: {
    paperIpsc: '+ \u041f\u0430\u043f\u0456\u0440 IPSC',
    paperA4: '+ A4 \u043f\u0430\u043f\u0456\u0440',
    metalPlate: '+ \u041c\u0435\u0442\u0430\u043b (\u043a\u0432\u0430\u0434\u0440.)',
    popper: '+ \u041f\u043e\u043f\u043f\u0435\u0440',
    miniPopper: '+ \u041c\u0456\u043d\u0456-\u043f\u043e\u043f\u043f\u0435\u0440',
    ceramicPlate: '+ \u041a\u0435\u0440\u0430\u043c\u0456\u043a\u0430',
    swingerSinglePaper: '+ \u041a\u0456\u0432\u0430\u043a 1\u00d7 \u043f\u0430\u043f\u0456\u0440',
    swingerDoublePaper: '+ \u041a\u0456\u0432\u0430\u043a 2\u00d7 \u043f\u0430\u043f\u0456\u0440',
    swingerSingleCeramic: '+ \u041a\u0456\u0432\u0430\u043a 1\u00d7 \u043a\u0435\u0440.',
    swingerDoubleCeramic: '+ \u041a\u0456\u0432\u0430\u043a 2\u00d7 \u043a\u0435\u0440.',
    noShootPaper: '+ NS \u043f\u0430\u043f\u0456\u0440 IPSC',
    noShootPaperA4: '+ NS A4',
    noShootMetal: '+ NS \u043c\u0435\u0442\u0430\u043b',
    noShootPopper: '+ NS \u043f\u043e\u043f\u043f\u0435\u0440',
    noShootMiniPopper: '+ NS \u043c\u0456\u043d\u0456',
  },
  props: {
    shield: '+ \u0429\u0438\u0442',
    shieldDouble: '+ \u0429\u0438\u0442 2\u00d72 \u043c',
    shieldWithPort: '+ \u0429\u0438\u0442 \u0437 \u043f\u043e\u0440\u0442\u043e\u043c',
    door: '+ \u0414\u0432\u0435\u0440\u0456',
    faultLine: '+ \u0428\u0442\u0440\u0430\u0444\u043d\u0430 \u043b\u0456\u043d\u0456\u044f',
    barrel: '+ \u0411\u043e\u0447\u043a\u0430',
    tireStack: '+ \u0421\u0442\u043e\u0441 \u0448\u0438\u043d',
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
    threeDControls:
      '\u041e\u0431\u0435\u0440\u0442\u0430\u043d\u043d\u044f \u2014 \u043f\u0435\u0440\u0435\u0442\u044f\u0433\u0443\u0432\u0430\u043d\u043d\u044f\u043c \u043c\u0438\u0448\u0435\u044e; \u043c\u0430\u0441\u0448\u0442\u0430\u0431 \u2014 \u043a\u043e\u043b\u0456\u0449\u0430\u0442\u043a\u043e\u043c \u0430\u0431\u043e \u0437\u0432\u0435\u0434\u0435\u043d\u043d\u044f\u043c \u043f\u0430\u043b\u044c\u0446\u0456\u0432. \u0414\u043e\u0434\u0430\u0432\u0430\u0442\u0438 \u0442\u0430 \u0440\u0443\u0445\u0430\u0442\u0438 \u043e\u0431\u2019\u0454\u043a\u0442\u0438 \u043a\u0440\u0430\u0449\u0435 \u0432 \u0440\u0435\u0436\u0438\u043c\u0456 \u00ab\u041f\u043b\u0430\u043d 2D\u00bb (\u043f\u0440\u0438\u0432\u2019\u044f\u0437\u043a\u0430 \u0434\u043e \u0441\u0456\u0442\u043a\u0438).',
    threeDControlsDetail:
      '\u0417\u043d\u0456\u043c\u043e\u043a \u0434\u043b\u044f PDF \u043c\u0430\u0454 \u0442\u0456 \u0436 \u043f\u0440\u043e\u043f\u043e\u0440\u0446\u0456\u0457, \u0449\u043e \u0439 \u043a\u0430\u0440\u0442\u043a\u0430 3D \u0443 \u0432\u0456\u043a\u043d\u0456 (\u0448\u0438\u0440\u0448\u0438\u0439 \u0437\u0430 \u0441\u0442\u0430\u0440\u0438\u0439 \u043d\u0430\u0434\u0432\u0438\u0441\u043e\u043a\u0438\u0439 \u043a\u0430\u0434\u0440), \u0449\u043e\u0431 \u0443 \u0434\u043e\u043a\u0443\u043c\u0435\u043d\u0442\u0456 \u043a\u0440\u0430\u0449\u0435 \u0432\u043c\u0456\u0449\u0430\u043b\u0430\u0441\u044f \u043f\u043b\u043e\u0449\u0430\u0434\u043a\u0430.',
    plan2dControls:
      '\u041c\u0430\u0441\u0448\u0442\u0430\u0431 \u2014 \u043a\u043e\u043b\u0456\u0449\u0430\u0442\u043a\u043e \u0430\u0431\u043e pinch. \u041f\u0435\u0440\u0435\u0442\u044f\u0433\u043d\u0456\u0442\u044c \u043f\u043e\u0440\u043e\u0436\u043d\u0454 \u043c\u0456\u0441\u0446\u0435 \u2014 \u0437\u0441\u0443\u0432 \u043f\u043b\u0430\u043d\u0443. \u041a\u043b\u0456\u043a \u043f\u043e \u043e\u0431\u2019\u0454\u043a\u0442\u0443 \u2014 \u0432\u0438\u0434\u0456\u043b\u0435\u043d\u043d\u044f, \u043f\u0435\u0440\u0435\u0442\u044f\u0433\u0443\u0432\u0430\u043d\u043d\u044f \u2014 \u0440\u0443\u0445. \u00ab\u21bb\u00bb \u0431\u0456\u043b\u044f \u043e\u0431\u2019\u0454\u043a\u0442\u0430 \u2014 \u043f\u043e\u0432\u043e\u0440\u043e\u0442 \u043a\u0440\u043e\u043a\u0430\u043c\u0438. Delete \u0430\u0431\u043e Backspace \u2014 \u0432\u0438\u0434\u0430\u043b\u0438\u0442\u0438.',
    plan2dControlsDetail:
      '\u041f\u0456\u0434 \u043a\u0443\u0440\u0441\u043e\u0440\u043e\u043c \u043f\u043e\u043a\u0430\u0437\u0443\u0454\u0442\u044c\u0441\u044f \u0432\u0443\u0437\u043e\u043b \u0441\u0456\u0442\u043a\u0438 \u0432 \u043c\u0435\u0442\u0440\u0430\u0445. \u041f\u0430\u043d\u043e\u0440\u0430\u043c\u0430: \u0441\u0435\u0440\u0435\u0434\u043d\u044f \u043a\u043d\u043e\u043f\u043a\u0430 \u043c\u0438\u0448\u0456 \u0430\u0431\u043e \u043f\u0440\u043e\u0431\u0456\u043b \u0456 \u043f\u0435\u0440\u0435\u0442\u044f\u0433\u0443\u0432\u0430\u043d\u043d\u044f. \u0428\u0442\u0440\u0430\u0444\u043d\u0430 \u043b\u0456\u043d\u0456\u044f: \u043f\u043e\u043c\u0430\u0440\u0430\u043d\u0447\u0435\u0432\u0438\u0439 \u043c\u0430\u0440\u043a\u0435\u0440 \u2014 \u0434\u043e\u0432\u0436\u0438\u043d\u0430 (\u0456\u043d\u0448\u0438\u0439 \u043a\u0456\u043d\u0435\u0446\u044c \u043d\u0435\u0440\u0443\u0445\u043e\u043c\u0438\u0439); \u0440\u0443\u0447\u043a\u0430 \u21bb \u0431\u0456\u043b\u044f \u0442\u043e\u0433\u043e \u043a\u0456\u043d\u0446\u044f \u2014 \u043e\u0431\u0435\u0440\u0442\u0430\u043d\u043d\u044f \u043d\u0430\u0432\u043a\u043e\u043b\u043e \u043f\u043e\u043c\u0430\u0440\u0430\u043d\u0447\u0435\u0432\u043e\u0433\u043e. \u041c\u0435\u0442\u0430\u043b\u0435\u0432\u0430 \u043a\u0432\u0430\u0434\u0440\u0430\u0442\u043d\u0430 \u043f\u043b\u0430\u0441\u0442\u0438\u043d\u0430 (\u0432\u0438\u0434\u0456\u043b\u0435\u043d\u0430): [ \u0456 ] \u2014 \u0441\u0442\u043e\u0440\u043e\u043d\u0430 \u0437\u0430 Appendix C3 (15 / 20 / 30 \u0441\u043c).',
    controlsDetails: '\u0414\u043e\u043a\u043b\u0430\u0434\u043d\u0456\u0448\u0435',
    controlsDetailsTooltip: '\u041f\u0456\u0434\u043a\u0430\u0437\u043a\u0438 \u0437 \u043a\u0435\u0440\u0443\u0432\u0430\u043d\u043d\u044f \u043f\u043b\u0430\u043d\u043e\u043c 2D \u0442\u0430 \u043f\u0435\u0440\u0435\u0433\u043b\u044f\u0434\u043e\u043c 3D',
    minimapAria:
      '\u041c\u0456\u043d\u0456-\u043a\u0430\u0440\u0442\u0430 \u043f\u043b\u043e\u0449\u0430\u0434\u043a\u0438: \u0441\u0438\u043d\u0456 \u0442\u043e\u0447\u043a\u0438-\u043f\u0430\u043f\u0456\u0440 \u0456 \u043c\u0435\u0442\u0430\u043b, \u043f\u043e\u043c\u0430\u0440\u0430\u043d\u0436\u0435\u0432\u0456 \u043a\u0432\u0430\u0434\u0440\u0430\u0442\u0438-\u0440\u0435\u043a\u0432\u0456\u0437\u0438\u0442, \u0440\u043e\u0436\u0435\u0432\u0430 \u0440\u0430\u043c\u043a\u0430-\u0432\u0438\u0434\u0438\u043c\u0438\u0439 \u0444\u0440\u0430\u0433\u043c\u0435\u043d\u0442. \u041a\u043b\u0430\u0446\u043d\u0456\u0442\u044c, \u0449\u043e\u0431 \u043f\u043e\u043a\u0430\u0437\u0430\u0442\u0438 \u0446\u044e \u0442\u043e\u0447\u043a\u0443 \u0432 \u0446\u0435\u043d\u0442\u0440\u0456 \u043f\u043b\u0430\u043d\u0443.',
  },
  briefing: {
    summary: '\u0422\u0435\u043a\u0441\u0442 \u0434\u043b\u044f PDF (\u0442\u0430\u0431\u043b\u0438\u0446\u044f \u0431\u0440\u0438\u0444\u0456\u043d\u0433\u0443)',
    documentTitle: '\u0417\u0430\u0433\u043e\u043b\u043e\u0432\u043e\u043a \u0434\u043e\u043a\u0443\u043c\u0435\u043d\u0442\u0430',
    exerciseType: '\u0422\u0438\u043f \u0432\u043f\u0440\u0430\u0432\u0438',
    targetsText: '\u041c\u0456\u0448\u0435\u043d\u0456 (\u0442\u0435\u043a\u0441\u0442)',
    recommendedShots: '\u0420\u0435\u043a\u043e\u043c\u0435\u043d\u0434\u043e\u0432\u0430\u043d\u0430 \u043a\u0456\u043b\u044c\u043a\u0456\u0441\u0442\u044c \u043f\u043e\u0441\u0442\u0440\u0456\u043b\u0456\u0432',
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
    rowRecommendedShots: '\u0420\u0435\u043a\u043e\u043c\u0435\u043d\u0434\u043e\u0432\u0430\u043d\u0430 \u043a\u0456\u043b\u044c\u043a\u0456\u0441\u0442\u044c \u043f\u043e\u0441\u0442\u0440\u0456\u043b\u0456\u0432',
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
    hint: 'JSON (*.stage.json): \u0441\u0446\u0435\u043d\u0430, \u043e\u0431\u2019\u0454\u043a\u0442\u0438, \u0442\u0430\u0431\u043b\u0438\u0446\u044f \u0431\u0440\u0438\u0444\u0456\u043d\u0433\u0443.',
    loadErrorJson: '\u0424\u0430\u0439\u043b \u043d\u0435 \u0454 \u043a\u043e\u0440\u0435\u043a\u0442\u043d\u0438\u043c JSON.',
    loadErrorShape: '\u041d\u0435\u0432\u0456\u0434\u043e\u043c\u0438\u0439 \u0444\u043e\u0440\u043c\u0430\u0442 \u0430\u0431\u043e \u043f\u043e\u0448\u043a\u043e\u0434\u0436\u0435\u043d\u0456 \u0434\u0430\u043d\u0456 \u0432\u043f\u0440\u0430\u0432\u0438.',
    loadErrorVersion: '\u041d\u0435\u043f\u0456\u0434\u0442\u0440\u0438\u043c\u0443\u0432\u0430\u043d\u0430 \u0432\u0435\u0440\u0441\u0456\u044f \u0444\u0430\u0439\u043b\u0443. \u041e\u043d\u043e\u0432\u0456\u0442\u044c Stage Builder.',
    fileGroupAria: '\u0417\u0431\u0435\u0440\u0435\u0436\u0435\u043d\u043d\u044f \u0442\u0430 \u0437\u0430\u0432\u0430\u043d\u0442\u0430\u0436\u0435\u043d\u043d\u044f \u0444\u0430\u0439\u043b\u0443 \u0432\u043f\u0440\u0430\u0432\u0438',
  },
  footer: {
    feedbackHeading: '\u0417\u0432\u043e\u0440\u043e\u0442\u043d\u0438\u0439 \u0437\u0432\u2019\u044f\u0437\u043e\u043a',
    feedbackText: '\u0417\u043d\u0430\u0439\u0448\u043b\u0438 \u043f\u043e\u043c\u0438\u043b\u043a\u0443, \u043c\u0430\u0454\u0442\u0435 \u043f\u0440\u043e\u043f\u043e\u0437\u0438\u0446\u0456\u044e \u0447\u0438 \u0432\u0456\u0434\u0433\u0443\u043a? \u041d\u0430\u043f\u0438\u0448\u0456\u0442\u044c:',
    feedbackEmail: 'Email',
    feedbackTelegram: 'Telegram',
    supportHeading: '\u041f\u0456\u0434\u0442\u0440\u0438\u043c\u0430\u0442\u0438 \u043f\u0440\u043e\u0454\u043a\u0442',
    supportText: 'Stage Builder \u2014 \u0431\u0435\u0437\u043a\u043e\u0448\u0442\u043e\u0432\u043d\u0438\u0439 \u0456 \u0432\u0456\u0434\u043a\u0440\u0438\u0442\u0438\u0439. \u042f\u043a\u0449\u043e \u0432\u0456\u043d \u0432\u0430\u043c \u043a\u043e\u0440\u0438\u0441\u043d\u0438\u0439, \u043c\u043e\u0436\u0435\u0442\u0435 \u043f\u0456\u0434\u0442\u0440\u0438\u043c\u0430\u0442\u0438 \u0440\u043e\u0437\u0440\u043e\u0431\u043a\u0443:',
    supportLink: '\u041f\u0456\u0434\u0442\u0440\u0438\u043c\u0430\u0442\u0438 (Monobank)',
  },
  pdfBranding: {
    generatedBy: '\u0417\u0433\u0435\u043d\u0435\u0440\u043e\u0432\u0430\u043d\u043e \u0432 Stage Builder',
  },
}

export const enMessages: MessageTree = {
  app: {
    title: 'Stage Builder',
    onboardingTitle: 'User Guide',
    onboardingS1Title: '1. Setting up the range',
    onboardingS1Text:
      'Pick the range size from the top bar (from 20\u00d730 m up to 120 m). Grid step is 0.5 m for precise target spacing. Zoom \u2014 scroll or pinch; pan \u2014 Space or middle mouse button + drag.',
    onboardingS2Title: '2. Building the stage (2D plan)',
    onboardingS2Text:
      'Pick an element from the sidebar (target, shield, prop) \u2014 it appears on the field. Click to select, drag to move (grid snap is automatic). \u00ab\u21bb\u00bb near an object rotates in steps. Delete / Backspace removes it.',
    onboardingS3Title: '3. Object specifics',
    onboardingS3Text:
      'Targets can be marked as NS (No-Shoot) with dedicated buttons. Penalty line: drag the orange marker to change length; the other end stays fixed. Steel plates: [ and ] keys change the side (15 / 20 / 30 cm per Appendix C3).',
    onboardingS4Title: '4. 3D preview & audit',
    onboardingS4Text:
      'Switch to 3D in the top menu. Orbit with left mouse, zoom with scroll. Check target visibility through ports and rotation angles. \u00abShooter\u2019s view\u00bb shows the stage from the competitor\u2019s perspective.',
    onboardingS5Title: '5. Briefing & PDF',
    onboardingS5Text:
      'Fill the briefing table (title, procedure, start position). The system auto-counts targets and min. rounds. \u00abDownload PDF\u00bb produces a document with the table and a 3D scene snapshot. Open 3D before exporting for the snapshot.',
    onboardingS6Title: '6. Saving',
    onboardingS6Text:
      '\u00abSave stage\u00bb creates a .stage.json file with the full scene geometry and briefing text. You can reload it later or share it with other match organizers.',
    onboardingNote:
      'The app works as a PWA \u2014 add it to your home screen for offline access at the range.',
    onboardingCta: "Let's get to work!",
    onboardingReopen: 'Guide',
    contextHint: 'Current field: {{w}}\u00d7{{h}} m, grid {{grid}} m.',
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
    targetsNsAria: 'Add no-shoot (NS) targets \u2014 hits do not score',
    targetsNsCaption: 'NS:',
    fieldSizeOption: '{{w}} \u00d7 {{h}} m',
    fieldSizeLabel: 'Range (w \u00d7 l)',
    fieldSizeHint:
      'Updates 2D grid, bounds, 3D, and PDF. Objects are clamped into the new bounds (simplified).',
  },
  weapon: {
    sectionTitle: 'Weapon class',
    aria: 'Pick a class \u2014 it controls which main targets you can add',
    handgun: 'Handgun',
    rifle: 'Rifle',
    shotgun: 'Shotgun',
    mismatchHint:
      'Some targets on the plan are not in the list for this class. They stay on the stage \u2014 review your briefing text.',
  },
  targets: {
    paperIpsc: '+ IPSC paper',
    paperA4: '+ A4 paper',
    metalPlate: '+ Steel plate',
    popper: '+ Popper',
    miniPopper: '+ Mini popper',
    ceramicPlate: '+ Ceramic',
    swingerSinglePaper: '+ Swinger 1\u00d7 paper',
    swingerDoublePaper: '+ Swinger 2\u00d7 paper',
    swingerSingleCeramic: '+ Swinger 1\u00d7 ceramic',
    swingerDoubleCeramic: '+ Swinger 2\u00d7 ceramic',
    noShootPaper: '+ NS IPSC paper',
    noShootPaperA4: '+ NS A4',
    noShootMetal: '+ NS steel',
    noShootPopper: '+ NS popper',
    noShootMiniPopper: '+ NS mini',
  },
  props: {
    shield: '+ Shield',
    shieldDouble: '+ Shield 2\u00d72 m',
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
      'Drag to orbit; scroll or pinch to zoom. Add and move objects in \u00ab2D plan\u00bb (grid snap).',
    threeDControlsDetail:
      'The PDF snapshot matches the 3D card proportions in the app (wider than the old extra-tall frame) so the stage fits better on the page.',
    plan2dControls:
      'Wheel or pinch to zoom. Drag empty space to pan. Click an object to select, drag to move, purple \u21bb to rotate in steps. Delete or Backspace removes the selection.',
    plan2dControlsDetail:
      'Grid coordinates under the cursor show meters. Pan with middle mouse or Space+drag. Penalty line: the orange dot changes length (opposite end fixed); the \u21bb handle rotates around that orange end. Square steel plate (selected): [ and ] \u2014 Appendix C3 side (15 / 20 / 30 cm).',
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
