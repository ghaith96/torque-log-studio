/** Normalize thrown/rejected values for UI + worker wire format (shared policy). */

export function unknownErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
