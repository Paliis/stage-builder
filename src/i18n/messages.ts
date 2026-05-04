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
    /** Режим зв’язків активації на плані (BL-004). */
    activationLinkMode: string
    activationLinkModeTitle: string
    /** Закріплені розміри між об’єктами (центр–центр), для кваліфікаційних схем */
    dimensionLinkMode: string
    dimensionLinkModeTitle: string
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
    category: {
      short: string
      medium: string
      long: string
    }
    /** Заголовок блоку активацій у `targetsDescription` (BL-004). */
    activationHeading: string
    /** Одне ребро: глобальні номери {{from}} → {{to}}. */
    activationOneToOne: string
    /** Одне джерело, кілька цілей; {{toList}} — уже відформатований список номерів. */
    activationOneToMany: string
    /** Два номери в списку цілей (UK: «та»). */
    activationNumberListTwo: string
    /** Три й більше номерів: {{init}} — усі, крім останнього, через кому; {{last}} — останній. */
    activationNumberListMany: string
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
    /** After view publish — next view publish can reuse share_group_id (matches: refresh latest). */
    publishContinueViewShareGroup: string
    /** Clears linkage so next view publish creates a new share group. */
    publishStartNewViewShareGroup: string
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
    /** In-app /publish-policy: full text of the publishing agreement. */
    publishPolicyTitle: string
    publishPolicyParagraphs: string[]
    /** Link on `/v/` share page — open same snapshot in editor (new tab). */
    openInEditor: string
    /** `/v/` view-only: short notice above the editor link. */
    viewModeHint: string
  }
  /** Home page of the Shooters Tools portal (`/`). */
  portal: {
    title: string
    /** `<title>` for `/` (Helmet). */
    helmetTitle: string
    /** Short meta description for `/` (Helmet). */
    metaDescription: string
    lead: string
    navStageBuilder: string
    navHitFactor: string
    navRoHelper: string
    stageBuilderTitle: string
    stageBuilderDesc: string
    /** 2-3 ultra-short feature bullets shown on the Stage Builder card. */
    stageBuilderFeatures: string[]
    openStageBuilder: string
    hitFactorTitle: string
    hitFactorDesc: string
    /** 2-3 ultra-short feature bullets shown on the Hit Factor card. */
    hitFactorFeatures: string[]
    openHitFactor: string
    roHelperTitle: string
    roHelperDesc: string
    /** 2-3 ultra-short feature bullets shown on the RO Helper card. */
    roHelperFeatures: string[]
    openRoHelper: string
    /** ARIA label for the cards grid section. */
    gridAriaLabel: string
    /** Match hub (`/:locale/matches`): published list + lead copy. */
    portalPublishedMatchesHeading: string
    portalPublishedMatchesLead: string
    portalPublishedMatchesEmpty: string
    portalPublishedMatchesLoadError: string
    /** Hub list: primary CTA to open public match page. */
    portalPublishedMatchOpenPrimary: string
    /** `formatTemplate` `{{name}}` — organizer line on hub card. */
    portalPublishedCardOrganizer: string
    /** Alt text for match cover thumbnail on hub. */
    portalPublishedCardCoverAlt: string
    /** Footer link from match hub → organizer list (`/matches/my`). */
    matchesPortalOrganizerLink: string
    /** Match hub footer: signed-in user is not approved organizer yet → account link. */
    matchesPortalFooterOrganizerViaAccount: string
    /** Match hub footer: anonymous — sign-in for organizer flows. */
    matchesPortalFooterOrganizerSignIn: string
    /** `/matches/my` + edit/roster denied: pending organizer profile. */
    organizerMatchAccessDeniedPendingBody: string
    /** No organizer profile row (guest applied flow via account page). */
    organizerMatchAccessDeniedMissingBody: string
    organizerMatchAccessDeniedBlockedBody: string
    organizerMatchAccessGoAccount: string
    portalMatchesHubSearchAria: string
    /** Visible label above the match hub search field. */
    portalMatchesHubSearchFieldLabel: string
    portalMatchesHubSearchPlaceholder: string
    portalMatchesHubDateFrom: string
    portalMatchesHubDateTo: string
    portalMatchesHubClearFilters: string
    portalMatchesHubCalendarPrevAria: string
    portalMatchesHubCalendarNextAria: string
    portalMatchesHubMonthJumpLabel: string
    portalMatchesHubCalendarAria: string
    /** `formatTemplate`: `{{date}}` → YYYY-MM-DD (local calendar day label). */
    portalMatchesHubDayButtonAria: string
    portalMatchesHubNoMatchesFiltered: string
    /** Match hub: filter by event kind (training / match / classification). */
    portalMatchesHubFilterEventKind: string
    portalMatchesHubFilterEventKindAll: string
    /** Match hub: filter by PractiScore level L1–L5. */
    portalMatchesHubFilterPsLevel: string
    portalMatchesHubFilterPsLevelAll: string
    /** Match hub: weapon-type filter (UI placeholder until data exists). */
    portalMatchesHubFilterWeaponType: string
    portalMatchesHubFilterWeaponTypePlaceholder: string
    /** Compact placeholder when kind/level not set (list/hub). */
    portalMatchesHubListDash: string
    /** Status badge label — stable / generally available product. */
    badgeLive: string
    /** Status badge label — new / recently launched product. */
    badgeNew: string
    /** Status badge label — beta / under active development. */
    badgeBeta: string
    matchesPageHelmetTitle: string
    /** Short suffix for `<title>` on detail (after match name). */
    matchesPageShortTitle: string
    matchesSupabaseUnset: string
    matchesLoadError: string
    matchesLoadingDetail: string
    matchDetailBackToList: string
    /** aria-label for compact breadcrumb / back rows in match flows */
    portalBreadcrumbAria: string
    matchDetailNotFoundTitle: string
    matchDetailNotFoundBody: string
    matchDetailStartsLabel: string
    matchDetailEventKindLabel: string
    matchDetailPsLevelLabel: string
    /** Shown on public match card when event type / PS level was left empty. */
    matchDetailNotSpecifiedValue: string
    matchDetailLocationLabel: string
    matchDetailDisciplineLabel: string
    matchDetailLimitLabel: string
    matchDetailPrematchLabel: string
    matchDetailPrematchValueYes: string
    matchDetailPrematchValueNo: string
    /** Public match card: linked exercises (match_stage_links). */
    matchDetailProgrammeHeading: string
    matchDetailProgrammeViewLink: string
    matchDetailProgrammeFootnote: string
    /** Public match card: roster block (participant_list_visibility). */
    matchDetailParticipantsHeading: string
    matchDetailParticipantsClosed: string
    matchDetailParticipantsOpenEmpty: string
    matchDetailParticipantsOpenAwaitingConfirmation: string
    matchDetailParticipantsFootnote: string
    matchDetailParticipantsColSquad: string
    matchDetailParticipantsColPhase: string
    matchDetailParticipantsColName: string
    matchDetailParticipantsColDivision: string
    matchDetailParticipantsColClass: string
    /** When RPC migration not applied yet */
    matchDetailApplyMigrationHint: string
    matchDetailRegistrationHeading: string
    matchDetailRegistrationPrematchHeading: string
    matchDetailRegistrationMainHeading: string
    matchDetailRegistrationPrematchEmpty: string
    matchDetailRegistrationMainEmpty: string
    matchDetailRegistrationPhaseShortPrematch: string
    matchDetailRegistrationPhaseShortMain: string
    matchDetailRegistrationNoSquads: string
    matchDetailRegistrationColSquad: string
    matchDetailRegistrationColFree: string
    matchDetailRegistrationFull: string
    matchDetailRegistrationMatchFull: string
    matchDetailRegistrationSignInIntro: string
    matchDetailRegistrationFieldSquad: string
    matchDetailRegistrationSelectSquad: string
    matchDetailRegistrationDivision: string
    matchDetailRegistrationClass: string
    matchDetailRegistrationPFOptional: string
    matchDetailRegistrationPFNone: string
    matchDetailRegistrationPFMajor: string
    matchDetailRegistrationPFMinor: string
    matchDetailRegistrationSubmit: string
    matchDetailRegistrationSubmitting: string
    matchDetailRegistrationDonePending: string
    matchDetailRegistrationYourStatus: string
    matchDetailRegistrationStatusPending: string
    matchDetailRegistrationStatusConfirmed: string
    matchDetailRegistrationStatusCancelled: string
    matchDetailRegistrationCancel: string
    matchDetailRegistrationCancelling: string
    matchDetailRegistrationPickOpenSquad: string
    matchDetailRegistrationErrorPrefix: string
    portalCompactAuthAria: string
    portalCompactAuthSignIn: string
    portalCompactAuthSignUp: string
    portalCompactAuthEmail: string
    portalCompactAuthPassword: string
    /** Shown under password field (min length + optional guidance). */
    portalCompactAuthPasswordHint: string
    /** Client-side validation before Supabase (must stay in sync with project Auth policy if stricter). */
    portalCompactAuthPasswordTooShort: string
    portalCompactAuthShowPassword: string
    portalCompactAuthHidePassword: string
    portalCompactAuthSubmitSignIn: string
    portalCompactAuthSubmitSignUp: string
    portalCompactAuthSignOut: string
    portalCompactAuthSignupSession: string
    portalCompactAuthSignupConfirm: string
    /** After signUp without session — OTP from email (Supabase `{{ .Token }}`, typically 6 or 8 digits). */
    portalCompactAuthOtpSent: string
    portalCompactAuthOtpLabel: string
    portalCompactAuthOtpHint: string
    portalCompactAuthOtpLength: string
    portalCompactAuthOtpSubmit: string
    portalCompactAuthOtpInvalid: string
    portalCompactAuthOtpResend: string
    portalCompactAuthOtpResendDone: string
    portalCompactAuthOtpChangeEmail: string
    /** Email confirm redirect target `/{locale}/auth/email-callback`. */
    authEmailCallbackHelmet: string
    authEmailCallbackLoading: string
    authEmailCallbackSuccessTitle: string
    authEmailCallbackSuccessBody: string
    authEmailCallbackContinue: string
    authEmailCallbackToHome: string
    authEmailCallbackFailedTitle: string
    authEmailCallbackFailedBody: string
    authEmailCallbackAccountCta: string
    /** Platform owner: match organizers directory (`/admin/organizers`). */
    organizersAdminHelmetTitle: string
    organizersAdminTitle: string
    organizersAdminIntro: string
    organizersNeedSignIn: string
    organizersForbidden: string
    organizersLoading: string
    organizersLoadError: string
    organizersColEmail: string
    organizersColDisplayName: string
    organizersColMatches: string
    organizersColStatus: string
    organizersStatusPending: string
    organizersStatusActive: string
    organizersStatusBlocked: string
    organizersSave: string
    organizersSaving: string
    organizersBackHome: string
    organizersFilterAll: string
    organizersFilterApplications: string
    organizersFilterPendingAll: string
    organizersColBadge: string
    organizersColContact: string
    organizersColPastMatches: string
    organizersColModeration: string
    organizersBadgeApplication: string
    organizersBadgePendingExtra: string
    organizersModerationNoteLabel: string
    organizersModerationNotePlaceholder: string
    organizersApplicationEmpty: string
    organizersModerationNoteTooLong: string
    /** Header + `/:locale/account`: explicit session & role badges. */
    accountHeaderAria: string
    accountHeaderChecking: string
    accountHeaderSignIn: string
    accountHeaderProfile: string
    /** `aria-label` on header profile icon — include {{email}}. */
    accountHeaderProfileIconAria: string
    accountBadgeParticipant: string
    accountBadgeParticipantHint: string
    accountBadgeOrganizerActive: string
    accountBadgeOrganizerBlocked: string
    /** Account page — organizer application pending approval. */
    accountBadgeOrganizerPending: string
    accountBadgeLoading: string
    accountPageHelmet: string
    accountPageTitle: string
    accountAuthHeading: string
    accountSummaryHeading: string
    accountSummaryLogin: string
    accountShooterCabinetHeading: string
    accountShooterCabinetLead: string
    accountShooterPortalLinkLabel: string
    accountShooterPortalLinkSuffix: string
    accountPageGoOrganizer: string
    accountPageOrganizerExplain: string
    accountPageShooterSoon: string
    accountOrganizerSectionHeading: string
    accountOrganizerActiveLead: string
    accountOrganizerApplyTeaser: string
    accountOrganizerApplyToggleExpand: string
    accountOrganizerApplyToggleCollapse: string
    accountOrganizerApplyHeading: string
    accountOrganizerApplyIntro: string
    accountOrganizerApplyButton: string
    accountOrganizerApplySubmitting: string
    accountOrganizerApplyPendingTitle: string
    accountOrganizerApplyPendingBody: string
    accountOrganizerApplyBlockedBody: string
    accountOrganizerApplyErrorPrefix: string
    accountOrganizerApplyDuplicateFriendly: string
    accountOrganizerApplyValidationLength: string
    accountOrganizerModerationHeading: string
    accountOrganizerApplyContactLabel: string
    accountOrganizerApplyContactPlaceholder: string
    accountOrganizerApplyPastMatchesLabel: string
    accountOrganizerApplyPastMatchesPlaceholder: string
    accountMyRegistrationsHeading: string
    accountMyRegistrationsEmpty: string
    accountMyRegistrationsLoadError: string
    accountMyRegistrationsColMatch: string
    accountMyRegistrationsColDate: string
    accountMyRegistrationsColStatus: string
    accountMyRegistrationsColActions: string
    accountMyRegistrationsStatusPending: string
    accountMyRegistrationsStatusConfirmed: string
    accountMyRegistrationsStatusCancelled: string
    accountMyRegistrationsOpenMatch: string
    accountMyRegistrationsCancel: string
    accountMyRegistrationsCancelling: string
    accountMyRegistrationsMatchUnavailable: string
    accountParticipantDefaultsHeading: string
    accountParticipantDefaultsLead: string
    /** PractiScore-oriented defaults card body (account page). */
    accountParticipantProfileSectionLead: string
    accountParticipantFieldRegion: string
    accountParticipantFieldRegionPlaceholder: string
    accountParticipantFieldCategory: string
    accountParticipantFieldCategoryPlaceholder: string
    accountParticipantFieldCategoryHint: string
    accountParticipantFieldWeaponClass: string
    accountParticipantFieldWeaponPlaceholder: string
    /** Shown when match routes disabled but profile form still visible. */
    accountParticipantMatchPortalOffHint: string
    accountParticipantDefaultsSave: string
    accountParticipantDefaultsSaving: string
    accountParticipantDefaultsSaved: string
    /** Responsive shell header: mobile drawer + hamburger. */
    portalShellMenuOpenAria: string
    portalShellMenuCloseAria: string
    portalShellNavDrawerAria: string
    /** Match portal hub in shell — `/:locale/matches`. */
    navMatches: string
    myMatchesTitle: string
    myMatchesHelmet: string
    myMatchesCreate: string
    myMatchesColTitle: string
    myMatchesColStarts: string
    myMatchesColEventKind: string
    myMatchesColPsLevel: string
    myMatchesColStatus: string
    myMatchesColList: string
    myMatchesRoster: string
    myMatchesEdit: string
    myMatchesViewPublic: string
    myMatchesNeedSignIn: string
    myMatchesDevSignInHint: string
    myMatchesLoading: string
    myMatchesLoadError: string
    myMatchesEmpty: string
    myMatchesBackHome: string
    /** Organizer list: primary action → match edit hub. */
    myMatchesManage: string
    /** Mobile card: secondary link group (roster, public). */
    myMatchesQuickLinksAria: string
    matchOrgStatusDraft: string
    matchOrgStatusPublished: string
    matchOrgStatusCancelled: string
    matchOrgStatusCompleted: string
    matchOrgParticipantsOpenShort: string
    matchOrgParticipantsClosedShort: string
    matchOrgCreateTitle: string
    matchOrgEditTitle: string
    matchOrgCreateHelmet: string
    matchOrgEditHelmetEdit: string
    matchOrgEditHelmetLoading: string
    matchOrgSave: string
    matchOrgSaveSaving: string
    matchOrgBackList: string
    matchOrgFieldTitle: string
    matchOrgFieldStarts: string
    matchOrgFieldLocation: string
    matchOrgFieldCoverImage: string
    matchOrgCoverUpload: string
    matchOrgCoverRemove: string
    matchOrgCoverHintNew: string
    matchOrgCoverErrType: string
    matchOrgCoverErrSize: string
    matchOrgCoverUploading: string
    matchOrgFieldEventKind: string
    matchOrgFieldPsLevel: string
    /** Short line above event type / PS level block. */
    matchOrgTaxonomyOptionalLead: string
    /** Help under event type `<select>` (organizer match edit). */
    matchOrgEventKindHint: string
    /** Help under PractiScore level `<select>`. */
    matchOrgPsLevelHint: string
    matchOrgEventKindUnset: string
    matchEventKindTraining: string
    matchEventKindMatch: string
    matchEventKindClassification: string
    matchOrgPsLevelUnset: string
    matchPsLevelL1: string
    matchPsLevelL2: string
    matchPsLevelL3: string
    matchPsLevelL4: string
    matchPsLevelL5: string
    matchOrgDerivedCapacityLine: string
    matchOrgFieldShootersMain: string
    matchOrgFieldShootersPrematch: string
    matchOrgFieldDescription: string
    matchOrgFieldStatus: string
    matchOrgFieldParticipantList: string
    matchOrgParticipantsListOpen: string
    matchOrgParticipantsListClosed: string
    matchOrgParticipantListFootnote: string
    matchOrgRegistrationsSummary: string
    matchOrgRegistrationsNoneYet: string
    matchOrgDisciplineShotgunNote: string
    matchOrgExportPsc: string
    matchOrgExportPscBusy: string
    matchOrgExportPscHint: string
    matchOrgExportPscErrGeneric: string
    matchOrgExportPscErrNetwork: string
    matchOrgExportPscErrNoStages: string
    matchOrgExportPscErrSession: string
    matchOrgFieldPrematch: string
    matchOrgFieldPlannedMainSquads: string
    matchOrgFieldPlannedPrematchSquads: string
    matchOrgPlannedMainInvalid: string
    matchOrgPlannedPrematchInvalid: string
    matchOrgEditBadId: string
    matchOrgEditNotFound: string
    matchOrgTitleRequired: string
    matchOrgShootersInvalid: string
    matchOrgStagesHeading: string
    matchOrgStagesIntro: string
    matchOrgStagesOpenEditor: string
    matchOrgStagesPasteLabel: string
    matchOrgStagesPastePlaceholder: string
    matchOrgStagesAdd: string
    matchOrgStagesAdding: string
    matchOrgStagesEmpty: string
    matchOrgStagesColTitle: string
    matchOrgStagesColShareId: string
    matchOrgStagesColActions: string
    matchOrgStagesViewLink: string
    matchOrgStagesMoveUp: string
    matchOrgStagesMoveDown: string
    matchOrgStagesRemove: string
    matchOrgStagesRefreshLatest: string
    matchOrgStagesRefreshing: string
    matchOrgStagesRefreshAll: string
    matchOrgStagesRefreshAllBusy: string
    matchOrgStagesErrorGeneric: string
    matchOrgStagesInvalidPaste: string
    matchOrgStagesNotFound: string
    matchOrgStagesNotViewMode: string
    matchOrgStagesDuplicate: string
    matchOrgStagesErrNoShareGroup: string
    matchOrgStagesErrNoLatestShare: string
    matchOrgSquadsHeading: string
    matchOrgSquadsDerivedIntro: string
    matchOrgSquadsDerivedCapacityLine: string
    matchOrgSquadSyncBanner: string
    matchOrgSquadSyncBannerDismiss: string
    matchOrgSyncErrPrematchRemove: string
    matchOrgSyncErrLowerCapacity: string
    matchOrgSyncErrReduceSquads: string
    matchOrgSyncErrOrganizerInactive: string
    matchOrgSyncErrGeneric: string
    matchOrgSquadsColPhase: string
    matchOrgSquadsPhaseMain: string
    matchOrgSquadsPhasePrematch: string
    matchOrgSquadsPlannedMainLine: string
    matchOrgSquadsPlannedPrematchLine: string
    matchOrgRosterManageLink: string
    matchOrgRosterHelmet: string
    matchOrgRosterHeading: string
    matchOrgRosterLead: string
    matchOrgRosterEditMatch: string
    matchOrgRosterEmpty: string
    matchOrgRosterColName: string
    matchOrgRosterColDivision: string
    matchOrgRosterColStatus: string
    matchOrgRosterColSquad: string
    matchOrgRosterApply: string
    matchOrgRosterSaving: string
    matchOrgRosterConfirm: string
    matchOrgRosterColActions: string
    matchOrgRosterNoFreeSlot: string
    matchOrgRosterViewTable: string
    matchOrgRosterViewBoard: string
    matchOrgRosterBoardHint: string
    matchOrgRosterBoardSquadFull: string
    matchOrgRosterBoardEmptyColumn: string
    matchOrgRosterInactiveHeading: string
    matchOrgSquadsColLabel: string
    matchOrgSquadsColCapacity: string
    matchOrgSquadsColTaken: string
    matchOrgSquadsAutoEmpty: string
  }
  hitFactor: {
    pageTitle: string
    pageLead: string
    requiredHitsLabel: string
    timeLabel: string
    powerFactorLabel: string
    powerFactorMinor: string
    powerFactorMajor: string
    modelNoteLabel: string
    modelNote: string
    deviationsTitle: string
    deviationsLead: string
    deviationsExpandCta: string
    deviationsCollapseCta: string
    charlieLabel: string
    deltaLabel: string
    missLabel: string
    proceduralLabel: string
    noShootLabel: string
    hfActualLabel: string
    hfMaxLabel: string
    maxPointsLabel: string
    actualPointsLabel: string
    hfLossLabel: string
    impactTitle: string
    impactLead: string
    plusOneSecondLabel: string
    minusOneSecondLabel: string
    secondsUnit: string
    focusTitle: string
    focusAccuracyTitle: string
    focusAccuracyText: string
    focusSpeedTitle: string
    focusSpeedText: string
    focusBalancedTitle: string
    focusBalancedText: string
    focusMakeupsTitle: string
    focusMakeupsText: string
    weaponClassLabel: string
    weaponClassPistol: string
    weaponClassRifle: string
    weaponClassPcc: string
    weaponClassShotgun: string
    makeupShotLabel: string
    makeupShotCountLabel: string
    makeupShotSplitLabel: string
    reset: string
  }
  /** `/ro-helper` production module (markdown articles). */
  roHelper: {
    moduleTitle: string
    navPortal: string
    lead: string
    /** Title of the discipline-picker section on the RO Helper home. */
    disciplineTitle: string
    /** Subtitle shown under the home title — guides the user to pick a discipline first. */
    disciplineLead: string
    /** Per-card subtitle on home, e.g. "5 категорій правил". */
    disciplineCardSubtitle: string
    categoryTitle: string
    articlesEmpty: string
    articleNotFound: string
    invalidPath: string
    loading: string
    fpsuLayerLabel: string
    fpsuLayerHint: string
    /** Disclaimer shown at the bottom of every RO Helper article. */
    disclaimerTitle: string
    disclaimerBody: string
    breadcrumbRo: string
    discHandgun: string
    discPcc: string
    discRifle: string
    discMiniRifle: string
    discShotgun: string
    catSafety: string
    catPenalties: string
    catScoring: string
    catEquipment: string
    catMatchAdmin: string
    /** Short one-line description shown on the category card on the discipline page. */
    catSafetyDesc: string
    catPenaltiesDesc: string
    catScoringDesc: string
    catEquipmentDesc: string
    catMatchAdminDesc: string
    /** Default `<meta name="description">` for RO Helper list pages (not article body). */
    seoModuleDescription: string
    /** Search bar shown on every RO Helper page. */
    searchPlaceholder: string
    searchAriaLabel: string
    searchEmpty: string
    searchHint: string
    searchClear: string
    searchLoading: string
    quickCiteButton: string
    quickCiteAria: string
    quickCiteCopied: string
    quickCiteFailed: string
    quickCiteHeader: string
    quickCiteTopic: string
    quickCiteIpsc: string
    quickCitePrimary: string
    quickCiteUnset: string
    quickCiteNoRules: string
    quickCiteFpsu: string
    quickCiteFpsuSeeBlock: string
    quickCiteNote: string
  }
  footer: {
    feedbackHeading: string
    feedbackText: string
    feedbackTelegram: string
    supportHeading: string
    supportText: string
    supportLink: string
    installHeading: string
    installText: string
    installButton: string
    publishPolicy: string
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
      'Розстановка: оберіть тип у бічній панелі (мішень, щит, реквізит) → клацайте по плану. Кожен клік додає один об’єкт у точці курсора (навіть поверх інших). Вийти з режиму: Esc або знову та сама кнопка типу.\n\nПісля виходу: клік — виділити; перетягування — перемістити (прив’язка до сітки вмикається сама). «↻» — поворот. На клавіатурі: Delete / Backspace — видалити виділене. На телефоні: кнопка з хрестиком біля карти — те саме; довгий тап по плану (~0,5 с) з виділенням відкриває меню дій. Нижня червона кнопка з кошиком — очистити всю вправу (не плутати з видаленням виділення).\n\nВимір: іконка лінійки біля карти або клавіша M у 2D — два кліки задають відрізок і довжину в метрах; Esc скасовує незавершений вимір.\nРамка на карті — виділити зону; перетягніть будь-який з виділених об’єктів — переміститься вся група. Копія / вставка: Ctrl+C / Ctrl+V або кнопки «Копія» / «Вставити» — вставка під покажчиком на карті, якщо він над нею (інакше в центрі поточного виду).',
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
      '\u0422\u0435\u0441\u0442\u043e\u0432\u0435 \u0441\u0435\u0440\u0435\u0434\u043e\u0432\u0438\u0449\u0435 (staging). \u0414\u043b\u044f \u0431\u043e\u044e \u0432\u0438\u043a\u043e\u0440\u0438\u0441\u0442\u043e\u0432\u0443\u0439\u0442\u0435 shooters-tools.com.',
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
      'Клацніть близько до першої точки (допуск 5 см), щоб замкнути. Під час руху курсора від останньої точки показано довжину наступного відрізка та шкалу (рисочки кожні 0,1 м, довші — на метрах). Постановка та перетягування вершин — з прив’язкою 0,1 м. Всередині існуючої зони — дірка. Вершини — перетягувати за точкою; під час руху відображено довжини двох прилеглих до неї ребер (до сусідніх точок уздовж контуру). Delete / Backspace — видалити вершину (якщо менше за 3 точки в контурі — весь полігон або дірку).',
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
      '\u0412\u0438\u0434\u0456\u043b\u0435\u043d\u043d\u044f \u0437\u043e\u043d\u043e\u044e: \u043f\u0440\u043e\u0442\u044f\u0433\u043d\u0456\u0442\u044c \u043f\u043e \u043f\u043b\u0430\u043d\u0443. \u041f\u043e\u043f\u0430\u0434\u0430\u044e\u0442\u044c \u043e\u0431\u2019\u0454\u043a\u0442\u0438, \u0447\u0438\u0439 \u0446\u0435\u043d\u0442\u0440 \u0432\u0441\u0435\u0440\u0435\u0434\u0438\u043d\u0456 \u0440\u0430\u043c\u043a\u0438. \u041f\u0456\u0441\u043b\u044f \u0432\u0456\u0434\u043f\u0443\u0441\u043a\u0430\u043d\u043d\u044f \u0440\u0435\u0436\u0438\u043c \u0440\u0430\u043c\u043a\u0438 \u0432\u0438\u043c\u043a\u0430\u0454\u0442\u044c\u0441\u044f \u2014 \u043c\u043e\u0436\u043d\u0430 \u043f\u0435\u0440\u0435\u0442\u044f\u0433\u0443\u0432\u0430\u0442\u0438 \u0432\u0438\u0434\u0456\u043b\u0435\u043d\u043d\u044f. Esc \u2014 \u0432\u0438\u043c\u043a\u043d\u0443\u0442\u0438 \u0432\u0440\u0443\u0447\u043d\u0443.',
    activationLinkMode: '\u0410\u043a\u0442\u0438\u0432\u0430\u0446\u0456\u044f',
    activationLinkModeTitle:
      '\u0414\u0432\u0430 \u043a\u043b\u0456\u043a\u0438: \u0441\u043f\u043e\u0447\u0430\u0442\u043a\u0443 \u0434\u0436\u0435\u0440\u0435\u043b\u043e, \u043f\u043e\u0442\u0456\u043c \u0446\u0456\u043b\u044c. Esc \u2014 \u0432\u0438\u0439\u0442\u0438 \u0437 \u0440\u0435\u0436\u0438\u043c\u0443.',
    dimensionLinkMode: '\u0420\u043e\u0437\u043c\u0456\u0440\u0438',
    dimensionLinkModeTitle:
      'Два кліки — новий розмір; перетягувати кінець або середину (рух усій лінії). Клік виділяє — Delete або Backspace видаляють. Esc знімає виділення (вихід з режиму «Розміри» — як раніше через панель).',
    copySelection: '\u041a\u043e\u043f\u0456\u044f',
    copySelectionTitle:
      '\u041a\u043e\u043f\u0456\u044e\u0432\u0430\u0442\u0438 \u0432\u0438\u0434\u0456\u043b\u0435\u043d\u0435 (Ctrl+C). \u0421\u043f\u043e\u0447\u0430\u0442\u043a\u0443 \u2014 \u0432\u043d\u0443\u0442\u0440\u0456\u0448\u043d\u0454 \u0437\u0431\u0435\u0440\u0456\u0433\u0430\u043d\u043d\u044f \u0442\u0430\u043a\u043e\u0436 \u0443 \u0431\u0443\u0444\u0435\u0440 \u043e\u0431\u043c\u0456\u043d\u0443.',
    pasteSelection: '\u0412\u0441\u0442\u0430\u0432\u0438\u0442\u0438',
    pasteSelectionTitle:
      '\u0412\u0441\u0442\u0430\u0432\u0438\u0442\u0438 \u043a\u043e\u043f\u0456\u044e \u043f\u0456\u0434 \u043f\u043e\u043a\u0430\u0436\u0447\u0438\u043a\u043e\u043c \u043d\u0430 \u043f\u043b\u0430\u043d\u0456 (\u0456\u043d\u0448\u0435 \u2014 \u0432 \u0446\u0435\u043d\u0442\u0440 \u0432\u0438\u0434\u0443) (Ctrl+V).',
    undoRedoGroupAria: '\u0406\u0441\u0442\u043e\u0440\u0456\u044f \u0437\u043c\u0456\u043d \u043f\u043b\u0430\u043d\u0443',
    undoPlan: '\u0412\u0456\u0434\u043c\u0456\u043d\u0438\u0442\u0438',
    undoPlanTitle:
      '\u0412\u0456\u0434\u043c\u0456\u043d\u0438\u0442\u0438 \u043e\u0441\u0442\u0430\u043d\u043d\u044e \u0437\u043c\u0456\u043d\u0443 \u043d\u0430 \u043f\u043b\u0430\u043d\u0456 (Ctrl+Z \u0430\u0431\u043e \u2318+Z).',
    redoPlan: '\u041f\u043e\u0432\u0442\u043e\u0440\u0438\u0442\u0438',
    redoPlanTitle:
      '\u041f\u043e\u0432\u0442\u043e\u0440\u0438\u0442\u0438 \u0441\u043a\u0430\u0441\u043e\u0432\u0430\u043d\u0443 \u0434\u0456\u044e (Ctrl+Shift+Z, Ctrl+Y \u0430\u0431\u043e \u2318+Shift+Z).',
    planMapActionsAria:
      'Дії на 2D-плані: рамка, копія, вставка, активація, розміри, вимір, видалити виділене, очистити всю вправу',
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
    category: {
      short: '\u041a\u043e\u0440\u043e\u0442\u043a\u0430',
      medium: '\u0421\u0435\u0440\u0435\u0434\u043d\u044f',
      long: '\u0414\u043e\u0432\u0433\u0430',
    },
    activationHeading: '\u0410\u043a\u0442\u0438\u0432\u0430\u0446\u0456\u0457:',
    activationOneToOne:
      '\u041e\u0431\u2019\u0454\u043a\u0442 \u2116{{from}} \u0430\u043a\u0442\u0438\u0432\u0443\u0454 \u043e\u0431\u2019\u0454\u043a\u0442 \u2116{{to}}.',
    activationOneToMany:
      '\u041e\u0431\u2019\u0454\u043a\u0442 \u2116{{from}} \u0430\u043a\u0442\u0438\u0432\u0443\u0454 \u043e\u0431\u2019\u0454\u043a\u0442\u0438 {{toList}}.',
    activationNumberListTwo: '{{a}} \u0442\u0430 {{b}}',
    activationNumberListMany: '{{init}} \u0442\u0430 {{last}}',
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
      '\u041d\u0430\u043b\u0430\u0448\u0442\u0443\u0432\u0430\u043d\u043d\u044f Supabase \u043d\u0430 \u043a\u043b\u0456\u0454\u043d\u0442\u0456 \u0432\u0456\u0434\u0441\u0443\u0442\u043d\u0454. \u041b\u043e\u043a\u0430\u043b\u044c\u043d\u043e: VITE_SUPABASE_URL \u0442\u0430 VITE_SUPABASE_ANON_KEY \u0443 .env.local. \u041d\u0430 Vercel: \u0437\u043c\u0456\u043d\u043d\u0456 \u0442\u043e\u0433\u043e \u0436 \u0456\u043c\u0435\u043d\u0456 \u0434\u043b\u044f Production \u0456 Preview (\u0430\u0431\u043e \u00abAll Environments\u00bb), \u043f\u043e\u0442\u0456\u043c Redeploy \u2014 \u0431\u0435\u0437 \u0446\u044c\u043e\u0433\u043e \u043f\u0435\u0440\u0435\u0433\u043b\u044f\u0434\u0438 \u043d\u0430 preview-URL \u043d\u0435 \u043c\u0430\u044e\u0442\u044c \u043a\u043b\u044e\u0447\u0456\u0432 \u0443 \u0437\u0431\u0456\u0440\u0446\u0456.',
    backHome: '\u041d\u0430 \u0433\u043e\u043b\u043e\u0432\u043d\u0443',
    draftConflictTitle: 'Збережена чернетка попередньої вправи в браузері',
    draftConflictBody:
      'Ви відкриваєте вправу за посиланням, але в цьому браузері ще є автозбережена чернетка попередньої вправи. Щоб завантажити вправу з посилання, оберіть: зберегти чернетку файлом, відкинути її або скасувати відкриття.',
    draftSave:
      '\u0417\u0431\u0435\u0440\u0435\u0433\u0442\u0438 \u0444\u0430\u0439\u043b\u043e\u043c\u2026',
    draftDiscard: '\u0412\u0456\u0434\u043a\u0438\u043d\u0443\u0442\u0438 \u0447\u0435\u0440\u043d\u0435\u0442\u043a\u0443',
    draftCancel: '\u0421\u043a\u0430\u0441\u0443\u0432\u0430\u0442\u0438',
    publishButton: '\u041f\u043e\u0434\u0456\u043b\u0438\u0442\u0438\u0441\u044f\u2026',
    publishTitle: '\u041f\u043e\u0434\u0456\u043b\u0438\u0442\u0438\u0441\u044f \u043f\u043e\u0441\u0438\u043b\u0430\u043d\u043d\u044f\u043c',
    publishIntro:
      '\u041a\u043e\u0436\u043d\u0430 \u043f\u0443\u0431\u043b\u0456\u043a\u0430\u0446\u0456\u044f \u0441\u0442\u0432\u043e\u0440\u044e\u0454 \u043d\u043e\u0432\u0435 \u043f\u043e\u0441\u0438\u043b\u0430\u043d\u043d\u044f \u043d\u0430 \u0437\u043d\u0456\u043c\u043e\u043a \u0432\u043f\u0440\u0430\u0432\u0438 (\u0434\u0456\u044f 365 \u0434\u043d\u0456\u0432). \u0414\u043b\u044f \u043f\u0435\u0440\u0435\u0433\u043b\u044f\u0434\u0443 \u043c\u043e\u0436\u043d\u0430 \u043b\u0430\u043d\u0446\u044e\u0432\u0430\u0442\u0438 \u043b\u043e\u0433\u0456\u0447\u043d\u0443 \u0433\u0440\u0443\u043f\u0443: \u043d\u0430\u0441\u0442\u0443\u043f\u043d\u0456 view-\u043f\u0443\u0431\u043b\u0456\u043a\u0430\u0446\u0456\u0457 \u0434\u043e\u0442\u0440\u0438\u043c\u0443\u044e\u0442\u044c \u0442\u0443 \u0441\u0430\u043c\u0443 \u0433\u0440\u0443\u043f\u0443: \u043c\u0430\u0442\u0447\u0456 (\u041cVP) \u0437\u0440\u043e\u0437\u0443\u043c\u0456\u044e\u0442\u044c \u0441\u043f\u0456\u043b\u044c\u043d\u0456\u0442\u044c \u043d\u0430 \u043e\u0441\u0442\u0430\u043d\u043d\u044e \u0432\u0435\u0440\u0441\u0456\u044e.',
    publishConsentBefore: '\u041e\u0437\u043d\u0430\u0439\u043e\u043c\u043b\u0435\u043d\u0438\u0439(-\u0430) \u0437',
    publishConsentLinkText: '\u043f\u043e\u043b\u0456\u0442\u0438\u043a\u043e\u044e \u043f\u0443\u0431\u043b\u0456\u043a\u0430\u0446\u0456\u0457',
    publishConsentAfter: '.',
    publishContinueViewShareGroup:
      '\u041d\u0430\u0441\u0442\u0443\u043f\u043d\u0430 view-\u043f\u0443\u0431\u043b\u0456\u043a\u0430\u0446\u0456\u044f — \u0442\u0430 \u0441\u0430\u043c\u0430 \u043b\u043e\u0433\u0456\u0447\u043d\u0430 \u0432\u043f\u0440\u0430\u0432\u0430 (\u0434\u043b\u044f \u043f\u0440\u043e\u0433\u0440\u0430\u043c\u0438 \u043c\u0430\u0442\u0447\u0443: \xab\u041e\u043d\u043e\u0432\u0438\u0442\u0438 \u0434\u043e \u043e\u0441\u0442\u0430\u043d\u043d\u044c\u043e\u0433\u043e\xbb).',
    publishStartNewViewShareGroup: '\u041d\u043e\u0432\u0430 \u043b\u043e\u0433\u0456\u0447\u043d\u0430 \u0432\u043f\u0440\u0430\u0432\u0430 (\u0456\u043d\u0448\u0430 view-\u0433\u0440\u0443\u043f\u0430)',
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
    publishPolicyTitle: 'Політика публікації вправ за посиланням',
    publishPolicyParagraphs: [
      'Опублікована за посиланням вправа вважається доступною для будь-кого, хто має URL. Окремих приватних посилань з паролем у першій версії немає.',
      'Ви публікуєте контент (сцену, брифінг, описи) на власний розсуд. Уникайте зайвих персональних даних у тексті брифінгу та назвах, якщо не хочете їх розголошувати.',
      'Натискаючи «Отримати посилання» для перегляду або редактора, ви підтверджуєте, що ознайомлені з цією політикою та погоджуєтесь з умовами публікації.',
      'Якщо ви вважаєте, що за посиланням опубліковано неприйнятний або шкідливий контент, скористайтеся блоком «Зворотний зв’язок» у нижньому колонтитулі застосунку (Email та Telegram). У повідомленні вкажіть посилання на вправу та коротко опишіть проблему.',
      'Термін дії посилання та обмеження на кількість публікацій залежать від налаштувань сервісу. Самостійно прибрати публікацію з хмари в першій версії може бути недоступно; за вмотивованим зверненням через зворотний зв’язок оператор може видалити або обмежити доступ до матеріалу після перевірки.',
    ],
    openInEditor: '\u0412\u0456\u0434\u043a\u0440\u0438\u0442\u0438 \u0432 \u0440\u0435\u0434\u0430\u043a\u0442\u043e\u0440\u0456 (\u043d\u043e\u0432\u0430 \u0432\u043a\u043b\u0430\u0434\u043a\u0430)',
    viewModeHint:
      'Зараз увімкнено лише перегляд. Щоб змінювати вправу, відкрийте її в редакторі.',
    publishErrorHtmlResponse:
      '\u0421\u0435\u0440\u0432\u0435\u0440 \u043f\u043e\u0432\u0435\u0440\u043d\u0443\u0432 HTML \u0437\u0430\u043c\u0456\u0441\u0442\u044c JSON \u2014 \u043f\u0435\u0440\u0435\u0432\u0456\u0440\u0442\u0435 \u0434\u0435\u043f\u043b\u043e\u0439 /api/publish-share \u0442\u0430 \u0437\u043c\u0456\u043d\u043d\u0456 Vercel (SUPABASE_SERVICE_ROLE_KEY, URL).',
  },
  portal: {
    title: 'Shooters Tools',
    helmetTitle: 'Shooters Tools — IPSC / \u043f\u0440\u0430\u043a\u0442\u0438\u0447\u043d\u0430 \u0441\u0442\u0440\u0456\u043b\u044c\u0431\u0430',
    metaDescription:
      '\u0406\u043d\u0441\u0442\u0440\u0443\u043c\u0435\u043d\u0442\u0438 \u0434\u043b\u044f \u043f\u0440\u0430\u043a\u0442\u0438\u0447\u043d\u043e\u0457 \u0441\u0442\u0440\u0456\u043b\u044c\u0431\u0438 \u0442\u0430 IPSC: Stage Builder (\u043f\u043b\u0430\u043d, 3D, PDF\u2011\u0431\u0440\u0438\u0444\u0456\u043d\u0433, \u0435\u043a\u0441\u043f\u043e\u0440\u0442), RO Helper (\u0434\u043e\u0432\u0456\u0434\u043d\u0438\u043a \u043f\u0440\u0430\u0432\u0438\u043b).',
    lead: '\u0406\u043d\u0441\u0442\u0440\u0443\u043c\u0435\u043d\u0442\u0438 \u0434\u043b\u044f \u043f\u0440\u0430\u043a\u0442\u0438\u0447\u043d\u043e\u0457 \u0441\u0442\u0440\u0456\u043b\u044c\u0431\u0438 \u0442\u0430 IPSC. \u041d\u043e\u0432\u0456 \u043c\u043e\u0434\u0443\u043b\u0456 \u0434\u043e\u0434\u0430\u0432\u0430\u0442\u0438\u043c\u0443\u0442\u044c\u0441\u044f \u043f\u043e\u0441\u0442\u0443\u043f\u043e\u0432\u043e.',
    navStageBuilder: 'Stage Builder',
    navHitFactor: 'Hit Factor',
    navRoHelper: 'RO Helper',
    stageBuilderTitle: 'Stage Builder',
    stageBuilderDesc:
      '\u041f\u0435\u0440\u0435\u0442\u0432\u043e\u0440\u0456\u0442\u044c \u0456\u0434\u0435\u044e \u0432\u043f\u0440\u0430\u0432\u0438 \u043d\u0430 \u0434\u0435\u0442\u0430\u043b\u044c\u043d\u0438\u0439 3D\u2011\u043f\u0440\u043e\u0454\u043a\u0442 \u0437\u0430 \u043b\u0456\u0447\u0435\u043d\u0456 \u0445\u0432\u0438\u043b\u0438\u043d\u0438. \u0406\u043d\u0441\u0442\u0440\u0443\u043c\u0435\u043d\u0442 \u0434\u043e\u0437\u0432\u043e\u043b\u044f\u0454 \u043f\u043e\u0431\u0430\u0447\u0438\u0442\u0438 \u0440\u043e\u0437\u0441\u0442\u0430\u043d\u043e\u0432\u043a\u0443 \u043c\u0456\u0448\u0435\u043d\u0435\u0439 \u043e\u0447\u0438\u043c\u0430 \u0441\u0442\u0440\u0456\u043b\u044c\u0446\u044f \u0449\u0435 \u0434\u043e \u043f\u043e\u0447\u0430\u0442\u043a\u0443 \u043c\u043e\u043d\u0442\u0430\u0436\u0443. \u0412\u0438 \u043e\u0442\u0440\u0438\u043c\u0443\u0454\u0442\u0435 \u043d\u0435 \u043f\u0440\u043e\u0441\u0442\u043e \u043c\u0430\u043b\u044e\u043d\u043e\u043a, \u0430 \u043f\u043e\u0432\u043d\u0438\u0439 \u043f\u0430\u043a\u0435\u0442 \u0434\u043e\u043a\u0443\u043c\u0435\u043d\u0442\u0456\u0432 \u0434\u043b\u044f \u043c\u0430\u0442\u0447\u0443 \u2014 \u0432\u0456\u0434 \u043c\u0435\u0442\u0440\u0438\u0447\u043d\u043e\u0433\u043e \u043f\u043b\u0430\u043d\u0443 \u0437\u0456 \u0441\u0456\u0442\u043a\u043e\u044e \u0434\u043e \u0433\u043e\u0442\u043e\u0432\u043e\u0433\u043e PDF\u2011\u0431\u0440\u0438\u0444\u0456\u043d\u0433\u0443.',
    stageBuilderFeatures: [
      '\u0422\u043e\u0447\u043d\u0456\u0441\u0442\u044c: \u041c\u0435\u0442\u0440\u0438\u0447\u043d\u0438\u0439 \u043f\u043b\u0430\u043d \u0456\u0437 \u043b\u0456\u043d\u0456\u0439\u043a\u043e\u044e \u0434\u043b\u044f \u0456\u0434\u0435\u0430\u043b\u044c\u043d\u043e\u0433\u043e \u0440\u043e\u0437\u043c\u0456\u0449\u0435\u043d\u043d\u044f \u043e\u0431\u043b\u0430\u0434\u043d\u0430\u043d\u043d\u044f.',
      '\u041a\u043e\u043d\u0442\u0440\u043e\u043b\u044c: 3D\u2011\u0432\u0456\u0437\u0443\u0430\u043b\u0456\u0437\u0430\u0446\u0456\u044f \u0437\u043e\u043d\u0438 \u0441\u0442\u0440\u0456\u043b\u044c\u0446\u044f \u0434\u043b\u044f \u043f\u0435\u0440\u0435\u0432\u0456\u0440\u043a\u0438 \u0432\u0438\u0434\u0438\u043c\u043e\u0441\u0442\u0456 \u0442\u0430 \u0431\u0435\u0437\u043f\u0435\u043a\u0438.',
      '\u0413\u043e\u0442\u043e\u0432\u043d\u0456\u0441\u0442\u044c: \u0410\u0432\u0442\u043e\u043c\u0430\u0442\u0438\u0447\u043d\u0430 \u0433\u0435\u043d\u0435\u0440\u0430\u0446\u0456\u044f \u0431\u0440\u0438\u0444\u0456\u043d\u0433\u0456\u0432 \u0442\u0430 \u0435\u043a\u0441\u043f\u043e\u0440\u0442 \u043f\u043e\u0441\u0438\u043b\u0430\u043d\u043d\u044f \u0430\u0431\u043e \u0444\u0430\u0439\u043b\u0443 \u0432\u043f\u0440\u0430\u0432\u0438.',
    ],
    openStageBuilder: '\u0412\u0456\u0434\u043a\u0440\u0438\u0442\u0438 Stage Builder',
    hitFactorTitle: 'Hit Factor',
    hitFactorDesc:
      'Ваш персональний аналітик результативності безпосередньо на стрільбищі. Калькулятор не просто рахує бали, а наочно показує «ціну» кожного промаху чи додаткової секунди. Це допомагає миттєво зрозуміти, чи варто вам прискорюватися, чи краще сфокусуватися на чистоті стрільби.',
    hitFactorFeatures: [
      'Миттєвий розрахунок: Швидке отримання хіт-фактора для Major та Minor факторів потужності.',
      'Аналіз помилок: Чітка візуалізація того, скільки часу у вас «забирають» помилки.',
      'Розумні підказки: Автоматична рекомендація фокуса (швидкість vs точність) для покращення результату.',
    ],
    openHitFactor: '\u0412\u0456\u0434\u043a\u0440\u0438\u0442\u0438 Hit Factor',
    roHelperTitle: 'RO Helper',
    roHelperDesc:
      'Інтелектуальний довідник, який завжди під рукою у судді. Замість гортання сотень сторінок PDF, ви отримуєте структурований доступ до всіх процедур, пенальті та вимог до спорядження. Ідеальний інструмент для швидкого вирішення питань безпосередньо на стейджі.',
    roHelperFeatures: [
      'Швидка навігація: Зручний пошук за категоріями: безпека, процедури, спорядження.',
      'Ефективне суддівство: Чіткі алгоритми для нарахування пенальті та оцінки складних випадків.',
      'Зручне цитування: Можливість миттєво знайти та показати потрібне правило стрільцю.',
    ],
    openRoHelper: '\u0412\u0456\u0434\u043a\u0440\u0438\u0442\u0438 RO Helper',
    gridAriaLabel: '\u0414\u043e\u0441\u0442\u0443\u043f\u043d\u0456 \u0456\u043d\u0441\u0442\u0440\u0443\u043c\u0435\u043d\u0442\u0438',
    portalPublishedMatchesHeading: 'Перелік майбутніх подій',
    portalPublishedMatchesLead:
      'Майбутні опубліковані змагання; реєстрація — на картці матчу після входу. Повний огляд ваших заявок — в обліковому записі.',
    portalPublishedMatchesEmpty: 'Наразі немає запланованих опублікованих матчів з сьогоднішньої дати.',
    portalPublishedMatchesLoadError: 'Не вдалося завантажити список матчів',
    portalPublishedMatchOpenPrimary: 'Деталі',
    portalPublishedCardOrganizer: 'Організатор: {{name}}',
    portalPublishedCardCoverAlt: 'Обкладинка матчу',
    matchesPortalOrganizerLink: 'Кабінет організатора',
    matchesPortalFooterOrganizerViaAccount:
      'Заявка та статус організатора — в обліковому записі. Керування чернетками й заявками відкриється після схвалення платформи.',
    matchesPortalFooterOrganizerSignIn:
      'Увійдіть, щоб подати заявку організатора або працювати з матчами після її схвалення.',
    organizerMatchAccessDeniedPendingBody:
      'Ваш статус організатора ще не затверджений платформою — створити чи редагувати матчі тут не можна. Прогрес заявки дивіться в обліковому записі; після схвалення цей розділ стане активним.',
    organizerMatchAccessDeniedMissingBody:
      'Цей розділ лише для затверджених організаторів на платформі. Подати заявку або перевірити статус можна в обліковому записі.',
    organizerMatchAccessDeniedBlockedBody:
      'Доступ організатора для вашого акаунта припинено з боку платформи — керувати матчами тут недоступно.',
    organizerMatchAccessGoAccount: 'Обліковий запис',
    portalMatchesHubSearchAria: 'Пошук у списку матчів',
    portalMatchesHubSearchFieldLabel: 'Пошук',
    portalMatchesHubSearchPlaceholder: 'Назва або локація…',
    portalMatchesHubDateFrom: 'Від дати',
    portalMatchesHubDateTo: 'До дати',
    portalMatchesHubClearFilters: 'Скинути фільтри',
    portalMatchesHubCalendarPrevAria: 'Попередній місяць',
    portalMatchesHubCalendarNextAria: 'Наступний місяць',
    portalMatchesHubMonthJumpLabel: 'Місяць',
    portalMatchesHubCalendarAria: 'Календар днів із матчами',
    portalMatchesHubDayButtonAria: 'Фільтр списку за день {{date}}',
    portalMatchesHubNoMatchesFiltered:
      'За поточними умовами нічого не знайдено. Змініть пошук, діапазон дат, тип події, рівень, календар і спробуйте «Скинути фільтри».',
    portalMatchesHubFilterEventKind: 'Тип події',
    portalMatchesHubFilterEventKindAll: 'Усі типи',
    portalMatchesHubFilterPsLevel: 'Рівень PS',
    portalMatchesHubFilterPsLevelAll: 'Усі рівні',
    portalMatchesHubFilterWeaponType: 'Тип зброї',
    portalMatchesHubFilterWeaponTypePlaceholder: 'Незабаром',
    portalMatchesHubListDash: '—',
    badgeLive: '\u0414\u043e\u0441\u0442\u0443\u043f\u043d\u043e',
    badgeNew: '\u041d\u043e\u0432\u0435',
    badgeBeta: 'Beta',
    matchesPageHelmetTitle: 'Перелік майбутніх подій — Shooters Tools',
    matchesPageShortTitle: 'Матч',
    matchesSupabaseUnset:
      'Клієнт Supabase не налаштовано (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). Дані матчу в браузері недоступні.',
    matchesLoadError: 'Не вдалося завантажити дані',
    matchesLoadingDetail: 'Завантаження матчу…',
    matchDetailBackToList: 'До списку матчів',
    portalBreadcrumbAria: 'Шлях до сторінки',
    matchDetailNotFoundTitle: 'Матч не знайдено — Shooters Tools',
    matchDetailNotFoundBody:
      'Матч із таким ідентифікатором немає серед опублікованих або посилання некоректне.',
    matchDetailStartsLabel: 'Початок',
    matchDetailEventKindLabel: 'Тип події',
    matchDetailPsLevelLabel: 'Рівень (PractiScore)',
    matchDetailNotSpecifiedValue: 'не вказано',
    matchDetailLocationLabel: 'Локація',
    matchDetailDisciplineLabel: 'Дисципліна',
    matchDetailLimitLabel: 'Ліміт учасників',
    matchDetailPrematchLabel: 'Прематч',
    matchDetailPrematchValueYes: 'так — окремі скводи за день(-і) до основного матчу',
    matchDetailPrematchValueNo: 'ні',
    matchDetailProgrammeHeading: 'Програма (вправи)',
    matchDetailProgrammeViewLink: 'Схема / брифінг',
    matchDetailProgrammeFootnote:
      'Посилання ведуть на режим перегляду вправи в Stage Builder (знімок на момент публікації організатором).',
    matchDetailParticipantsHeading: 'Учасники',
    matchDetailParticipantsClosed:
      'Список зареєстрованих учасників для цього матчу закритий (налаштування організатора). Організатор може опублікувати його в редакторі матчу («Мої матчі») — параметр видимості списку учасників.',
    matchDetailParticipantsOpenEmpty:
      'Публічний список поки порожній (підтверджених заявок ще немає).',
    matchDetailParticipantsOpenAwaitingConfirmation:
      'У скводах уже є {{count}} активних записів (разом очікуючі та підтверджені), але нижній список поки порожній, бо ми показуємо лише підтверджених учасників. Підтвердь потрібні заявки в «Мої матчі» → «Заявки» — і вони з’являться в цьому блоці.',
    matchDetailParticipantsFootnote:
      'Показано лише підтверджені заявки; ім’я — з профілю учасника в порталі, якщо вказано.',
    matchDetailParticipantsColSquad: 'Сквод',
    matchDetailParticipantsColPhase: 'День',
    matchDetailParticipantsColName: 'Ім’я',
    matchDetailParticipantsColDivision: 'Дивізіон',
    matchDetailParticipantsColClass: 'Клас',
    matchDetailApplyMigrationHint:
      'Застосуй останні міграції Supabase з каталогу supabase/migrations (зокрема `20260504140000_public_match_registration_metrics.sql` та `20260505120000_match_prematch_squads.sql`).',
    matchDetailRegistrationHeading: 'Реєстрація',
    matchDetailRegistrationPrematchHeading: 'Прематч',
    matchDetailRegistrationMainHeading: 'Основний день матчу',
    matchDetailRegistrationPrematchEmpty: 'Скводи прематчу ще не додані організатором.',
    matchDetailRegistrationMainEmpty: 'Скводи основного дня ще не додані.',
    matchDetailRegistrationPhaseShortPrematch: 'Прематч',
    matchDetailRegistrationPhaseShortMain: 'Матч',
    matchDetailRegistrationNoSquads:
      'Для цього матчу ще не додані скводи. Поверніться пізніше або зв’яжіться з організатором.',
    matchDetailRegistrationColSquad: 'Сквод',
    matchDetailRegistrationColFree: 'Вільні місця',
    matchDetailRegistrationFull: 'Повний',
    matchDetailRegistrationMatchFull: 'Ліміт учасників матчу вже заповнений; нові заявки тимчасово недоступні.',
    matchDetailRegistrationSignInIntro: 'Увійдіть або створіть обліковий запис, щоб подати заявку на участь.',
    matchDetailRegistrationFieldSquad: 'Сквод',
    matchDetailRegistrationSelectSquad: 'Оберіть сквод',
    matchDetailRegistrationDivision: 'Дивізіон',
    matchDetailRegistrationClass: 'Клас',
    matchDetailRegistrationPFOptional: 'Power factor (необов’язково)',
    matchDetailRegistrationPFNone: '—',
    matchDetailRegistrationPFMajor: 'Major',
    matchDetailRegistrationPFMinor: 'Minor',
    matchDetailRegistrationSubmit: 'Подати заявку',
    matchDetailRegistrationSubmitting: 'Надсилання…',
    matchDetailRegistrationDonePending:
      'Заявку прийнято. Статус «очікує» — організатор підтвердить участь після перевірки оплати.',
    matchDetailRegistrationYourStatus: 'Ваша заявка',
    matchDetailRegistrationStatusPending: 'очікує підтвердження',
    matchDetailRegistrationStatusConfirmed: 'підтверджено',
    matchDetailRegistrationStatusCancelled: 'скасовано',
    matchDetailRegistrationCancel: 'Скасувати заявку',
    matchDetailRegistrationCancelling: 'Скасування…',
    matchDetailRegistrationPickOpenSquad: 'Оберіть сквод із вільними місцями.',
    matchDetailRegistrationErrorPrefix: 'Помилка',
    portalCompactAuthAria: 'Режим входу',
    portalCompactAuthSignIn: 'Вхід',
    portalCompactAuthSignUp: 'Реєстрація',
    portalCompactAuthEmail: 'Email',
    portalCompactAuthPassword: 'Пароль',
    portalCompactAuthPasswordHint: 'Щонайменше 8 символів. Довший пароль зазвичай надійніший; уникайте очевидних слів і повторів email.',
    portalCompactAuthPasswordTooShort: 'Пароль має містити щонайменше 8 символів.',
    portalCompactAuthShowPassword: 'Показати пароль',
    portalCompactAuthHidePassword: 'Приховати пароль',
    portalCompactAuthSubmitSignIn: 'Увійти',
    portalCompactAuthSubmitSignUp: 'Зареєструватися',
    portalCompactAuthSignOut: 'Вийти',
    portalCompactAuthSignupSession: 'Готово: ви ввійшли в обліковий запис.',
    portalCompactAuthSignupConfirm:
      'Обліковий запис створено. Якщо увімкнено підтвердження email — відкрийте лист і перейдіть за посиланням, потім увійдіть.',
    portalCompactAuthOtpSent:
      'Ми надіслали код на ваш email. Введіть усі цифри з листа нижче (перевірте папку «Спам»).',
    portalCompactAuthOtpLabel: 'Код з листа',
    portalCompactAuthOtpHint: '6–8 цифр, без пробілів (як у листі).',
    portalCompactAuthOtpLength: 'Введіть повний код: 6–8 цифр.',
    portalCompactAuthOtpSubmit: 'Підтвердити email',
    portalCompactAuthOtpInvalid: 'Код невірний або прострочений. Спробуйте ще раз або надішліть новий лист.',
    portalCompactAuthOtpResend: 'Надіслати код ще раз',
    portalCompactAuthOtpResendDone: 'Новий код надіслано на вашу адресу.',
    portalCompactAuthOtpChangeEmail: 'Змінити email / пароль',
    authEmailCallbackHelmet: 'Підтвердження email',
    authEmailCallbackLoading: 'Завершуємо вхід…',
    authEmailCallbackSuccessTitle: 'Email підтверджено',
    authEmailCallbackSuccessBody:
      'Обліковий запис активовано. Натисніть «Далі», щоб повернутися до сторінки, з якої реєструвалися, або перейдіть на головну порталу.',
    authEmailCallbackContinue: 'Далі',
    authEmailCallbackToHome: 'Головна порталу',
    authEmailCallbackFailedTitle: 'Не вдалося завершити перехід з листа',
    authEmailCallbackFailedBody:
      'Якщо в адресі ще з’являється сторінка з помилкою на сайті Supabase (наприклад, лінк прострочений) — поштовий клієнт міг відкрити посилання двічі, або термін дії коду вичерпано. Спробуйте увійти з паролем; за потреби зареєструйтеся знову.',
    authEmailCallbackAccountCta: 'Сторінка облікового запису',
    organizersAdminHelmetTitle: 'Організатори матчів — адмін порталу',
    organizersAdminTitle: 'Організатори матчів',
    organizersAdminIntro:
      'Лише для власника порталу. Заявки — рядки зі статусом «Новий» без створених матчів (фільтр «Заявки»). При «Заблокованому» можна лишити короткий коментар — автор побачить його в обліковому записі. «Активний» створює та змінює матчі.',
    organizersNeedSignIn: 'Увійдіть у Supabase Auth, щоб відкрити цю сторінку.',
    organizersForbidden: 'Немає прав власника порталу. Доступ налаштовується в таблиці portal_platform_admins.',
    organizersLoading: 'Завантаження…',
    organizersLoadError: 'Не вдалося завантажити список',
    organizersColEmail: 'Email',
    organizersColDisplayName: 'Ім’я в додатку',
    organizersColMatches: 'Матчів',
    organizersColStatus: 'Статус',
    organizersStatusPending: 'Новий',
    organizersStatusActive: 'Активний',
    organizersStatusBlocked: 'Заблокований',
    organizersSave: 'Зберегти',
    organizersSaving: 'Збереження…',
    organizersBackHome: 'На головну порталу',
    organizersFilterAll: 'Усі',
    organizersFilterApplications: 'Заявки (без матчів)',
    organizersFilterPendingAll: 'Усі «Нові»',
    organizersColBadge: 'Тип',
    organizersColContact: 'Контакт у заявці',
    organizersColPastMatches: 'Минулі матчі / посилання',
    organizersColModeration: 'Коментар / причина',
    organizersBadgeApplication: 'Заявка',
    organizersBadgePendingExtra: 'На розгляді (є матчі)',
    organizersModerationNoteLabel:
      'Коментар для автора заявки при статусі «Заблокований» (опційно; показується в обліковому записі).',
    organizersModerationNotePlaceholder:
      'Коротка причина або що змінити перед повторною спробою (до 600 символів)',
    organizersApplicationEmpty: '—',
    organizersModerationNoteTooLong: 'Коментар занадто довгий (макс. 600 символів)',
    accountHeaderAria: 'Обліковий запис порталу',
    accountHeaderChecking: 'Перевірка сесії…',
    accountHeaderSignIn: 'Увійти',
    accountHeaderProfile: 'Профіль',
    accountHeaderProfileIconAria: 'Обліковий запис. Залогінено як {{email}}',
    accountBadgeParticipant: 'Учасник',
    accountBadgeParticipantHint: 'Можете реєструватися на опубліковані матчі',
    accountBadgeOrganizerActive: 'Організатор',
    accountBadgeOrganizerBlocked: 'Організатор (обмежено)',
    accountBadgeOrganizerPending: 'Організатор — на розгляді',
    accountBadgeLoading: '…',
    accountPageHelmet: 'Обліковий запис — Shooters Tools',
    accountPageTitle: 'Обліковий запис',
    accountAuthHeading: 'Вхід',
    accountSummaryHeading: 'Поточний вхід',
    accountSummaryLogin: 'Логін:',
    accountShooterCabinetHeading: 'Кабінет стрільця',
    accountShooterCabinetLead:
      'Ви можете реєструватися на опубліковані матчі, коли знаєте посилання або анонс. Роль «Учасник» є для всіх, хто увійшов у портал.',
    accountShooterPortalLinkLabel: 'Головна порталу',
    accountShooterPortalLinkSuffix: ' — новини інструментів та перехід до Stage Builder тощо; пряме посилання на картку матчу організатор зазвичай надсилає окремо.',
    accountPageGoOrganizer: 'Мої матчі (організатор)',
    accountPageOrganizerExplain: 'керування чернетками, опублікованими матчами та заявками.',
    accountPageShooterSoon:
      'На сторінці «Матчі» — огляд запланованих опублікованих подій. Нижче — ваші заявки й типові поля форми для наступної реєстрації (їх також можна змінити на картці матчу).',
    accountOrganizerSectionHeading: 'Організатор матчів',
    accountOrganizerActiveLead: 'У вас є права створювати та вести матчі в цьому порталі.',
    accountOrganizerApplyTeaser:
      'Організаторську роль видає платформа після заявки. Якщо вам потрібен доступ до «Моїх матчів», розгорніть форму — для більшості стрільців цей блок можна просто проігнорувати.',
    accountOrganizerApplyToggleExpand: 'Подати заявку на організатора',
    accountOrganizerApplyToggleCollapse: 'Згорнути',
    accountOrganizerApplyHeading: 'Стати організатором матчів',
    accountOrganizerApplyIntro:
      'Подайте заявку: у профілі створюється статус «на розгляді». Контакт і посилання — опційно, допоможуть модератору швидше відповісти. Власник порталу затверджує доступ у розділі «Організатори матчів».',
    accountOrganizerApplyButton: 'Подати заявку',
    accountOrganizerApplySubmitting: 'Надсилання…',
    accountOrganizerApplyPendingTitle: 'Заява вже подана',
    accountOrganizerApplyPendingBody:
      'Статус «Новий» у модерації платформи. Після затвердження з’явиться доступ до створення матчів; ми надішлемо лише статус у цьому кабінеті (email-сповіщень може ще не бути).',
    accountOrganizerApplyBlockedBody:
      'Для вашого облікового запису призупинено статус організатора з боку платформи. Нову заявку подати не можна — зверніться до підтримки порталу.',
    accountOrganizerApplyErrorPrefix: 'Не вдалося подати заявку',
    accountOrganizerApplyDuplicateFriendly:
      'Профіль організатора для цього акаунта вже є в системі — можливо, заявку вже підано або платформа створила запис раніше. Якщо статус так і лишився лише учасника, перевірте сторінку пізніше або напишіть у підтримку.',
    accountOrganizerApplyValidationLength: 'Перевірте довжину полів: контакт до 280 символів, блок про матчі до 2000.',
    accountOrganizerModerationHeading: 'Повідомлення від платформи',
    accountOrganizerApplyContactLabel: 'Контакт (Telegram, телефон тощо) — опційно',
    accountOrganizerApplyContactPlaceholder: 'Наприклад @username або +380…',
    accountOrganizerApplyPastMatchesLabel: 'Посилання на минулі матчі / коментар — опційно',
    accountOrganizerApplyPastMatchesPlaceholder: 'Посилання на PSC, постер, сайт або короткий опис досвіду',
    accountMyRegistrationsHeading: 'Мої реєстрації на матчі',
    accountMyRegistrationsEmpty:
      'Немає заявок на матчі. Майбутні опубліковані події — у розділі «Матчі»; картку також можна відкрити за прямим посиланням від організатора.',
    accountMyRegistrationsLoadError: 'Не вдалося завантажити реєстрації',
    accountMyRegistrationsColMatch: 'Матч',
    accountMyRegistrationsColDate: 'Початок',
    accountMyRegistrationsColStatus: 'Заявка',
    accountMyRegistrationsColActions: 'Дії',
    accountMyRegistrationsStatusPending: 'очікує підтвердження',
    accountMyRegistrationsStatusConfirmed: 'підтверджено',
    accountMyRegistrationsStatusCancelled: 'скасовано',
    accountMyRegistrationsOpenMatch: 'Картка',
    accountMyRegistrationsCancel: 'Скасувати заявку',
    accountMyRegistrationsCancelling: 'Скасування…',
    accountMyRegistrationsMatchUnavailable: '(картка недоступна)',
    accountParticipantDefaultsHeading: 'Профіль стрільця (PractiScore)',
    accountParticipantDefaultsLead:
      'Ці поля підставляються у форму реєстрації на картці матчу (можна змінити перед відправкою).',
    accountParticipantProfileSectionLead:
      'Типові поля для нових заявок і подальшого експорту: регіон, категорія (кілька — через кому), клас зброї, дивізіон, класифікація, фактор потужності.',
    accountParticipantFieldRegion: 'Регіон / область',
    accountParticipantFieldRegionPlaceholder: 'Наприклад: UA або область',
    accountParticipantFieldCategory: 'Категорія',
    accountParticipantFieldCategoryPlaceholder: 'Lady, Junior…',
    accountParticipantFieldCategoryHint: 'Кілька значень — через кому, як у PractiScore.',
    accountParticipantFieldWeaponClass: 'Клас зброї',
    accountParticipantFieldWeaponPlaceholder: 'Наприклад: Shotgun',
    accountParticipantMatchPortalOffHint:
      'Модуль «Матчі» у цьому середовищі вимкнено — список заявок приховано. Профіль нижче зберігається для інших середовищ і майбутнього експорту.',
    accountParticipantDefaultsSave: 'Зберегти',
    accountParticipantDefaultsSaving: 'Збереження…',
    accountParticipantDefaultsSaved: 'Збережено.',
    portalShellMenuOpenAria: 'Відкрити меню навігації',
    portalShellMenuCloseAria: 'Закрити меню навігації',
    portalShellNavDrawerAria: 'Навігація й обліковий запис',
    navMatches: 'Матчі',
    myMatchesTitle: 'Мої матчі',
    myMatchesHelmet: 'Мої матчі — Shooters Tools',
    myMatchesCreate: 'Створити матч',
    myMatchesColTitle: 'Назва',
    myMatchesColStarts: 'Початок',
    myMatchesColEventKind: 'Тип',
    myMatchesColPsLevel: 'Рівень',
    myMatchesColStatus: 'Статус',
    myMatchesColList: 'Список учасників',
    myMatchesRoster: 'Заявки',
    myMatchesEdit: 'Редагувати',
    myMatchesViewPublic: 'Картка',
    myMatchesNeedSignIn: 'Увійди, щоб керувати своїми матчами.',
    myMatchesDevSignInHint: 'Тест входу (dev)',
    myMatchesLoading: 'Завантаження…',
    myMatchesLoadError: 'Помилка',
    myMatchesEmpty: 'Ще немає матчів. Створи перший.',
      myMatchesBackHome: 'На головну порталу',
      myMatchesManage: 'Керувати',
      myMatchesQuickLinksAria: 'Додаткові дії для цього матчу',
    matchOrgStatusDraft: 'Чернетка',
    matchOrgStatusPublished: 'Опубліковано',
    matchOrgStatusCancelled: 'Скасовано',
    matchOrgStatusCompleted: 'Завершено',
    matchOrgParticipantsOpenShort: 'Відкритий',
    matchOrgParticipantsClosedShort: 'Закритий',
    matchOrgCreateTitle: 'Новий матч',
    matchOrgEditTitle: 'Редагування матчу',
    matchOrgCreateHelmet: 'Новий матч — Shooters Tools',
    matchOrgEditHelmetEdit: 'Редагування матчу — Shooters Tools',
    matchOrgEditHelmetLoading: 'Матч — завантаження',
    matchOrgSave: 'Зберегти',
    matchOrgSaveSaving: 'Збереження…',
    matchOrgBackList: 'До списку матчів',
    matchOrgFieldTitle: 'Назва',
    matchOrgFieldStarts: 'Початок (локальний час браузера)',
    matchOrgFieldLocation: 'Локація (текст)',
    matchOrgFieldCoverImage: 'Обкладинка (для переліку матчів)',
    matchOrgCoverUpload: 'Завантажити зображення',
    matchOrgCoverRemove: 'Прибрати',
    matchOrgCoverHintNew: 'Після збереження матчу тут можна додати зображення для картки в переліку подій.',
    matchOrgCoverErrType: 'Дозволені лише JPEG, PNG або WebP.',
    matchOrgCoverErrSize: 'Файл завеликий (макс. 5 МБ).',
    matchOrgCoverUploading: 'Завантаження…',
    matchOrgFieldEventKind: 'Тип події',
    matchOrgFieldPsLevel: 'Рівень матчу (PractiScore)',
    matchOrgTaxonomyOptionalLead:
      'Необов’язково: обидва поля нижче можна лишити порожніми (на картці матчу тоді буде «не вказано»).',
    matchOrgEventKindHint:
      'Для каталогу та картки на сайті: тренування, змагання чи класифікаційний етап. Не замінює поле «Назва».',
    matchOrgPsLevelHint:
      'Офіційна шкала PractiScore (Level I–V). У експорті .psc — поле match_level; якщо не обрано, ключ у файл не додається.',
    matchOrgEventKindUnset: '— не обрано —',
    matchEventKindTraining: 'Тренування',
    matchEventKindMatch: 'Матч',
    matchEventKindClassification: 'Класифікація',
    matchOrgPsLevelUnset: '— не обрано —',
    matchPsLevelL1: 'Рівень I',
    matchPsLevelL2: 'Рівень II',
    matchPsLevelL3: 'Рівень III',
    matchPsLevelL4: 'Рівень IV',
    matchPsLevelL5: 'Рівень V',
    matchOrgDerivedCapacityLine: 'Разом місце на матчі (розраховано автоматично й зберігається як ліміт учасників): {{total}}.',
    matchOrgFieldShootersMain: 'Стрільці в скводі — основний день',
    matchOrgFieldShootersPrematch: 'Стрільці в скводі — прематч',
    matchOrgFieldDescription: 'Опис (Markdown)',
    matchOrgFieldStatus: 'Статус матчу',
    matchOrgFieldParticipantList: 'Список учасників на картці',
    matchOrgParticipantsListOpen: 'Відкритий (лише підтверджені)',
    matchOrgParticipantsListClosed: 'Закритий',
    matchOrgParticipantListFootnote:
      'На публічній картці в блоці «Учасники» відображаються лише ті заявки, які мають статус «підтверджено». «Очікує підтвердження» залишається тільки в твоєму списку заявок організатора.',
    matchOrgRegistrationsSummary:
      'Заявки цього матчу (організатор): {{confirmed}} підтверджено · {{pending}} очікує підтвердження. Публічна таблиця учасників показує лише підтверджених.',
    matchOrgRegistrationsNoneYet: 'Заявок на цей матч поки немає.',
    matchOrgDisciplineShotgunNote: 'Дисципліна MVP: shotgun (налаштовується лише на рівні коду БД).',
    matchOrgExportPsc: 'Завантажити .psc (PractiScore)',
    matchOrgExportPscBusy: 'Готуємо файл…',
    matchOrgExportPscHint:
      'Локально з `SUPABASE_SERVICE_ROLE_KEY` у `.env`/`.env.local` експорт працює і в звичайному `npm run dev`; інакше — `npm run dev:vercel`. На проді або preview віддає Vercel (`/api/match-export-psc`).',
    matchOrgExportPscErrGeneric: 'Не вдалося зібрати експорт. Спробуй ще раз або перевір консоль.',
    matchOrgExportPscErrNetwork:
      'Немає відповіді від сервера експорту. Локально: перевір ключ у `.env` і `npm run dev`, або `npm run dev:vercel`; на хмарі — деплой (див. підказку).',
    matchOrgExportPscErrNoStages: 'Додай хоча б одну вправу (посилання share) перед експортом.',
    matchOrgExportPscErrSession: 'Увійди в обліковий запис і онови сторінку.',
    matchOrgFieldPrematch: 'Прематч (стрільба суддів та організаційних стрільців напередодні)',
    matchOrgFieldPlannedMainSquads: 'Запланована кількість скводів — основний день',
    matchOrgFieldPlannedPrematchSquads: 'Запланована кількість скводів — прематч',
    matchOrgPlannedMainInvalid: 'Число скводів на основний день має бути цілим числом ≥ 1.',
    matchOrgPlannedPrematchInvalid: 'З увімкненим прематчем потрібно ціле число скводів для прематчу ≥ 1.',
    matchOrgEditBadId: 'Некоректне посилання для редагування.',
    matchOrgEditNotFound: 'Матч не знайдено або він не належить до твого облікового запису.',
    matchOrgTitleRequired: 'Заповни назву.',
    matchOrgShootersInvalid: 'Кількість стрільців у скводі має бути цілим числом ≥ 1.',
    matchOrgStagesHeading: 'Вправи програми',
    matchOrgStagesIntro:
      'Створи сцену в Stage Builder. Назва в програмі береться з поля заголовку брифінгу («Заголовок документа» — як для PDF); якщо його порожньо — з назви впра ви на плані. Знімок із share фіксує текст на момент публікації або «Оновити до останньої».',
    matchOrgStagesOpenEditor: 'Відкрити Stage Builder (нова вкладка)',
    matchOrgStagesPasteLabel: 'Посилання перегляду або id',
    matchOrgStagesPastePlaceholder: 'https://…/v/s… або s…',
    matchOrgStagesAdd: 'Додати до матчу',
    matchOrgStagesAdding: 'Додавання…',
    matchOrgStagesEmpty: 'Ще немає прив’язаних вправ — додай перше посилання перегляду.',
    matchOrgStagesColTitle: 'Назва',
    matchOrgStagesColShareId: 'Share',
    matchOrgStagesColActions: 'Дії',
    matchOrgStagesViewLink: 'Відкрити',
    matchOrgStagesMoveUp: 'Вгору',
    matchOrgStagesMoveDown: 'Вниз',
    matchOrgStagesRemove: 'Прибрати',
    matchOrgStagesRefreshLatest: 'Оновити до останньої',
    matchOrgStagesRefreshing: 'Оновлення…',
    matchOrgStagesRefreshAll: 'Оновити всі вправи до останніх',
    matchOrgStagesRefreshAllBusy: 'Оновлення всіх вправ…',
    matchOrgStagesErrorGeneric: 'Операцію не виконано. Перезавантаж сторінку або перевір міграції.',
    matchOrgStagesInvalidPaste: 'Не вдалося розпізнати id посилання для перегляду. Очікується URL з /v/… або короткий id типу s…',
    matchOrgStagesNotFound: 'Вправу не знайдено або термін посилання минув.',
    matchOrgStagesNotViewMode:
      'Прив’язуємо лише посилання перегляду (view). Скористайся view-публікацією з редактора; edit-посилання сюди не підходять.',
    matchOrgStagesDuplicate: 'Цей share вже є в списку програми.',
    matchOrgStagesErrNoShareGroup:
      'Немає логічної групи версій (share_group_id). Додай вправу знову або накоти міграцію та оновлення publish API.',
    matchOrgStagesErrNoLatestShare:
      'Не знайдено актуального view для цієї групи — перевір прострочення посилань або що знов опубліковано view із тим самим shareGroupId.',
    matchOrgSquadsHeading: 'Скводи',
    matchOrgSquadsDerivedIntro:
      'Таблиця скводів формується з налаштувань матчу: кількість скводів × стрільців у скводі (окремо для основного дня та прематчу). Збережи картку — рядки оновлються; зменшення можливе лише якщо на скводі немає активних заявок.',
    matchOrgSquadsDerivedCapacityLine:
      '{{mainSq}}×{{mainShoot}}{{prematchPart}} = {{planned}} місць (ціль).',
    matchOrgSquadSyncBanner: 'Не вдалося оновити таблицю скводів: {{detail}}',
    matchOrgSquadSyncBannerDismiss: 'Зрозуміло',
    matchOrgSyncErrPrematchRemove:
      'Не можна прибрати скводи прематчу, доки є очікуючі чи підтверджені заявки. Спочатку перерозподіль стрільців на сторінці заявок.',
    matchOrgSyncErrLowerCapacity:
      'Не можна зменшити кількість місць у скводі нижче вже зарахованої кількості стрільців. Спочатку перемісти або скасуй зайві заявки.',
    matchOrgSyncErrReduceSquads:
      'Не можна зменшити кількість скводів, доки один із скводів, які треба прибрати, має заявки. Спочатку перерозподіль або скасуй.',
    matchOrgSyncErrOrganizerInactive: 'Обліковий запис організатора не активний — звернися до куратора платформи.',
    matchOrgSyncErrGeneric: 'Не вдалося синхронізувати скводи.',
    matchOrgSquadsColPhase: 'День',
    matchOrgSquadsPhaseMain: 'Основний',
    matchOrgSquadsPhasePrematch: 'Прематч',
    matchOrgSquadsPlannedMainLine: 'Основний день: {{current}} / {{planned}} скводів (ціль).',
    matchOrgSquadsPlannedPrematchLine: 'Прематч: {{current}} / {{planned}} скводів (ціль).',
    matchOrgRosterManageLink: 'Керувати заявками та скводами',
    matchOrgRosterHelmet: 'Заявки на матч',
    matchOrgRosterHeading: 'Заявки',
    matchOrgRosterLead:
      'Перерозподіляй стрільців по скводах після зміни сітки місткості. Для активних скводів у списку лише скводи з вільним місцем.',
    matchOrgRosterEditMatch: 'Назад до картки матчу',
    matchOrgRosterEmpty: 'Заявок ще немає.',
    matchOrgRosterColName: 'Учасник',
    matchOrgRosterColDivision: 'Дивізіон',
    matchOrgRosterColStatus: 'Статус',
    matchOrgRosterColSquad: 'Сквод',
    matchOrgRosterApply: 'Застосувати',
    matchOrgRosterSaving: 'Збереження…',
    matchOrgRosterConfirm: 'Підтвердити участь',
    matchOrgRosterColActions: 'Дії',
    matchOrgRosterNoFreeSlot: 'Немає доступного скводу з місцем або зміни потребують збереження картки.',
    matchOrgRosterViewTable: 'Таблиця',
    matchOrgRosterViewBoard: 'Дошка скводів',
    matchOrgRosterBoardHint:
      'Тягни картку стрільця в інший сквод — зміна зберігається одразу. У сквод є місце, якщо зайнято менше місткості.',
    matchOrgRosterBoardSquadFull: 'У цьому скводі немає вільного місця для цієї заявки.',
    matchOrgRosterBoardEmptyColumn: 'Немає активних заявок',
    matchOrgRosterInactiveHeading: 'Неактивні заявки (не на дошці)',
    matchOrgSquadsColLabel: 'Назва',
    matchOrgSquadsColCapacity: 'Місць',
    matchOrgSquadsColTaken: 'Зайнято',
    matchOrgSquadsAutoEmpty:
      'Після збереження картки тут з’являться скводи. Якщо рядків немає — збережи форму ще раз або перевір міграції БД.',
  },
  hitFactor: {
    pageTitle: 'Hit Factor \u2014 \u0446\u0456\u043d\u0430 \u043f\u043e\u043c\u0438\u043b\u043a\u0438',
    pageLead:
      '\u0428\u0432\u0438\u0434\u043a\u0438\u0439 \u0430\u043d\u0430\u043b\u0456\u0437 \u0432\u043f\u0440\u0430\u0432\u0438: \u043c\u0430\u043a\u0441\u0438\u043c\u0430\u043b\u044c\u043d\u0438\u0439 HF, \u0444\u0430\u043a\u0442\u0438\u0447\u043d\u0438\u0439 HF \u0442\u0430 \u00ab\u0432\u0430\u0440\u0442\u0456\u0441\u0442\u044c\u00bb \u043f\u043e\u043c\u0438\u043b\u043e\u043a \u0443 \u0441\u0435\u043a\u0443\u043d\u0434\u0430\u0445.',
    requiredHitsLabel: '\u0417\u0430\u043b\u0456\u043a\u043e\u0432\u0456 \u0432\u043b\u0443\u0447\u0430\u043d\u043d\u044f',
    timeLabel: '\u0427\u0430\u0441 (\u0441\u0435\u043a)',
    powerFactorLabel: '\u0424\u0430\u043a\u0442\u043e\u0440 (PF)',
    powerFactorMinor: 'Minor',
    powerFactorMajor: 'Major',
    modelNoteLabel: '\u041d\u043e\u0442\u0430\u0442\u043a\u0430',
    modelNote:
      '\u0426\u0435 \u0442\u0440\u0435\u043d\u0443\u0432\u0430\u043b\u044c\u043d\u0430 \u043c\u043e\u0434\u0435\u043b\u044c \u0434\u043b\u044f \u0448\u0432\u0438\u0434\u043a\u043e\u0433\u043e \u201cwhat\u2011if\u201d. \u041e\u0444\u0456\u0446\u0456\u0439\u043d\u0438\u0439 \u0441\u043a\u043e\u0440\u0438\u043d\u0433 \u0437\u0430\u043b\u0435\u0436\u0438\u0442\u044c \u0432\u0456\u0434 \u043c\u0430\u0442\u0447\u0435\u0432\u0438\u0445 \u0443\u043c\u043e\u0432 \u0456 \u0444\u0430\u043a\u0442\u0438\u0447\u043d\u0438\u0445 \u043f\u043e\u043f\u0430\u0434\u0430\u043d\u044c.',
    deviationsTitle: '\u0412\u0456\u0434\u0445\u0438\u043b\u0435\u043d\u043d\u044f \u0432\u0456\u0434 \u201cAll Alpha\u201d',
    deviationsLead: '\u0412\u043a\u0430\u0436\u0456\u0442\u044c, \u0449\u043e \u201c\u0437\u02bc\u0457\u043b\u043e\u201d \u043e\u0447\u043a\u0438 \u0443 \u0432\u0430\u0448\u043e\u043c\u0443 \u0440\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442\u0456.',
    deviationsExpandCta: '\u0420\u043e\u0437\u0433\u043e\u0440\u043d\u0443\u0442\u0438',
    deviationsCollapseCta: '\u0417\u0433\u043e\u0440\u043d\u0443\u0442\u0438',
    charlieLabel: 'Charlie',
    deltaLabel: 'Delta',
    missLabel: 'Miss',
    proceduralLabel: 'Procedural',
    noShootLabel: 'No\u2011Shoot',
    hfActualLabel: '\u0424\u0430\u043a\u0442 HF',
    hfMaxLabel: '\u041c\u0430\u043a\u0441 HF',
    maxPointsLabel: 'Max points',
    actualPointsLabel: '\u0424\u0430\u043a\u0442\u0438\u0447\u043d\u0456 points',
    hfLossLabel: '\u0412\u0442\u0440\u0430\u0442\u0430',
    impactTitle: '\u0426\u0456\u043d\u0430 \u043f\u043e\u043c\u0438\u043b\u043a\u0438 (\u0435\u043a\u0432\u0456\u0432\u0430\u043b\u0435\u043d\u0442 \u0447\u0430\u0441\u0443)',
    impactLead:
      '\u0421\u043a\u0456\u043b\u044c\u043a\u0438 \u0441\u0435\u043a\u0443\u043d\u0434 \u0442\u0440\u0435\u0431\u0430 \u201c\u0432\u0438\u0433\u0440\u0430\u0442\u0438\u201d, \u0449\u043e\u0431 \u043a\u043e\u043c\u043f\u0435\u043d\u0441\u0443\u0432\u0430\u0442\u0438 \u043e\u0434\u043d\u0443 \u043f\u043e\u043c\u0438\u043b\u043a\u0443 \u043f\u0440\u0438 \u043f\u043e\u0442\u043e\u0447\u043d\u043e\u043c\u0443 \u0442\u0435\u043c\u043f\u0456.',
    plusOneSecondLabel: '+1 \u0441\u0435\u043a\u0443\u043d\u0434\u0430',
    minusOneSecondLabel: '\u22121 \u0441\u0435\u043a\u0443\u043d\u0434\u0430',
    secondsUnit: '\u0441\u0435\u043a',
    focusTitle: '\u0420\u0435\u043a\u043e\u043c\u0435\u043d\u0434\u0430\u0446\u0456\u044f',
    focusAccuracyTitle: '\u0424\u043e\u043a\u0443\u0441 \u2014 \u0442\u043e\u0447\u043d\u0456\u0441\u0442\u044c',
    focusAccuracyText:
      '\u0412\u0442\u0440\u0430\u0442\u0430 \u043f\u043e \u043e\u0447\u043a\u0430\u0445 \u0432\u0436\u0435 \u0441\u0443\u0442\u0442\u0454\u0432\u0430 (\u2248{{loss}}% HF). \u0424\u043e\u043a\u0443\u0441: \u043f\u0440\u0438\u0431\u0440\u0430\u0442\u0438 \u0448\u0442\u0440\u0430\u0444\u0438/\u043d\u043e\u0443\u0448\u0443\u0442\u0438 \u0456 \u0437\u0431\u0435\u0440\u0435\u0433\u0442\u0438 \u0447\u0438\u0441\u0442\u0456 \u043e\u0447\u043a\u0438.',
    focusSpeedTitle: '\u0424\u043e\u043a\u0443\u0441 \u2014 \u0448\u0432\u0438\u0434\u043a\u0456\u0441\u0442\u044c',
    focusSpeedText:
      '\u041d\u0430 \u0446\u044c\u043e\u043c\u0443 \u0442\u0435\u043c\u043f\u0456 +{{step}} \u0441\u0435\u043a \u0434\u043e \u0447\u0430\u0441\u0443 \u0437\u0430\u0431\u0438\u0440\u0430\u0454 \u043f\u0440\u0438\u0431\u043b\u0438\u0437\u043d\u043e {{pct}}% HF. \u042f\u043a\u0449\u043e \u043e\u0447\u043a\u0438 \u0447\u0438\u0441\u0442\u0456 \u2014 \u043c\u043e\u0436\u043d\u0430 \u0434\u043e\u0434\u0430\u0432\u0430\u0442\u0438 \u0448\u0432\u0438\u0434\u043a\u043e\u0441\u0442\u0456.',
    focusBalancedTitle: '\u0424\u043e\u043a\u0443\u0441 \u2014 \u0431\u0430\u043b\u0430\u043d\u0441',
    focusBalancedText:
      '\u041f\u043e\u0442\u043e\u0447\u043d\u0438\u0439 \u0442\u0435\u043c\u043f \u0437\u0431\u0430\u043b\u0430\u043d\u0441\u043e\u0432\u0430\u043d\u0438\u0439. \u0422\u0440\u0438\u043c\u0430\u0439 \u043a\u043e\u043d\u0442\u0440\u043e\u043b\u044c \u0456 \u0443\u043d\u0438\u043a\u0430\u0439 \u043f\u0440\u043e\u043c\u0430\u0445\u0456\u0432.',
    focusMakeupsTitle: '\u0424\u043e\u043a\u0443\u0441 \u2014 \u0434\u043e\u0441\u0442\u0440\u0456\u043b\u0438',
    focusMakeupsText:
      '\u0414\u043e\u0441\u0442\u0440\u0456\u043b\u0438 \u0434\u043e\u0434\u0430\u044e\u0442\u044c \u0431\u043b\u0438\u0437\u044c\u043a\u043e \u2248{{time}}% \u0434\u043e \u0431\u0430\u0437\u043e\u0432\u043e\u0433\u043e \u0447\u0430\u0441\u0443. \u041a\u0440\u0430\u0449\u0435 \u0442\u0440\u043e\u0445\u0438 \u043f\u0440\u0438\u0433\u0430\u043b\u044c\u043c\u0443\u0432\u0430\u0442\u0438, \u0449\u043e\u0431 \u0437\u043c\u0435\u043d\u0448\u0438\u0442\u0438 \u0457\u0445 \u043a\u0456\u043b\u044c\u043a\u0456\u0441\u0442\u044c.',
    weaponClassLabel: '\u041a\u043b\u0430\u0441 \u0437\u0431\u0440\u043e\u0457',
    weaponClassPistol: '\u041f\u0456\u0441\u0442\u043e\u043b\u0435\u0442',
    weaponClassRifle: '\u041a\u0430\u0440\u0430\u0431\u0456\u043d',
    weaponClassPcc: '\u041a\u041f\u041a (PCC)',
    weaponClassShotgun: '\u0420\u0443\u0448\u043d\u0438\u0446\u044f',
    makeupShotLabel: '\u0414\u043e\u0441\u0442\u0440\u0456\u043b (\u0447\u0430\u0441)',
    makeupShotCountLabel: '\u0414\u043e\u0441\u0442\u0440\u0456\u043b\u0438',
    makeupShotSplitLabel: '\u0427\u0430\u0441 \u043e\u0434\u043d\u043e\u0433\u043e \u0434\u043e\u0441\u0442\u0440\u0456\u043b\u0443',
    reset: '\u0421\u043a\u0438\u043d\u0443\u0442\u0438',
  },
  roHelper: {
    moduleTitle: 'RO Helper',
    navPortal: '\u041f\u043e\u0440\u0442\u0430\u043b',
    lead: '\u0414\u043e\u0432\u0456\u0434\u043d\u0438\u043a \u0434\u043b\u044f \u0441\u0443\u0434\u0434\u0456\u0432 \u0442\u0430 \u0441\u043f\u043e\u0440\u0442\u0441\u043c\u0435\u043d\u0456\u0432. \u0422\u0435\u043a\u0441\u0442\u0438 \u2014 \u0447\u0435\u0440\u043d\u0435\u0442\u043a\u0438; \u043e\u0444\u0456\u0446\u0456\u0439\u043d\u043e \u0437\u0430\u0442\u0432\u0435\u0440\u0434\u0436\u0443\u0439\u0442\u0435 \u0437 PDF \u0432\u0430\u0448\u043e\u0457 \u0434\u0438\u0441\u0446\u0438\u043f\u043b\u0456\u043d\u0438.',
    disciplineTitle: '\u041e\u0431\u0435\u0440\u0456\u0442\u044c \u0434\u0438\u0441\u0446\u0438\u043f\u043b\u0456\u043d\u0443',
    disciplineLead:
      '\u041f\u043e\u0447\u043d\u0456\u0442\u044c \u0437 \u0432\u0438\u0434\u0443 \u0437\u0431\u0440\u043e\u0457 \u2014 \u0432\u0441\u0435\u0440\u0435\u0434\u0438\u043d\u0456 \u0437\u043d\u0430\u0439\u0434\u0435\u0442\u0435 \u043a\u0430\u0440\u0442\u043a\u0438 \u043f\u0440\u0430\u0432\u0438\u043b \u0437\u0430 \u043a\u0430\u0442\u0435\u0433\u043e\u0440\u0456\u044f\u043c\u0438 (Safety, Penalties, Scoring, Equipment, Match admin).',
    disciplineCardSubtitle: '5 \u043a\u0430\u0442\u0435\u0433\u043e\u0440\u0456\u0439 \u043f\u0440\u0430\u0432\u0438\u043b',
    categoryTitle: '\u041a\u0430\u0442\u0435\u0433\u043e\u0440\u0456\u044f',
    articlesEmpty: '\u0421\u0442\u0430\u0442\u0435\u0439 \u043d\u0435 \u0437\u043d\u0430\u0439\u0434\u0435\u043d\u043e.',
    articleNotFound: '\u0421\u0442\u0430\u0442\u0442\u044e \u043d\u0435 \u0437\u043d\u0430\u0439\u0434\u0435\u043d\u043e \u0434\u043b\u044f \u043e\u0431\u0440\u0430\u043d\u043e\u0457 \u043c\u043e\u0432\u0438.',
    invalidPath: '\u041d\u0435\u0432\u0456\u0434\u043e\u043c\u0438\u0439 \u0448\u043b\u044f\u0445.',
    loading: '\u0417\u0430\u0432\u0430\u043d\u0442\u0430\u0436\u0435\u043d\u043d\u044f\u2026',
    fpsuLayerLabel: '\u0428\u0430\u0440 \u00ab\u041b\u043e\u043a\u0430\u043b\u044c\u043d\u043e (\u0424\u041f\u0421\u0423)\u00bb \u0443 \u0441\u0442\u0430\u0442\u0442\u044f\u0445',
    fpsuLayerHint:
      '\u041d\u0435\u0437\u0430\u043b\u0435\u0436\u043d\u043e \u0432\u0456\u0434 \u043c\u043e\u0432\u0438 \u0456\u043d\u0442\u0435\u0440\u0444\u0435\u0439\u0441\u0443 (\u0434\u0438\u0432. RO_HELPER_V0 \u00a75.1).',
    disclaimerTitle: '\u0412\u0430\u0436\u043b\u0438\u0432\u043e',
    disclaimerBody:
      'RO Helper / Shooters Tools \u043d\u0435 \u0437\u0430\u043c\u0456\u043d\u044e\u0454 \u043e\u0444\u0456\u0446\u0456\u0439\u043d\u0456 \u043f\u0440\u0430\u0432\u0438\u043b\u0430 IPSC \u0447\u0438 \u0440\u0456\u0448\u0435\u043d\u043d\u044f Range Master. \u041f\u0435\u0440\u0435\u0432\u0456\u0440\u044f\u0439\u0442\u0435 \u043f\u0443\u043d\u043a\u0442\u0438 \u0437\u0430 PDF \u0432\u0430\u0448\u043e\u0457 \u0434\u0438\u0441\u0446\u0438\u043f\u043b\u0456\u043d\u0438.',
    breadcrumbRo: 'RO Helper',
    discHandgun: 'Handgun',
    discPcc: 'PCC',
    discRifle: 'Rifle',
    discMiniRifle: 'Mini rifle',
    discShotgun: 'Shotgun',
    catSafety: 'Safety / DQ',
    catPenalties: 'Penalties',
    catScoring: 'Scoring',
    catEquipment: 'Equipment',
    catMatchAdmin: 'Match admin',
    catSafetyDesc: '\u0411\u0435\u0437\u043f\u0435\u043a\u0430 \u043d\u0430 \u0441\u0442\u0435\u0439\u0434\u0436\u0456, DQ, \u043f\u043e\u043f\u0435\u0440\u0435\u0434\u0436\u0435\u043d\u043d\u044f',
    catPenaltiesDesc: '\u0428\u0442\u0440\u0430\u0444\u0438, \u043f\u0440\u043e\u0446\u0435\u0434\u0443\u0440\u0438, \u0441\u043f\u0456\u0440\u043d\u0456 \u0432\u0438\u043f\u0430\u0434\u043a\u0438',
    catScoringDesc: '\u0417\u0430\u043b\u0456\u043a, \u043c\u0456\u0448\u0435\u043d\u0456, hits/misses',
    catEquipmentDesc: '\u0414\u0438\u0432\u0456\u0437\u0456\u043e\u043d\u0438, \u0432\u0438\u043c\u043e\u0433\u0438 \u0434\u043e \u043e\u0431\u043b\u0430\u0434\u043d\u0430\u043d\u043d\u044f',
    catMatchAdminDesc: '\u0410\u0434\u043c\u0456\u043d\u0456\u0441\u0442\u0440\u0430\u0446\u0456\u044f \u043c\u0430\u0442\u0447\u0443, \u0440\u043e\u043b\u0456, \u0434\u043e\u043a\u0443\u043c\u0435\u043d\u0442\u0438',
    seoModuleDescription:
      'RO Helper \u2014 \u0434\u043e\u0432\u0456\u0434\u043d\u0438\u043a \u043f\u0440\u043e\u0446\u0435\u0434\u0443\u0440 \u0442\u0430 \u043f\u0440\u0430\u0432\u0438\u043b IPSC-\u0441\u0442\u0440\u0456\u043b\u044c\u0431\u0438 (\u0447\u0435\u0440\u043d\u0435\u0442\u043a\u0438; \u0437\u0430\u0432\u0436\u0434\u0438 PDF).',
    searchPlaceholder: '\u041f\u043e\u0448\u0443\u043a \u043f\u043e \u0441\u0442\u0430\u0442\u0442\u044f\u0445\u2026',
    searchAriaLabel: '\u041f\u043e\u0448\u0443\u043a \u043f\u043e RO Helper',
    searchEmpty: '\u041d\u0456\u0447\u043e\u0433\u043e \u043d\u0435 \u0437\u043d\u0430\u0439\u0434\u0435\u043d\u043e',
    searchHint: '\u0428\u0443\u043a\u0430\u0454 \u0437\u0430 \u043d\u0430\u0437\u0432\u043e\u044e \u0441\u0442\u0430\u0442\u0442\u0456 \u0442\u0430 slug. \u041f\u0456\u0434\u043a\u0430\u0437\u043a\u0430: \u0432\u0432\u0435\u0434\u0456\u0442\u044c \u043a\u0456\u043b\u044c\u043a\u0430 \u0441\u0438\u043c\u0432\u043e\u043b\u0456\u0432.',
    searchClear: '\u041e\u0447\u0438\u0441\u0442\u0438\u0442\u0438',
    searchLoading: '\u0417\u0430\u0432\u0430\u043d\u0442\u0430\u0436\u0435\u043d\u043d\u044f \u0456\u043d\u0434\u0435\u043a\u0441\u0443\u2026',
    quickCiteButton: '\u0428\u0432\u0438\u0434\u043a\u0435 \u0434\u043b\u044f \u0437\u0432\u0456\u0442\u0443',
    quickCiteAria: '\u0421\u043a\u043e\u043f\u0456\u044e\u0432\u0430\u0442\u0438 \u043a\u043e\u0440\u043e\u0442\u043a\u0435 \u043f\u043e\u0441\u0438\u043b\u0430\u043d\u043d\u044f \u0434\u043b\u044f \u0437\u0432\u0456\u0442\u0443',
    quickCiteCopied: '\u0421\u043a\u043e\u043f\u0456\u0439\u043e\u0432\u0430\u043d\u043e \u0432 \u0431\u0443\u0444\u0435\u0440',
    quickCiteFailed: '\u041d\u0435 \u0432\u0434\u0430\u043b\u043e\u0441\u044f \u0441\u043a\u043e\u043f\u0456\u044e\u0432\u0430\u0442\u0438',
    quickCiteHeader: '[RO Helper / Shooters Tools]',
    quickCiteTopic: '\u0422\u0435\u043c\u0430:',
    quickCiteIpsc: 'IPSC:',
    quickCitePrimary: '\u041f\u0435\u0440\u0432\u0438\u043d\u043d\u0438\u043a:',
    quickCiteUnset: '\u2014',
    quickCiteNoRules: '\u2014',
    quickCiteFpsu: '\u041b\u043e\u043a\u0430\u043b\u044c\u043d\u043e (\u0424\u041f\u0421\u0423):',
    quickCiteFpsuSeeBlock: '\u0434\u0438\u0432. \u0431\u043b\u043e\u043a \u0443 \u043a\u0430\u0440\u0442\u0446\u0456 (\u043f\u043e\u0441\u0438\u043b\u0430\u043d\u043d\u044f \u043d\u0430 \u0434\u0436\u0435\u0440\u0435\u043b\u0430 \u0431\u0435\u0437 \u043f\u043e\u0432\u043d\u043e\u0433\u043e \u0442\u0435\u043a\u0441\u0442\u0443)',
    quickCiteNote:
      '\u041f\u0440\u0438\u043c\u0456\u0442\u043a\u0430: \u043d\u0435 \u0437\u0430\u043c\u0456\u043d\u044e\u0454 \u0440\u0456\u0448\u0435\u043d\u043d\u044f RM / \u0434\u043e\u043a\u0443\u043c\u0435\u043d\u0442\u0438 \u043c\u0430\u0442\u0447\u0443.',
  },
  footer: {
    feedbackHeading: '\u0417\u0432\u043e\u0440\u043e\u0442\u043d\u0438\u0439 \u0437\u0432\u2019\u044f\u0437\u043e\u043a',
    feedbackText: '\u0417\u043d\u0430\u0439\u0448\u043b\u0438 \u043f\u043e\u043c\u0438\u043b\u043a\u0443, \u043c\u0430\u0454\u0442\u0435 \u043f\u0440\u043e\u043f\u043e\u0437\u0438\u0446\u0456\u044e \u0447\u0438 \u0432\u0456\u0434\u0433\u0443\u043a? \u041d\u0430\u043f\u0438\u0448\u0456\u0442\u044c:',
    feedbackTelegram: 'Telegram',
    supportHeading: '\u041f\u0456\u0434\u0442\u0440\u0438\u043c\u0430\u0442\u0438 \u043f\u0440\u043e\u0454\u043a\u0442',
    supportText: 'Stage Builder \u2014 \u0431\u0435\u0437\u043a\u043e\u0448\u0442\u043e\u0432\u043d\u0438\u0439 \u0456 \u0432\u0456\u0434\u043a\u0440\u0438\u0442\u0438\u0439. \u042f\u043a\u0449\u043e \u0432\u0456\u043d \u0432\u0430\u043c \u043a\u043e\u0440\u0438\u0441\u043d\u0438\u0439, \u043c\u043e\u0436\u0435\u0442\u0435 \u043f\u0456\u0434\u0442\u0440\u0438\u043c\u0430\u0442\u0438 \u0440\u043e\u0437\u0440\u043e\u0431\u043a\u0443:',
    supportLink: '\u041f\u0456\u0434\u0442\u0440\u0438\u043c\u0430\u0442\u0438 (Monobank)',
    installHeading: '\u0412\u0441\u0442\u0430\u043d\u043e\u0432\u0438\u0442\u0438 \u0434\u043e\u0434\u0430\u0442\u043e\u043a',
    installText: '\u0414\u043e\u0434\u0430\u0439\u0442\u0435 Stage Builder \u043d\u0430 \u0440\u043e\u0431\u043e\u0447\u0438\u0439 \u0441\u0442\u0456\u043b \u0434\u043b\u044f \u0448\u0432\u0438\u0434\u043a\u043e\u0433\u043e \u0434\u043e\u0441\u0442\u0443\u043f\u0443 \u0442\u0430 \u0440\u043e\u0431\u043e\u0442\u0438 \u043e\u0444\u043b\u0430\u0439\u043d.',
    installButton: '\u0412\u0441\u0442\u0430\u043d\u043e\u0432\u0438\u0442\u0438',
    publishPolicy: '\u041f\u043e\u043b\u0456\u0442\u0438\u043a\u0430 \u043f\u0443\u0431\u043b\u0456\u043a\u0430\u0446\u0456\u0457',
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
      'Placement: pick a type in the sidebar (target, wall, prop), then click the plan. Each click adds one object at the cursor (even on top of others). Exit placement: Esc or click the same type button again.\n\nAfter that: click to select; drag to move (grid snap is on). «↻» rotates in steps. Keyboard: Delete / Backspace removes the selection. Phone: the X button by the map does the same; long-press the plan (~0.5 s) with a selection to open quick actions. The red trash button at the bottom clears the entire exercise — not the same as deleting the selection.\n\nMeasure: ruler icon by the map, or M in 2D — two clicks set a segment and length in metres; Esc cancels an unfinished line.\nMarquee on the map selects a region; drag any selected object to move the whole selection together. Copy / paste: Ctrl+C / Ctrl+V or Copy / Paste — paste goes to the cursor when it is over the map, otherwise to the centre of the current view.',
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
      'Staging environment — not the live site. Production: shooters-tools.com.',
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
      'Click near the first point (within 5 cm) to close. While you move toward the next point, the dashed guide shows edge length and metric ticks (every 0.1 m, taller ticks each full metre). Vertices snap to a 0.1 m grid when placing and dragging. Inside an existing zone, the closed contour becomes a hole. Drag a vertex to move it; while dragging, distances for the two incident edges are shown along the contour. Delete or Backspace removes the vertex (fewer than three vertices removes the whole polygon or hole).',
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
      'Drag on the plan to select. Objects whose center lies inside the box are selected. Marquee mode turns off when you release the mouse so you can drag the selection. Esc exits manually.',
    activationLinkMode: 'Activation',
    activationLinkModeTitle:
      'Two clicks: first the source object, then the target. Esc exits the mode.',
    dimensionLinkMode: 'Dimensions',
    dimensionLinkModeTitle:
      'Two clicks — new dimension. Drag an endpoint or the segment body to move. Click selects (violet); Delete or Backspace removes. Esc clears line selection (exit Dimensions mode from the toolbar as before).',
    copySelection: 'Copy',
    copySelectionTitle:
      'Copy selection (Ctrl+C). Also saved to the internal buffer; tries system clipboard when allowed.',
    pasteSelection: 'Paste',
    pasteSelectionTitle:
      'Paste copy at cursor on the plan, or centered in view if cursor is outside the map (Ctrl+V).',
    undoRedoGroupAria: 'Plan edit history',
    undoPlan: 'Undo',
    undoPlanTitle: 'Undo last plan change (Ctrl+Z or ⌘+Z).',
    redoPlan: 'Redo',
    redoPlanTitle: 'Redo undone change (Ctrl+Shift+Z, Ctrl+Y, or ⌘+Shift+Z).',
    planMapActionsAria:
      '2D plan actions: marquee, copy, paste, activation, pinned dimensions, measure, delete selection, clear entire exercise',
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
    category: {
      short: 'Short',
      medium: 'Medium',
      long: 'Long',
    },
    activationHeading: 'Activations:',
    activationOneToOne: 'Object #{{from}} activates object #{{to}}.',
    activationOneToMany: 'Object #{{from}} activates objects {{toList}}.',
    activationNumberListTwo: '{{a}} and {{b}}',
    activationNumberListMany: '{{init}}, and {{last}}',
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
      'Supabase is not configured on the client. Locally: add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local. On Vercel: set the same names for Production and Preview (or All Environments), then redeploy — preview deployments will not have keys in the build otherwise.',
    backHome: 'Home',
    draftConflictTitle: 'Saved draft of your previous stage in this browser',
    draftConflictBody:
      'You are opening a stage from a link, but this browser still has an auto-saved draft from a previous visit. To load the linked stage, choose: save the draft as a file, discard it, or cancel.',
    draftSave: 'Save as file\u2026',
    draftDiscard: 'Discard draft',
    draftCancel: 'Cancel',
    publishButton: 'Share\u2026',
    publishTitle: 'Share via link',
    publishIntro:
      'Each publish creates a new link to a snapshot of your stage (valid 365 days). Viewer links can share one logical group: later view publishes can extend that chain so matches can jump to the latest snapshot.',
    publishConsentBefore: 'I have read and agree to the',
    publishConsentLinkText: 'publishing policy',
    publishConsentAfter: '.',
    publishContinueViewShareGroup:
      'Keep the next view publish in this logical exercise chain (helps matches use “refresh to latest”).',
    publishStartNewViewShareGroup: 'New logical exercise (new viewer group)',
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
    publishPolicyTitle: 'Publishing policy for link-shared stages',
    publishPolicyParagraphs: [
      'A stage published via link is available to anyone who has the URL. There are no separate password-protected links in the first version.',
      'You publish content (stage, briefing, descriptions) at your own discretion. Avoid unnecessary personal data in briefing text and names if you do not want it disclosed.',
      'By requesting a view or editor link, you confirm that you have read this policy and agree to the publishing terms.',
      'If you believe unacceptable or harmful content was published, use the Feedback section in the app footer (email and Telegram). Include the exercise URL and a short description.',
      'Link lifetime and publish limits depend on service settings. Self-service removal from the cloud may be unavailable in the first version; after a substantiated request via feedback, an operator may remove or restrict access after review.',
    ],
    openInEditor: 'Open in editor (new tab)',
    viewModeHint: 'View-only mode. To edit the stage, open it in the editor.',
    publishErrorHtmlResponse:
      'Server returned HTML instead of JSON — check deployment of /api/publish-share and Vercel env (SUPABASE_SERVICE_ROLE_KEY, Supabase URL).',
  },
  portal: {
    title: 'Shooters Tools',
    helmetTitle: 'Shooters Tools — IPSC / practical shooting',
    metaDescription:
      'Practical shooting and IPSC tools: Stage Builder (metric plan, 3D, PDF briefing, export), RO Helper (rules reference).',
    lead: 'Tools for practical shooting and IPSC. More modules will roll out over time.',
    navStageBuilder: 'Stage Builder',
    navHitFactor: 'Hit Factor',
    navRoHelper: 'RO Helper',
    stageBuilderTitle: 'Stage Builder',
    stageBuilderDesc:
      'Turn your stage idea into a detailed 3D project in minutes. See target layout through the shooter\u2019s eyes before you build. You get more than a sketch\u2014a full match pack, from a metric grid plan to a print-ready PDF briefing.',
    stageBuilderFeatures: [
      'Accuracy: Metric plan with ruler for precise target and prop placement.',
      'Control: 3D shooter-zone view to check visibility and safety early.',
      'Ready to share: Briefing output plus a share link or stage file export.',
    ],
    openStageBuilder: 'Open Stage Builder',
    hitFactorTitle: 'Hit Factor',
    hitFactorDesc:
      'Your personal performance analyst at the range. The calculator doesn\u2019t just add up points\u2014it shows the \u201cprice\u201d of every miss or extra second. Instantly see whether to push speed or focus on clean shooting.',
    hitFactorFeatures: [
      'Instant calculation: Quick hit factor for Major and Minor power factors.',
      'Error analysis: Clear view of how much time mistakes cost you.',
      'Smart hints: Automatic focus tip (speed vs accuracy) to improve your run.',
    ],
    openHitFactor: 'Open Hit Factor',
    roHelperTitle: 'RO Helper',
    roHelperDesc:
      'An intelligent rules companion at the RO post. Skip hundred-page PDF hunts\u2014get structured access to procedures, penalties, and equipment rules, built for fast answers right on the stage.',
    roHelperFeatures: [
      'Quick navigation: Category-first browsing\u2014safety, procedures, equipment.',
      'Effective officiating: Clear patterns for penalties and tough calls.',
      'Easy citing: Surface the right rule for the competitor in moments.',
    ],
    openRoHelper: 'Open RO Helper',
    gridAriaLabel: 'Available tools',
    portalPublishedMatchesHeading: 'Upcoming events',
    portalPublishedMatchesLead:
      'Upcoming published events; sign up from each match page while signed in. Your personal sign-up list lives on the account page.',
    portalPublishedMatchesEmpty: 'No published matches scheduled from today onward yet.',
    portalPublishedMatchesLoadError: 'Could not load the matches list',
    portalPublishedMatchOpenPrimary: 'Details',
    portalPublishedCardOrganizer: 'Organizer: {{name}}',
    portalPublishedCardCoverAlt: 'Match cover',
    matchesPortalOrganizerLink: 'Organizer dashboard',
    matchesPortalFooterOrganizerViaAccount:
      'Apply for organizer access and track your status from the account page. Match authoring opens after approval.',
    matchesPortalFooterOrganizerSignIn: 'Sign in to apply as an organizer or access match tools once approved.',
    organizerMatchAccessDeniedPendingBody:
      'Organizer access for your account has not been approved yet — creating or editing matches is disabled here. Check your application status on the account page.',
    organizerMatchAccessDeniedMissingBody:
      'This organizer area is limited to approved platform organizers. Start or resume your application on the account page.',
    organizerMatchAccessDeniedBlockedBody:
      'Organizer features are disabled by the platform — you cannot manage matches here.',
    organizerMatchAccessGoAccount: 'Account',
    portalMatchesHubSearchAria: 'Search matches in the list',
    portalMatchesHubSearchFieldLabel: 'Search',
    portalMatchesHubSearchPlaceholder: 'Title or location…',
    portalMatchesHubDateFrom: 'From date',
    portalMatchesHubDateTo: 'To date',
    portalMatchesHubClearFilters: 'Clear filters',
    portalMatchesHubCalendarPrevAria: 'Previous month',
    portalMatchesHubCalendarNextAria: 'Next month',
    portalMatchesHubMonthJumpLabel: 'Month',
    portalMatchesHubCalendarAria: 'Calendar of days with matches',
    portalMatchesHubDayButtonAria: 'Filter list to {{date}}',
    portalMatchesHubNoMatchesFiltered:
      'Nothing matches these filters yet. Adjust search, dates, event type, level, or tap "Clear filters".',
    portalMatchesHubFilterEventKind: 'Event type',
    portalMatchesHubFilterEventKindAll: 'All types',
    portalMatchesHubFilterPsLevel: 'PS level',
    portalMatchesHubFilterPsLevelAll: 'All levels',
    portalMatchesHubFilterWeaponType: 'Weapon type',
    portalMatchesHubFilterWeaponTypePlaceholder: 'Coming soon',
    portalMatchesHubListDash: '—',
    badgeLive: 'Live',
    badgeNew: 'New',
    badgeBeta: 'Beta',
    matchesPageHelmetTitle: 'Upcoming events — Shooters Tools',
    matchesPageShortTitle: 'Match',
    matchesSupabaseUnset:
      'Supabase client is not configured (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). Match data is unavailable in the browser.',
    matchesLoadError: 'Could not load data',
    matchesLoadingDetail: 'Loading match…',
    matchDetailBackToList: 'Back to matches',
    portalBreadcrumbAria: 'Breadcrumb',
    matchDetailNotFoundTitle: 'Match not found — Shooters Tools',
    matchDetailNotFoundBody:
      'There is no published match with this id, or the link is invalid.',
    matchDetailStartsLabel: 'Starts',
    matchDetailEventKindLabel: 'Event type',
    matchDetailPsLevelLabel: 'Level (PractiScore)',
    matchDetailNotSpecifiedValue: 'Not specified',
    matchDetailLocationLabel: 'Location',
    matchDetailDisciplineLabel: 'Discipline',
    matchDetailLimitLabel: 'Competitor limit',
    matchDetailPrematchLabel: 'Prematch',
    matchDetailPrematchValueYes: 'yes — separate squad capacity the day(s) before match day',
    matchDetailPrematchValueNo: 'no',
    matchDetailProgrammeHeading: 'Programme',
    matchDetailProgrammeViewLink: 'Course of fire',
    matchDetailProgrammeFootnote:
      'Links open Stage Builder view snapshots (as published by the organizer).',
    matchDetailParticipantsHeading: 'Participants',
    matchDetailParticipantsClosed:
      'The registered participant list is not published for this match (organizer setting). The organizer can turn on the participant list visibility in the match draft (My matches → edit match).',
    matchDetailParticipantsOpenEmpty:
      'The public list is empty (no confirmed registrations yet).',
    matchDetailParticipantsOpenAwaitingConfirmation:
      'There are already {{count}} active sign-ups in squads (pending + confirmed counted together), but this table is empty because it lists only shooters the organizer has confirmed. Confirm entries under My matches → Registrations.',
    matchDetailParticipantsFootnote:
      'Only confirmed registrations are shown; name comes from the participant profile when set.',
    matchDetailParticipantsColSquad: 'Squad',
    matchDetailParticipantsColPhase: 'Day',
    matchDetailParticipantsColName: 'Name',
    matchDetailParticipantsColDivision: 'Division',
    matchDetailParticipantsColClass: 'Class',
    matchDetailApplyMigrationHint:
      'Apply the latest migrations from supabase/migrations (including `20260504140000_public_match_registration_metrics.sql` and `20260505120000_match_prematch_squads.sql`).',
    matchDetailRegistrationHeading: 'Registration',
    matchDetailRegistrationPrematchHeading: 'Prematch day',
    matchDetailRegistrationMainHeading: 'Main match day',
    matchDetailRegistrationPrematchEmpty: 'No prematch squads configured yet.',
    matchDetailRegistrationMainEmpty: 'No main-day squads configured yet.',
    matchDetailRegistrationPhaseShortPrematch: 'Prematch',
    matchDetailRegistrationPhaseShortMain: 'Match',
    matchDetailRegistrationNoSquads:
      'No squads were added yet. Check back later or contact the match organizer.',
    matchDetailRegistrationColSquad: 'Squad',
    matchDetailRegistrationColFree: 'Open seats',
    matchDetailRegistrationFull: 'Full',
    matchDetailRegistrationMatchFull:
      'The competitor limit for this match is reached; new sign-ups are not available right now.',
    matchDetailRegistrationSignInIntro: 'Sign in or create an account to register for this match.',
    matchDetailRegistrationFieldSquad: 'Squad',
    matchDetailRegistrationSelectSquad: 'Select a squad',
    matchDetailRegistrationDivision: 'Division',
    matchDetailRegistrationClass: 'Class',
    matchDetailRegistrationPFOptional: 'Power factor (optional)',
    matchDetailRegistrationPFNone: '—',
    matchDetailRegistrationPFMajor: 'Major',
    matchDetailRegistrationPFMinor: 'Minor',
    matchDetailRegistrationSubmit: 'Submit registration',
    matchDetailRegistrationSubmitting: 'Submitting…',
    matchDetailRegistrationDonePending:
      'Registration received. Pending status—the organizer confirms after verifying payment arrangements.',
    matchDetailRegistrationYourStatus: 'Your registration',
    matchDetailRegistrationStatusPending: 'pending organizer confirmation',
    matchDetailRegistrationStatusConfirmed: 'confirmed',
    matchDetailRegistrationStatusCancelled: 'cancelled',
    matchDetailRegistrationCancel: 'Cancel registration',
    matchDetailRegistrationCancelling: 'Cancelling…',
    matchDetailRegistrationPickOpenSquad: 'Choose a squad with open seats.',
    matchDetailRegistrationErrorPrefix: 'Error',
    portalCompactAuthAria: 'Sign-in mode',
    portalCompactAuthSignIn: 'Sign in',
    portalCompactAuthSignUp: 'Sign up',
    portalCompactAuthEmail: 'Email',
    portalCompactAuthPassword: 'Password',
    portalCompactAuthPasswordHint:
      'Use at least 8 characters. Longer passphrases are usually safer; avoid obvious words or your email.',
    portalCompactAuthPasswordTooShort: 'Password must be at least 8 characters.',
    portalCompactAuthShowPassword: 'Show password',
    portalCompactAuthHidePassword: 'Hide password',
    portalCompactAuthSubmitSignIn: 'Sign in',
    portalCompactAuthSubmitSignUp: 'Sign up',
    portalCompactAuthSignOut: 'Sign out',
    portalCompactAuthSignupSession: 'You are signed in.',
    portalCompactAuthSignupConfirm:
      'Account created. If email confirmation is enabled, confirm from your inbox before signing in.',
    portalCompactAuthOtpSent:
      'We sent a code to your email. Enter all digits below (check spam).',
    portalCompactAuthOtpLabel: 'Code from email',
    portalCompactAuthOtpHint: '6–8 digits, no spaces (as in the email).',
    portalCompactAuthOtpLength: 'Enter the full code: 6–8 digits.',
    portalCompactAuthOtpSubmit: 'Confirm email',
    portalCompactAuthOtpInvalid: 'Invalid or expired code. Try again or resend.',
    portalCompactAuthOtpResend: 'Resend code',
    portalCompactAuthOtpResendDone: 'A new code was sent to your address.',
    portalCompactAuthOtpChangeEmail: 'Change email or password',
    authEmailCallbackHelmet: 'Email confirmation',
    authEmailCallbackLoading: 'Completing sign-in…',
    authEmailCallbackSuccessTitle: 'Email confirmed',
    authEmailCallbackSuccessBody:
      'Your account is active. Use “Continue” to return where you signed up, or open the portal home.',
    authEmailCallbackContinue: 'Continue',
    authEmailCallbackToHome: 'Portal home',
    authEmailCallbackFailedTitle: 'Could not finish the email link',
    authEmailCallbackFailedBody:
      'If you still see a JSON error on supabase.co (e.g. otp_expired), your mail client may have opened the link twice, or the code expired. Try signing in with your password, or sign up again.',
    authEmailCallbackAccountCta: 'Account page',
    organizersAdminHelmetTitle: 'Match organizers — platform admin',
    organizersAdminTitle: 'Match organizers',
    organizersAdminIntro:
      'Platform owners only. “Applications only” highlights pending users without matches. When blocking, an optional note is shown on the applicant’s account page. “Active” creates and edits matches.',
    organizersNeedSignIn: 'Sign in with Supabase Auth to open this page.',
    organizersForbidden:
      'No platform owner privileges. Managed in portal_platform_admins.',
    organizersLoading: 'Loading…',
    organizersLoadError: 'Could not load the list',
    organizersColEmail: 'Email',
    organizersColDisplayName: 'Display name',
    organizersColMatches: 'Matches',
    organizersColStatus: 'Status',
    organizersStatusPending: 'Pending',
    organizersStatusActive: 'Active',
    organizersStatusBlocked: 'Blocked',
    organizersSave: 'Save',
    organizersSaving: 'Saving…',
    organizersBackHome: 'Portal home',
    organizersFilterAll: 'All',
    organizersFilterApplications: 'Applications only',
    organizersFilterPendingAll: 'All pending',
    organizersColBadge: 'Type',
    organizersColContact: 'Application contact',
    organizersColPastMatches: 'Past events / links',
    organizersColModeration: 'Moderator note',
    organizersBadgeApplication: 'Application',
    organizersBadgePendingExtra: 'Pending (has matches)',
    organizersModerationNoteLabel:
      'Note for the applicant when blocking (optional — shown on their account page).',
    organizersModerationNotePlaceholder:
      'Short reason or what they should fix (max 600 characters)',
    organizersApplicationEmpty: '—',
    organizersModerationNoteTooLong: 'Note is too long (max 600 characters)',
    accountHeaderAria: 'Portal account',
    accountHeaderChecking: 'Checking session…',
    accountHeaderSignIn: 'Sign in',
    accountHeaderProfile: 'Account',
    accountHeaderProfileIconAria: 'Account. Signed in as {{email}}',
    accountBadgeParticipant: 'Participant',
    accountBadgeParticipantHint: 'You can register for published matches',
    accountBadgeOrganizerActive: 'Organizer',
    accountBadgeOrganizerBlocked: 'Organizer (restricted)',
    accountBadgeOrganizerPending: 'Organizer — pending approval',
    accountBadgeLoading: '…',
    accountPageHelmet: 'Account — Shooters Tools',
    accountPageTitle: 'Account',
    accountAuthHeading: 'Sign in',
    accountSummaryHeading: 'Signed in',
    accountSummaryLogin: 'Login:',
    accountShooterCabinetHeading: 'Shooter hub',
    accountShooterCabinetLead:
      'You can register for published matches when you have a link or announcement from an organizer. The Participant role applies to anyone signed in.',
    accountShooterPortalLinkLabel: 'Portal home',
    accountShooterPortalLinkSuffix:
      ' — product cards and Stage Builder entry; organizers usually send a direct link to each match.',
    accountPageGoOrganizer: 'My matches (organizer)',
    accountPageOrganizerExplain: 'manage drafts, published matches and registrations.',
    accountPageShooterSoon:
      'Use the «Matches» page for the public schedule. Below: your sign-ups and default fields for the next sign-up (you can override them on each match page).',
    accountOrganizerSectionHeading: 'Match organizer',
    accountOrganizerActiveLead: 'You can create and manage matches on this portal.',
    accountOrganizerApplyTeaser:
      'Organizer access is granted by the platform after you apply. If you need «My matches», expand the form below — most shooters can skip this.',
    accountOrganizerApplyToggleExpand: 'Apply to become an organizer',
    accountOrganizerApplyToggleCollapse: 'Collapse',
    accountOrganizerApplyHeading: 'Apply to organise matches',
    accountOrganizerApplyIntro:
      'Submit your request: your profile is marked pending for review. Contact and links are optional but help moderators. The platform owner grants access in the organizers admin page.',
    accountOrganizerApplyButton: 'Submit application',
    accountOrganizerApplySubmitting: 'Submitting…',
    accountOrganizerApplyPendingTitle: 'Application received',
    accountOrganizerApplyPendingBody:
      'Your status is “Pending” until the platform approves it. After approval you can create matches; you will see updates on this account page when we add notifications.',
    accountOrganizerApplyBlockedBody:
      'Organizer access has been revoked for your account by the platform. You cannot submit a new application — contact portal support.',
    accountOrganizerApplyErrorPrefix: 'Could not submit application',
    accountOrganizerApplyDuplicateFriendly:
      'Your account already has an organizer profile in the database — perhaps you already applied, or an admin added it earlier. Refresh this page after a minute; contact support if the status seems wrong.',
    accountOrganizerApplyValidationLength: 'Check field length: contact max 280 characters; past matches block max 2000.',
    accountOrganizerModerationHeading: 'Message from the platform',
    accountOrganizerApplyContactLabel: 'Contact (Telegram, phone, etc.) — optional',
    accountOrganizerApplyContactPlaceholder: 'e.g. @username or +1…',
    accountOrganizerApplyPastMatchesLabel: 'Past matches / links — optional',
    accountOrganizerApplyPastMatchesPlaceholder: 'Links to PSC, posters, clubs, or a short experience summary',
    accountMyRegistrationsHeading: 'My match sign-ups',
    accountMyRegistrationsEmpty:
      'No match sign-ups yet. Upcoming published events are on the «Matches» page; you can also open a match via a link from the organizer.',
    accountMyRegistrationsLoadError: 'Could not load registrations',
    accountMyRegistrationsColMatch: 'Match',
    accountMyRegistrationsColDate: 'Starts',
    accountMyRegistrationsColStatus: 'Status',
    accountMyRegistrationsColActions: 'Actions',
    accountMyRegistrationsStatusPending: 'awaiting confirmation',
    accountMyRegistrationsStatusConfirmed: 'confirmed',
    accountMyRegistrationsStatusCancelled: 'cancelled',
    accountMyRegistrationsOpenMatch: 'Open',
    accountMyRegistrationsCancel: 'Cancel sign-up',
    accountMyRegistrationsCancelling: 'Cancelling…',
    accountMyRegistrationsMatchUnavailable: '(match unavailable)',
    accountParticipantDefaultsHeading: 'Shooter profile (PractiScore)',
    accountParticipantDefaultsLead:
      'Prefills the sign-up form on a match page (you can edit before submitting).',
    accountParticipantProfileSectionLead:
      'Defaults for new registrations and future export: region, categories (comma-separated), weapon class, division, classification, power factor.',
    accountParticipantFieldRegion: 'Region / state',
    accountParticipantFieldRegionPlaceholder: 'e.g. UA or your state',
    accountParticipantFieldCategory: 'Category',
    accountParticipantFieldCategoryPlaceholder: 'Lady, Junior…',
    accountParticipantFieldCategoryHint: 'Multiple values — comma-separated, like PractiScore.',
    accountParticipantFieldWeaponClass: 'Weapon class',
    accountParticipantFieldWeaponPlaceholder: 'e.g. Shotgun',
    accountParticipantMatchPortalOffHint:
      'The Matches module is off in this environment — your registration list is hidden. The profile below is still saved.',
    accountParticipantDefaultsSave: 'Save',
    accountParticipantDefaultsSaving: 'Saving…',
    accountParticipantDefaultsSaved: 'Saved.',
    portalShellMenuOpenAria: 'Open navigation menu',
    portalShellMenuCloseAria: 'Close navigation menu',
    portalShellNavDrawerAria: 'Navigation and account',
    navMatches: 'Matches',
    myMatchesTitle: 'My matches',
    myMatchesHelmet: 'My matches — Shooters Tools',
    myMatchesCreate: 'Create match',
    myMatchesColTitle: 'Title',
    myMatchesColStarts: 'Starts',
    myMatchesColEventKind: 'Type',
    myMatchesColPsLevel: 'Level',
    myMatchesColStatus: 'Status',
    myMatchesColList: 'Participant list',
    myMatchesRoster: 'Registrations',
    myMatchesEdit: 'Edit',
    myMatchesViewPublic: 'Public page',
    myMatchesNeedSignIn: 'Sign in to manage your matches.',
    myMatchesDevSignInHint: 'Auth smoke (dev)',
    myMatchesLoading: 'Loading…',
    myMatchesLoadError: 'Error',
    myMatchesEmpty: 'No matches yet. Create one.',
      myMatchesBackHome: 'Portal home',
      myMatchesManage: 'Manage',
      myMatchesQuickLinksAria: 'Additional actions for this match',
    matchOrgStatusDraft: 'Draft',
    matchOrgStatusPublished: 'Published',
    matchOrgStatusCancelled: 'Cancelled',
    matchOrgStatusCompleted: 'Completed',
    matchOrgParticipantsOpenShort: 'Open',
    matchOrgParticipantsClosedShort: 'Closed',
    matchOrgCreateTitle: 'New match',
    matchOrgEditTitle: 'Edit match',
    matchOrgCreateHelmet: 'New match — Shooters Tools',
    matchOrgEditHelmetEdit: 'Edit match — Shooters Tools',
    matchOrgEditHelmetLoading: 'Match — loading',
    matchOrgSave: 'Save',
    matchOrgSaveSaving: 'Saving…',
    matchOrgBackList: 'Back to my matches',
    matchOrgFieldTitle: 'Title',
    matchOrgFieldStarts: 'Start (browser local time)',
    matchOrgFieldLocation: 'Location (text)',
    matchOrgFieldCoverImage: 'Cover image (match list)',
    matchOrgCoverUpload: 'Upload image',
    matchOrgCoverRemove: 'Remove',
    matchOrgCoverHintNew: 'Save the match first, then you can add a list card image here.',
    matchOrgCoverErrType: 'Only JPEG, PNG, or WebP are allowed.',
    matchOrgCoverErrSize: 'File is too large (max 5 MB).',
    matchOrgCoverUploading: 'Uploading…',
    matchOrgFieldEventKind: 'Event type',
    matchOrgFieldPsLevel: 'Match level (PractiScore)',
    matchOrgTaxonomyOptionalLead:
      'Optional: you can leave both fields below empty (the public match page will show “Not specified”).',
    matchOrgEventKindHint:
      'For the public hub and match card: training, match, or classification. Does not replace the title field.',
    matchOrgPsLevelHint:
      'Official PractiScore scale (Level I–V). Exported in .psc as match_level; if unset, the key is omitted from the file.',
    matchOrgEventKindUnset: '— not set —',
    matchEventKindTraining: 'Training',
    matchEventKindMatch: 'Match',
    matchEventKindClassification: 'Classification',
    matchOrgPsLevelUnset: '— not set —',
    matchPsLevelL1: 'Level I',
    matchPsLevelL2: 'Level II',
    matchPsLevelL3: 'Level III',
    matchPsLevelL4: 'Level IV',
    matchPsLevelL5: 'Level V',
    matchOrgDerivedCapacityLine:
      'Total planned capacity (stored as competitor limit after save): {{total}}.',
    matchOrgFieldShootersMain: 'Shooters per squad — main match day',
    matchOrgFieldShootersPrematch: 'Shooters per squad — prematch',
    matchOrgFieldDescription: 'Description (Markdown)',
    matchOrgFieldStatus: 'Match status',
    matchOrgFieldParticipantList: 'Participant list on public card',
    matchOrgParticipantsListOpen: 'Open (confirmed only)',
    matchOrgParticipantsListClosed: 'Closed',
    matchOrgParticipantListFootnote:
      'On the public match card, the «Participants» table lists only confirmed entries. Pending sign-ups stay visible in your organizer roster until you confirm them.',
    matchOrgRegistrationsSummary:
      'Registrations on this match: {{confirmed}} confirmed · {{pending}} awaiting confirmation (the public Participants table lists confirmed only).',
    matchOrgRegistrationsNoneYet: 'No registrations for this match yet.',
    matchOrgDisciplineShotgunNote:
      'MVP discipline is shotgun only (stored in DB; not selectable in UI yet).',
    matchOrgExportPsc: 'Download .psc (PractiScore)',
    matchOrgExportPscBusy: 'Preparing file…',
    matchOrgExportPscHint:
      'Local: with `SUPABASE_SERVICE_ROLE_KEY` in `.env`/`.env.local`, export works in plain `npm run dev`; otherwise use `npm run dev:vercel`. Preview/production: Vercel (`/api/match-export-psc`).',
    matchOrgExportPscErrGeneric: 'Could not build the export. Retry or check the console.',
    matchOrgExportPscErrNetwork:
      'Export server unreachable. Local: confirm key in `.env` and try `npm run dev`, or `npm run dev:vercel`; in the cloud deploy (see hint).',
    matchOrgExportPscErrNoStages: 'Link at least one stage (share URL) before exporting.',
    matchOrgExportPscErrSession: 'Sign in and refresh the page.',
    matchOrgFieldPrematch: 'Prematch (RO/staff shooters the day before match day)',
    matchOrgFieldPlannedMainSquads: 'Planned squads — main match day',
    matchOrgFieldPlannedPrematchSquads: 'Planned squads — prematch day',
    matchOrgPlannedMainInvalid: 'Main-day squad count must be an integer ≥ 1.',
    matchOrgPlannedPrematchInvalid: 'With prematch enabled, prematch squad count must be an integer ≥ 1.',
    matchOrgEditBadId: 'Invalid edit link.',
    matchOrgEditNotFound: 'Match not found or not owned by you.',
    matchOrgTitleRequired: 'Please enter a title.',
    matchOrgShootersInvalid: 'Shooters per squad must be an integer ≥ 1.',
    matchOrgStagesHeading: 'Programme exercises',
    matchOrgStagesIntro:
      'Build the stage in Stage Builder. Names in this list use the briefing «Document title» (same as PDF) first; if empty, the plan’s stage name. The share snapshot freezes that wording until you re-publish view or tap «Update to latest».',
    matchOrgStagesOpenEditor: 'Open Stage Builder (new tab)',
    matchOrgStagesPasteLabel: 'View URL or share id',
    matchOrgStagesPastePlaceholder: 'https://…/v/s… or s…',
    matchOrgStagesAdd: 'Add to match',
    matchOrgStagesAdding: 'Adding…',
    matchOrgStagesEmpty: 'No exercises linked yet—add the first view link.',
    matchOrgStagesColTitle: 'Title',
    matchOrgStagesColShareId: 'Share',
    matchOrgStagesColActions: 'Actions',
    matchOrgStagesViewLink: 'Open',
    matchOrgStagesMoveUp: 'Up',
    matchOrgStagesMoveDown: 'Down',
    matchOrgStagesRemove: 'Remove',
    matchOrgStagesRefreshLatest: 'Update to latest',
    matchOrgStagesRefreshing: 'Updating…',
    matchOrgStagesRefreshAll: 'Update all exercises to latest',
    matchOrgStagesRefreshAllBusy: 'Updating all exercises…',
    matchOrgStagesErrorGeneric: 'Something went wrong. Reload or verify migrations.',
    matchOrgStagesInvalidPaste: 'Paste a `/v/…` view URL or a short id starting with «s».',
    matchOrgStagesNotFound: 'Stage not found or link expired.',
    matchOrgStagesNotViewMode: 'Only view (reader) shares can be attached. Publish a view link first.',
    matchOrgStagesDuplicate: 'That share id is already in the programme.',
    matchOrgStagesErrNoShareGroup:
      'Missing share_group_id for this row—reenable migrations / publish pipeline, or re-add this exercise.',
    matchOrgStagesErrNoLatestShare:
      'No current view snapshot in this group—links may have expired or you need another view publish in the same group.',
    matchOrgSquadsHeading: 'Squads',
    matchOrgSquadsDerivedIntro:
      'Squad rows are generated from planned squad counts × shooters per squad (main vs prematch). Saving the match updates rows; shrinking is blocked while active registrations occupy removed capacity.',
    matchOrgSquadsDerivedCapacityLine: '{{mainSq}}×{{mainShoot}}{{prematchPart}} = {{planned}} slots (planned).',
    matchOrgSquadSyncBanner: 'Could not rebuild squad rows: {{detail}}',
    matchOrgSquadSyncBannerDismiss: 'Dismiss',
    matchOrgSyncErrPrematchRemove:
      'Cannot remove prematch squads while registrations still reference them—reassign shooters on the registrations page first.',
    matchOrgSyncErrLowerCapacity:
      'Cannot lower shooters-per-squad below already-assigned shooters. Reassign or cancel registrations first.',
    matchOrgSyncErrReduceSquads:
      'Cannot reduce squad count while a squad slated for removal still has registrations. Reassign them first.',
    matchOrgSyncErrOrganizerInactive: 'Organizer profile is not active—contact platform support.',
    matchOrgSyncErrGeneric: 'Could not sync squads.',
    matchOrgSquadsColPhase: 'Day',
    matchOrgSquadsPhaseMain: 'Main',
    matchOrgSquadsPhasePrematch: 'Prematch',
    matchOrgSquadsPlannedMainLine: 'Main day: {{current}} / {{planned}} squads (target).',
    matchOrgSquadsPlannedPrematchLine: 'Prematch: {{current}} / {{planned}} squads (target).',
    matchOrgRosterManageLink: 'Manage registrations / squads',
    matchOrgRosterHelmet: 'Match registrations',
    matchOrgRosterHeading: 'Registrations',
    matchOrgRosterLead:
      'Reassign shooters after changing the squad grid—only squads with an open seat are listed for pending/confirmed entries.',
    matchOrgRosterEditMatch: 'Back to match draft',
    matchOrgRosterEmpty: 'No registrations yet.',
    matchOrgRosterColName: 'Shooter',
    matchOrgRosterColDivision: 'Division',
    matchOrgRosterColStatus: 'Status',
    matchOrgRosterColSquad: 'Squad',
    matchOrgRosterApply: 'Apply',
    matchOrgRosterSaving: 'Saving…',
    matchOrgRosterConfirm: 'Confirm entry',
    matchOrgRosterColActions: 'Actions',
    matchOrgRosterNoFreeSlot:
      'No squad with spare capacity—or save the match card first after changing squad settings.',
    matchOrgRosterViewTable: 'Table',
    matchOrgRosterViewBoard: 'Squads board',
    matchOrgRosterBoardHint:
      'Drag a shooter card into another squad—the change saves immediately when there is spare capacity.',
    matchOrgRosterBoardSquadFull: 'This squad has no spare seat for this registration.',
    matchOrgRosterBoardEmptyColumn: 'No active registrations',
    matchOrgRosterInactiveHeading: 'Inactive registrations (not on the board)',
    matchOrgSquadsColLabel: 'Label',
    matchOrgSquadsColCapacity: 'Capacity',
    matchOrgSquadsColTaken: 'Taken',
    matchOrgSquadsAutoEmpty:
      'Squads appear after saving the draft. If the table stays empty, save again or verify database migrations.',
  },
  hitFactor: {
    pageTitle: 'Hit Factor — price of mistakes',
    pageLead: 'Quick stage analysis: max HF, actual HF, and “cost” of errors in seconds.',
    requiredHitsLabel: 'Required hits',
    timeLabel: 'Time (sec)',
    powerFactorLabel: 'Power factor (PF)',
    powerFactorMinor: 'Minor',
    powerFactorMajor: 'Major',
    modelNoteLabel: 'Note',
    modelNote:
      'This is a training “what-if” model. Official match scoring depends on match conditions and actual hits.',
    deviationsTitle: 'Deviations from “All Alpha”',
    deviationsLead: 'Enter what reduced your points in this run.',
    deviationsExpandCta: 'Expand',
    deviationsCollapseCta: 'Collapse',
    charlieLabel: 'Charlie',
    deltaLabel: 'Delta',
    missLabel: 'Miss',
    proceduralLabel: 'Procedural',
    noShootLabel: 'No‑Shoot',
    hfActualLabel: 'Actual HF',
    hfMaxLabel: 'Max HF',
    maxPointsLabel: 'Max points',
    actualPointsLabel: 'Actual points',
    hfLossLabel: 'Loss',
    impactTitle: 'Cost per error (time equivalent)',
    impactLead: 'How many seconds you’d need to “gain back” to offset one error at the current pace.',
    plusOneSecondLabel: '+1 second',
    minusOneSecondLabel: '−1 second',
    secondsUnit: 'sec',
    focusTitle: 'Recommendation',
    focusAccuracyTitle: 'Focus: accuracy',
    focusAccuracyText:
      'Point loss is already meaningful (≈{{loss}}% HF). Focus on clean points: avoid penalties / no-shoots.',
    focusSpeedTitle: 'Focus: speed',
    focusSpeedText:
      'At this pace, +{{step}} sec costs about {{pct}}% HF. If points are clean, you can push speed.',
    focusBalancedTitle: 'Focus: balance',
    focusBalancedText:
      'Your pace looks balanced. Stay in control and avoid misses.',
    focusMakeupsTitle: 'Focus: make-up shots',
    focusMakeupsText:
      'Make-up shots add about ≈{{time}}% on top of baseline time. Slow down slightly to reduce them.',
    weaponClassLabel: 'Weapon class',
    weaponClassPistol: 'Handgun',
    weaponClassRifle: 'Rifle',
    weaponClassPcc: 'PCC',
    weaponClassShotgun: 'Shotgun',
    makeupShotLabel: 'Make-up shot (time)',
    makeupShotCountLabel: 'Make-up shots',
    makeupShotSplitLabel: 'Time for one make-up shot',
    reset: 'Reset',
  },
  roHelper: {
    moduleTitle: 'RO Helper',
    navPortal: 'Portal',
    lead: 'Reference for match staff and competitors. Content is draft — verify every rule call against your discipline PDF.',
    disciplineTitle: 'Choose discipline',
    disciplineLead:
      'Start with a firearm type — inside you will find rules grouped into categories (Safety, Penalties, Scoring, Equipment, Match admin).',
    disciplineCardSubtitle: '5 rule categories',
    categoryTitle: 'Category',
    articlesEmpty: 'No articles found.',
    articleNotFound: 'Article not found for the current language.',
    invalidPath: 'Unknown path.',
    loading: 'Loading…',
    fpsuLayerLabel: 'Show “Local (FPSU)” blocks in articles',
    fpsuLayerHint: 'Independent of UI language (see RO_HELPER_V0 §5.1).',
    disclaimerTitle: 'Important',
    disclaimerBody:
      'RO Helper / Shooters Tools does not replace official IPSC rules or Range Master decisions. Always verify against the PDF for your discipline and edition.',
    breadcrumbRo: 'RO Helper',
    discHandgun: 'Handgun',
    discPcc: 'PCC',
    discRifle: 'Rifle',
    discMiniRifle: 'Mini rifle',
    discShotgun: 'Shotgun',
    catSafety: 'Safety / DQ',
    catPenalties: 'Penalties',
    catScoring: 'Scoring',
    catEquipment: 'Equipment',
    catMatchAdmin: 'Match admin',
    catSafetyDesc: 'Range safety, DQ, warnings',
    catPenaltiesDesc: 'Penalties, procedures, edge cases',
    catScoringDesc: 'Scoring, target types, hits/misses',
    catEquipmentDesc: 'Divisions, equipment requirements',
    catMatchAdminDesc: 'Match administration, roles, documents',
    seoModuleDescription:
      'RO Helper — IPSC-style match rules and procedures reference (draft articles; always verify with your official PDF).',
    searchPlaceholder: 'Search articles…',
    searchAriaLabel: 'Search RO Helper',
    searchEmpty: 'No matches',
    searchHint: 'Searches article titles and slugs. Tip: type a few characters.',
    searchClear: 'Clear',
    searchLoading: 'Loading index…',
    quickCiteButton: 'Quick Cite',
    quickCiteAria: 'Copy a short citation for reports or messages',
    quickCiteCopied: 'Copied to clipboard',
    quickCiteFailed: 'Could not copy',
    quickCiteHeader: '[RO Helper / Shooters Tools]',
    quickCiteTopic: 'Topic:',
    quickCiteIpsc: 'IPSC:',
    quickCitePrimary: 'Primary source:',
    quickCiteUnset: '—',
    quickCiteNoRules: '—',
    quickCiteFpsu: 'Local (FPSU):',
    quickCiteFpsuSeeBlock: 'see block in article (link targets only; not full text)',
    quickCiteNote: 'Note: does not replace Range Master decisions or match documents.',
  },
  footer: {
    feedbackHeading: 'Feedback',
    feedbackText: 'Found a bug, have a suggestion, or want to leave a review? Reach out:',
    feedbackTelegram: 'Telegram',
    supportHeading: 'Support the project',
    supportText: 'Stage Builder is free and open. If you find it useful, consider supporting development:',
    supportLink: 'Donate (Monobank)',
    installHeading: 'Install the app',
    installText: 'Add Stage Builder to your home screen for quick access and offline use.',
    installButton: 'Install',
    publishPolicy: 'Publish policy',
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
