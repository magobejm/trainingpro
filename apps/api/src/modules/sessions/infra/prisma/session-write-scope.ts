import { NotFoundException } from '@nestjs/common';
import { Prisma, TemplateKind } from '@prisma/client';

const writableSessionSelect = {
  finishComment: true,
  id: true,
  isIncomplete: true,
  performedDurationSeconds: true,
  sessionRpe: true,
  skippedAt: true,
  status: true,
} satisfies Prisma.SessionInstanceSelect;

export async function readWritableSession(db: Prisma.TransactionClient, sessionId: string) {
  const row = await db.sessionInstance.findFirst({
    select: writableSessionSelect,
    where: { archivedAt: null, id: sessionId },
  });
  if (!row) throw new NotFoundException('Session not found');
  return row;
}

export async function readWritableCardioSession(db: Prisma.TransactionClient, sessionId: string) {
  const row = await db.sessionInstance.findFirst({
    select: {
      ...writableSessionSelect,
      cardioBlocks: { select: { id: true }, take: 1, where: { archivedAt: null } },
      template: { select: { kind: true } },
    },
    where: { archivedAt: null, id: sessionId },
  });
  const workout = row?.template.kind === TemplateKind.ROUTINE || row?.template.kind === TemplateKind.STRENGTH;
  const allowed = row?.template.kind === TemplateKind.CARDIO || (workout && (row?.cardioBlocks.length ?? 0) > 0);
  if (!row || !allowed) throw new NotFoundException('Cardio session not found');
  return row;
}
