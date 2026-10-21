import type { Prisma } from '@prisma/client';

/** Mirrors the shared outcome precedence: incomplete, then completed. */
export const closedSessionWhere = {
  OR: [{ isIncomplete: true }, { isCompleted: true }, { status: 'COMPLETED' }],
} satisfies Prisma.SessionInstanceWhereInput;
export const outcomeSelect = { isIncomplete: true, isCompleted: true, status: true, skippedAt: true } as const;
