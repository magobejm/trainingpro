import { ConflictException } from '@nestjs/common';
import type { ClientRoutine, ClientRoutineWeek } from '@prisma/client';
import {
  addItemSet,
  assertItem,
  removeItemSet,
  moveItem,
  swapItem,
  updateItemMeta,
} from '../../src/modules/client-routines/client-routine-items';
import { prescriptionPatch, splitPlanNotes } from '../../src/modules/client-routines/client-routine-prescription';

jest.mock('../../src/modules/client-routines/client-routine-view', () => ({ buildWeek: jest.fn() }));
jest.mock('../../src/modules/plans/infra/prisma/client-routine.prisma', () => ({ todayKey: () => '2026-01-01' }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { buildWeek } = require('../../src/modules/client-routines/client-routine-view') as { buildWeek: jest.Mock };

const week = (weekIndex: number) => ({ id: `w${weekIndex}`, templateId: `t${weekIndex}`, weekIndex }) as ClientRoutineWeek;
const routine = { weeks: [week(1), week(2)] } as unknown as ClientRoutine & { weeks: ClientRoutineWeek[] };

function view(editableByWeek: Record<string, boolean>) {
  buildWeek.mockImplementation(async (_p: unknown, _r: unknown, row: ClientRoutineWeek) => ({
    days: [
      {
        blocks: [],
        dayIndex: 0,
        editable: editableByWeek[row.id],
        exercises: [{ displayName: 'Squat', id: `ex-${row.id}`, sortOrder: 0 }],
        id: `day-${row.id}`,
      },
    ],
  }));
}

function prismaMock() {
  const sets: Record<string, Array<Record<string, unknown>>> = {
    'ex-w1': [{ exerciseId: 'ex-w1', id: 's1', reps: 5, setIndex: 0 }],
    'ex-w2': [{ exerciseId: 'ex-w2', id: 's2', reps: 5, setIndex: 0 }],
  };
  const strengthSet = {
    count: jest.fn(async ({ where }: { where: { exerciseId: string } }) => sets[where.exerciseId]!.length),
    create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => data),
    findFirst: jest.fn(
      async ({ where }: { where: { exerciseId: string; id: string } }) =>
        sets[where.exerciseId]!.find((set) => set.id === where.id) ?? null,
    ),
    findMany: jest.fn(async ({ where }: { where: { exerciseId: string } }) => sets[where.exerciseId]),
    update: jest.fn(),
  };
  const strengthItem = {
    findFirst: jest.fn(async ({ where }: { where: { id: string } }) => ({ dayId: `day-${where.id.slice(3)}` })),
    findUniqueOrThrow: jest.fn(async () => ({ day: { dayIndex: 0 }, displayName: 'Squat', sortOrder: 0 })),
    update: jest.fn(),
  };
  return { planStrengthExercise: strengthItem, planStrengthSet: strengthSet } as never;
}

describe('client routine items', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rejects edits on a day that is already closed', async () => {
    view({ w1: false, w2: true });
    await expect(assertItem(prismaMock(), routine, week(1), 'exercise', 'ex-w1')).rejects.toBeInstanceOf(ConflictException);
  });

  it('adds a set that repeats the last one in the open later weeks only', async () => {
    view({ w1: true, w2: false });
    const prisma = prismaMock() as never as { planStrengthSet: { create: jest.Mock } };
    await addItemSet(prisma as never, routine, week(1), 'exercise', 'ex-w1');
    expect(prisma.planStrengthSet.create).toHaveBeenCalledTimes(1);
    expect(prisma.planStrengthSet.create).toHaveBeenCalledWith({ data: { exerciseId: 'ex-w1', reps: 5, setIndex: 1 } });
  });

  it('never removes the last remaining set', async () => {
    view({ w1: true, w2: true });
    await expect(removeItemSet(prismaMock(), routine, week(1), 'exercise', 'ex-w1', 's1')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('replaces the movement on every open copy', async () => {
    view({ w1: true, w2: true });
    const prisma = prismaMock() as never as { planStrengthExercise: { update: jest.Mock } };
    await swapItem(prisma as never, routine, week(1), 'exercise', 'ex-w1', { displayName: 'Lunge', libraryId: 'lib-2' });
    const updates = prisma.planStrengthExercise.update.mock.calls.map((call) => call[0]);
    expect(updates.map((arg) => arg.where.id)).toEqual(['ex-w1', 'ex-w2']);
    expect(updates[0].data).toEqual({ displayName: 'Lunge', exerciseLibraryId: 'lib-2' });
  });

  it('writes a strength rep range on every open copy', async () => {
    view({ w1: true, w2: true });
    const prisma = prismaMock() as never as { planStrengthExercise: { update: jest.Mock } };
    await updateItemMeta(prisma as never, routine, week(1), 'exercise', 'ex-w1', { repsRange: '8-12' });
    const data = prisma.planStrengthExercise.update.mock.calls.map((call) => call[0].data);
    expect(data).toEqual([
      { repsMax: 12, repsMin: 8 },
      { repsMax: 12, repsMin: 8 },
    ]);
  });

  it('stores a plyometric rep range beside the note, without erasing the other marker values', () => {
    const row = { notes: 'Hola\n[meta] {"deCalentamiento":1}' };
    const data = prescriptionPatch('plio', row, { repsRange: '6-8' });
    expect(splitPlanNotes(String(data.notes))).toEqual({ meta: { deCalentamiento: 1, rangoReps: '6-8' }, text: 'Hola' });
  });

  it('writes notes and locked fields on every open copy', async () => {
    view({ w1: true, w2: true });
    const prisma = prismaMock() as never as { planStrengthExercise: { update: jest.Mock } };
    await updateItemMeta(prisma as never, routine, week(1), 'exercise', 'ex-w1', { lockedFields: ['rpe'], notes: 'x' });
    const calls = prisma.planStrengthExercise.update.mock.calls.map(([arg]) => arg.where.id);
    expect(calls).toEqual(['ex-w1', 'ex-w2']);
    expect(prisma.planStrengthExercise.update.mock.calls[0]![0].data).toEqual({ lockedFieldsJson: ['rpe'], notes: 'x' });
  });

  it('drops an item at an index and repeats that order on later open weeks', async () => {
    const updates: string[] = [];
    const record = (tableName: string) => ({
      findUniqueOrThrow: jest.fn(async () => ({ day: { dayIndex: 0 }, displayName: 'Bike', sortOrder: 2 })),
      update: jest.fn(async ({ data, where }: { data: { sortOrder: number }; where: { id: string } }) => {
        updates.push(`${tableName}:${where.id}:${data.sortOrder}`);
      }),
    });
    const prisma = { planCardioBlock: record('cardio'), planStrengthExercise: record('strength') } as never;
    buildWeek.mockImplementation(async (_prisma: unknown, _routine: unknown, row: ClientRoutineWeek) => ({
      days: [
        {
          blocks: [{ displayName: 'Bike', id: `bike-${row.id}`, kind: 'cardio', sortOrder: 2 }],
          dayIndex: 0,
          editable: true,
          exercises: [
            { displayName: 'Squat', id: `squat-${row.id}`, sortOrder: 0 },
            { displayName: 'Curl', id: `curl-${row.id}`, sortOrder: 1 },
          ],
          id: `day-${row.id}`,
        },
      ],
    }));
    await moveItem(prisma, routine, week(1), 'cardio', 'bike-w1', { toIndex: 0 });
    expect(updates).toEqual([
      'cardio:bike-w1:0',
      'strength:squat-w1:1',
      'strength:curl-w1:2',
      'cardio:bike-w2:0',
      'strength:squat-w2:1',
      'strength:curl-w2:2',
    ]);
  });
});
