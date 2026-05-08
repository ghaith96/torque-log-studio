import type { SerializedSession } from '../domain/worker-protocol'

/** Driven port: CSV → structured session (worker or future alternatives). */
export interface CsvParsePort {
  parse(file: File, onProgress: (pct: number) => void): Promise<SerializedSession>
}
