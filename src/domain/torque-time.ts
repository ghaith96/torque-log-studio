import { normalizeHeader } from './csv-line'
import {
  MONOTONIC_EPS,
  TIME_HEADER_KEYWORDS,
  UNIX_MS_LOWER_BOUND,
  UNIX_SUB_MS_LOWER_BOUND,
} from './torque-csv-constants'

export function parseTimeCell(raw: string): number | null {
  const t = raw.trim()
  if (!t) return null
  const normalized = t.replace(',', '.')
  const n = Number(normalized)
  if (Number.isFinite(n)) {
    return normalizeNumericEpochSeconds(n)
  }
  const ms = Date.parse(t)
  if (!Number.isNaN(ms)) return ms / 1000
  const m = t.match(/^(\d+):(\d+):(\d+(?:[.,]\d+)?)$/)
  if (m) {
    const h = Number(m[1])
    const mi = Number(m[2])
    const se = Number(String(m[3]).replace(',', '.'))
    if ([h, mi, se].every(Number.isFinite)) {
      return h * 3600 + mi * 60 + se
    }
  }
  return null
}

export function parseNumberCell(raw: string): number | null {
  const t = raw.trim()
  if (!t || t === '-') return null
  const n = Number(t.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

/** Interpret plain numeric cell as seconds or epoch-ms → seconds. */
export function normalizeNumericEpochSeconds(n: number): number {
  if (Math.abs(n) > UNIX_SUB_MS_LOWER_BOUND) return n / 1000
  if (Math.abs(n) > UNIX_MS_LOWER_BOUND && Math.abs(n) <= UNIX_SUB_MS_LOWER_BOUND) {
    return n / 1000
  }
  return n
}

export function guessTimeColumnIndex(headers: string[], sampleRows: string[][]): number {
  const lower = headers.map((h) => normalizeHeader(h).toLowerCase())
  for (let c = 0; c < lower.length; c++) {
    const h = lower[c]!
    if (TIME_HEADER_KEYWORDS.some((k) => h.includes(k))) return c
  }
  let bestCol = 0
  let bestScore = -1
  for (let c = 0; c < headers.length; c++) {
    let ok = 0
    let total = 0
    for (const row of sampleRows) {
      const cell = row[c]
      if (cell === undefined) continue
      total++
      if (parseTimeCell(cell) !== null || parseNumberCell(cell) !== null) ok++
    }
    const score = total ? ok / total : 0
    if (score > bestScore) {
      bestScore = score
      bestCol = c
    }
  }
  return bestCol
}

export function isMonotonic(arr: Float64Array, eps = MONOTONIC_EPS): boolean {
  for (let i = 1; i < arr.length; i++) {
    if (arr[i]! < arr[i - 1]! - eps) return false
  }
  return true
}
