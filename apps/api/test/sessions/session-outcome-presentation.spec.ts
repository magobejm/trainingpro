import { mapSession } from '../../src/modules/sessions/presentation/controllers/sessions.controller';

const row = {
  id: 's',
  sessionDate: new Date('2026-10-01T00:00:00Z'),
  startedAt: null,
  finishedAt: new Date('2026-10-02T02:00:00Z'),
  status: 'COMPLETED',
  isCompleted: true,
  isIncomplete: true,
  originDate: '2026-09-30',
  skippedAt: null,
  skipReason: null,
};

describe('session result presentation compatibility', () => {
  it('keeps new metadata out of the default response for older strict APK parsers', () => {
    expect(mapSession(row)).not.toHaveProperty('originDate');
    expect(mapSession(row)).not.toHaveProperty('skippedAt');
    expect(mapSession(row)).not.toHaveProperty('outcome');
  });
  it('includes the canonical outcome on request without using the finish date as session date', () => {
    expect(mapSession(row, true)).toMatchObject({
      outcome: 'incomplete',
      sessionDate: '2026-10-01',
      originDate: '2026-09-30',
    });
  });
});
