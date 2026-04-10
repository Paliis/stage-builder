import type { Prop, Target } from './models'
import { clampVec2ToField } from './field'
import { defaultPropSizeM } from './propGeometry'

/** Старі сцени: прибрати стіну/вікно; «port» перейменовано на shieldWithPort. */
function migrateProp(p: Prop): Prop | null {
  const raw = p.type as string
  if (raw === 'wall' || raw === 'window') return null
  if (raw === 'port') return { ...p, type: 'shieldWithPort' }
  if (
    p.type === 'tireStack' &&
    Math.abs(p.sizeM.x - 0.95) < 1e-3 &&
    Math.abs(p.sizeM.y - 0.95) < 1e-3
  ) {
    return { ...p, sizeM: defaultPropSizeM('tireStack') }
  }
  return p
}

/**
 * Після зміни габаритів поля — зсунути мішені й реквізит у межі (як у `stageStore.setFieldSizeM`).
 */
export function reclampTargetsProps(targets: Target[], props: Prop[], fw: number, fh: number) {
  const nextTargets = targets.map((t) => ({
    ...t,
    position: clampVec2ToField(t.position, 1, fw, fh),
  }))
  const nextProps = props
    .map(migrateProp)
    .filter((x): x is Prop => x !== null)
    .map((p) => {
      const m = Math.max(p.sizeM.x, p.sizeM.y) / 2 + 0.16
      return {
        ...p,
        position: clampVec2ToField(p.position, m, fw, fh),
      }
    })
  return { targets: nextTargets, props: nextProps }
}
