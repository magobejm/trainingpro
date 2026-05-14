import { TemplateKind } from '@prisma/client';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import type {
  LogIsometricSetInput,
  LogMobilitySetInput,
  LogPlioSetInput,
  LogSetInput,
  LogSportInput,
} from '../../domain/session.input';
import { toDecimal } from './sessions-strength.prisma.helpers';

export function upsertSetLog(prisma: PrismaService, input: LogSetInput, sessionItemId: string) {
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

export function upsertPlioSetLog(prisma: PrismaService, input: LogPlioSetInput, sessionPlioBlockId: string) {
  return prisma.plioSetLog.upsert({
    where: { sessionPlioBlockId_setIndex: { sessionPlioBlockId, setIndex: input.setIndex } },
    create: {
      effortRpe: input.effortRpe ?? null,
      repsDone: input.repsDone ?? null,
      sessionId: input.sessionId,
      sessionPlioBlockId,
      setIndex: input.setIndex,
      weightDoneKg: toDecimal(input.weightDoneKg),
    },
    update: {
      effortRpe: input.effortRpe ?? null,
      repsDone: input.repsDone ?? null,
      weightDoneKg: toDecimal(input.weightDoneKg),
    },
  });
}

export function upsertMobilitySetLog(prisma: PrismaService, input: LogMobilitySetInput, sessionMobilityBlockId: string) {
  return prisma.mobilitySetLog.upsert({
    where: { sessionMobilityBlockId_setIndex: { sessionMobilityBlockId, setIndex: input.setIndex } },
    create: {
      effortRpe: input.effortRpe ?? null,
      repsDone: input.repsDone ?? null,
      romDone: input.romDone ?? null,
      sessionId: input.sessionId,
      sessionMobilityBlockId,
      setIndex: input.setIndex,
    },
    update: {
      effortRpe: input.effortRpe ?? null,
      repsDone: input.repsDone ?? null,
      romDone: input.romDone ?? null,
    },
  });
}

export function upsertIsometricSetLog(prisma: PrismaService, input: LogIsometricSetInput, sessionIsometricBlockId: string) {
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

export function upsertSportLog(prisma: PrismaService, input: LogSportInput, sessionSportBlockId: string) {
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

export function readWorkoutTemplate(prisma: PrismaService, templateId: string, coachMembershipId: string) {
  return prisma.planTemplate.findFirst({
    where: {
      archivedAt: null,
      coachMembershipId,
      id: templateId,
      kind: { in: [TemplateKind.STRENGTH, TemplateKind.ROUTINE] },
    },
    include: {
      days: {
        where: { archivedAt: null },
        orderBy: { dayIndex: 'asc' },
        include: {
          exercises: {
            where: { archivedAt: null },
            orderBy: { sortOrder: 'asc' },
          },
          plioBlocks: {
            where: { archivedAt: null },
            orderBy: { sortOrder: 'asc' },
          },
          mobilityBlocks: {
            where: { archivedAt: null },
            orderBy: { sortOrder: 'asc' },
          },
          isometricBlocks: {
            where: { archivedAt: null },
            orderBy: { sortOrder: 'asc' },
          },
          sportBlocks: {
            where: { archivedAt: null },
            orderBy: { sortOrder: 'asc' },
          },
        },
      },
    },
  });
}
