import { unknownErrorMessage } from '../domain/error-message'
import { parseTorqueCsvText } from '../domain/torque-csv'
import type { MainToWorker, WorkerToMain } from '../domain/worker-protocol'
import { PROTOCOL_V } from '../domain/worker-protocol'

function post(msg: WorkerToMain): void {
  self.postMessage(msg)
}

async function runParseJob(file: File): Promise<void> {
  try {
    const text = await file.text()
    const session = parseTorqueCsvText(text, file.name, (pct) => {
      post({ v: PROTOCOL_V, kind: 'progress', pct })
    })
    post({ v: PROTOCOL_V, kind: 'done', session })
  } catch (e) {
    const message = unknownErrorMessage(e)
    post({
      v: PROTOCOL_V,
      kind: 'error',
      code: 'PARSE_FAILED',
      message,
      recoverable: true,
    })
  }
}

self.onmessage = (ev: MessageEvent<MainToWorker>) => {
  const data = ev.data
  if (!data || data.v !== PROTOCOL_V || data.kind !== 'parse') return
  void runParseJob(data.file)
}
