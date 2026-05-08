/** CSV extension checks, accept attribute, and user-facing copy for invalid imports. */

export const CSV_INPUT_ACCEPT = '.csv,text/csv' as const

export function isCsvFileName(fileName: string): boolean {
  return fileName.toLowerCase().endsWith('.csv')
}

export const INVALID_CSV_EXTENSION_MESSAGE =
  'Please choose a .csv file from Torque.' as const
