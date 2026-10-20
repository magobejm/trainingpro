import { sanitizeRirInput, sanitizeRpeInput } from '@trainerpro/ui';
import { describe, expect, it } from 'vitest';
import { isAllowedNumericInput, numericModeForField, parseAndValidateNumericInput } from './seriesTableNumeric.utils';

describe('web effort input', () => {
  it('keeps RPE on halves and drops other decimals', () => {
    expect(sanitizeRpeInput('6,5')).toBe('6,5');
    expect(sanitizeRpeInput('6.3')).toBe('6.');
    expect(sanitizeRpeInput('10.5')).toBe('10.');
    expect(numericModeForField('rpe')).toBe('rpeHalf');
    expect(isAllowedNumericInput('6.3', 'rpeHalf')).toBe(false);
    expect(parseAndValidateNumericInput('7.5', 'rpeHalf')).toBe(7.5);
    expect(parseAndValidateNumericInput('6.3', 'rpeHalf')).toBeUndefined();
  });

  it('keeps RIR as a whole number from 0 to 10', () => {
    expect(sanitizeRirInput('4')).toBe('4');
    expect(sanitizeRirInput('6.5')).toBe('6');
    expect(sanitizeRirInput('11')).toBe('1');
    expect(numericModeForField('rir')).toBe('rir');
    expect(parseAndValidateNumericInput('2', 'rir')).toBe(2);
    expect(parseAndValidateNumericInput('6.5', 'rir')).toBeUndefined();
  });
});

it('accepts comma-separated km and minute duration with their own precision', () => {
  expect(parseAndValidateNumericInput('1,250', 'distance')).toBe(1.25);
  expect(parseAndValidateNumericInput('0.0001', 'distance')).toBeUndefined();
  expect(parseAndValidateNumericInput('500.001', 'distance')).toBeUndefined();
  expect(parseAndValidateNumericInput('2,5', 'minutes')).toBe(2.5);
});
