import { Store } from '@geajs/core'
import { csvWorkerParseAdapter } from './csv-worker-client'
import {
  INVALID_CSV_EXTENSION_MESSAGE,
  isCsvFileName,
} from './domain/csv-input'
import { unknownErrorMessage } from './domain/error-message'
import { mergePersistedSelection } from './domain/channel-prefs-merge'
import type { SerializedSession } from './domain/worker-protocol'
import type { CsvParsePort } from './ports/csv-parse-port'
import type { ChannelPrefsPort } from './ports/channel-prefs-port'
import { localStorageChannelPrefs } from './adapters/local-storage-channel-prefs'

export type UiStatus = 'idle' | 'parsing' | 'ready' | 'error'

class SessionStore extends Store {
  /** Dependency inversion — allows swapping CSV backend without changing UI (OCP). */
  parser: CsvParsePort = csvWorkerParseAdapter

  /** Persisted signal selection per origin (ADR-004); swap for alternate adapters. */
  channelPrefs: ChannelPrefsPort = localStorageChannelPrefs

  status: UiStatus = 'idle'
  progressPct = 0
  errorMessage: string | null = null
  session: SerializedSession | null = null
  selectedIds: string[] = []

  get hasSession(): boolean {
    return this.session !== null && this.status === 'ready'
  }

  async loadFile(file: File): Promise<void> {
    if (!isCsvFileName(file.name)) {
      this.applyInvalidCsvError()
      return
    }

    this.beginParse()

    try {
      const session = await this.parser.parse(file, (pct) => {
        this.progressPct = pct
      })
      this.session = session
      const snapshot = this.channelPrefs.load()
      const persistedIds = snapshot?.channelIds ?? []
      this.selectedIds = mergePersistedSelection(persistedIds, session.channels)
      this.status = 'ready'
    } catch (e) {
      this.applyParseFailure(e)
    }
  }

  private applyInvalidCsvError(): void {
    this.status = 'error'
    this.errorMessage = INVALID_CSV_EXTENSION_MESSAGE
    this.session = null
  }

  private beginParse(): void {
    this.status = 'parsing'
    this.progressPct = 0
    this.errorMessage = null
    this.session = null
  }

  private applyParseFailure(e: unknown): void {
    this.status = 'error'
    this.errorMessage = unknownErrorMessage(e)
    this.session = null
  }

  setChannelSelected(id: string, selected: boolean): void {
    if (!this.session) return
    const exists = this.selectedIds.includes(id)
    if (selected && !exists) {
      this.selectedIds = [...this.selectedIds, id]
    }
    if (!selected && exists) {
      this.selectedIds = this.selectedIds.filter((x) => x !== id)
    }
    this.channelPrefs.save(this.selectedIds)
  }

  reset(): void {
    this.status = 'idle'
    this.progressPct = 0
    this.errorMessage = null
    this.session = null
    this.selectedIds = []
  }
}

export default new SessionStore()
