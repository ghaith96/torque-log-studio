/** Stable id fragment from human-readable channel header text. */

export function slugForId(s: string, maxLen = 48): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, maxLen)
}
