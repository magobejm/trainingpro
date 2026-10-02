import { isRomScaleValue, ROM_SCALE_VALUES } from '../rom-scale.utils';

describe('rom-scale.utils', () => {
  it('exposes completo, parcial and minimo in that order', () => {
    expect(ROM_SCALE_VALUES).toEqual(['completo', 'parcial', 'minimo']);
  });

  it('accepts only the three rom scale values', () => {
    expect(isRomScaleValue('completo')).toBe(true);
    expect(isRomScaleValue('parcial')).toBe(true);
    expect(isRomScaleValue('minimo')).toBe(true);
    expect(isRomScaleValue('Completo')).toBe(false);
    expect(isRomScaleValue('full')).toBe(false);
  });
});
