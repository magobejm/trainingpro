import { sportPerformedWhere } from '../../src/modules/progress/infra/prisma/performed-id-filters';
test('a sport with distance as its only metric is included in performed filters', () => {
  const where = sportPerformedWhere({
    archivedAt: null,
    clientId: 'c',
    isCompleted: true,
    sessionDate: { gte: new Date(0), lte: new Date() },
  });
  expect(where.OR[1]?.setLogs?.some.OR).toContainEqual({ distanceDoneMeters: { gt: 0 } });
});
