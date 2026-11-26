import { parseDecimalInput, type MeasurementKey } from '../../screens/client/client-measures.helpers';

const RANGES: Record<MeasurementKey, [number, number]> = {
  heightCm: [80, 260],
  hipCm: [40, 220],
  waistCm: [40, 220],
  weightKg: [20, 400],
};

export type ProfileTextCommit = { error: 'invalid' } | { skip: true } | { value: string };
export type ProfilePhoneCommit = { error: 'invalid' } | { skip: true } | { value: string | null };
export type ProfileMeasureCommit = { error: 'invalid' } | { skip: true } | { value: number };

export function commitProfileText(current: string, raw: string, max: number): ProfileTextCommit {
  const value = raw.trim();
  if (!value || value.length > max) return { error: 'invalid' };
  if (value === current) return { skip: true };
  return { value };
}

export function commitProfileNote(current: string | null, raw: string): ProfilePhoneCommit {
  const trimmed = raw.trim();
  if (trimmed.length > 2000) return { error: 'invalid' };
  const value = trimmed || null;
  if ((current ?? null) === value) return { skip: true };
  return { value };
}

export function commitProfilePhone(current: string | null, raw: string): ProfilePhoneCommit {
  const trimmed = raw.trim();
  if (trimmed.length > 30) return { error: 'invalid' };
  const value = trimmed || null;
  if ((current ?? null) === value) return { skip: true };
  return { value };
}

export function commitProfileMeasure(current: number | null, key: MeasurementKey, raw: string): ProfileMeasureCommit {
  const trimmed = raw.trim();
  if (!trimmed) return { skip: true };
  const value = parseDecimalInput(trimmed);
  const [min, max] = RANGES[key];
  if (value === undefined || value < min || value > max) return { error: 'invalid' };
  const stored = key === 'weightKg' ? value : Math.round(value);
  if (current !== null && Math.abs(current - stored) < 0.05) return { skip: true };
  return { value };
}
