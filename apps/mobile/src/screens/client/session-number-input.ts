import type { TextInputProps } from 'react-native';
import {
  formatHeartRateBand,
  parseHeartRateBand,
  sanitizeHeartRateBandInput,
  type HeartRateBandKind,
} from '@trainerpro/shared';
import type { SetFieldKey } from './active-exercise.helpers';
import { sanitizeRirInput, sanitizeRpeInput } from './effort-input.utils';

const DECIMAL_FIELDS = new Set<SetFieldKey>(['distance', 'weight']);
const BAND_FIELDS = new Set<SetFieldKey>(['fcMaxPct', 'fcReservePct', 'heartRate']);
const INTEGER_FIELDS = new Set<SetFieldKey>(['duration', 'reps']);

export function keyboardForField(key: SetFieldKey, minutes = false): NonNullable<TextInputProps['keyboardType']> {
  if (BAND_FIELDS.has(key)) return 'default';
  if ((key === 'duration' && minutes) || key === 'rpe' || DECIMAL_FIELDS.has(key)) return 'decimal-pad';
  return 'number-pad';
}

export function commitHeartRateBandInput(key: SetFieldKey, raw: string, previous: string): string {
  const kind = bandKind(key);
  if (!kind) return raw;
  const parsed = parseHeartRateBand(raw, kind);
  if (!parsed) return raw.trim() ? previous : '';
  return formatHeartRateBand(parsed.min, parsed.max);
}

export function sanitizeSessionNumber(key: SetFieldKey, raw: string, minutes = false): string {
  if (key === 'rpe') return sanitizeRpeInput(raw);
  if (key === 'rir') return sanitizeRirInput(raw);
  if (BAND_FIELDS.has(key)) return sanitizeHeartRateBandInput(raw);
  if (key === 'distance') return sanitizeDecimal(raw, 3);
  if (key === 'duration' && minutes) return sanitizeDecimal(raw, 10);
  if (INTEGER_FIELDS.has(key)) return sanitizeInteger(raw);
  if (DECIMAL_FIELDS.has(key)) return sanitizeOneDecimal(raw);
  return raw;
}

export function sanitizeInteger(raw: string): string {
  return raw.match(/^\d*/)?.[0] ?? '';
}

export function sanitizeOneDecimal(raw: string): string {
  const cleaned = raw.replace(/[^\d.,]/g, '');
  const match = cleaned.match(/^(\d*)([.,])?(\d?)/);
  if (!match) return '';
  const whole = match[1] ?? '';
  const separator = match[2] ?? '';
  if (!separator) return whole;
  return `${whole}${separator}${match[3] ?? ''}`;
}

function bandKind(key: SetFieldKey): HeartRateBandKind | null {
  if (key === 'heartRate') return 'heartRate';
  if (key === 'fcMaxPct' || key === 'fcReservePct') return 'percent';
  return null;
}

function sanitizeDecimal(raw: string, places: number): string {
  const cleaned = raw.replace(/[^\d.,]/g, '');
  const match = cleaned.match(/^(\d*)([.,])?(\d*)/);
  return match ? `${match[1]}${match[2] ?? ''}${match[3]?.slice(0, places) ?? ''}` : '';
}
