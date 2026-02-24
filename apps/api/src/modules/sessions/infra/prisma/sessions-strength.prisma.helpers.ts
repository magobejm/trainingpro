import { Prisma } from '@prisma/client';
import type { SessionInstance } from '../../domain/session.entity';

// eslint-disable-next-line max-lines-per-function
export function mapSession(
  row: Prisma.SessionInstanceGetPayload<{ include: ReturnType<typeof sessionInclude> }>,
): SessionInstance {
  return {
    clientId: row.clientId,
    finishComment: row.finishComment,
    finishedAt: row.finishedAt,
    id: row.id,
    isCompleted: row.isCompleted,
    isIncomplete: row.isIncomplete,
    items: row.items.map((item) => ({
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
    })),
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
  };
}

export function toDecimal(value: null | number | undefined) {
  return typeof value === 'number' ? new Prisma.Decimal(value) : null;
}
