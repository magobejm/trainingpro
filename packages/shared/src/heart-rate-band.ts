export type HeartRateBandKind = 'heartRate' | 'percent';

export type HeartRateBand = {
  max: number | null;
  min: number | null;
};

const RANGE_PATTERN = /^(\d+)\s*-\s*(\d+)$/;
const EXACT_PATTERN = /^(\d+)$/;

export function sanitizeHeartRateBandInput(raw: string): string {
  const match = raw.replace(/[^\d\-.,]/g, '').match(/^(\d*)(?:[.,]\d*)?(-)?(\d*)(?:[.,]\d*)?/);
  if (!match) return '';
  return `${match[1] ?? ''}${match[2] ?? ''}${match[3] ?? ''}`;
}

export function parseHeartRateBand(raw: string, kind: HeartRateBandKind): HeartRateBand | null {
  const text = raw.trim();
  if (!text) return { min: null, max: null };
  const range = RANGE_PATTERN.exec(text);
  if (range) return acceptRange(kind, Number(range[1]), Number(range[2]));
  const exact = EXACT_PATTERN.exec(text);
  if (!exact || !allowed(kind, Number(exact[1]))) return null;
  return { min: Number(exact[1]), max: null };
}

export function formatHeartRateBand(min: number | null | undefined, max: number | null | undefined): string {
  if (min == null) return '';
  if (max == null || max === min) return String(min);
  return `${Math.min(min, max)}-${Math.max(min, max)}`;
}

export function heartRateBandPoint(min: number | null | undefined, max: number | null | undefined): number | null {
  if (min == null || !Number.isFinite(min)) return null;
  if (max == null || !Number.isFinite(max)) return min;
  return (min + max) / 2;
}

function acceptRange(kind: HeartRateBandKind, left: number, right: number): HeartRateBand | null {
  const min = Math.min(left, right);
  const max = Math.max(left, right);
  if (!allowed(kind, min) || !allowed(kind, max)) return null;
  return max === min ? { min, max: null } : { min, max };
}

function allowed(kind: HeartRateBandKind, value: number): boolean {
  if (!Number.isInteger(value)) return false;
  if (kind === 'percent') return value >= 0 && value <= 100;
  return value >= 1 && value <= 300;
}
