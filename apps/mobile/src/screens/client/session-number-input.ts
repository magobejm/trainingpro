import type { TextInputProps } from 'react-native';
import type { SetFieldKey } from './active-exercise.helpers';
import { sanitizeRirInput, sanitizeRpeInput } from './effort-input.utils';

const DECIMAL_FIELDS = new Set<SetFieldKey>(['distance', 'fcMaxPct', 'fcReservePct', 'weight']);
const INTEGER_FIELDS = new Set<SetFieldKey>(['duration', 'heartRate', 'reps']);

export function keyboardForField(key: SetFieldKey, minutes = false): NonNullable<TextInputProps['keyboardType']> {
  if ((key === 'duration' && minutes) || key === 'rpe' || DECIMAL_FIELDS.has(key)) return 'decimal-pad';
  return 'number-pad';
}

export function sanitizeSessionNumber(key: SetFieldKey, raw: string, minutes = false): string {
  if (key === 'rpe') return sanitizeRpeInput(raw);
  if (key === 'rir') return sanitizeRirInput(raw);
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

function sanitizeDecimal(raw: string, places: number): string {
  const cleaned = raw.replace(/[^\d.,]/g, '');
  const match = cleaned.match(/^(\d*)([.,])?(\d*)/);
  return match ? `${match[1]}${match[2] ?? ''}${match[3]?.slice(0, places) ?? ''}` : '';
}
