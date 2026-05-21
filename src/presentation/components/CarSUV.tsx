import { useMemo } from 'react'
import * as THREE from 'three'

import type { DecorationCarGeometry } from '../../domain/decorationCarGeometry'
import {
  computeDecorationCarGeometry,
  DECORATION_CAR_BODY_HEX,
  DECORATION_CAR_DOOR_SEAM_CENTER_X_FRAC,
  DECORATION_CAR_SIDE_GLASS_CENTER_X_FRAC,
  DECORATION_CAR_SIDE_GLASS_LENGTH_FRAC,
} from '../../domain/decorationCarGeometry'

/** Площина лобового (не залежить від Z — пряма в XY). */
function windshieldPlane(g: DecorationCarGeometry): THREE.Plane {
  const { wsXB, wsYB, wsXT, wsYT, wsHW } = g
  const p1 = new THREE.Vector3(wsXB, wsYB, -wsHW)
  const p2 = new THREE.Vector3(wsXB, wsYB, wsHW)
  const p3 = new THREE.Vector3(wsXT, wsYT, wsHW)
  return new THREE.Plane().setFromCoplanarPoints(p1, p2, p3)
}

function planeXAtY(plane: THREE.Plane, y: number, fallbackX: number): number {
  const n = plane.normal
  const c = plane.constant
  const nx = n.x
  if (Math.abs(nx) < 1e-7) return fallbackX
  return -(n.y * y + c) / nx
}

/** Y на площині лобового, де x = xTarget (якщо є). */
function planeYAtX(plane: THREE.Plane, xTarget: number): number | null {
  const n = plane.normal
  const c = plane.constant
  const ny = n.y
  if (Math.abs(ny) < 1e-7) return null
  return -(n.x * xTarget + c) / ny
}

/**
 * Контур лівої боковини (z = −halfW), проєкція XY. Передній край — min(frontX, площина скла).
 */
function leftSideWallRingXY(
  plane: THREE.Plane,
  rearX: number,
  frontX: number,
  yBot: number,
  yTop: number,
  wsYB: number,
  fallbackX: number,
): [number, number][] {
  const eps = 2e-4
  const xAt = (yy: number) => planeXAtY(plane, yy, fallbackX)
  const xWsb = xAt(wsYB)
  const xTop = Math.min(frontX, xAt(yTop))

  const ring: [number, number][] = []
  ring.push([rearX, yBot])
  ring.push([frontX, yBot])
  ring.push([frontX, wsYB])

  if (xWsb > frontX + eps) {
    const yStar = planeYAtX(plane, frontX)
    if (yStar !== null && yStar > wsYB + eps && yStar < yTop - eps) {
      ring.push([frontX, yStar])
    }
  } else if (xWsb < frontX - eps) {
    ring.push([xWsb, wsYB])
  }

  ring.push([xTop, yTop])
  ring.push([rearX, yTop])
  return ring
}

function appendWallFromXYRing(
  positions: number[],
  indices: number[],
  zFixed: number,
  ringXY: readonly [number, number][],
  flipTriangles: boolean,
) {
  const shape = new THREE.Shape()
  shape.moveTo(ringXY[0]![0], ringXY[0]![1])
  for (let i = 1; i < ringXY.length; i++) {
    shape.lineTo(ringXY[i]![0], ringXY[i]![1])
  }
  shape.closePath()
  const sg = new THREE.ShapeGeometry(shape)
  const posAttr = sg.attributes.position as THREE.BufferAttribute
  const idx = sg.index
  const vOff = positions.length / 3
  for (let i = 0; i < posAttr.count; i++) {
    positions.push(posAttr.getX(i), posAttr.getY(i), zFixed)
  }
  if (idx) {
    for (let i = 0; i < idx.count; i += 3) {
      const a = vOff + idx.getX(i)!
      const b = vOff + idx.getX(i + 1)!
      const c = vOff + idx.getX(i + 2)!
      if (flipTriangles) indices.push(a, c, b)
      else indices.push(a, b, c)
    }
  }
  sg.dispose()
}

/** Кабіна без суцільної передньої грані під склом — інакше через прозоре лобове видно «залишок» боксу (трикутник під нахилом). */
function buildCabinShellGeometry(g: DecorationCarGeometry): THREE.BufferGeometry {
  const { cabinCX, cabinY, cabinLenInner, cabinH, cabinWid, wsYB, wsYT, wsHW } = g

  const rearX = cabinCX - cabinLenInner / 2
  const frontX = cabinCX + cabinLenInner / 2
  const yBot = cabinY - cabinH / 2
  const yTop = cabinY + cabinH / 2
  const halfW = cabinWid / 2
  const zg = Math.min(wsHW, Math.max(halfW - 1e-3, 1e-3))
  const plane = windshieldPlane(g)
  const xRoofFront = Math.min(frontX, planeXAtY(plane, yTop, g.wsXB))

  const positions: number[] = []
  const indices: number[] = []
  const v = (x: number, y: number, z: number) => {
    const i = positions.length / 3
    positions.push(x, y, z)
    return i
  }
  const quad = (a: number, b: number, c: number, d: number) => {
    indices.push(a, b, c, a, c, d)
  }

  /* Зад x = rearX, нормаль −X */
  quad(
    v(rearX, yBot, -halfW),
    v(rearX, yBot, halfW),
    v(rearX, yTop, halfW),
    v(rearX, yTop, -halfW),
  )

  /* Дах +Y — перед без нависання над склом (узгоджено з площиною лобового при даному y). */
  quad(
    v(rearX, yTop, -halfW),
    v(rearX, yTop, halfW),
    v(xRoofFront, yTop, halfW),
    v(xRoofFront, yTop, -halfW),
  )

  /* Підлога −Y */
  quad(
    v(rearX, yBot, halfW),
    v(rearX, yBot, -halfW),
    v(frontX, yBot, -halfW),
    v(frontX, yBot, halfW),
  )

  /* Боковини: зріз переднього краю по площині скла (прибирає «вуха» та стикування з дахом). */
  const leftRing = leftSideWallRingXY(plane, rearX, frontX, yBot, yTop, wsYB, g.wsXB)
  appendWallFromXYRing(positions, indices, -halfW, leftRing, true)
  appendWallFromXYRing(positions, indices, halfW, leftRing, false)

  /* Перед x = frontX: нижня смуга + бічні стійки лише до wsYT (без площини над склом). */

  if (zg + 1e-4 < halfW) {
    quad(
      v(frontX, yBot, -halfW),
      v(frontX, yBot, -zg),
      v(frontX, wsYB, -zg),
      v(frontX, wsYB, -halfW),
    )
    quad(
      v(frontX, wsYB, -halfW),
      v(frontX, wsYB, -zg),
      v(frontX, wsYT, -zg),
      v(frontX, wsYT, -halfW),
    )

    quad(
      v(frontX, yBot, zg),
      v(frontX, yBot, halfW),
      v(frontX, wsYB, halfW),
      v(frontX, wsYB, zg),
    )
    quad(
      v(frontX, wsYB, zg),
      v(frontX, wsYB, halfW),
      v(frontX, wsYT, halfW),
      v(frontX, wsYT, zg),
    )
  }

  const eps = 2e-4
  if (wsYB > yBot + eps) {
    quad(
      v(frontX, yBot, -zg),
      v(frontX, yBot, zg),
      v(frontX, wsYB, zg),
      v(frontX, wsYB, -zg),
    )
  }

  const geom = new THREE.BufferGeometry()
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geom.setIndex(indices)
  geom.computeVertexNormals()
  return geom
}

export type CarSUVProps = {
  lengthM: number
  widthM: number
  heightM: number
  /** Основний колір кузова (матовий металік). */
  bodyColor?: string
}

/**
 * Процедурний середній SUV з примітивів R3F. Якір групи: центр сліду на землі (Y=0).
 */
export function CarSUV({ lengthM, widthM, heightM, bodyColor = DECORATION_CAR_BODY_HEX }: CarSUVProps) {
  const g = useMemo(
    () => computeDecorationCarGeometry(lengthM, widthM, heightM),
    [lengthM, widthM, heightM],
  )

  const windshieldGeom = useMemo(() => {
    const { wsXB, wsXT, wsYB, wsYT, wsHW } = g
    const geom = new THREE.BufferGeometry()
    const positions = new Float32Array([
      /* два трикутники, нормаль уздовж +Y× cross для верхньої видимості з переду */
      wsXB,
      wsYB,
      -wsHW,
      wsXB,
      wsYB,
      wsHW,
      wsXT,
      wsYT,
      wsHW,
      wsXB,
      wsYB,
      -wsHW,
      wsXT,
      wsYT,
      wsHW,
      wsXT,
      wsYT,
      -wsHW,
    ])
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geom.computeVertexNormals()
    return geom
  }, [g])

  const cabinShellGeom = useMemo(() => buildCabinShellGeometry(g), [g])

  const bodyMat = {
    color: bodyColor,
    roughness: 0.58,
    metalness: 0.26,
  } as const
  const cabinMat = {
    color: bodyColor,
    roughness: 0.52,
    metalness: 0.3,
  } as const
  const bumperMat = {
    color: '#1e293b',
    roughness: 0.72,
    metalness: 0.35,
  } as const
  const rubberMat = { color: '#141414', roughness: 0.92, metalness: 0.04 } as const

  const glassWindshieldMat = useMemo(
    () =>
      ({
        color: '#eaf6ff',
        transparent: true,
        opacity: 0.4,
        roughness: 0.05,
        metalness: 0.12,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -1,
        side: THREE.DoubleSide,
      }) as const,
    [],
  )

  const glassSideMat = useMemo(
    () =>
      ({
        color: '#c8e2fb',
        transparent: true,
        opacity: 0.48,
        roughness: 0.12,
        metalness: 0.06,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      }) as const,
    [],
  )

  /** Обідка фари + яскравіша лінза (краще видно в сцені з тінями). */
  const headlightBezelMat = useMemo(
    () =>
      ({
        color: '#475569',
        roughness: 0.45,
        metalness: 0.55,
      }) as const,
    [],
  )

  const headlightLensMat = useMemo(
    () =>
      ({
        color: '#ffffff',
        roughness: 0.18,
        metalness: 0.65,
        emissive: '#fffef0',
        emissiveIntensity: 0.42,
      }) as const,
    [],
  )

  const taillightMat = useMemo(
    () =>
      ({
        color: '#e11d48',
        roughness: 0.32,
        metalness: 0.28,
        emissive: '#7f0d24',
        emissiveIntensity: 0.38,
      }) as const,
    [],
  )

  /** Лінії дверей / темніший штрих по боках кабіни */
  const doorLineMat = useMemo(
    () =>
      ({
        color: '#0f172a',
        roughness: 0.88,
        metalness: 0.08,
      }) as const,
    [],
  )

  const zw = g.cabinWid / 2 + 0.006

  return (
    <group>
      {/* Нижній кузов */}
      <mesh position={[0, g.chassisY, 0]} castShadow receiveShadow>
        <boxGeometry args={[g.chassisLen, g.chassisH, g.chassisWid]} />
        <meshStandardMaterial {...bodyMat} />
      </mesh>

      {/* Передній бампер */}
      <mesh
        position={[g.chassisHalf + g.bumperProtrude / 2, g.bumperY, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[g.bumperProtrude, g.bumperH, g.chassisWid * 0.98]} />
        <meshStandardMaterial {...bumperMat} />
      </mesh>

      {/* Задній бампер */}
      <mesh
        position={[-g.chassisHalf - g.bumperProtrude / 2, g.bumperY, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[g.bumperProtrude, g.bumperH, g.chassisWid * 0.98]} />
        <meshStandardMaterial {...bumperMat} />
      </mesh>

      {/* Кабіна: оболонка з вирізом під лобове (без суцільної передньої площини під склом). */}
      <mesh geometry={cabinShellGeom} castShadow receiveShadow>
        <meshStandardMaterial {...cabinMat} />
      </mesh>

      {/* Лобове скло — нахилена площина */}
      <mesh geometry={windshieldGeom} receiveShadow>
        <meshStandardMaterial {...glassWindshieldMat} />
      </mesh>

      {/* Бокові вікна */}
      <mesh
        position={[
          g.cabinCX + g.cabinLenInner * DECORATION_CAR_SIDE_GLASS_CENTER_X_FRAC,
          g.cabinY,
          g.cabinWid / 2 - g.glassT / 2,
        ]}
        receiveShadow
      >
        <boxGeometry args={[g.cabinLenInner * DECORATION_CAR_SIDE_GLASS_LENGTH_FRAC, g.cabinH * 0.55, g.glassT]} />
        <meshStandardMaterial {...glassSideMat} />
      </mesh>
      <mesh
        position={[
          g.cabinCX + g.cabinLenInner * DECORATION_CAR_SIDE_GLASS_CENTER_X_FRAC,
          g.cabinY,
          -g.cabinWid / 2 + g.glassT / 2,
        ]}
        receiveShadow
      >
        <boxGeometry args={[g.cabinLenInner * DECORATION_CAR_SIDE_GLASS_LENGTH_FRAC, g.cabinH * 0.55, g.glassT]} />
        <meshStandardMaterial {...glassSideMat} />
      </mesh>

      {/* Розділювач передніх / задніх дверей (B-подібний шов) — обидві сторони */}
      {([-1, 1] as const).map((sign) => (
        <mesh
          key={`door-${sign}`}
          position={[
            g.cabinCX + g.cabinLenInner * DECORATION_CAR_DOOR_SEAM_CENTER_X_FRAC,
            g.cabinY,
            sign * zw,
          ]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[0.04 * g.sx, g.cabinH * 0.68, 0.022 * g.sz]} />
          <meshStandardMaterial {...doorLineMat} />
        </mesh>
      ))}

      {/* Ручки дверей — маленькі цятки */}
      {([
        [0.28, 1],
        [-0.22, 1],
        [0.28, -1],
        [-0.22, -1],
      ] as const).map(([fx, szSign], i) => (
        <mesh
          key={`handle-${i}`}
          position={[
            g.cabinCX + g.cabinLenInner * fx,
            g.cabinY - g.cabinH * 0.05,
            szSign * (g.cabinWid / 2 + 0.014),
          ]}
          castShadow
        >
          <boxGeometry args={[0.08 * g.sx, 0.032 * g.sy, 0.05 * g.sz]} />
          <meshStandardMaterial {...bumperMat} />
        </mesh>
      ))}

      {/* Колеса */}
      {(
        [
          [g.axleFrontX, g.wheelZ],
          [g.axleFrontX, -g.wheelZ],
          [g.axleRearX, g.wheelZ],
          [g.axleRearX, -g.wheelZ],
        ] as const
      ).map(([wx, wz], i) => (
        <mesh
          key={i}
          position={[wx, g.wheelY, wz]}
          rotation={[Math.PI / 2, 0, 0]}
          castShadow
          receiveShadow
        >
          <cylinderGeometry args={[g.r, g.r, g.tread, 22]} />
          <meshStandardMaterial {...rubberMat} />
        </mesh>
      ))}

      {/* Передні фари: обідка + лінза */}
      {([-1, 1] as const).map((sign) => (
        <group key={`hl-${sign}`} position={[g.hlX, g.hlY, sign * g.hlZ]}>
          <mesh castShadow position={[0.025 * g.sx, 0, 0]}>
            <boxGeometry args={[0.055 * g.sx, 0.16 * g.sy, 0.22 * g.sz]} />
            <meshStandardMaterial {...headlightBezelMat} />
          </mesh>
          <mesh castShadow position={[0.052 * g.sx, 0, 0]}>
            <boxGeometry args={[0.035 * g.sx, 0.11 * g.sy, 0.16 * g.sz]} />
            <meshStandardMaterial {...headlightLensMat} />
          </mesh>
        </group>
      ))}

      {/* Задні ліхтарі */}
      {([-1, 1] as const).map((sign) => (
        <mesh
          key={`tl-${sign}`}
          position={[g.tlX, g.tlY, sign * g.tlZ]}
          castShadow
        >
          <boxGeometry args={[0.09 * g.sx, 0.14 * g.sy, 0.2 * g.sz]} />
          <meshStandardMaterial {...taillightMat} />
        </mesh>
      ))}
    </group>
  )
}
