import { extractExerciseName } from '../exercise-comment.utils';

describe('extractExerciseName', () => {
  it('reads the exercise from a comment notice', () => {
    const text = [
      '💬 Comentario sobre el ejercicio:',
      '📅 Fecha: 01/01/2026',
      '🎯 Ejercicio: Press banca',
      '💬 Comentario: ok',
    ].join('\n');
    expect(extractExerciseName(text)).toBe('Press banca');
  });

  it('returns undefined when there is no exercise line', () => {
    expect(extractExerciseName('hola')).toBeUndefined();
    expect(extractExerciseName(null)).toBeUndefined();
  });
});
