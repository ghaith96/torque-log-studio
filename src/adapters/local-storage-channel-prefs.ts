import type {
  ChannelPreferenceSnapshot,
  ChannelPrefsPort,
} from '../ports/channel-prefs-port'

/** Schema stored under {@link STORAGE_KEY}. */
export const CHANNEL_PREFS_SCHEMA_V = 1 as const

export const CHANNEL_PREFS_STORAGE_KEY =
  'torque-log-vis.channel-prefs.v1' as const

/** Bounds worst-case payload size (DESIGN DDD-7 / AC-X3). */
const MAX_CHANNEL_IDS = 64
const MAX_ID_CHARS = 256
/** ~few KB cap including JSON wrapper */
const MAX_JSON_CHARS = 8192

function clampIds(ids: string[]): string[] {
  const out: string[] = []
  for (const id of ids) {
    if (typeof id !== 'string') continue
    const t = id.slice(0, MAX_ID_CHARS)
    if (t.length === 0) continue
    out.push(t)
    if (out.length >= MAX_CHANNEL_IDS) break
  }
  return out
}

function parseStored(raw: string | null): ChannelPreferenceSnapshot | null {
  if (raw == null || raw === '') return null
  try {
    const parsed: unknown = JSON.parse(raw)
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('v' in parsed) ||
      !('channelIds' in parsed)
    ) {
      return null
    }
    const rec = parsed as { v: unknown; channelIds: unknown }
    if (typeof rec.v !== 'number' || rec.v !== CHANNEL_PREFS_SCHEMA_V)
      return null
    if (!Array.isArray(rec.channelIds)) return null
    const channelIds = clampIds(rec.channelIds.filter((x) => typeof x === 'string'))
    return { v: CHANNEL_PREFS_SCHEMA_V, channelIds }
  } catch {
    return null
  }
}

function storageAvailable(): boolean {
  try {
    return typeof globalThis.localStorage !== 'undefined'
  } catch {
    return false
  }
}

export function createLocalStorageChannelPrefs(
  storageKey: string = CHANNEL_PREFS_STORAGE_KEY,
): ChannelPrefsPort {
  return {
    load(): ChannelPreferenceSnapshot | null {
      if (!storageAvailable()) return null
      try {
        return parseStored(globalThis.localStorage.getItem(storageKey))
      } catch {
        return null
      }
    },

    save(channelIds: string[]): void {
      if (!storageAvailable()) return
      const payload: ChannelPreferenceSnapshot = {
        v: CHANNEL_PREFS_SCHEMA_V,
        channelIds: clampIds(channelIds),
      }
      try {
        const json = JSON.stringify(payload)
        if (json.length > MAX_JSON_CHARS) return
        globalThis.localStorage.setItem(storageKey, json)
      } catch {
        /* private mode / quota — US3 */
      }
    },
  }
}

/** Default adapter for the SPA (same origin for PWA + tab). */
export const localStorageChannelPrefs = createLocalStorageChannelPrefs()
