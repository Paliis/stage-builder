export type Vec2 = {
  x: number
  y: number
}

/** Appendix C3: сторона квадратної металевої пластини (см), таблиця для гвинтівки — 15 / 20 / 30. */
export type MetalPlateRectSideCm = 15 | 20 | 30

/** Основні типи мішеней редактора (спрощений набір). */
export type TargetType =
  /** IPSC B2 (контур), біла; низ лиця біля землі (~0,1 м) у 3D. */
  | 'paperIpscTwoPostGround'
  /** Той самий силует; низ лиця ~50 см від підлоги у 3D. */
  | 'paperIpscTwoPostStand50'
  /** Той самий силует; низ лиця ~1 м від підлоги у 3D. */
  | 'paperIpscTwoPostStand100'
  /** A4 (210×297 мм, масштаб на плані); низ лиця біля землі (~0,1 м) у 3D. */
  | 'paperA4TwoPostGround'
  | 'paperA4TwoPostStand50'
  | 'paperA4TwoPostStand100'
  /** Mini IPSC (номінал B3); ті самі три висоти нижнього краю лиця. */
  | 'paperMiniIpscTwoPostGround'
  | 'paperMiniIpscTwoPostStand50'
  | 'paperMiniIpscTwoPostStand100'
  /** Квадратна металева пластина; NS — червона. */
  | 'metalPlate'
  /** Та сама пластина (Appendix C3), низ лиця ~50 см від підлоги у 3D. */
  | 'metalPlateStand50'
  /** Та сама пластина, низ лиця ~1 м від підлоги у 3D. */
  | 'metalPlateStand100'
  | 'popper'
  | 'miniPopper'
  /** Кругла керамічна тарілка (типово Ø 110 мм, помаранчева). */
  | 'ceramicPlate'
  /** Ківак (swinger): одинарний/подвійний, паперова IPSC або кераміка на кінцях важеля. */
  | 'swingerSinglePaper'
  | 'swingerDoublePaper'
  | 'swingerSingleCeramic'
  | 'swingerDoubleCeramic'

export type PropType =
  /** Двері: ті самі габарити та рамка що й щит (1×0,05 на плані, 2 м висоти); суцільна дерев’яна панель. */
  | 'door'
  /** Штрафна лінія: брусок 5×5 см, довжина sizeM.x, розтягування за кінець у 2D. */
  | 'faultLine'
  /** Щит: sizeM = ширина лиця × товщина на плані (м), рамка 5×5 см, всередині сітка; висота 2 м. */
  | 'shield'
  /** Подвійний щит 2×2 м (лице 2 м по ширині, висота 2 м); та сама рамка й сітка. */
  | 'shieldDouble'
  /** Щит із отвором 300×300 мм по центру лиця (рамка отвору як частина конструкції). */
  | 'shieldWithPort'
  /** Той самий порт, зміщений униз лиця (низ отвору ближче до підніжжя щита). */
  | 'shieldPortLow'
  /** Порт зміщений угору лиця. */
  | 'shieldPortHigh'
  /** Порт у вигляді квадрата, повернутого на площині лиця (~26°). */
  | 'shieldPortSlanted'
  /** Центральний порт закритий «дверцями»: дерев’яна панель і ручка (як у дверей). */
  | 'shieldWithPortDoor'
  | 'barrel'
  | 'tireStack'
  /** Качель: планка 3×0,3 м, обертання в плані навколо центральної труби Ø0,3 м. */
  | 'seesaw'
  /** Рухома платформа 0,8×0,8 м на ланцюгах; стовпи по кутах квадрата 1×1 м (розмір у плані). */
  | 'movingPlatform'
  /** Тунель Купера: висота рами 1,25 м; відстань між верхніми червоними планками 50 см. */
  | 'cooperTunnel'
  /** Стартова позиція: синя розмітка у вигляді двох відбитків ніг на площадці. */
  | 'startPosition'
  /** Дерев’яний прямокутний стіл на чотирьох ніжках; синя смуга на столі паралельно коротшим краям (sizeM — стіл у плані). */
  | 'woodTable'
  /** Дерев’яний стілець: сидіння, спинка, чотири ніжки (sizeM — опора сидіння в плані). */
  | 'woodChair'
  /** Червона дерев’яна A-подібна стійка («піраміда») для довгоствольної зброї; у сцені — одна рушниця без чохла. */
  | 'weaponRackPyramid'

export type Target = {
  id: string
  type: TargetType
  isNoShoot: boolean
  position: Vec2
  /** Квадратна сталь (Appendix C3); якщо немає — 30 см (старі файли). */
  metalRectSideCm?: MetalPlateRectSideCm
  rotationRad: number
}

export type Prop = {
  id: string
  type: PropType
  /**
   * На плані: розмах по X × глибина по Y (м).
   * Для щита/порту: ширина обличчя × товщина (напр. 1 × 0,05).
   */
  sizeM: Vec2
  position: Vec2
  rotationRad: number
}

export type StageCategory = 'short' | 'medium' | 'long'

/** Посилання на екземпляр мішені або реквізиту (BL-004 активації). */
export type StageEntityKind = 'target' | 'prop'
export type StageEntityRef = { kind: StageEntityKind; id: string }

/** Ребро «активує»: from → to; глобальні номери на плані обчислюються з усіх ребер. */
export type ActivationEdge = {
  id: string
  from: StageEntityRef
  to: StageEntityRef
}

export type Stage = {
  name: string
  category: StageCategory
  maxPoints: number
  targets: Target[]
  props: Prop[]
}
