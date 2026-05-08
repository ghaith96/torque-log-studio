/** Typed postMessage protocol v1 — shared by UI and csv-parse worker (ADR-002). */

export const PROTOCOL_V = 1 as const

export type SerializedChannel = {
  id: string
  name: string
  unit: string | null
  values: Float64Array
}

export type SerializedSession = {
  fileName: string
  rowCount: number
  durationSec: number
  timeSec: Float64Array
  channels: SerializedChannel[]
  warnings: string[]
}

export type WorkerToMain =
  | { v: typeof PROTOCOL_V; kind: 'progress'; pct: number }
  | { v: typeof PROTOCOL_V; kind: 'done'; session: SerializedSession }
  | {
      v: typeof PROTOCOL_V
      kind: 'error'
      code: string
      message: string
      recoverable: boolean
    }

export type MainToWorker =
  | { v: typeof PROTOCOL_V; kind: 'parse'; file: File }
