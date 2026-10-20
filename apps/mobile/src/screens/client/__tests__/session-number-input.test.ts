import { keyboardForField, sanitizeInteger, sanitizeOneDecimal, sanitizeSessionNumber } from '../session-number-input';

describe('session number input', () => {
  it('uses a decimal pad for weight, distance, percentages and RPE', () => {
    expect(keyboardForField('weight')).toBe('decimal-pad');
    expect(keyboardForField('distance')).toBe('decimal-pad');
    expect(keyboardForField('fcMaxPct')).toBe('decimal-pad');
    expect(keyboardForField('rpe')).toBe('decimal-pad');
  });

  it('uses a number pad for whole-number fields', () => {
    expect(keyboardForField('reps')).toBe('number-pad');
    expect(keyboardForField('duration')).toBe('number-pad');
    expect(keyboardForField('heartRate')).toBe('number-pad');
    expect(keyboardForField('rir')).toBe('number-pad');
  });

  it('keeps one decimal and accepts either separator', () => {
    expect(sanitizeOneDecimal('62,5')).toBe('62,5');
    expect(sanitizeOneDecimal('62.55')).toBe('62.5');
    expect(sanitizeOneDecimal('62.5kg')).toBe('62.5');
    expect(sanitizeSessionNumber('weight', '80,5')).toBe('80,5');
    expect(sanitizeSessionNumber('fcReservePct', '70.25')).toBe('70.2');
  });

  it('keeps only the whole part of integer fields', () => {
    expect(sanitizeInteger('12.5')).toBe('12');
    expect(sanitizeSessionNumber('reps', '12,5')).toBe('12');
    expect(sanitizeSessionNumber('heartRate', '140bpm')).toBe('140');
    expect(sanitizeSessionNumber('rir', '3.5')).toBe('3');
    expect(sanitizeSessionNumber('rpe', '7,5')).toBe('7,5');
  });
});

it('allows kilometre precision and decimal minutes only for cardio/sport', () => {
  expect(sanitizeSessionNumber('distance', '1,2509')).toBe('1,250');
  expect(sanitizeSessionNumber('duration', '2,5', true)).toBe('2,5');
  expect(sanitizeSessionNumber('duration', '2,5')).toBe('2');
  expect(keyboardForField('duration', true)).toBe('decimal-pad');
});
