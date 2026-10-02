import {
  formatExerciseCommentChatNotice,
  formatExerciseIncidentChatNotice,
  formatTodayIncidentDate,
  incidentSeverityForCategory,
} from '../exercise-comment.utils';

describe('exercise comment chat notices', () => {
  it('formats a trainer comment with date, day and exercise', () => {
    expect(
      formatExerciseCommentChatNotice({
        comment: 'Me ha costado el último set',
        date: '02/10/2026',
        exerciseName: 'Press banca',
        routineDay: 'Torso',
      }),
    ).toBe(
      [
        '💬 Comentario sobre el ejercicio:',
        '📅 Fecha: 02/10/2026',
        '🏋️ Día de la rutina: Torso',
        '🎯 Ejercicio: Press banca',
        '💬 Comentario: Me ha costado el último set',
      ].join('\n'),
    );
  });

  it('formats a reported incident with category and exercise context', () => {
    expect(
      formatExerciseIncidentChatNotice({
        category: 'Lesión',
        date: '02/10/2026',
        description: 'Pinchazo en el hombro',
        exerciseName: 'Press banca',
        routineDay: 'Torso',
      }),
    ).toBe(
      [
        '⚠️ Incidencia reportada:',
        '📅 Fecha: 02/10/2026',
        '🏋️ Día de la rutina: Torso',
        '🎯 Ejercicio: Press banca',
        '⚡ Gravedad: Lesión',
        '📝 Incidencia: Pinchazo en el hombro',
      ].join('\n'),
    );
  });

  it('maps incident categories to API severity', () => {
    expect(incidentSeverityForCategory('molestia')).toBe('LOW');
    expect(incidentSeverityForCategory('dolor')).toBe('MEDIUM');
    expect(incidentSeverityForCategory('lesion')).toBe('HIGH');
    expect(incidentSeverityForCategory('otro')).toBe('LOW');
  });

  it('formats today as a local calendar date', () => {
    expect(formatTodayIncidentDate(new Date(2026, 9, 2, 8, 15))).toBe('02/10/2026');
  });
});
