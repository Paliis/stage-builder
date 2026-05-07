/**
 * Inserts BBCode pair at selection; if nothing selected, inserts open+placeholder+close
 * and returns a range to select the placeholder (or empty range after close if no placeholder).
 */
export function wrapBbCode(
  value: string,
  selStart: number,
  selEnd: number,
  open: string,
  close: string,
  emptyInner = '',
): { text: string; selStart: number; selEnd: number } {
  const a = Math.min(selStart, selEnd)
  const b = Math.max(selStart, selEnd)
  const selected = value.slice(a, b)
  if (selected) {
    const text = value.slice(0, a) + open + selected + close + value.slice(b)
    const pos = a + open.length + selected.length + close.length
    return { text, selStart: pos, selEnd: pos }
  }
  const text = value.slice(0, a) + open + emptyInner + close + value.slice(b)
  const i0 = a + open.length
  const i1 = i0 + emptyInner.length
  return { text, selStart: i0, selEnd: i1 }
}
