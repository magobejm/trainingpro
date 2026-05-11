import { Prisma } from '@prisma/client';
import type { SessionBlockItem, SessionInstance, SessionStrengthItem } from '../../domain/session.entity';

// eslint-disable-next-line max-lines-per-function
export function mapSession(
  row: Prisma.SessionInstanceGetPayload<{ include: ReturnType<typeof sessionInclude> }>,
): SessionInstance {
  const strengthItems: SessionStrengthItem[] = row.items.map((item) => ({
    type: 'strength' as const,
    displayName: item.displayName,
    id: item.id,
    logs: item.logs.map((L) => ({
      effortRpe: L.effortRpe,
      repsDone: L.repsDone,
      sessionItemId: L.sessionItemId,
      setIndex: L.setIndex,
      weightDoneKg: typeof L.weightDoneKg === 'number' ? L.weightDoneKg : Number(L.weightDoneKg),
    })),
    repsMax: item.repsMax,
    repsMin: item.repsMin,
    setsPlanned: item.setsPlanned,
    sortOrder: item.sortOrder,
  }));

  const plioItems: SessionBlockItem[] = row.plioBlocks.map((b) => ({
    type: 'plio' as const,
    displayName: b.displayName,
    id: b.id,
    meta: `${b.roundsPlanned}×${b.workSeconds}s / ${b.restSeconds}s desc`,
    sortOrder: b.sortOrder,
  }));

  const mobilityItems: SessionBlockItem[] = row.mobilityBlocks.map((b) => ({
    type: 'mobility' as const,
    displayName: b.displayName,
    id: b.id,
    meta: `${b.roundsPlanned}×${b.workSeconds}s / ${b.restSeconds}s desc`,
    sortOrder: b.sortOrder,
  }));

  const isometricItems: SessionBlockItem[] = row.isometricBlocks.map((b) => ({
    type: 'isometric' as const,
    displayName: b.displayName,
    id: b.id,
    meta: b.setsPlanned ? `${b.setsPlanned} series` : '',
    sortOrder: b.sortOrder,
  }));

  const sportItems: SessionBlockItem[] = row.sportBlocks.map((b) => ({
    type: 'sport' as const,
    displayName: b.displayName,
    id: b.id,
    meta: `${b.durationMinutes} min`,
    sortOrder: b.sortOrder,
  }));

  const items = [...strengthItems, ...plioItems, ...mobilityItems, ...isometricItems, ...sportItems].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );

  return {
    clientId: row.clientId,
    finishComment: row.finishComment,
    finishedAt: row.finishedAt,
    id: row.id,
    isCompleted: row.isCompleted,
    isIncomplete: row.isIncomplete,
    items,
    sessionDate: row.sessionDate,
    startedAt: row.startedAt,
    status: row.status,
    templateId: row.sourceTemplateId,
    templateVersion: row.sourceTemplateVersion,
  };
}

export function normalizeText(value: null | string | undefined): null | string {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function sessionInclude() {
  return {
    items: {
      orderBy: { sortOrder: 'asc' as const },
      where: { archivedAt: null },
      include: {
        logs: {
          orderBy: { setIndex: 'asc' as const },
        },
      },
    },
    plioBlocks: {
      orderBy: { sortOrder: 'asc' as const },
      where: { archivedAt: null },
    },
    mobilityBlocks: {
      orderBy: { sortOrder: 'asc' as const },
      where: { archivedAt: null },
    },
    isometricBlocks: {
      orderBy: { sortOrder: 'asc' as const },
      where: { archivedAt: null },
    },
    sportBlocks: {
      orderBy: { sortOrder: 'asc' as const },
      where: { archivedAt: null },
    },
  };
}

export function toDecimal(value: null | number | undefined) {
  return typeof value === 'number' ? new Prisma.Decimal(value) : null;
}
