import { physicalTestFields } from '../physical-test-fields';

describe('physicalTestFields', () => {
  it('asks Rockport for weight, time and heart rate', () => {
    expect(physicalTestFields('Test de Caminata de Rockport (1 milla)')).toEqual([
      'gender',
      'age',
      'weight',
      'timeMin',
      'timeSec',
      'hr',
    ]);
  });

  it('asks Cooper only for distance besides sex and age', () => {
    expect(physicalTestFields('Test de Cooper (12 Minutos)')).toEqual(['gender', 'age', 'distance']);
  });

  it('falls back to sex and age for an unknown test', () => {
    expect(physicalTestFields('Test nuevo')).toEqual(['gender', 'age']);
  });
});
