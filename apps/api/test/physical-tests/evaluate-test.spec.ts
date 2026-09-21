import { evaluateTest } from '../../src/modules/physical-tests/domain/evaluate-test';

describe('evaluateTest', () => {
  test('classifies plank test for young male with excellent hold time', () => {
    const result = evaluateTest('Test de Resistencia de Plancha Isométrica (Plank Test)', {
      gender: 'M',
      age: 25,
      timeMin: 2,
      timeSec: 30,
    });

    expect(result.rawScore).toBe('150 s');
    expect(result.classification).toBe('Excelente');
    expect(result.color).toContain('emerald');
  });

  test('classifies cooper test distance for adult female', () => {
    const result = evaluateTest('Test de Cooper (12 Minutos)', {
      gender: 'F',
      age: 35,
      distance: 2100,
    });

    expect(result.rawScore).toBe('2100 m');
    expect(result.classification).toBe('Excelente');
    expect(result.color).toContain('emerald');
  });

  test('classifies push-up test reps for middle-aged male', () => {
    const result = evaluateTest('Test de Flexiones (Push-Up Test)', {
      gender: 'M',
      age: 45,
      reps: 20,
    });

    expect(result.rawScore).toBe('20 reps');
    expect(result.classification).toBe('Bueno');
    expect(result.color).toContain('blue');
  });

  test('returns manual review classification for unknown test name', () => {
    const result = evaluateTest('Unknown Test', {
      gender: 'M',
      age: 30,
    });

    expect(result.rawScore).toBe('Registrado');
    expect(result.classification).toBe('Ver Tabla Manual');
  });

  test('resolves catalog codes to the same classification as names', () => {
    const byName = evaluateTest('Test de Cooper (12 Minutos)', {
      gender: 'F',
      age: 35,
      distance: 2100,
    });
    const byCode = evaluateTest('test_4', {
      gender: 'F',
      age: 35,
      distance: 2100,
    });
    expect(byCode).toEqual(byName);
  });
});
