import type { Prisma } from '@prisma/client';
import { mapClientWarmups } from '../../src/common/plan/client-warmups.mapper';

type References = Parameters<typeof mapClientWarmups>[1];
function reference(type = 'strength', metadataJson: unknown = null): References {
  return [
    {
      id: 'day-warmup',
      warmupTemplate: {
        id: 'warmup',
        name: 'Prepare',
        items: [
          {
            id: 'item',
            blockType: type,
            displayName: 'Activation',
            sortOrder: 0,
            groupId: 'group',
            group: { groupType: 'SUPERSET' },
            libraryExercise: { coachInstructions: 'Keep control', mediaUrl: '/photo', youtubeUrl: null },
            setsPlanned: 2,
            repsMin: 8,
            repsMax: 12,
            restSeconds: 30,
            workSeconds: 20,
            targetRpe: null,
            targetRir: 3,
            notes: 'Slow',
            metadataJson,
          },
        ],
      },
    },
  ] as unknown as References;
}
describe('client warmup prescriptions', () => {
  const db = {} as Prisma.TransactionClient;
  it('preserves coach series, groups and media without result fields', async () => {
    const [warmup] = await mapClientWarmups(
      db,
      reference('strength', {
        sets: [
          { setIndex: 0, reps: 10, weightKg: 4 },
          { setIndex: 1, reps: 8, weightKg: 6 },
        ],
      }),
    );
    expect(warmup?.exercises[0]).toMatchObject({
      groupType: 'SUPERSET',
      mediaUrl: '/photo',
      notes: 'Slow',
      coachInstructions: 'Keep control',
    });
    expect(warmup?.exercises[0]?.sets.map((set) => [set.reps, set.weightKg])).toEqual([
      [10, 4],
      [8, 6],
    ]);
    expect(warmup?.exercises[0]).not.toHaveProperty('logs');
  });
  it('uses programmed durations for timed warmups and hides empty warmups', async () => {
    expect((await mapClientWarmups(db, reference('isometric')))[0]?.exercises[0]?.sets[0]?.durationSeconds).toBe(20);
    expect(await mapClientWarmups(db, [{ warmupTemplate: { id: 'empty', items: [] } }] as unknown as References)).toEqual(
      [],
    );
  });
});
