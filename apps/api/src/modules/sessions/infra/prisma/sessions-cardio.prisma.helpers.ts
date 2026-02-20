import { BadRequestException } from '@nestjs/common';
import { Prisma, SessionStatus } from '@prisma/client';
import type { CardioIntervalLog, CardioSessionInstance } from '../../domain/cardio-session.entity';

export type CardioTemplateBlockSnapshot = {
  cardioMethodLibraryId: null | string;
  displayName: string;
  id: string;
  restSeconds: number;
  roundsPlanned: number;
  sortOrder: number;
  targetDistanceMeters: null | number;
  targetRpe: null | number;
  workSeconds: number;
};

export function assertCardioSessionMutable(status: SessionStatus): void {
  if (status === SessionStatus.COMPLETED) {
    throw new BadRequestException('Session already completed');
  }
}

export function mapCardioSessionBlockCreate(
  block: CardioTemplateBlockSnapshot,
): Prisma.SessionCardioBlockCreateWithoutSessionInput {
  return {
    displayName: block.displayName,
    restSeconds: block.restSeconds,
    roundsPlanned: block.roundsPlanned,
    sortOrder: block.sortOrder,
    sourceCardioBlockId: block.id,
    sourceCardioMethodId: block.cardioMethodLibraryId,
    targetDistanceMeters: block.targetDistanceMeters,
    targetRpe: block.targetRpe,
    workSeconds: block.workSeconds,
  };
}

export function readFirstDayCardioBlocks(
  days: { cardioBlocks: CardioTemplateBlockSnapshot[] }[],
): CardioTemplateBlockSnapshot[] | null {
  const firstDay = days[0];
  if (!firstDay || firstDay.cardioBlocks.length === 0) {
    return null;
  }
  return firstDay.cardioBlocks;
}

export function mapCardioIntervalLog(row: {
  avgHeartRate: null | number;
  distanceDoneMeters: null | number;
  durationSecondsDone: null | number;
  effortRpe: null | number;
  intervalIndex: number;
  sessionCardioBlockId: string;
}): CardioIntervalLog {
  return {
    avgHeartRate: row.avgHeartRate,
    distanceDoneMeters: row.distanceDoneMeters,
    durationSecondsDone: row.durationSecondsDone,
    effortRpe: row.effortRpe,
    intervalIndex: row.intervalIndex,
    sessionCardioBlockId: row.sessionCardioBlockId,
  };
}

export function mapCardioSession(
  row: Prisma.SessionInstanceGetPayload<{ include: ReturnType<typeof cardioSessionInclude> }>,
): CardioSessionInstance {
  return {
    blocks: row.cardioBlocks.map((block) => ({
      displayName: block.displayName,
      id: block.id,
      restSeconds: block.restSeconds,
      roundsPlanned: block.roundsPlanned,
      sortOrder: block.sortOrder,
      targetDistanceMeters: block.targetDistanceMeters,
      targetRpe: block.targetRpe,
      workSeconds: block.workSeconds,
    })),
    clientId: row.clientId,
    finishComment: row.finishComment,
    finishedAt: row.finishedAt,
    id: row.id,
    isCompleted: row.isCompleted,
    isIncomplete: row.isIncomplete,
    sessionDate: row.sessionDate,
    startedAt: row.startedAt,
    status: row.status,
    templateId: row.sourceTemplateId,
    templateVersion: row.sourceTemplateVersion,
  };
}

export function cardioSessionInclude() {
  return {
    cardioBlocks: {
      orderBy: { sortOrder: 'asc' as const },
      where: { archivedAt: null },
    },
    template: {
      select: { kind: true },
    },
  };
}
