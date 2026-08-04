import type { DraftSet } from '../../RoutinePlanner.types';

export type SeriesNumericMode = 'integer' | 'weight' | 'rpeHalf';

const PARTIAL_DECIMAL = /^(\d+([.,]\d*)?|[.,]\d*)?$/;
const INTEGER_ONLY = /^\d*$/;

export function isAllowedNumericInput(text: string, mode: SeriesNumericMode): boolean {
  if (text === '') return true;
  return mode === 'integer' ? INTEGER_ONLY.test(text) : PARTIAL_DECIMAL.test(text);
}

export function parseDecimalInput(text: string): number | undefined {
  const normalized = text.trim().replace(',', '.');
  if (!normalized || normalized === '.') return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function countDecimalPlaces(value: number): number {
  const parts = String(value).split('.');
  return parts.length > 1 ? parts[1]!.length : 0;
}

export function isValidWeight(value: number): boolean {
  return value >= 0 && value <= 9999 && countDecimalPlaces(value) <= 2;
}

export function isValidRpeHalf(value: number): boolean {
  if (value < 1 || value > 10) return false;
  return Math.abs(value * 2 - Math.round(value * 2)) < 1e-9;
}

export function formatStoredNumber(value: number, mode: SeriesNumericMode): string {
  if (mode === 'integer') return String(Math.trunc(value));
  if (mode === 'rpeHalf') {
    return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, '');
  }
  const fixed = value.toFixed(2);
  return fixed.replace(/\.?0+$/, '');
}

export function parseAndValidateNumericInput(text: string, mode: SeriesNumericMode): number | undefined {
  if (mode === 'integer') {
    const trimmed = text.trim();
    if (!trimmed) return undefined;
    const parsed = parseInt(trimmed, 10);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  const parsed = parseDecimalInput(text);
  if (parsed === undefined) return undefined;
  if (mode === 'weight' && !isValidWeight(parsed)) return undefined;
  if (mode === 'rpeHalf' && !isValidRpeHalf(parsed)) return undefined;
  return parsed;
}

export function numericModeForField(key: keyof DraftSet): SeriesNumericMode {
  if (key === 'weightKg') return 'weight';
  if (key === 'rpe') return 'rpeHalf';
  return 'integer';
}
