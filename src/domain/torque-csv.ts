import {
  NUMERIC_CHANNEL_MIN_RATIO,
  PROGRESS_ROW_INTERVAL,
  SAMPLE_ROWS_FOR_HEURISTIC,
} from './torque-csv-constants'
import { detectDelimiter, normalizeHeader, splitCsvLine } from './csv-line'
import { slugForId } from './string-slug'
import {
  applyMergeToHeaders,
  applyMergeToRow,
  buildColumnMergeSteps,
} from './torque-header-merge'
import {
  guessTimeColumnIndex,
  isMonotonic,
  parseNumberCell,
  parseTimeCell,
} from './torque-time'
import type { SerializedChannel, SerializedSession } from './worker-protocol'

function reportRowPhaseProgress(
  rowIndex: number,
  rowCap: number,
  onProgress?: (pct: number) => void,
): void {
  if (!onProgress || rowIndex % PROGRESS_ROW_INTERVAL !== 0) return
  onProgress(Math.min(99, Math.round((rowIndex / Math.max(1, rowCap)) * 45)))
}

function reportColumnPhaseProgress(
  rowIndex: number,
  validTimes: number,
  onProgress?: (pct: number) => void,
): void {
  if (!onProgress || rowIndex % PROGRESS_ROW_INTERVAL !== 0) return
  onProgress(
    45 + Math.min(54, Math.round((rowIndex / Math.max(1, validTimes)) * 54)),
  )
}

export function parseTorqueCsvText(
  text: string,
  fileName: string,
  onProgress?: (pct: number) => void,
): SerializedSession {
  const warnings: string[] = []
  const trimmed = text.replace(/^\uFEFF/, '')
  if (!trimmed.trim()) {
    throw new Error('This file appears empty — try re-exporting from Torque.')
  }

  const lines = trimmed.split(/\r?\n/).filter((l) => l.length > 0)
  if (lines.length < 2) {
    throw new Error('Need a header row and at least one data row.')
  }

  const delim = detectDelimiter(lines[0]!)
  const rawHeaderCells = splitCsvLine(lines[0]!, delim).map(normalizeHeader)
  if (rawHeaderCells.length < 2) {
    throw new Error(
      'Could not find multiple columns — check delimiter (comma vs semicolon vs tab).',
    )
  }

  const columnMergeSteps = buildColumnMergeSteps(rawHeaderCells)
  const headerCells = applyMergeToHeaders(rawHeaderCells, columnMergeSteps)

  const dataLines = lines.slice(1)
  const rowCap = dataLines.length
  const sampleN = Math.min(SAMPLE_ROWS_FOR_HEURISTIC, rowCap)
  const sampleRows: string[][] = []
  for (let i = 0; i < sampleN; i++) {
    const raw = splitCsvLine(dataLines[i]!, delim)
    sampleRows.push(applyMergeToRow(raw, columnMergeSteps))
  }

  const timeIdx = guessTimeColumnIndex(headerCells, sampleRows)

  const keptRows: string[][] = []
  const absoluteTimes: number[] = []

  for (let r = 0; r < rowCap; r++) {
    reportRowPhaseProgress(r, rowCap, onProgress)
    const row = applyMergeToRow(splitCsvLine(dataLines[r]!, delim), columnMergeSteps)
    const cell = row[timeIdx] ?? ''
    const t = parseTimeCell(cell) ?? parseNumberCell(cell)
    if (t === null) continue
    keptRows.push(row)
    absoluteTimes.push(t)
  }

  const validTimes = absoluteTimes.length
  if (validTimes < 2) {
    throw new Error(
      'Could not parse a usable time column — ensure a timestamp or numeric time field is present.',
    )
  }

  const timeSlice = new Float64Array(validTimes)
  for (let i = 0; i < validTimes; i++) {
    timeSlice[i] = absoluteTimes[i]!
  }

  if (!isMonotonic(timeSlice)) {
    warnings.push('Time column was not strictly increasing; rows were kept in file order.')
  }

  const t0 = timeSlice[0]!
  const relativeSec = new Float64Array(validTimes)
  for (let i = 0; i < validTimes; i++) {
    relativeSec[i] = timeSlice[i]! - t0
  }
  const durationSec = relativeSec[validTimes - 1]! ?? 0

  const channels: SerializedChannel[] = []

  for (let c = 0; c < headerCells.length; c++) {
    if (c === timeIdx) continue
    const name = headerCells[c]!
    if (!name) continue

    let numeric = 0
    const values = new Float64Array(validTimes)
    for (let r = 0; r < validTimes; r++) {
      reportColumnPhaseProgress(r, validTimes, onProgress)
      const row = keptRows[r]!
      const raw = row[c] ?? ''
      const v = parseNumberCell(raw)
      if (v !== null) {
        numeric++
        values[r] = v
      } else {
        values[r] = NaN
      }
    }
    if (numeric / validTimes < NUMERIC_CHANNEL_MIN_RATIO) continue

    const unitMatch = name.match(/\(([^)]+)\)\s*$/)
    const unit = unitMatch ? unitMatch[1]!.trim() : null
    const displayName = unit ? name.replace(/\s*\([^)]+\)\s*$/, '').trim() || name : name
    const id = `col-${c}-${slugForId(name)}`

    channels.push({
      id,
      name: displayName,
      unit,
      values,
    })
  }

  if (channels.length === 0) {
    throw new Error(
      'No numeric channels detected — check that Torque exported numeric PID columns.',
    )
  }

  if (onProgress) onProgress(100)

  return {
    fileName,
    rowCount: validTimes,
    durationSec,
    timeSec: relativeSec,
    channels,
    warnings,
  }
}
