import { completeRpeValue, sanitizeRirInput, sanitizeRpeInput } from '../effort-input.utils';

describe('effort input', () => {
  it('keeps RPE on whole numbers and halves', () => {
    expect(sanitizeRpeInput('6')).toBe('6');
    expect(sanitizeRpeInput('6.')).toBe('6.');
    expect(sanitizeRpeInput('6,')).toBe('6,');
    expect(sanitizeRpeInput('6.5')).toBe('6.5');
    expect(sanitizeRpeInput('6,5')).toBe('6,5');
    expect(sanitizeRpeInput('10')).toBe('10');
    expect(sanitizeRpeInput('10.0')).toBe('10.0');
  });

  it('drops an RPE digit that is not a half step', () => {
    expect(sanitizeRpeInput('6.3')).toBe('6.');
    expect(sanitizeRpeInput('6,3')).toBe('6,');
    expect(sanitizeRpeInput('6.35')).toBe('6.');
    expect(sanitizeRpeInput('10.5')).toBe('10.');
    expect(sanitizeRpeInput('11')).toBe('1');
    expect(sanitizeRpeInput('0')).toBe('');
  });

  it('reads a finished RPE value', () => {
    expect(completeRpeValue('7,5')).toBe(7.5);
    expect(completeRpeValue('8')).toBe(8);
    expect(completeRpeValue('6.')).toBeNull();
  });

  it('keeps RIR as a whole number from 0 to 10', () => {
    expect(sanitizeRirInput('0')).toBe('0');
    expect(sanitizeRirInput('4')).toBe('4');
    expect(sanitizeRirInput('10')).toBe('10');
    expect(sanitizeRirInput('6.5')).toBe('6');
    expect(sanitizeRirInput('6,5')).toBe('6');
    expect(sanitizeRirInput('11')).toBe('1');
  });
});
