/** Parsing heuristics — single place for Torque CSV tuning (L1 magic-number elimination). */

/** Rows between progress callbacks during long scans */
export const PROGRESS_ROW_INTERVAL = 5000

/** Header / column guessing uses at most this many leading rows */
export const SAMPLE_ROWS_FOR_HEURISTIC = 50

/** Column is “numeric channel” if ≥ this fraction of rows parse as numbers */
export const NUMERIC_CHANNEL_MIN_RATIO = 0.65

/** Numeric values above this magnitude are treated as milliseconds → seconds */
export const UNIX_MS_LOWER_BOUND = 1e11

/** Values above this are treated as sub-ms epoch → scale to seconds */
export const UNIX_SUB_MS_LOWER_BOUND = 1e12

export const TIME_HEADER_KEYWORDS = [
  'time',
  'timestamp',
  'gps time',
  'seconds',
  'epoch',
] as const

export const MONOTONIC_EPS = 1e-9
