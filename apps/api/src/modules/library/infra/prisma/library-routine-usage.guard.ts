import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/prisma/prisma.service';

export type LibraryRoutineUsageKind = 'cardio' | 'isometric' | 'mobility' | 'plio' | 'sport' | 'strength';

const ROUTINE_IN_USE_MESSAGE = 'Library item is used in a routine template';

const ACTIVE_ROUTINE_DAY = {
  archivedAt: null,
  template: { archivedAt: null },
} as const;

const ACTIVE_WARMUP_TEMPLATE_IN_ROUTINE = {
  archivedAt: null,
  dayWarmups: {
    some: {
      planDay: ACTIVE_ROUTINE_DAY,
    },
  },
} as const;

@Injectable()
export class LibraryRoutineUsageGuard {
  constructor(private readonly prisma: PrismaService) {}

  async assertNotUsedInRoutine(kind: LibraryRoutineUsageKind, itemId: string): Promise<void> {
    const inUse = await this.isUsedInRoutine(kind, itemId);
    if (inUse) {
      throw new BadRequestException(ROUTINE_IN_USE_MESSAGE);
    }
  }

  async isUsedInRoutine(kind: LibraryRoutineUsageKind, itemId: string): Promise<boolean> {
    const [direct, warmup] = await Promise.all([
      this.countDirectRoutineUsage(kind, itemId),
      this.countWarmupRoutineUsage(kind, itemId),
    ]);
    return direct + warmup > 0;
  }

  private countDirectRoutineUsage(kind: LibraryRoutineUsageKind, itemId: string): Promise<number> {
    const blockFilter = { archivedAt: null, day: ACTIVE_ROUTINE_DAY };
    switch (kind) {
      case 'strength':
        return this.prisma.planStrengthExercise.count({
          where: { ...blockFilter, exerciseLibraryId: itemId },
        });
      case 'cardio':
        return this.prisma.planCardioBlock.count({
          where: { ...blockFilter, cardioMethodLibraryId: itemId },
        });
      case 'plio':
        return this.prisma.planPlioBlock.count({
          where: { ...blockFilter, plioExerciseLibraryId: itemId },
        });
      case 'mobility':
        return this.prisma.planMobilityBlock.count({
          where: { ...blockFilter, mobilityExerciseLibraryId: itemId },
        });
      case 'isometric':
        return this.prisma.planIsometricBlock.count({
          where: { ...blockFilter, isometricExerciseLibraryId: itemId },
        });
      case 'sport':
        return this.prisma.planSportBlock.count({
          where: { ...blockFilter, sportLibraryId: itemId },
        });
    }
  }

  private countWarmupRoutineUsage(kind: LibraryRoutineUsageKind, itemId: string): Promise<number> {
    return this.prisma.warmupTemplateItem.count({
      where: {
        archivedAt: null,
        ...warmupLibraryFieldFilter(kind, itemId),
        template: ACTIVE_WARMUP_TEMPLATE_IN_ROUTINE,
      },
    });
  }
}

function warmupLibraryFieldFilter(kind: LibraryRoutineUsageKind, itemId: string) {
  switch (kind) {
    case 'strength':
      return { exerciseLibraryId: itemId };
    case 'cardio':
      return { cardioMethodLibraryId: itemId };
    case 'plio':
      return { plioExerciseLibraryId: itemId };
    case 'mobility':
      return { mobilityExerciseLibraryId: itemId };
    case 'isometric':
      return { isometricExerciseLibraryId: itemId };
    case 'sport':
      return { sportLibraryId: itemId };
  }
}
