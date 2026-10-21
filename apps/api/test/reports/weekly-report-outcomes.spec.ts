import { buildWeeklyReportLines } from '../../src/modules/reports/application/weekly-report-lines';

describe('TP-41 weekly PDF presentation', () => {
  it('keeps declared adherence separate and lists session dates/results without zero imputation', () => {
    const date = new Date('2026-10-20T00:00:00Z');
    const lines = buildWeeklyReportLines(
      {
        strengthRows: [{ muscleGroup: 'legs', repsDone: 8, weightDoneKg: null, sessionDate: date }],
        cardioRows: [
          {
            methodType: 'HIIT',
            avgHeartRate: null,
            distanceDoneMeters: 1250,
            durationSecondsDone: null,
            effortRpe: null,
            sessionDate: date,
          },
        ],
        srpeRows: [],
        weeklyReports: [{ reportDate: date, adherencePercent: 95, mood: null, energy: null, sleepHours: null }],
        adherence: {
          percent: 50,
          plannedCount: 2,
          cutoffDate: '2026-10-19',
          counts: { done: 1, incomplete: 1, skipped: 0, pending: 0, in_progress: 0 },
          unplannedSessionsCount: 0,
        },
        sessions: [
          { sessionDate: '2026-10-18', outcome: 'incomplete', originDate: '2026-10-17' },
          { sessionDate: '2026-10-19', outcome: 'skipped', skipReason: 'Descanso indicado' },
        ],
      },
      { clientId: 'client', from: date, to: date },
    );
    expect(lines.join('\n')).toContain('adherencia declarada:95');
    expect(lines.join('\n')).toContain('Completadas 1 / previstas 2');
    expect(lines.join('\n')).toContain('2026-10-18: Incompleto (origen 2026-10-17)');
    expect(lines.join('\n')).toContain('2026-10-19: No hecho - Descanso indicado');
    expect(lines.join('\n')).toContain('volume:-');
    expect(lines.join('\n')).toContain('min:-');
    expect(lines.join('\n')).toContain('Muestra volumen: 0/1 series');
    expect(lines.join('\n')).toContain('Muestra duración: 0/1 intervalos');
  });
});
