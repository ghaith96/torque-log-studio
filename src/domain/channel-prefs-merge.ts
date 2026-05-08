import { initialSelectedChannelIds } from './session-selection'
import type { SerializedChannel } from './worker-protocol'

/**
 * Ordered intersection of persisted ids with current session channels.
 * If empty, fall back to {@link initialSelectedChannelIds}.
 */
export function mergePersistedSelection(
  persistedIds: string[],
  channels: SerializedChannel[],
): string[] {
  const valid = new Set(channels.map((c) => c.id))
  const intersection = persistedIds.filter((id) => valid.has(id))
  if (intersection.length > 0) return intersection
  return initialSelectedChannelIds(channels)
}
