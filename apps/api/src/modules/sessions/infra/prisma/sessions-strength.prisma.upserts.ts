import { LibraryItemScope, Prisma, TemplateKind } from '@prisma/client';
import { attachRevisionInstructions } from '../../../plans/infra/prisma/routine-revision.prisma';
import { writeOrUpdate } from '../../../../common/prisma/unique-violation';
import {
  isometricSetHasData,
  mobilitySetHasData,
  plioSetHasData,
  sportLogHasData,
  sportSetHasData,
  strengthSetHasData,
} from '../../../../common/performed-set';
import type {
  LogIsometricSetInput,
  LogMobilitySetInput,
  LogPlioSetInput,
  LogSetInput,
  LogSportInput,
  LogSportSetInput,
} from '../../domain/session.input';
import { toDecimal } from './sessions-strength.prisma.helpers';

export async function upsertSetLog(prisma: Prisma.TransactionClient, input: LogSetInput, sessionItemId: string) {
  if (!strengthSetHasData(input)) {
    await prisma.setLog.deleteMany({ where: { sessionItemId, setIndex: input.setIndex } });
    return null;
  }
  const save = () =>
    prisma.setLog.upsert({
      where: { sessionItemId_setIndex: { sessionItemId, setIndex: input.setIndex } },
      create: {
        effortRir: input.effortRir ?? null,
        effortRpe: input.effortRpe ?? null,
        repsDone: input.repsDone ?? null,
        restSecondsDone: input.restSecondsDone ?? null,
        sessionId: input.sessionId,
        sessionItemId,
        setIndex: input.setIndex,
        weightDoneKg: toDecimal(input.weightDoneKg),
      },
      update: {
        effortRir: input.effortRir ?? null,
        effortRpe: input.effortRpe ?? null,
        repsDone: input.repsDone ?? null,
        ...recordedRest(input.restSecondsDone),
        weightDoneKg: toDecimal(input.weightDoneKg),
      },
    });
  return writeOrUpdate(save, save);
}

export async function upsertPlioSetLog(
  prisma: Prisma.TransactionClient,
  input: LogPlioSetInput,
  sessionPlioBlockId: string,
) {
  if (!plioSetHasData(input)) {
    await prisma.plioSetLog.deleteMany({ where: { sessionPlioBlockId, setIndex: input.setIndex } });
    return null;
  }
  const save = () =>
    prisma.plioSetLog.upsert({
      where: { sessionPlioBlockId_setIndex: { sessionPlioBlockId, setIndex: input.setIndex } },
      create: {
        durationSecondsDone: input.durationSecondsDone ?? null,
        effortRpe: input.effortRpe ?? null,
        repsDone: input.repsDone ?? null,
        restSecondsDone: input.restSecondsDone ?? null,
        sessionId: input.sessionId,
        sessionPlioBlockId,
        setIndex: input.setIndex,
        weightDoneKg: toDecimal(input.weightDoneKg),
      },
      update: {
        durationSecondsDone: input.durationSecondsDone ?? null,
        effortRpe: input.effortRpe ?? null,
        repsDone: input.repsDone ?? null,
        ...recordedRest(input.restSecondsDone),
        weightDoneKg: toDecimal(input.weightDoneKg),
      },
    });
  return writeOrUpdate(save, save);
}

export async function upsertMobilitySetLog(
  prisma: Prisma.TransactionClient,
  input: LogMobilitySetInput,
  sessionMobilityBlockId: string,
) {
  if (!mobilitySetHasData(input)) {
    await prisma.mobilitySetLog.deleteMany({ where: { sessionMobilityBlockId, setIndex: input.setIndex } });
    return null;
  }
  const save = () =>
    prisma.mobilitySetLog.upsert({
      where: { sessionMobilityBlockId_setIndex: { sessionMobilityBlockId, setIndex: input.setIndex } },
      create: {
        effortRpe: input.effortRpe ?? null,
        repsDone: input.repsDone ?? null,
        restSecondsDone: input.restSecondsDone ?? null,
        romDone: input.romDone ?? null,
        sessionId: input.sessionId,
        sessionMobilityBlockId,
        setIndex: input.setIndex,
        weightDoneKg: toDecimal(input.weightDoneKg),
      },
      update: {
        effortRpe: input.effortRpe ?? null,
        repsDone: input.repsDone ?? null,
        ...recordedRest(input.restSecondsDone),
        romDone: input.romDone ?? null,
        weightDoneKg: toDecimal(input.weightDoneKg),
      },
    });
  return writeOrUpdate(save, save);
}

export async function upsertIsometricSetLog(
  prisma: Prisma.TransactionClient,
  input: LogIsometricSetInput,
  sessionIsometricBlockId: string,
) {
  if (!isometricSetHasData(input)) {
    await prisma.isometricSetLog.deleteMany({ where: { sessionIsometricBlockId, setIndex: input.setIndex } });
    return null;
  }
  const save = () =>
    prisma.isometricSetLog.upsert({
      where: { sessionIsometricBlockId_setIndex: { sessionIsometricBlockId, setIndex: input.setIndex } },
      create: {
        durationSecondsDone: input.durationSecondsDone ?? null,
        effortRpe: input.effortRpe ?? null,
        restSecondsDone: input.restSecondsDone ?? null,
        sessionId: input.sessionId,
        sessionIsometricBlockId,
        setIndex: input.setIndex,
        weightDoneKg: toDecimal(input.weightDoneKg),
      },
      update: {
        durationSecondsDone: input.durationSecondsDone ?? null,
        effortRpe: input.effortRpe ?? null,
        ...recordedRest(input.restSecondsDone),
        weightDoneKg: toDecimal(input.weightDoneKg),
      },
    });
  return writeOrUpdate(save, save);
}

export async function upsertSportLog(prisma: Prisma.TransactionClient, input: LogSportInput, sessionSportBlockId: string) {
  if (!sportLogHasData(input)) {
    await prisma.sportSessionLog.deleteMany({ where: { sessionSportBlockId } });
    return null;
  }
  const save = () =>
    prisma.sportSessionLog.upsert({
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
  return writeOrUpdate(save, save);
}

export async function upsertSportSetLog(
  prisma: Prisma.TransactionClient,
  input: LogSportSetInput,
  sessionSportBlockId: string,
) {
  if (!sportSetHasData(input)) {
    await prisma.sportSetLog.deleteMany({ where: { sessionSportBlockId, setIndex: input.setIndex } });
    return null;
  }
  const save = () =>
    prisma.sportSetLog.upsert({
      where: { sessionSportBlockId_setIndex: { sessionSportBlockId, setIndex: input.setIndex } },
      create: {
        distanceDoneMeters: input.distanceDoneMeters ?? null,
        durationSecondsDone: input.durationSecondsDone ?? null,
        effortRir: input.effortRir ?? null,
        effortRpe: input.effortRpe ?? null,
        heartRateDone: input.heartRateDone ?? null,
        heartRateDoneMax: input.heartRateDoneMax ?? null,
        hrMaxPctDone: input.hrMaxPctDone ?? null,
        hrMaxPctDoneMax: input.hrMaxPctDoneMax ?? null,
        hrReservePctDone: input.hrReservePctDone ?? null,
        hrReservePctDoneMax: input.hrReservePctDoneMax ?? null,
        repsDone: input.repsDone ?? null,
        restSecondsDone: input.restSecondsDone ?? null,
        romDone: input.romDone ?? null,
        sessionId: input.sessionId,
        sessionSportBlockId,
        setIndex: input.setIndex,
        weightDoneKg: toDecimal(input.weightDoneKg),
      },
      update: {
        ...(input.distanceDoneMeters === undefined ? {} : { distanceDoneMeters: input.distanceDoneMeters }),
        durationSecondsDone: input.durationSecondsDone ?? null,
        effortRir: input.effortRir ?? null,
        effortRpe: input.effortRpe ?? null,
        heartRateDone: input.heartRateDone ?? null,
        heartRateDoneMax: input.heartRateDoneMax ?? null,
        hrMaxPctDone: input.hrMaxPctDone ?? null,
        hrMaxPctDoneMax: input.hrMaxPctDoneMax ?? null,
        hrReservePctDone: input.hrReservePctDone ?? null,
        hrReservePctDoneMax: input.hrReservePctDoneMax ?? null,
        repsDone: input.repsDone ?? null,
        ...recordedRest(input.restSecondsDone),
        romDone: input.romDone ?? null,
        weightDoneKg: toDecimal(input.weightDoneKg),
      },
    });
  return writeOrUpdate(save, save);
}

function recordedRest(value: null | number | undefined): { restSecondsDone?: null | number } {
  if (value === undefined) return {};
  return { restSecondsDone: value };
}

const PLAN_BLOCK_SETS_INCLUDE = {
  orderBy: { setIndex: 'asc' as const },
};

export async function readWorkoutTemplate(
  prisma: Prisma.TransactionClient,
  templateId: string,
  coachMembershipId: string,
  planDayId?: string | null,
  clientId?: string,
) {
  const row = await prisma.planTemplate.findFirst({
    where: {
      AND: [
        {
          OR: [
            { archivedAt: null },
            ...(planDayId && clientId
              ? [{ days: { some: { id: planDayId, calendarEvents: { some: { clientId, archivedAt: null } } } } }]
              : []),
          ],
        },
      ],
      id: templateId,
      kind: { in: [TemplateKind.STRENGTH, TemplateKind.ROUTINE] },
      OR: [{ coachMembershipId }, { scope: LibraryItemScope.GLOBAL }],
    },
    include: {
      days: {
        where: { archivedAt: null },
        orderBy: { dayIndex: 'asc' },
        include: {
          cardioBlocks: {
            where: { archivedAt: null },
            orderBy: { sortOrder: 'asc' },
            include: {
              libraryCardioMethod: { select: { coachInstructions: true } },
              sets: PLAN_BLOCK_SETS_INCLUDE,
            },
          },
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
  if (!row) return null;
  const day = planDayId ? row.days.find((item) => item.id === planDayId) : null;
  const version = day?.revisionVersion ?? row.templateVersion;
  await attachRevisionInstructions(prisma, templateId, version, row.days);
  return { ...row, templateVersion: version, days: row.days.filter((item) => item.revisionVersion === version) };
}
