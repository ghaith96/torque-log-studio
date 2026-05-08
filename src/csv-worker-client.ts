import type { MainToWorker, SerializedSession, WorkerToMain } from './domain/worker-protocol'
import { PROTOCOL_V } from './domain/worker-protocol'
import type { CsvParsePort } from './ports/csv-parse-port'

function spawnCsvWorker(): Worker {
  return new Worker(new URL('./workers/csv-parse.worker.ts', import.meta.url), {
    type: 'module',
  })
}

export function parseFileWithWorker(
  file: File,
  onProgress: (pct: number) => void,
): Promise<SerializedSession> {
  return new Promise((resolve, reject) => {
    const worker = spawnCsvWorker()

    const onMessage = (ev: MessageEvent<WorkerToMain>) => {
      const msg = ev.data
      if (!msg || msg.v !== PROTOCOL_V) return
      if (msg.kind === 'progress') {
        onProgress(msg.pct)
        return
      }
      if (msg.kind === 'done') {
        cleanup()
        resolve(msg.session)
        return
      }
      if (msg.kind === 'error') {
        cleanup()
        reject(new Error(msg.message))
      }
    }

    const onError = () => {
      cleanup()
      reject(new Error('Background parsing stopped unexpectedly.'))
    }

    function cleanup() {
      worker.removeEventListener('message', onMessage)
      worker.removeEventListener('error', onError)
      worker.terminate()
    }

    worker.addEventListener('message', onMessage)
    worker.addEventListener('error', onError)

    const payload: MainToWorker = { v: PROTOCOL_V, kind: 'parse', file }
    worker.postMessage(payload)
  })
}

/** Default browser adapter — swap on `sessionStore.parser` for tests or alternate backends. */
export const csvWorkerParseAdapter: CsvParsePort = {
  parse: parseFileWithWorker,
}
