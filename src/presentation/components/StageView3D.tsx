import { OrbitControls } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react'
import * as THREE from 'three'
import { PerspectiveCamera, type Scene, type WebGLRenderer } from 'three'
import { useStageStore } from '../../application/stageStore'
import { pdfSnapshotPixelSize } from '../../domain/a4PrintLayout'
import type { OrbitControls as OrbitControlsType } from 'three-stdlib'
import type { Prop, Target, TargetType } from '../../domain/models'
import { CERAMIC_FACE_HEX, CERAMIC_RADIUS_M } from '../../domain/ceramicPlateSpec'
import {
  cooperTunnelPenaltyPlankOffsetsXM,
  COOPER_TUNNEL_HEIGHT_M,
  isShieldWithPortFamily,
  MOVING_PLATFORM_DECK_M,
  PORT_HOLE_HALF_M,
  PORT_TALL_HALF_H_M,
  propHeightM,
  SEESAW_PIPE_RADIUS_M,
  SHIELD_FRAME_SECTION_M,
  SHIELD_PORT_SLANT_INSET_M,
  shieldPortSlantOpeningLocalM,
  WOOD_TABLE_HEIGHT_M,
} from '../../domain/propGeometry'
import {
  isPaperTargetType,
  isSquareSteelPlateTargetType,
  popperBaseOnlyLocal,
  popperHeadCenterLocal,
  popperHeadRadiusM,
  popperSilhouetteLocal,
  targetFaceOutlineLocalM,
  targetFaceOutlineLocalMForType,
  targetFaceSizeM,
  targetMetalPedestalLocal,
  targetsDrawOrder,
} from '../../domain/targetSpecs'
import {
  isSwingerTargetType,
  swingerFaceCentersLocal,
  swingerIsPaperLoad,
  SWINGER_DIM,
} from '../../domain/swingerGeometry'
import { stageToThreeXZ, type StageFieldM } from '../lib/stageCoordinates3d'

function useStageFieldM(): StageFieldM {
  const x = useStageStore((s) => s.fieldSizeM.x)
  const y = useStageStore((s) => s.fieldSizeM.y)
  return { widthM: x, heightM: y }
}

/**
 * Тіні directional light: типовий ortho ±5 m ламає карту тіней на полі 30×40 m (зсув, «хвости»).
 * Розгортаємо shadow camera під реальний розмір площадки + запас і тюнимо bias.
 */
function StageSunLight() {
  const dirRef = useRef<THREE.DirectionalLight>(null)
  const { widthM, heightM } = useStageFieldM()

  useLayoutEffect(() => {
    const light = dirRef.current
    if (!light) return
    light.shadow.bias = -0.00006
    light.shadow.normalBias = 0.048
    light.shadow.mapSize.set(3072, 3072)
    const cam = light.shadow.camera
    const half = Math.max(widthM, heightM) * 0.5 + 36
    cam.left = -half
    cam.right = half
    cam.top = half
    cam.bottom = -half
    cam.near = 0.25
    cam.far = half * 6 + 120
    cam.updateProjectionMatrix()
    light.shadow.needsUpdate = true
  }, [widthM, heightM])

  return (
    <directionalLight ref={dirRef} castShadow position={[42, 68, 32]} intensity={1.12}>
      <orthographicCamera attach="shadow-camera" args={[-50, 50, 50, -50, 0.25, 280]} />
    </directionalLight>
  )
}

export type CameraMode3D = 'overview' | 'shooter'

export type StageView3DHandle = {
  capturePngDataUrl: () => string | null
}

type StageView3DProps = {
  targets: readonly Target[]
  props: readonly Prop[]
  cameraMode: CameraMode3D
}

/** Обертання, зум (scroll / pinch), панорама; стартова позиція залежить від режиму. */
function StageNavigator({ mode }: { mode: CameraMode3D }) {
  const ctrlRef = useRef<OrbitControlsType>(null)
  const { camera } = useThree()

  useEffect(() => {
    const oc = ctrlRef.current
    const overview = mode === 'overview'
    if (overview) {
      camera.position.set(11, 14.5, 18)
      oc?.target.set(0, 0, -3)
      if (oc) {
        oc.minDistance = 9
        oc.maxDistance = 85
      }
    } else {
      camera.position.set(0, 1.58, 11)
      oc?.target.set(0, 1.32, -8.5)
      if (oc) {
        oc.minDistance = 2
        oc.maxDistance = 36
      }
    }
    oc?.update()
    camera.updateProjectionMatrix()
  }, [camera, mode])

  return (
    <OrbitControls
      ref={ctrlRef}
      makeDefault
      enableDamping
      dampingFactor={0.07}
      enablePan
      enableZoom
      enableRotate
      maxPolarAngle={Math.PI / 2 - 0.02}
      minPolarAngle={0.04}
    />
  )
}

function Ground() {
  const { widthM, heightM } = useStageFieldM()
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[widthM, heightM]} />
      <meshStandardMaterial color="#d6c4a8" roughness={0.9} metalness={0.02} />
    </mesh>
  )
}

const PROP_BARREL_BLUE = '#1d4ed8'

/** Легка периметральна стіна: 3 бруси замість сотень окремих мешів. */
const PERIMETER_WALL_H_M = 1.38
const PERIMETER_WALL_THICK_M = 0.32

function StackedBlueBarrelsColumn({
  position,
  rotationY = 0,
  radius = 0.31,
  totalHeight = 1.1,
  layers = 5,
}: {
  position: readonly [number, number, number]
  rotationY?: number
  radius?: number
  totalHeight?: number
  layers?: number
}) {
  const r = radius
  const gap = totalHeight / layers
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {Array.from({ length: layers }, (_, i) => (
        <mesh key={i} position={[0, gap * (i + 0.5), 0]} castShadow receiveShadow>
          <cylinderGeometry args={[r, r * 0.94, gap * 0.92, 22]} />
          <meshStandardMaterial color={PROP_BARREL_BLUE} roughness={0.52} metalness={0.16} />
        </mesh>
      ))}
    </group>
  )
}

/** U-подібна дерев’яна стіна (зад + боки), мінімум геометрії для швидшого 3D. */
function PerimeterWoodWall() {
  const { widthM: w, heightM: fh } = useStageFieldM()
  const hw = w / 2
  const hh = fh / 2
  const h = PERIMETER_WALL_H_M
  const t = PERIMETER_WALL_THICK_M
  const wood = {
    color: '#7a5c2e',
    roughness: 0.9,
    metalness: 0.03,
  } as const

  return (
    <group>
      <mesh position={[0, h / 2, -hh - t / 2]} castShadow receiveShadow>
        <boxGeometry args={[2 * hw + 2 * t, h, t]} />
        <meshStandardMaterial {...wood} />
      </mesh>
      <mesh position={[-hw - t / 2, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[t, h, 2 * hh + 2 * t]} />
        <meshStandardMaterial {...wood} />
      </mesh>
      <mesh position={[hw + t / 2, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[t, h, 2 * hh + 2 * t]} />
        <meshStandardMaterial {...wood} />
      </mesh>
    </group>
  )
}

function steelPlateStandHeightM(type: TargetType): number {
  if (type === 'metalPlateStand50') return 0.5
  if (type === 'metalPlateStand100') return 1
  return 0.1
}

function targetColor(t: Target): string {
  if (t.isNoShoot) return '#e11d48'
  if (t.type === 'ceramicPlate') return CERAMIC_FACE_HEX
  if (t.type === 'swingerSingleCeramic' || t.type === 'swingerDoubleCeramic') return CERAMIC_FACE_HEX
  if (isSquareSteelPlateTargetType(t.type)) return '#f4f4f5'
  if (isPaperTargetType(t.type)) return '#ffffff'
  /* Поппери: світле тіло; голова окремо в меші. */
  return '#f4f4f5'
}

function outlineMinY(pts: readonly { x: number; y: number }[]): number {
  return Math.min(...pts.map((p) => p.y))
}

function extrudeOutlineGeometry(outline: { x: number; y: number }[], depth: number): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape()
  shape.moveTo(outline[0]!.x, outline[0]!.y)
  for (let i = 1; i < outline.length; i++) {
    shape.lineTo(outline[i]!.x, outline[i]!.y)
  }
  shape.closePath()
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
    curveSegments: 16,
  })
  geo.translate(0, 0, -depth / 2)
  return geo
}

function MetalPedestal3D({ t, standH, faceMinY }: { t: Target; standH: number; faceMinY: number }) {
  const { geo, cx, cy } = useMemo(() => {
    const loc = targetMetalPedestalLocal(t)
    if (!loc || loc.length < 4) return { geo: null as THREE.ExtrudeGeometry | null, cx: 0, cy: 0 }
    const cxi = (loc[0]!.x + loc[1]!.x + loc[2]!.x + loc[3]!.x) / 4
    const cyi = (loc[0]!.y + loc[1]!.y + loc[2]!.y + loc[3]!.y) / 4
    return { geo: extrudeOutlineGeometry(loc, 0.018), cx: cxi, cy: cyi }
  }, [t])
  if (!geo) return null
  return (
    <group position={[0, standH - faceMinY, 0]}>
      <mesh position={[cx, cy, 0]} geometry={geo} castShadow receiveShadow>
        <meshStandardMaterial color="#3d2f24" roughness={0.82} metalness={0.05} />
      </mesh>
    </group>
  )
}

function TargetStandPost({ standH }: { standH: number }) {
  return (
    <mesh position={[0, standH / 2, 0]} castShadow>
      <cylinderGeometry args={[0.022, 0.032, standH, 10]} />
      <meshStandardMaterial color="#2a241c" roughness={0.82} metalness={0.1} />
    </mesh>
  )
}

function SwingerFacePaper3D({
  t,
  faceDepth,
  faceCenterY,
  lx,
  lz,
}: {
  t: Target
  faceDepth: number
  faceCenterY: number
  lx: number
  lz: number
}) {
  const fakePaper = useMemo(
    () =>
      ({
        ...t,
        type: 'paperIpsc' as const,
        position: { x: 0, y: 0 },
        rotationRad: 0,
      }) as Target,
    [t],
  )
  const outline = useMemo(() => targetFaceOutlineLocalM(fakePaper), [fakePaper])
  const geo = useMemo(() => extrudeOutlineGeometry(outline, faceDepth), [outline, faceDepth])
  const paperMinY = useMemo(() => outlineMinY(outline), [outline])
  const c = targetColor(t)
  return (
    <group position={[lx, 0, lz]}>
      <group position={[0, faceCenterY - paperMinY, 0]}>
        <mesh geometry={geo} castShadow receiveShadow>
          <meshStandardMaterial
            color={c}
            roughness={t.isNoShoot ? 0.55 : 0.42}
            metalness={t.isNoShoot ? 0.12 : 0.08}
          />
        </mesh>
      </group>
    </group>
  )
}

function SwingerFaceCeramic3D({
  t,
  faceDepth,
  faceCenterY,
  lx,
  lz,
}: {
  t: Target
  faceDepth: number
  faceCenterY: number
  lx: number
  lz: number
}) {
  const c = targetColor(t)
  return (
    <group position={[lx, 0, lz]}>
      <mesh position={[0, faceCenterY, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[CERAMIC_RADIUS_M, CERAMIC_RADIUS_M, faceDepth, 40]} />
        <meshStandardMaterial color={c} roughness={0.42} metalness={0.12} />
      </mesh>
    </group>
  )
}

function swingerFaceLocalToThreeXZ(c: { x: number; y: number }): { lx: number; lz: number } {
  const lx = c.x
  const lz = -(c.y - SWINGER_DIM.barY)
  return { lx, lz }
}

/** Подвійний ківак: два плечі під кутом 45° до горизонталі (форма «V» у вертикальній площині). */
function SwingerDoubleVArms3D({
  pivotY,
  halfSpanM,
  metal,
}: {
  pivotY: number
  halfSpanM: number
  metal: string
}) {
  const { quatR, quatL, len, ux, uy } = useMemo(() => {
    const zAxis = new THREE.Vector3(0, 0, 1)
    const rad = Math.PI / 4
    const run = halfSpanM
    const rise = run * Math.tan(rad)
    const L = Math.hypot(run, rise)
    const ux0 = run / L
    const uy0 = rise / L
    const dirR = new THREE.Vector3(ux0, uy0, 0).normalize()
    const dirL = new THREE.Vector3(-ux0, uy0, 0).normalize()
    return {
      quatR: new THREE.Quaternion().setFromUnitVectors(zAxis, dirR),
      quatL: new THREE.Quaternion().setFromUnitVectors(zAxis, dirL),
      len: L,
      ux: ux0,
      uy: uy0,
    }
  }, [halfSpanM])

  return (
    <group position={[0, pivotY, 0]}>
      <mesh
        position={[ux * len * 0.5, uy * len * 0.5, 0]}
        quaternion={quatR}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.0325, 0.025, len]} />
        <meshStandardMaterial color={metal} roughness={0.72} metalness={0.14} />
      </mesh>
      <mesh
        position={[-ux * len * 0.5, uy * len * 0.5, 0]}
        quaternion={quatL}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.0325, 0.025, len]} />
        <meshStandardMaterial color={metal} roughness={0.72} metalness={0.14} />
      </mesh>
    </group>
  )
}

function Swinger3D({ t }: { t: Target }) {
  const field = useStageFieldM()
  const [x, , z] = stageToThreeXZ(t.position, field)
  const faceDepth = 0.052
  /** Висота стійки й шарніра: балка в одній площині z=0 з віссю стійки (як на 2D плані pivot у (0, barY)). */
  const postH = 1.05
  const armY = postH - 0.03
  const metal = '#171717'
  const isDouble = t.type === 'swingerDoublePaper' || t.type === 'swingerDoubleCeramic'
  const centers2d = swingerFaceCentersLocal(t)
  const d = SWINGER_DIM.doubleHalf
  const armLen = SWINGER_DIM.singleArmLen

  return (
    <group position={[x, 0, z]} rotation={[0, t.rotationRad, 0]}>
      <mesh position={[0, 0.02, 0]} rotation={[0, Math.PI / 4, 0]} castShadow receiveShadow>
        <boxGeometry args={[SWINGER_DIM.baseL * 2.6, 0.0175, 0.0275]} />
        <meshStandardMaterial color={metal} roughness={0.78} metalness={0.12} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[0, -Math.PI / 4, 0]} castShadow receiveShadow>
        <boxGeometry args={[SWINGER_DIM.baseL * 2.6, 0.0175, 0.0275]} />
        <meshStandardMaterial color={metal} roughness={0.78} metalness={0.12} />
      </mesh>

      <mesh position={[0, postH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.035, postH, 0.035]} />
        <meshStandardMaterial color={metal} roughness={0.76} metalness={0.1} />
      </mesh>

      {isDouble ? (
        <>
          <SwingerDoubleVArms3D pivotY={armY} halfSpanM={d} metal={metal} />
          <mesh position={[0, armY - 0.11, 0]} castShadow receiveShadow>
            <sphereGeometry args={[0.024, 14, 14]} />
            <meshStandardMaterial color="#0a0a0a" roughness={0.65} metalness={0.2} />
          </mesh>
        </>
      ) : (
        <mesh position={[0, armY, -armLen / 2]} castShadow receiveShadow>
          <boxGeometry args={[0.0275, 0.0275, armLen + 0.05]} />
          <meshStandardMaterial color={metal} roughness={0.72} metalness={0.14} />
        </mesh>
      )}

      {centers2d.map((c, i) => {
        const { lx, lz } = swingerFaceLocalToThreeXZ(c)
        const faceCenterY = isDouble ? armY + d : armY
        return swingerIsPaperLoad(t.type) ? (
          <SwingerFacePaper3D
            key={i}
            t={t}
            faceDepth={faceDepth}
            faceCenterY={faceCenterY}
            lx={lx}
            lz={lz}
          />
        ) : (
          <SwingerFaceCeramic3D
            key={i}
            t={t}
            faceDepth={faceDepth}
            faceCenterY={faceCenterY}
            lx={lx}
            lz={lz}
          />
        )
      })}
    </group>
  )
}

/** Нижній край паперового лиця в 3D — на цій висоті (метал/кераміка лишаються низько). */
const PAPER_TARGET_STAND_HEIGHT_M = 1

function Target3D({ t }: { t: Target }) {
  const field = useStageFieldM()
  const [x, , z] = stageToThreeXZ(t.position, field)
  const c = targetColor(t)
  const { w, h } = targetFaceSizeM(t)
  const standH =
    t.type === 'paperIpsc' || t.type === 'paperA4' || t.type === 'paperMiniIpsc'
      ? PAPER_TARGET_STAND_HEIGHT_M
      : isSquareSteelPlateTargetType(t.type)
        ? steelPlateStandHeightM(t.type)
        : 0.1
  const faceDepth = 0.052
  const isMiniPop = t.type === 'miniPopper'

  const ceramicR = t.type === 'ceramicPlate' ? Math.min(w, h) / 2 : 0
  const ceramicMinY = -ceramicR

  const popperOutline = useMemo(() => {
    if (t.type !== 'popper' && t.type !== 'miniPopper') return null
    return popperSilhouetteLocal(isMiniPop)
  }, [t.type, isMiniPop])
  const popperMinY = popperOutline ? outlineMinY(popperOutline) : 0
  const popperBaseGeo = useMemo(() => {
    if (t.type !== 'popper' && t.type !== 'miniPopper') return null
    return extrudeOutlineGeometry(popperBaseOnlyLocal(isMiniPop), faceDepth)
  }, [t.type, isMiniPop, faceDepth])

  const steelFaceMinY = isSquareSteelPlateTargetType(t.type) ? -h / 2 : 0

  const paperOutline = useMemo(() => targetFaceOutlineLocalMForType(t.type), [t.type])

  const paperFaceGeo = useMemo(() => {
    if (!paperOutline) return null
    return extrudeOutlineGeometry(paperOutline, faceDepth)
  }, [paperOutline, faceDepth])

  const paperMinY = paperOutline ? outlineMinY(paperOutline) : 0

  if (isSwingerTargetType(t.type)) {
    return <Swinger3D t={t} />
  }

  if (t.type === 'ceramicPlate') {
    const yFace = standH - ceramicMinY
    return (
      <group position={[x, 0, z]} rotation={[0, t.rotationRad, 0]}>
        <TargetStandPost standH={standH} />
        <group position={[0, yFace, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[ceramicR, ceramicR, faceDepth, 40]} />
            <meshStandardMaterial color={c} roughness={0.42} metalness={0.12} />
          </mesh>
        </group>
        <MetalPedestal3D t={t} standH={standH} faceMinY={ceramicMinY} />
      </group>
    )
  }

  if (t.type === 'popper' || t.type === 'miniPopper') {
    const hc = popperHeadCenterLocal(isMiniPop)
    const r = popperHeadRadiusM(isMiniPop)
    const yGroup = standH - popperMinY
    const headMat = t.isNoShoot ? '#fb7185' : '#9ca3af'
    const baseMat = t.isNoShoot ? '#fecaca' : '#f5f0e8'
    return (
      <group position={[x, 0, z]} rotation={[0, t.rotationRad, 0]}>
        <TargetStandPost standH={standH} />
        <group position={[0, yGroup, 0]}>
          {popperBaseGeo && (
            <mesh geometry={popperBaseGeo} castShadow receiveShadow>
              <meshStandardMaterial color={baseMat} roughness={0.55} metalness={0.08} />
            </mesh>
          )}
          <mesh position={[hc.x, hc.y, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[r, r, faceDepth + 0.012, 36]} />
            <meshStandardMaterial color={headMat} roughness={0.48} metalness={0.14} />
          </mesh>
        </group>
      </group>
    )
  }

  if (isSquareSteelPlateTargetType(t.type)) {
    return (
      <group position={[x, 0, z]} rotation={[0, t.rotationRad, 0]}>
        <TargetStandPost standH={standH} />
        <group position={[0, standH - steelFaceMinY, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[w, h, faceDepth]} />
            <meshStandardMaterial
              color={c}
              roughness={t.isNoShoot ? 0.55 : 0.38}
              metalness={0.2}
            />
          </mesh>
        </group>
        <MetalPedestal3D t={t} standH={standH} faceMinY={steelFaceMinY} />
      </group>
    )
  }

  if (paperFaceGeo) {
    return (
      <group position={[x, 0, z]} rotation={[0, t.rotationRad, 0]}>
        <TargetStandPost standH={standH} />
        <group position={[0, standH - paperMinY, 0]}>
          <mesh geometry={paperFaceGeo} castShadow receiveShadow>
            <meshStandardMaterial
              color={c}
              roughness={t.isNoShoot ? 0.55 : 0.42}
              metalness={t.isNoShoot ? 0.12 : 0.08}
            />
          </mesh>
        </group>
      </group>
    )
  }

  return (
    <group position={[x, 0, z]} rotation={[0, t.rotationRad, 0]}>
      <TargetStandPost standH={standH} />
      <mesh position={[0, standH + h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, h, faceDepth]} />
        <meshStandardMaterial
          color={c}
          roughness={t.isNoShoot ? 0.55 : 0.42}
          metalness={t.isNoShoot ? 0.12 : 0.08}
        />
      </mesh>
    </group>
  )
}

function useShieldGridTexture(W: number, h: number) {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const g = canvas.getContext('2d')!
    g.clearRect(0, 0, 256, 256)
    g.fillStyle = 'rgba(190, 238, 210, 0.22)'
    g.fillRect(0, 0, 256, 256)
    g.strokeStyle = 'rgba(32, 118, 68, 0.9)'
    g.lineWidth = 1.25
    const cell = 11
    for (let i = 0; i <= 256; i += cell) {
      g.beginPath()
      g.moveTo(i, 0)
      g.lineTo(i, 256)
      g.stroke()
      g.beginPath()
      g.moveTo(0, i)
      g.lineTo(256, i)
      g.stroke()
    }
    const t = new THREE.CanvasTexture(canvas)
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(Math.max(3.5, W / 0.17), Math.max(5, h / 0.17))
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [W, h])
}

const shieldFrameMat = {
  color: '#0a0a0a',
  roughness: 0.88,
  metalness: 0.06,
} as const

const doorHandleMat = {
  color: '#e2e5ea',
  metalness: 0.65,
  roughness: 0.26,
} as const

/** Щит або двері: та сама рамка; всередині сітка або суцільна дерев’яна панель. */
function ShieldBarrier3D({
  p,
  x,
  z,
  innerFill,
}: {
  p: Prop
  x: number
  z: number
  innerFill: 'grid' | 'solid'
}) {
  const h = propHeightM(p)
  const W = p.sizeM.x
  const D = p.sizeM.y
  const f = SHIELD_FRAME_SECTION_M
  const innerH = Math.max(h - 2 * f, 0.15)
  const innerW = Math.max(W - 2 * f, 0.15)
  const gridTex = useShieldGridTexture(W, h)
  useEffect(() => () => gridTex.dispose(), [gridTex])
  const zPanel = Math.max(0.004, D * 0.12)

  return (
    <group position={[x, 0, z]} rotation={[0, p.rotationRad, 0]}>
      <mesh position={[0, f / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[W, f, D]} />
        <meshStandardMaterial {...shieldFrameMat} />
      </mesh>
      <mesh position={[0, h - f / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[W, f, D]} />
        <meshStandardMaterial {...shieldFrameMat} />
      </mesh>
      <mesh position={[-W / 2 + f / 2, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[f, innerH, D]} />
        <meshStandardMaterial {...shieldFrameMat} />
      </mesh>
      <mesh position={[W / 2 - f / 2, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[f, innerH, D]} />
        <meshStandardMaterial {...shieldFrameMat} />
      </mesh>
      {innerFill === 'grid' ? (
        <mesh position={[0, h / 2, zPanel]} receiveShadow castShadow={false}>
          <planeGeometry args={[innerW, innerH]} />
          <meshStandardMaterial
            map={gridTex}
            color="#daf5e3"
            transparent
            opacity={0.62}
            metalness={0.02}
            roughness={0.42}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ) : (
        <mesh position={[0, h / 2, zPanel]} castShadow receiveShadow>
          <planeGeometry args={[innerW, innerH]} />
          <meshStandardMaterial color="#5c4033" roughness={0.88} metalness={0.05} />
        </mesh>
      )}
      {innerFill === 'solid' && (
        <group position={[Math.max(innerW * 0.5 - 0.15, 0.12), 1.05, zPanel + 0.016]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.034, 0.034, 0.009, 22]} />
            <meshStandardMaterial {...doorHandleMat} />
          </mesh>
          <mesh position={[-0.056, 0, 0.012]} castShadow receiveShadow>
            <boxGeometry args={[0.12, 0.016, 0.024]} />
            <meshStandardMaterial {...doorHandleMat} />
          </mesh>
        </group>
      )}
    </group>
  )
}

/**
 * Сітка косого порту без ExtrudeGeometry/holes (у Three.js вони часто дають суцільну площину).
 * Два чотирикутники: A–TL–TR–B (верх/право) та D–BL–BR–C (низ/ліво) — разом покривають лице
 * без паралелограма A–B–C–D.
 */
function buildSlantedShieldGridBufferGeometry(innerW: number, innerH: number): THREE.BufferGeometry {
  const [A, B, C, D] = shieldPortSlantOpeningLocalM(innerW, innerH)
  const hw = innerW / 2
  const hh = innerH / 2
  const TL = { x: -hw, y: hh }
  const TR = { x: hw, y: hh }
  const BR = { x: hw, y: -hh }
  const BL = { x: -hw, y: -hh }

  const uv = (x: number, y: number): [number, number] => [
    (x + hw) / innerW,
    (y + hh) / innerH,
  ]

  const pos: number[] = []
  const uvs: number[] = []
  const idx: number[] = []
  let next = 0
  const pushTri = (
    ax: number,
    ay: number,
    bx: number,
    by: number,
    cx: number,
    cy: number,
  ) => {
    const ia = next
    next += 3
    pos.push(ax, ay, 0, bx, by, 0, cx, cy, 0)
    uvs.push(...uv(ax, ay), ...uv(bx, by), ...uv(cx, cy))
    idx.push(ia, ia + 1, ia + 2)
  }

  pushTri(A.x, A.y, TL.x, TL.y, TR.x, TR.y)
  pushTri(A.x, A.y, TR.x, TR.y, B.x, B.y)
  pushTri(D.x, D.y, BL.x, BL.y, BR.x, BR.y)
  pushTri(D.x, D.y, BR.x, BR.y, C.x, C.y)

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geo.setIndex(idx)
  geo.computeVertexNormals()
  return geo
}

/** Косий порт: сітка з вирізаним паралелограмом; планки вздовж довгих сторін (7 см від кутів по ребрах). */
function SlantedShieldPortFace3D({
  innerW,
  innerH,
  gridTex,
}: {
  innerW: number
  innerH: number
  gridTex: THREE.CanvasTexture
}) {
  const geo = useMemo(
    () => buildSlantedShieldGridBufferGeometry(innerW, innerH),
    [innerW, innerH],
  )
  useEffect(() => () => geo.dispose(), [geo])
  const gridMatProps = {
    map: gridTex,
    color: '#daf5e3',
    transparent: true,
    opacity: 0.62,
    metalness: 0.02,
    roughness: 0.42,
    side: THREE.DoubleSide,
    depthWrite: false,
  } as const
  return (
    <mesh geometry={geo} receiveShadow castShadow={false}>
      <meshStandardMaterial {...gridMatProps} />
    </mesh>
  )
}

function SlantedShieldPortPlanks3D({
  innerW,
  innerH,
  inset,
  depthAlongZ,
}: {
  innerW: number
  innerH: number
  inset: number
  depthAlongZ: number
}) {
  const segs = useMemo(() => {
    const [A, B, C, D] = shieldPortSlantOpeningLocalM(innerW, innerH, inset)
    const mk = (ax: number, ay: number, bx: number, by: number) => {
      const dx = bx - ax
      const dy = by - ay
      const len = Math.hypot(dx, dy)
      if (len < 1e-6) return null
      const quat = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(dx / len, dy / len, 0),
      )
      return {
        midX: (ax + bx) / 2,
        midY: (ay + by) / 2,
        len,
        quat,
      }
    }
    return {
      ab: mk(A.x, A.y, B.x, B.y),
      dc: mk(D.x, D.y, C.x, C.y),
    }
  }, [innerW, innerH, inset])

  const plankW = SHIELD_FRAME_SECTION_M
  const z = 0.006

  return (
    <>
      {segs.ab ? (
        <mesh
          position={[segs.ab.midX, segs.ab.midY, z]}
          quaternion={segs.ab.quat}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[plankW, segs.ab.len, depthAlongZ]} />
          <meshStandardMaterial {...shieldFrameMat} />
        </mesh>
      ) : null}
      {segs.dc ? (
        <mesh
          position={[segs.dc.midX, segs.dc.midY, z]}
          quaternion={segs.dc.quat}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[plankW, segs.dc.len, depthAlongZ]} />
          <meshStandardMaterial {...shieldFrameMat} />
        </mesh>
      ) : null}
    </>
  )
}

/** Щит із портом: 30×30 центр/двері; 30×60 низ/верх; косий — паралелограм + планки 7 см від кутів. */
function ShieldWithPortBarrier3D({ p, x, z }: { p: Prop; x: number; z: number }) {
  const h = propHeightM(p)
  const W = p.sizeM.x
  const D = p.sizeM.y
  const f = SHIELD_FRAME_SECTION_M
  const innerH = Math.max(h - 2 * f, 0.15)
  const innerW = Math.max(W - 2 * f, 0.15)
  const margin = 0.02
  const isTall = p.type === 'shieldPortLow' || p.type === 'shieldPortHigh'
  const gw = PORT_HOLE_HALF_M
  let gh = isTall ? PORT_TALL_HALF_H_M : PORT_HOLE_HALF_M
  gh = Math.min(gh, Math.max(innerH / 2 - margin, 0.05))
  let holeCy = 0
  if (p.type === 'shieldPortLow') holeCy = -innerH / 2 + gh
  else if (p.type === 'shieldPortHigh') holeCy = innerH / 2 - gh
  const g = PORT_HOLE_HALF_M

  const gridTex = useShieldGridTexture(W, h)
  useEffect(() => () => gridTex.dispose(), [gridTex])
  const zPanel = Math.max(0.004, D * 0.12)
  const zRim = zPanel + 0.004

  const gridMatProps = {
    map: gridTex,
    color: '#daf5e3',
    transparent: true,
    opacity: 0.62,
    metalness: 0.02,
    roughness: 0.42,
    side: THREE.DoubleSide,
    depthWrite: false,
  } as const

  const isSlanted = p.type === 'shieldPortSlanted'
  const isDoor = p.type === 'shieldWithPortDoor'
  const yHoleBot = holeCy - gh
  const yHoleTop = holeCy + gh
  const wLr = innerW / 2 - gw
  const xLeft = -innerW / 2 + wLr / 2
  const xRight = innerW / 2 - wLr / 2
  const bottomStripH = yHoleBot + innerH / 2
  const bottomStripCy = (-innerH / 2 + yHoleBot) / 2
  const topStripH = innerH / 2 - yHoleTop
  const topStripCy = (yHoleTop + innerH / 2) / 2

  return (
    <group position={[x, 0, z]} rotation={[0, p.rotationRad, 0]}>
      <mesh position={[0, f / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[W, f, D]} />
        <meshStandardMaterial {...shieldFrameMat} />
      </mesh>
      <mesh position={[0, h - f / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[W, f, D]} />
        <meshStandardMaterial {...shieldFrameMat} />
      </mesh>
      <mesh position={[-W / 2 + f / 2, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[f, innerH, D]} />
        <meshStandardMaterial {...shieldFrameMat} />
      </mesh>
      <mesh position={[W / 2 - f / 2, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[f, innerH, D]} />
        <meshStandardMaterial {...shieldFrameMat} />
      </mesh>
      <group position={[0, h / 2, zPanel]}>
        {isSlanted ? (
          <>
            <SlantedShieldPortFace3D innerW={innerW} innerH={innerH} gridTex={gridTex} />
            <SlantedShieldPortPlanks3D
              innerW={innerW}
              innerH={innerH}
              inset={SHIELD_PORT_SLANT_INSET_M}
              depthAlongZ={Math.max(0.008, D * 0.14)}
            />
          </>
        ) : (
          <>
            <mesh position={[0, bottomStripCy, 0]} receiveShadow castShadow={false}>
              <planeGeometry args={[innerW, Math.max(bottomStripH, 0.01)]} />
              <meshStandardMaterial {...gridMatProps} />
            </mesh>
            <mesh position={[0, topStripCy, 0]} receiveShadow castShadow={false}>
              <planeGeometry args={[innerW, Math.max(topStripH, 0.01)]} />
              <meshStandardMaterial {...gridMatProps} />
            </mesh>
            <mesh position={[xLeft, holeCy, 0]} receiveShadow castShadow={false}>
              <planeGeometry args={[wLr, 2 * gh]} />
              <meshStandardMaterial {...gridMatProps} />
            </mesh>
            <mesh position={[xRight, holeCy, 0]} receiveShadow castShadow={false}>
              <planeGeometry args={[wLr, 2 * gh]} />
              <meshStandardMaterial {...gridMatProps} />
            </mesh>
            {isDoor ? (
              <group position={[0, holeCy, 0.016]}>
                <mesh receiveShadow castShadow>
                  <planeGeometry args={[2 * g, 2 * g]} />
                  <meshStandardMaterial color="#5c4033" roughness={0.88} metalness={0.05} />
                </mesh>
                <group position={[g * 0.38, 0, 0.012]}>
                  <mesh rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
                    <cylinderGeometry args={[0.028, 0.028, 0.008, 20]} />
                    <meshStandardMaterial {...doorHandleMat} />
                  </mesh>
                  <mesh position={[-0.045, 0, 0.01]} castShadow receiveShadow>
                    <boxGeometry args={[0.1, 0.014, 0.022]} />
                    <meshStandardMaterial {...doorHandleMat} />
                  </mesh>
                </group>
              </group>
            ) : null}
          </>
        )}
      </group>
      {!isSlanted ? (
        <group position={[0, h / 2, zRim]}>
          <mesh position={[0, holeCy + gh + f / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[2 * gw + 2 * f, f, D * 0.15]} />
            <meshStandardMaterial {...shieldFrameMat} />
          </mesh>
          <mesh position={[0, holeCy - gh - f / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[2 * gw + 2 * f, f, D * 0.15]} />
            <meshStandardMaterial {...shieldFrameMat} />
          </mesh>
          <mesh position={[-gw - f / 2, holeCy, 0]} castShadow receiveShadow>
            <boxGeometry args={[f, 2 * gh, D * 0.15]} />
            <meshStandardMaterial {...shieldFrameMat} />
          </mesh>
          <mesh position={[gw + f / 2, holeCy, 0]} castShadow receiveShadow>
            <boxGeometry args={[f, 2 * gh, D * 0.15]} />
            <meshStandardMaterial {...shieldFrameMat} />
          </mesh>
        </group>
      ) : null}
    </group>
  )
}

function ChainCylinder3D({
  ax,
  ay,
  az,
  bx,
  by,
  bz,
  radius,
}: {
  ax: number
  ay: number
  az: number
  bx: number
  by: number
  bz: number
  radius: number
}) {
  const { mid, quat, len } = useMemo(() => {
    const va = new THREE.Vector3(ax, ay, az)
    const vb = new THREE.Vector3(bx, by, bz)
    const dir = vb.clone().sub(va)
    const len = Math.max(dir.length(), 1e-6)
    const mid = va.clone().add(vb).multiplyScalar(0.5)
    const quat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.clone().normalize(),
    )
    return { mid, quat, len }
  }, [ax, ay, az, bx, by, bz])
  return (
    <mesh position={mid} quaternion={quat} castShadow receiveShadow>
      <cylinderGeometry args={[radius, radius, len, 6]} />
      <meshStandardMaterial color="#525c6b" metalness={0.38} roughness={0.52} />
    </mesh>
  )
}

function Seesaw3D({ p, x, z }: { p: Prop; x: number; z: number }) {
  const L = p.sizeM.x
  const W = p.sizeM.y
  const pipeR = SEESAW_PIPE_RADIUS_M
  const pipeLen = W + 0.04
  const plankT = 0.045
  /** Планка лежить зверху на циліндрі (нижній торець на y = 2r); обертання навколо осі циліндра. */
  const tiltZ = 0.11
  const yPivot = pipeR
  const yPlankCenterAbovePivot = pipeR + plankT / 2
  return (
    <group position={[x, 0, z]} rotation={[0, p.rotationRad, 0]}>
      <mesh position={[0, yPivot, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[pipeR, pipeR, pipeLen, 22]} />
        <meshStandardMaterial color="#8a9099" metalness={0.42} roughness={0.44} />
      </mesh>
      <group position={[0, yPivot, 0]} rotation={[0, 0, tiltZ]}>
        <mesh position={[0, yPlankCenterAbovePivot, 0]} castShadow receiveShadow>
          <boxGeometry args={[L, plankT, W]} />
          <meshStandardMaterial color="#c4a882" roughness={0.82} metalness={0.04} />
        </mesh>
      </group>
    </group>
  )
}

function MovingPlatform3D({ p, x, z }: { p: Prop; x: number; z: number }) {
  const span = p.sizeM.x
  const s = span / 2
  const d = MOVING_PLATFORM_DECK_M / 2
  const pillarR = 0.055
  const pillarH = 0.3
  const deckT = 0.06
  /** Верх настилу 20 см від землі. */
  const yDeckTop = 0.2
  const yDeck = yDeckTop - deckT / 2
  const chainR = 0.016
  /** Той самий порядок, що rectWorldCorners: SW, SE, NE, NW у локальних XZ. */
  const corners: [number, number][] = [
    [-s, -s],
    [s, -s],
    [s, s],
    [-s, s],
  ]
  const deckCorners: [number, number][] = [
    [-d, -d],
    [d, -d],
    [d, d],
    [-d, d],
  ]
  return (
    <group position={[x, 0, z]} rotation={[0, p.rotationRad, 0]}>
      {corners.map(([px, pz], i) => (
        <mesh key={`p-${i}`} position={[px, pillarH / 2, pz]} castShadow receiveShadow>
          <cylinderGeometry args={[pillarR, pillarR, pillarH, 14]} />
          <meshStandardMaterial color="#6b7280" metalness={0.28} roughness={0.62} />
        </mesh>
      ))}
      {corners.map(([px, pz], i) => {
        const [dx, dz] = deckCorners[i]!
        return (
          <ChainCylinder3D
            key={`c-${i}`}
            ax={px}
            ay={pillarH}
            az={pz}
            bx={dx}
            by={yDeck}
            bz={dz}
            radius={chainR}
          />
        )
      })}
      <mesh position={[0, yDeck, 0]} castShadow receiveShadow>
        <boxGeometry args={[MOVING_PLATFORM_DECK_M, deckT, MOVING_PLATFORM_DECK_M]} />
        <meshStandardMaterial color="#78716c" roughness={0.78} metalness={0.08} />
      </mesh>
    </group>
  )
}

function CooperTunnel3D({ p, x, z }: { p: Prop; x: number; z: number }) {
  const L = p.sizeM.x
  const W = p.sizeM.y
  const H = COOPER_TUNNEL_HEIGHT_M
  const postR = 0.026
  const railR = 0.024
  const bottomR = 0.028
  const penaltyR = 0.018
  const segs = 14
  const hx = L / 2
  const hz = W / 2
  /** Верхні й нижні рейки по ширині поля — на одній лінії з кутовими стійками (±hz). */
  const yTopRail = H - railR
  const yBottomRail = bottomR + 0.018
  const crossLenZ = 2 * hz + 2 * railR
  const woodMat = { color: '#c4b59a', roughness: 0.82, metalness: 0.06 } as const
  const penaltyMat = { color: '#dc2626', roughness: 0.58, metalness: 0.14 } as const
  const penaltyXs = cooperTunnelPenaltyPlankOffsetsXM(p)
  const postCorners: [number, number][] = [
    [-hx, -hz],
    [hx, -hz],
    [hx, hz],
    [-hx, hz],
  ]
  const cylAlongX = [0, 0, Math.PI / 2] as const
  const cylAlongZ = [Math.PI / 2, 0, 0] as const
  return (
    <group position={[x, 0, z]} rotation={[0, p.rotationRad, 0]}>
      {postCorners.map(([px, pz], i) => (
        <mesh key={i} position={[px, H / 2, pz]} castShadow receiveShadow>
          <cylinderGeometry args={[postR, postR, H, segs]} />
          <meshStandardMaterial {...woodMat} />
        </mesh>
      ))}
      <mesh position={[0, yTopRail, -hz]} rotation={cylAlongX} castShadow receiveShadow>
        <cylinderGeometry args={[railR, railR, L, segs]} />
        <meshStandardMaterial {...woodMat} />
      </mesh>
      <mesh position={[0, yTopRail, hz]} rotation={cylAlongX} castShadow receiveShadow>
        <cylinderGeometry args={[railR, railR, L, segs]} />
        <meshStandardMaterial {...woodMat} />
      </mesh>
      {penaltyXs.map((xo, i) => (
        <mesh key={`pen-${i}`} position={[xo, yTopRail, 0]} rotation={cylAlongZ} castShadow receiveShadow>
          <cylinderGeometry args={[penaltyR, penaltyR, crossLenZ, segs]} />
          <meshStandardMaterial {...penaltyMat} />
        </mesh>
      ))}
      <mesh position={[0, yBottomRail, -hz]} rotation={cylAlongX} castShadow receiveShadow>
        <cylinderGeometry args={[bottomR, bottomR, L, segs]} />
        <meshStandardMaterial {...woodMat} />
      </mesh>
      <mesh position={[0, yBottomRail, hz]} rotation={cylAlongX} castShadow receiveShadow>
        <cylinderGeometry args={[bottomR, bottomR, L, segs]} />
        <meshStandardMaterial {...woodMat} />
      </mesh>
    </group>
  )
}

/** Бічна площина-трикутник (профіль стійки): основа на верхній грані нижньої планки, вершина — центр верхньої. */
function buildWeaponRackSideTriangleGeometry(
  halfW: number,
  halfD: number,
  yBase: number,
  yTop: number,
  sign: 1 | -1,
): THREE.BufferGeometry {
  const x = sign * halfW
  const positions = new Float32Array(9)
  if (sign < 0) {
    positions.set([x, yBase, halfD, x, yBase, -halfD, x, yTop, 0])
  } else {
    positions.set([x, yBase, -halfD, x, yBase, halfD, x, yTop, 0])
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setIndex([0, 1, 2])
  geo.computeVertexNormals()
  return geo
}

/** Стійка «піраміда»: лише 2 прямокутники (низ + верхня планка) і 2 трикутники з боків. */
function WeaponRackPyramid3D({ p, x, z }: { p: Prop; x: number; z: number }) {
  const hw = p.sizeM.x / 2
  const hz = p.sizeM.y / 2
  const H = propHeightM(p)
  const t = 0.036
  const red = { color: '#e53935', roughness: 0.74, metalness: 0.06 } as const

  const halfW = hw * 0.94
  const halfD = hz * 0.92
  const yBotC = t * 0.55
  const yTopC = H - t * 0.55
  const yTriBase = yBotC + t * 0.27

  const wTop = halfW * 2 * 0.9
  const dTop = halfD * 2 * 0.88

  const triGeos = useMemo(
    () => ({
      left: buildWeaponRackSideTriangleGeometry(halfW, halfD, yTriBase, yTopC, -1),
      right: buildWeaponRackSideTriangleGeometry(halfW, halfD, yTriBase, yTopC, 1),
    }),
    [halfW, halfD, yTriBase, yTopC],
  )

  useEffect(
    () => () => {
      triGeos.left.dispose()
      triGeos.right.dispose()
    },
    [triGeos],
  )

  const triMat = { ...red, side: THREE.DoubleSide } as const

  return (
    <group position={[x, 0, z]} rotation={[0, p.rotationRad, 0]}>
      <mesh position={[0, yBotC, 0]} castShadow receiveShadow>
        <boxGeometry args={[halfW * 2, t * 0.52, halfD * 2]} />
        <meshStandardMaterial {...red} />
      </mesh>
      <mesh position={[0, yTopC, 0]} castShadow receiveShadow>
        <boxGeometry args={[wTop, t * 0.5, dTop]} />
        <meshStandardMaterial {...red} />
      </mesh>
      <mesh geometry={triGeos.left} castShadow receiveShadow>
        <meshStandardMaterial {...triMat} />
      </mesh>
      <mesh geometry={triGeos.right} castShadow receiveShadow>
        <meshStandardMaterial {...triMat} />
      </mesh>
    </group>
  )
}

/** Дерев’яний стіл: стільниця, 4 ніжки, синя смуга вздовж коротшої сторони столу (паралельно коротким краям). */
function WoodTable3D({ p, x, z }: { p: Prop; x: number; z: number }) {
  const sx = p.sizeM.x
  const sz = p.sizeM.y
  const hw = sx / 2
  const hz = sz / 2
  const tableH = WOOD_TABLE_HEIGHT_M
  const topT = 0.038
  const legH = tableH - topT
  const legW = 0.044
  const insetX = Math.min(0.11, hw * 0.32)
  const insetZ = Math.min(0.11, hz * 0.32)
  const wood = { color: '#b8925c', roughness: 0.82, metalness: 0.04 } as const
  const woodLeg = { color: '#7a5a36', roughness: 0.88, metalness: 0.03 } as const
  const blue = {
    color: '#1d4ed8',
    roughness: 0.52,
    metalness: 0.06,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  } as const
  const longIsX = sx >= sz
  const longLen = Math.max(sx, sz)
  const stripeW = Math.min(0.1, longLen * 0.085)
  const yStripe = tableH + 0.012

  return (
    <group position={[x, 0, z]} rotation={[0, p.rotationRad, 0]}>
      <mesh position={[0, tableH - topT / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[sx, topT, sz]} />
        <meshStandardMaterial {...wood} />
      </mesh>
      {longIsX ? (
        <mesh position={[0, yStripe, 0]} castShadow receiveShadow>
          <boxGeometry args={[stripeW, 0.024, sz * 0.9]} />
          <meshStandardMaterial {...blue} />
        </mesh>
      ) : (
        <mesh position={[0, yStripe, 0]} castShadow receiveShadow>
          <boxGeometry args={[sx * 0.9, 0.024, stripeW]} />
          <meshStandardMaterial {...blue} />
        </mesh>
      )}
      {([[-1, -1], [1, -1], [-1, 1], [1, 1]] as const).map(([lx, lz], i) => (
        <mesh
          key={i}
          position={[lx * (hw - insetX), legH / 2, lz * (hz - insetZ)]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[legW, legH, legW]} />
          <meshStandardMaterial {...woodLeg} />
        </mesh>
      ))}
    </group>
  )
}

function StartPosition3D({ p, x, z }: { p: Prop; x: number; z: number }) {
  const sx = p.sizeM.x
  const sy = p.sizeM.y
  const footHalfSpacing = sx * 0.28
  const footLen = sy * 0.42
  const footWid = sx * 0.24
  const y = 0.003
  const blue = {
    color: '#2563eb',
    transparent: true,
    opacity: 0.78,
    roughness: 0.92,
    metalness: 0.02,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -3,
    polygonOffsetUnits: -3,
  } as const
  return (
    <group position={[x, 0, z]} rotation={[0, p.rotationRad, 0]}>
      {[-1, 1].map((sign) => (
        <mesh
          key={sign}
          position={[sign * footHalfSpacing, y, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[footWid, footLen]} />
          <meshStandardMaterial {...blue} />
        </mesh>
      ))}
    </group>
  )
}

function Prop3D({ p }: { p: Prop }) {
  const field = useStageFieldM()
  const [x, , z] = stageToThreeXZ(p.position, field)
  const h = propHeightM(p)

  if (p.type === 'barrel') {
    const r = Math.min(p.sizeM.x, p.sizeM.y) / 2
    return (
      <StackedBlueBarrelsColumn
        position={[x, 0, z]}
        rotationY={p.rotationRad}
        radius={r}
        totalHeight={h}
        layers={5}
      />
    )
  }

  if (p.type === 'tireStack') {
    const R = Math.min(p.sizeM.x, p.sizeM.y) / 2
    const tube = Math.max(R * 0.15, 0.028)
    const layers = 4
    /* Після Rx(π/2) товщина стосу в Y ≈ 2·tube; крок трохи менший — покришки стикаються / трохи вкладаються. */
    let step = 2 * tube * 0.86
    const naturalH = 2 * tube + (layers - 1) * step
    if (naturalH > h) {
      step = (h - 2 * tube) / Math.max(1, layers - 1)
    }
    const yCenters = Array.from({ length: layers }, (_, i) => tube + i * step)
    return (
      <group position={[x, 0, z]} rotation={[0, p.rotationRad, 0]}>
        {yCenters.map((yc, i) => (
          <mesh
            key={i}
            position={[0, yc, 0]}
            rotation={[Math.PI / 2, 0, 0]}
            castShadow
            receiveShadow
          >
            <torusGeometry args={[R, tube, 10, 28]} />
            <meshStandardMaterial color="#0f172a" roughness={0.88} metalness={0.06} />
          </mesh>
        ))}
      </group>
    )
  }

  if (p.type === 'faultLine') {
    return (
      <group position={[x, 0, z]} rotation={[0, p.rotationRad, 0]}>
        <mesh position={[0, h / 2, 0]} receiveShadow>
          <boxGeometry args={[p.sizeM.x, h, p.sizeM.y]} />
          <meshStandardMaterial color="#f97316" roughness={0.55} metalness={0.12} />
        </mesh>
      </group>
    )
  }

  if (p.type === 'shield' || p.type === 'shieldDouble') {
    return <ShieldBarrier3D p={p} x={x} z={z} innerFill="grid" />
  }

  if (isShieldWithPortFamily(p.type)) {
    return <ShieldWithPortBarrier3D p={p} x={x} z={z} />
  }

  if (p.type === 'door') {
    return <ShieldBarrier3D p={p} x={x} z={z} innerFill="solid" />
  }

  if (p.type === 'seesaw') {
    return <Seesaw3D p={p} x={x} z={z} />
  }

  if (p.type === 'movingPlatform') {
    return <MovingPlatform3D p={p} x={x} z={z} />
  }

  if (p.type === 'cooperTunnel') {
    return <CooperTunnel3D p={p} x={x} z={z} />
  }

  if (p.type === 'startPosition') {
    return <StartPosition3D p={p} x={x} z={z} />
  }

  if (p.type === 'woodTable') {
    return <WoodTable3D p={p} x={x} z={z} />
  }

  if (p.type === 'weaponRackPyramid') {
    return <WeaponRackPyramid3D p={p} x={x} z={z} />
  }

  return null
}

export const StageView3D = forwardRef<StageView3DHandle, StageView3DProps>(function StageView3D(
  { targets, props, cameraMode },
  ref,
) {
  const glRef = useRef<WebGLRenderer | null>(null)
  const sceneRef = useRef<Scene | null>(null)
  const cameraRef = useRef<PerspectiveCamera | null>(null)

  useImperativeHandle(ref, () => ({
    capturePngDataUrl: () => {
      const gl = glRef.current
      const scene = sceneRef.current
      const camera = cameraRef.current
      if (!gl?.domElement || !scene || !camera) return null
      const { x: fw, y: fh } = useStageStore.getState().fieldSizeM
      const { width: w, height: h } = pdfSnapshotPixelSize(fw, fh, 2)
      const prevW = gl.domElement.width
      const prevH = gl.domElement.height
      const prevPR = gl.getPixelRatio()
      const prevAspect = camera.aspect
      const prevFov = camera.fov
      try {
        /** Вужчий вертикальний охоплення під PDF — менше «неба», краще видно площадку при тому ж ракурсі. */
        camera.fov = 42
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        gl.setPixelRatio(1)
        gl.setSize(w, h, false)
        gl.render(scene, camera)
        return gl.domElement.toDataURL('image/png')
      } catch {
        return null
      } finally {
        camera.fov = prevFov
        camera.aspect = prevAspect
        camera.updateProjectionMatrix()
        gl.setPixelRatio(prevPR)
        gl.setSize(prevW, prevH, false)
      }
    },
  }))

  return (
    <Canvas
      className="stage-canvas-3d app__r3f-canvas-wrap"
      style={{ display: 'block' }}
      shadows
      camera={{ position: [11, 14.5, 18], fov: 48, near: 0.15, far: 240 }}
      gl={{ preserveDrawingBuffer: true, antialias: true, alpha: false }}
      dpr={[1, 1.75]}
      onCreated={({ gl, scene, camera }) => {
        glRef.current = gl
        sceneRef.current = scene
        cameraRef.current = camera instanceof PerspectiveCamera ? camera : null
        gl.setClearColor('#9fd3e8', 1)
        gl.shadowMap.type = THREE.PCFSoftShadowMap
      }}
    >
      <StageNavigator mode={cameraMode} />
      <ambientLight intensity={0.52} />
      <StageSunLight />
      <Ground />
      <PerimeterWoodWall />
      {props.map((p) => (
        <Prop3D key={p.id} p={p} />
      ))}
      {targetsDrawOrder(targets).map((t) => (
        <Target3D key={t.id} t={t} />
      ))}
    </Canvas>
  )
})
