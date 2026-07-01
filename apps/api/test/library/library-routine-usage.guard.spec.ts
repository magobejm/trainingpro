import { BadRequestException } from '@nestjs/common';
import { LibraryRoutineUsageGuard } from '../../src/modules/library/infra/prisma/library-routine-usage.guard';

describe('LibraryRoutineUsageGuard', () => {
  const prisma = {
    planStrengthExercise: { count: jest.fn() },
    planCardioBlock: { count: jest.fn() },
    planPlioBlock: { count: jest.fn() },
    planMobilityBlock: { count: jest.fn() },
    planIsometricBlock: { count: jest.fn() },
    planSportBlock: { count: jest.fn() },
    warmupTemplateItem: { count: jest.fn() },
  };

  let guard: LibraryRoutineUsageGuard;

  beforeEach(() => {
    jest.resetAllMocks();
    guard = new LibraryRoutineUsageGuard(prisma as never);
  });

  it('allows delete when exercise is not referenced in routines', async () => {
    prisma.planStrengthExercise.count.mockResolvedValue(0);
    prisma.warmupTemplateItem.count.mockResolvedValue(0);

    await expect(guard.assertNotUsedInRoutine('strength', 'exercise-1')).resolves.toBeUndefined();
  });

  it('blocks delete when exercise is used in a routine block', async () => {
    prisma.planStrengthExercise.count.mockResolvedValue(1);
    prisma.warmupTemplateItem.count.mockResolvedValue(0);

    await expect(guard.assertNotUsedInRoutine('strength', 'exercise-1')).rejects.toThrow(BadRequestException);
    await expect(guard.assertNotUsedInRoutine('strength', 'exercise-1')).rejects.toThrow(
      'Library item is used in a routine template',
    );
  });

  it('blocks delete when exercise is used in a warmup linked to a routine day', async () => {
    prisma.planStrengthExercise.count.mockResolvedValue(0);
    prisma.warmupTemplateItem.count.mockResolvedValue(1);

    await expect(guard.assertNotUsedInRoutine('strength', 'exercise-1')).rejects.toThrow(BadRequestException);
  });

  it('checks cardio usage through plan cardio blocks', async () => {
    prisma.planCardioBlock.count.mockResolvedValue(1);
    prisma.warmupTemplateItem.count.mockResolvedValue(0);

    await expect(guard.isUsedInRoutine('cardio', 'cardio-1')).resolves.toBe(true);
    expect(prisma.planCardioBlock.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ cardioMethodLibraryId: 'cardio-1' }),
      }),
    );
  });

  it('checks plio, mobility, isometric and sport usage through their block tables', async () => {
    prisma.planPlioBlock.count.mockResolvedValue(1);
    prisma.warmupTemplateItem.count.mockResolvedValue(0);
    await expect(guard.isUsedInRoutine('plio', 'plio-1')).resolves.toBe(true);

    jest.resetAllMocks();
    prisma.planMobilityBlock.count.mockResolvedValue(1);
    prisma.warmupTemplateItem.count.mockResolvedValue(0);
    await expect(guard.isUsedInRoutine('mobility', 'mobility-1')).resolves.toBe(true);

    jest.resetAllMocks();
    prisma.planIsometricBlock.count.mockResolvedValue(1);
    prisma.warmupTemplateItem.count.mockResolvedValue(0);
    await expect(guard.isUsedInRoutine('isometric', 'iso-1')).resolves.toBe(true);

    jest.resetAllMocks();
    prisma.planSportBlock.count.mockResolvedValue(1);
    prisma.warmupTemplateItem.count.mockResolvedValue(0);
    await expect(guard.isUsedInRoutine('sport', 'sport-1')).resolves.toBe(true);
  });
});
