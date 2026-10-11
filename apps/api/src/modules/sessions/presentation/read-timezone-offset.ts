const MIN_OFFSET_MINUTES = -720;
const MAX_OFFSET_MINUTES = 840;

export function readTimezoneOffset(raw: string | undefined): number {
  if (!raw) return 0;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < MIN_OFFSET_MINUTES || parsed > MAX_OFFSET_MINUTES) return 0;
  return parsed;
}
