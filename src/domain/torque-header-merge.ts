import { parseNumberCell } from './torque-time'

/**
 * Torque / sloppy CSV sometimes splits `PID Name(unit)` into two columns when the delimiter
 * appears between the label and the trailing `(unit)` fragment — e.g.
 * `Absolute Throttle Position B,(%)` → headers `...B` and `(%)`. Merge those back together.
 */

export type ColumnMergeStep =
  | { kind: 'single'; src: number }
  | { kind: 'pair'; left: number; right: number }

/** Cell is only a parenthetical unit suffix like `(%)` or `(rpm)`. */
export function isOrphanUnitOnlyFragment(raw: string): boolean {
  return /^\s*\([^)]*\)\s*$/.test(raw.trim())
}

/** Lone unit token when the delimiter splits after the PID name — e.g. `Throttle B` | `%`. */
export function isBarePercentUnitColumn(raw: string): boolean {
  return raw.trim() === '%'
}

/** Header already ends with a trailing `(…)` unit/clarifier — do not merge the next column into it. */
export function hasTrailingParenthetical(raw: string): boolean {
  return /\([^)]*\)\s*$/.test(raw.trim())
}

function shouldMergeUnitSuffixColumn(prev: string, next: string): boolean {
  if (hasTrailingParenthetical(prev)) return false
  if (isOrphanUnitOnlyFragment(next)) return true
  if (isBarePercentUnitColumn(next)) return true
  return false
}

/** Join split header cells into one PID title so unit parsing sees `… (%)` again. */
export function mergeSplitHeaderCells(left: string, right: string): string {
  const l = left.trim()
  const r = right.trim()
  if (/^\([^)]*\)$/.test(r)) {
    return l + r
  }
  if (r === '%') {
    return `${l} (%)`
  }
  return l + r
}

export function buildColumnMergeSteps(headers: string[]): ColumnMergeStep[] {
  const steps: ColumnMergeStep[] = []
  let i = 0
  while (i < headers.length) {
    const cur = headers[i] ?? ''
    const nxt = headers[i + 1]
    if (nxt !== undefined && shouldMergeUnitSuffixColumn(cur, nxt)) {
      steps.push({ kind: 'pair', left: i, right: i + 1 })
      i += 2
    } else {
      steps.push({ kind: 'single', src: i })
      i += 1
    }
  }
  return steps
}

export function pickMergedDataCell(left: string, right: string): string {
  const l = parseNumberCell(left)
  const r = parseNumberCell(right)
  if (l !== null) return left.trim()
  if (r !== null) return right.trim()
  const tl = left.trim()
  const tr = right.trim()
  return tl || tr
}

export function applyMergeToHeaders(headers: string[], steps: ColumnMergeStep[]): string[] {
  const out: string[] = []
  for (const s of steps) {
    if (s.kind === 'single') {
      out.push(headers[s.src] ?? '')
    } else {
      out.push(
        mergeSplitHeaderCells(headers[s.left] ?? '', headers[s.right] ?? ''),
      )
    }
  }
  return out
}

export function applyMergeToRow(row: string[], steps: ColumnMergeStep[]): string[] {
  const out: string[] = []
  for (const s of steps) {
    if (s.kind === 'single') {
      out.push(row[s.src] ?? '')
    } else {
      out.push(pickMergedDataCell(row[s.left] ?? '', row[s.right] ?? ''))
    }
  }
  return out
}
