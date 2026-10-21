import { collectBrokenRecords } from '../../src/modules/progress/domain/prior-records';

describe('collectBrokenRecords', () => {
  it('keeps the first mark and any later higher e1rm', () => {
    const records = collectBrokenRecords(new Map([['bench', 100]]), [
      {
        effortRpe: 10,
        exerciseId: 'bench',
        exerciseName: 'Press',
        repsDone: 5,
        sessionDate: '2026-10-01',
        sessionId: 's1',
        weightDoneKg: 80,
      },
      {
        effortRpe: 10,
        exerciseId: 'bench',
        exerciseName: 'Press',
        repsDone: 5,
        sessionDate: '2026-10-08',
        sessionId: 's2',
        weightDoneKg: 100,
      },
    ]);
    expect(records.map((record) => record.sessionId)).toEqual(['s2']);
    expect(records[0]?.previousBest).toBe(100);
  });
});
