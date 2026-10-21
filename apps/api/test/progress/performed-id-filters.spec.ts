import { cardioPerformedWhere, sportPerformedWhere } from '../../src/modules/progress/infra/prisma/performed-id-filters';

it('discovers cardio recorded only through header distance or either cardiac percentage', () => {
  const filter = cardioPerformedWhere({ clientId: 'client' });
  expect(filter).toMatchObject({
    OR: [
      { distanceDoneMeters: { gte: 0 } },
      {
        intervalLogs: {
          some: { OR: expect.arrayContaining([{ hrMaxPctDone: { gte: 0 } }, { hrReservePctDone: { gte: 0 } }]) },
        },
      },
    ],
  });
});
test('a sport with distance as its only metric is included in performed filters', () => {
  const where = sportPerformedWhere({
    archivedAt: null,
    clientId: 'c',
    isCompleted: true,
    sessionDate: { gte: new Date(0), lte: new Date() },
  });
  expect(where.OR[1]?.setLogs?.some.OR).toContainEqual({ distanceDoneMeters: { gte: 0 } });
});
