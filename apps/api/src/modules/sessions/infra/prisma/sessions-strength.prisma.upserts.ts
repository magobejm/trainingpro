import { LibraryItemScope, TemplateKind } from '@prisma/client';
import {
  isometricSetHasData,
  mobilitySetHasData,
  plioSetHasData,
  sportLogHasData,
  sportSetHasData,
  strengthSetHasData,
} from '../../../../common/performed-set';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import type {
  LogIsometricSetInput,
  LogMobilitySetInput,
  LogPlioSetInput,
  LogSetInput,
  LogSportInput,
  LogSportSetInput,
} from '../../domain/session.input';
import { toDecimal } from './sessions-strength.prisma.helpers';

export async function upsertSetLog(prisma: PrismaService, input: LogSetInput, sessionItemId: string) {
  if (!strengthSetHasData(input)) {
    await prisma.setLog.deleteMany({ where: { sessionItemId, setIndex: input.setIndex } });
    return null;
  }
  return prisma.setLog.upsert({
    where: { sessionItemId_setIndex: { sessionItemId, setIndex: input.setIndex } },
    create: {
      effortRir: input.effortRir ?? null,
      effortRpe: input.effortRpe ?? null,
      repsDone: input.repsDone ?? null,
      sessionId: input.sessionId,
      sessionItemId,
      setIndex: input.setIndex,
      weightDoneKg: toDecimal(input.weightDoneKg),
    },
    update: {
      effortRir: input.effortRir ?? null,
      effortRpe: input.effortRpe ?? null,
      repsDone: input.repsDone ?? null,
      weightDoneKg: toDecimal(input.weightDoneKg),
    },
  });
}

export async function upsertPlioSetLog(prisma: PrismaService, input: LogPlioSetInput, sessionPlioBlockId: string) {
  if (!plioSetHasData(input)) {
    await prisma.plioSetLog.deleteMany({ where: { sessionPlioBlockId, setIndex: input.setIndex } });
    return null;
  }
  return prisma.plioSetLog.upsert({
    where: { sessionPlioBlockId_setIndex: { sessionPlioBlockId, setIndex: input.setIndex } },
    create: {
      durationSecondsDone: input.durationSecondsDone ?? null,
      effortRpe: input.effortRpe ?? null,
      repsDone: input.repsDone ?? null,
      sessionId: input.sessionId,
      sessionPlioBlockId,
      setIndex: input.setIndex,
      weightDoneKg: toDecimal(input.weightDoneKg),
    },
    update: {
      durationSecondsDone: input.durationSecondsDone ?? null,
      effortRpe: input.effortRpe ?? null,
      repsDone: input.repsDone ?? null,
      weightDoneKg: toDecimal(input.weightDoneKg),
    },
  });
}

export async function upsertMobilitySetLog(
  prisma: PrismaService,
  input: LogMobilitySetInput,
  sessionMobilityBlockId: string,
) {
  if (!mobilitySetHasData(input)) {
    await prisma.mobilitySetLog.deleteMany({ where: { sessionMobilityBlockId, setIndex: input.setIndex } });
    return null;
  }
  return prisma.mobilitySetLog.upsert({
    where: { sessionMobilityBlockId_setIndex: { sessionMobilityBlockId, setIndex: input.setIndex } },
    create: {
      effortRpe: input.effortRpe ?? null,
      repsDone: input.repsDone ?? null,
      romDone: input.romDone ?? null,
      sessionId: input.sessionId,
      sessionMobilityBlockId,
      setIndex: input.setIndex,
      weightDoneKg: toDecimal(input.weightDoneKg),
    },
    update: {
      effortRpe: input.effortRpe ?? null,
      repsDone: input.repsDone ?? null,
      romDone: input.romDone ?? null,
      weightDoneKg: toDecimal(input.weightDoneKg),
    },
  });
}

export async function upsertIsometricSetLog(
  prisma: PrismaService,
  input: LogIsometricSetInput,
  sessionIsometricBlockId: string,
) {
  if (!isometricSetHasData(input)) {
    await prisma.isometricSetLog.deleteMany({ where: { sessionIsometricBlockId, setIndex: input.setIndex } });
    return null;
  }
  return prisma.isometricSetLog.upsert({
    where: { sessionIsometricBlockId_setIndex: { sessionIsometricBlockId, setIndex: input.setIndex } },
    create: {
      durationSecondsDone: input.durationSecondsDone ?? null,
      effortRpe: input.effortRpe ?? null,
      sessionId: input.sessionId,
      sessionIsometricBlockId,
      setIndex: input.setIndex,
      weightDoneKg: toDecimal(input.weightDoneKg),
    },
    update: {
      durationSecondsDone: input.durationSecondsDone ?? null,
      effortRpe: input.effortRpe ?? null,
      weightDoneKg: toDecimal(input.weightDoneKg),
    },
  });
}

export async function upsertSportLog(prisma: PrismaService, input: LogSportInput, sessionSportBlockId: string) {
  if (!sportLogHasData(input)) {
    await prisma.sportSessionLog.deleteMany({ where: { sessionSportBlockId } });
    return null;
  }
  return prisma.sportSessionLog.upsert({
    where: { sessionSportBlockId },
    create: {
      avgHeartRate: input.avgHeartRate ?? null,
      durationMinutesDone: input.durationMinutesDone ?? null,
      effortRpe: input.effortRpe ?? null,
      sessionId: input.sessionId,
      sessionSportBlockId,
    },
    update: {
      avgHeartRate: input.avgHeartRate ?? null,
      durationMinutesDone: input.durationMinutesDone ?? null,
      effortRpe: input.effortRpe ?? null,
    },
  });
}

export async function upsertSportSetLog(prisma: PrismaService, input: LogSportSetInput, sessionSportBlockId: string) {
  if (!sportSetHasData(input)) {
    await prisma.sportSetLog.deleteMany({ where: { sessionSportBlockId, setIndex: input.setIndex } });
    return null;
  }
  return prisma.sportSetLog.upsert({
    where: { sessionSportBlockId_setIndex: { sessionSportBlockId, setIndex: input.setIndex } },
    create: {
      durationSecondsDone: input.durationSecondsDone ?? null,
      effortRir: input.effortRir ?? null,
      effortRpe: input.effortRpe ?? null,
      heartRateDone: input.heartRateDone ?? null,
      hrMaxPctDone: input.hrMaxPctDone ?? null,
      hrReservePctDone: input.hrReservePctDone ?? null,
      repsDone: input.repsDone ?? null,
      restSecondsDone: input.restSecondsDone ?? null,
      romDone: input.romDone ?? null,
      sessionId: input.sessionId,
      sessionSportBlockId,
      setIndex: input.setIndex,
      weightDoneKg: toDecimal(input.weightDoneKg),
    },
    update: {
      durationSecondsDone: input.durationSecondsDone ?? null,
      effortRir: input.effortRir ?? null,
      effortRpe: input.effortRpe ?? null,
      heartRateDone: input.heartRateDone ?? null,
      hrMaxPctDone: input.hrMaxPctDone ?? null,
      hrReservePctDone: input.hrReservePctDone ?? null,
      repsDone: input.repsDone ?? null,
      restSecondsDone: input.restSecondsDone ?? null,
      romDone: input.romDone ?? null,
      weightDoneKg: toDecimal(input.weightDoneKg),
    },
  });
}

const PLAN_BLOCK_SETS_INCLUDE = {
  orderBy: { setIndex: 'asc' as const },
};

export function readWorkoutTemplate(prisma: PrismaService, templateId: string, coachMembershipId: string) {
  return prisma.planTemplate.findFirst({
    where: {
      archivedAt: null,
      id: templateId,
      kind: { in: [TemplateKind.STRENGTH, TemplateKind.ROUTINE] },
      OR: [{ coachMembershipId }, { scope: LibraryItemScope.GLOBAL }],
    },
    include: {
      days: {
        where: { archivedAt: null },
        orderBy: { dayIndex: 'asc' },
        include: {
          exercises: {
            where: { archivedAt: null },
            orderBy: { sortOrder: 'asc' },
            include: {
              libraryExercise: { select: { coachInstructions: true } },
              sets: PLAN_BLOCK_SETS_INCLUDE,
            },
          },
          plioBlocks: {
            where: { archivedAt: null },
            orderBy: { sortOrder: 'asc' },
            include: {
              libraryPlioExercise: { select: { coachInstructions: true } },
              sets: PLAN_BLOCK_SETS_INCLUDE,
            },
          },
          mobilityBlocks: {
            where: { archivedAt: null },
            orderBy: { sortOrder: 'asc' },
            include: {
              libraryMobilityExercise: { select: { coachInstructions: true } },
              sets: PLAN_BLOCK_SETS_INCLUDE,
            },
          },
          isometricBlocks: {
            where: { archivedAt: null },
            orderBy: { sortOrder: 'asc' },
            include: {
              libraryIsometricExercise: { select: { coachInstructions: true } },
              sets: PLAN_BLOCK_SETS_INCLUDE,
            },
          },
          sportBlocks: {
            where: { archivedAt: null },
            orderBy: { sortOrder: 'asc' },
            include: {
              librarySport: { select: { coachInstructions: true } },
              sets: PLAN_BLOCK_SETS_INCLUDE,
            },
          },
        },
      },
    },
  });
}
