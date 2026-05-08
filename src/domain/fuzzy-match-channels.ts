import type { SerializedChannel } from './worker-protocol'

/** Lowercase subsequence match: every query character appears in order in haystack. */
function isSubsequenceFolded(query: string, haystackLower: string): boolean {
  if (query.length === 0) return true
  let qi = 0
  for (let i = 0; i < haystackLower.length && qi < query.length; i++) {
    if (haystackLower[i] === query[qi]) qi++
  }
  return qi === query.length
}

function channelHaystackLower(ch: SerializedChannel): string {
  const u = ch.unit ? ` ${ch.unit}` : ''
  return `${ch.name}${u}`.toLowerCase()
}

/**
 * Fuzzy filter for channel rows: whitespace-separated tokens; each token must
 * match as a case-insensitive subsequence of `name` + optional unit.
 */
export function filterChannelsFuzzy(
  channels: readonly SerializedChannel[],
  queryRaw: string,
): SerializedChannel[] {
  const tokens = queryRaw
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
  if (tokens.length === 0) return [...channels]

  return channels.filter((ch) => {
    const hay = channelHaystackLower(ch)
    return tokens.every((t) => isSubsequenceFolded(t, hay))
  })
}
