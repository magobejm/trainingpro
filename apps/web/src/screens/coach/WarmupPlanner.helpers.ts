export function appendMeta(
  notes: string | undefined,
  meta: Record<string, null | number | string | undefined>,
): null | string {
  const safe = Object.fromEntries(
    Object.entries(meta).filter(
      ([, value]) => value !== undefined && value !== null && value !== '',
    ),
  );
  if (Object.keys(safe).length === 0) {
    return notes?.trim() || null;
  }
  const prefix = notes?.trim() ? `${notes.trim()}\n` : '';
  return `${prefix}[meta] ${JSON.stringify(safe)}`;
}

export function parseRange(
  value?: string,
  fallback?: number,
): { max: null | number; min: null | number } {
  const raw = value?.trim();
  if (raw) {
    const parts = raw.split('-').map((item) => Number(item.trim()));
    const first = parts[0] ?? Number.NaN;
    const second = parts[1] ?? Number.NaN;
    if (Number.isFinite(first) && Number.isFinite(second)) {
      const low = Math.min(first, second);
      const high = Math.max(first, second);
      return { max: high, min: low };
    }
    if (Number.isFinite(first)) {
      return { max: first, min: first };
    }
  }
  const one = fallback ?? null;
  return { max: one, min: one };
}
