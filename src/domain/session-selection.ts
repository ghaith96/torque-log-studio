import type { SerializedChannel } from './worker-protocol'

/** Default number of channels shown after import — balances clutter vs insight */
export const DEFAULT_VISIBLE_CHANNEL_COUNT = 4

export function initialSelectedChannelIds(channels: SerializedChannel[]): string[] {
  const n = Math.min(DEFAULT_VISIBLE_CHANNEL_COUNT, channels.length)
  return channels.slice(0, n).map((c) => c.id)
}
