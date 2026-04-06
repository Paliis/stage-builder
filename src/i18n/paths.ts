import type { MessageTree } from './messages'

export function getMessage(tree: MessageTree, path: string): string {
  const parts = path.split('.')
  let cur: unknown = tree
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in (cur as object)) {
      cur = (cur as Record<string, unknown>)[p]
    } else {
      return path
    }
  }
  return typeof cur === 'string' ? cur : path
}
