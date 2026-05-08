/** Driven port: persisted channel id preferences (ADR-004). */

export type ChannelPreferenceSnapshot = {
  v: number
  channelIds: string[]
}

export interface ChannelPrefsPort {
  /** Returns null if missing, corrupt, or storage throws. */
  load(): ChannelPreferenceSnapshot | null
  /** Best-effort persist; errors swallowed (US3). */
  save(channelIds: string[]): void
}
