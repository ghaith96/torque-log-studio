/** RFC4180-style CSV line splitting + delimiter inference (single responsibility). */

export type CsvDelimiter = ',' | ';' | '\t'

export function detectDelimiter(headerLine: string): CsvDelimiter {
  const counts = {
    ',': (headerLine.match(/,/g) ?? []).length,
    ';': (headerLine.match(/;/g) ?? []).length,
    '\t': (headerLine.match(/\t/g) ?? []).length,
  }
  let best: CsvDelimiter = ','
  let max = counts[',']
  if (counts[';'] > max) {
    max = counts[';']
    best = ';'
  }
  if (counts['\t'] > max) {
    best = '\t'
  }
  return best
}

export function splitCsvLine(line: string, delim: CsvDelimiter): string[] {
  const out: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]!
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        cur += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (delim === '\t' ? c === '\t' : c === delim) {
      out.push(cur)
      cur = ''
    } else {
      cur += c
    }
  }
  out.push(cur)
  return out
}

export function normalizeHeader(h: string): string {
  return h.trim().replace(/^\uFEFF/, '')
}
