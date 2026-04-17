import type { ActivationEdge, Prop, StageEntityRef, Target, Vec2 } from './models'

export function refKey(r: StageEntityRef): string {
  return `${r.kind}:${r.id}`
}

export function refsEqual(a: StageEntityRef, b: StageEntityRef): boolean {
  return a.kind === b.kind && a.id === b.id
}

function sortRefsForNumbering(refs: StageEntityRef[]): StageEntityRef[] {
  const targets = refs
    .filter((r) => r.kind === 'target')
    .sort((a, b) => a.id.localeCompare(b.id))
  const props = refs
    .filter((r) => r.kind === 'prop')
    .sort((a, b) => a.id.localeCompare(b.id))
  return [...targets, ...props]
}

/** Унікальні учасники ребер; порядок нумерації — усі мішені за id, потім увесь реквізит за id. */
export function collectParticipantRefs(edges: readonly ActivationEdge[]): StageEntityRef[] {
  const m = new Map<string, StageEntityRef>()
  for (const e of edges) {
    m.set(refKey(e.from), e.from)
    m.set(refKey(e.to), e.to)
  }
  return sortRefsForNumbering([...m.values()])
}

/** Ключ `refKey` → глобальний номер 1…N. */
export function globalActivationNumberMap(edges: readonly ActivationEdge[]): Map<string, number> {
  const ordered = collectParticipantRefs(edges)
  const map = new Map<string, number>()
  ordered.forEach((r, i) => map.set(refKey(r), i + 1))
  return map
}

export function resolveEntityRef(
  ref: StageEntityRef,
  targets: readonly Target[],
  props: readonly Prop[],
): Target | Prop | null {
  if (ref.kind === 'target') return targets.find((t) => t.id === ref.id) ?? null
  return props.find((p) => p.id === ref.id) ?? null
}

/** Центр підпису на плані: позиція сутності (як у 2D). */
export function planAnchorWorld(
  ref: StageEntityRef,
  targets: readonly Target[],
  props: readonly Prop[],
): Vec2 | null {
  const e = resolveEntityRef(ref, targets, props)
  if (!e) return null
  return e.position
}

export function filterActivationsValid(
  edges: readonly ActivationEdge[],
  targets: readonly Target[],
  props: readonly Prop[],
): ActivationEdge[] {
  return edges.filter((e) => {
    if (refsEqual(e.from, e.to)) return false
    return resolveEntityRef(e.from, targets, props) && resolveEntityRef(e.to, targets, props)
  })
}

export function dedupeActivationEdges(edges: readonly ActivationEdge[]): ActivationEdge[] {
  const seen = new Set<string>()
  const out: ActivationEdge[] = []
  for (const e of edges) {
    const k = `${refKey(e.from)}->${refKey(e.to)}`
    if (seen.has(k)) continue
    seen.add(k)
    out.push(e)
  }
  return out
}

export function filterActivationsAfterRemoveTarget(
  edges: readonly ActivationEdge[],
  targetId: string,
): ActivationEdge[] {
  return edges.filter((e) => !(e.from.kind === 'target' && e.from.id === targetId) && !(e.to.kind === 'target' && e.to.id === targetId))
}

export function filterActivationsAfterRemoveProp(
  edges: readonly ActivationEdge[],
  propId: string,
): ActivationEdge[] {
  return edges.filter((e) => !(e.from.kind === 'prop' && e.from.id === propId) && !(e.to.kind === 'prop' && e.to.id === propId))
}
