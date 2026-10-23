import type { SessionStatus } from '@prisma/client';
import type { FinishSessionInput } from '../../domain/session.input';
import { assertSessionMutable } from './sessions-prisma.mappers';

type StaleAutoClose = {
  finishComment: null | string;
  isIncomplete: boolean;
  performedDurationSeconds?: null | number;
  sessionRpe: unknown;
  status: string;
};

export function isStaleAutoClose(session: StaleAutoClose): boolean {
  return (
    session.status === 'COMPLETED' &&
    session.isIncomplete &&
    session.sessionRpe == null &&
    !session.finishComment?.trim() &&
    (session.performedDurationSeconds ?? null) === null
  );
}

export function assertWritableSession(
  session: StaleAutoClose & { skippedAt?: Date | null; status: SessionStatus },
  options?: { closeStale?: boolean },
): void {
  if (options?.closeStale === false && isStaleAutoClose(session)) return;
  assertSessionMutable(session.status, session.skippedAt);
}

export async function takeStaleFinish<T>(
  session: StaleAutoClose,
  input: FinishSessionInput,
  update: () => Promise<number>,
  reload: () => Promise<T>,
): Promise<T | null> {
  if (!input.finishedAt || !isStaleAutoClose(session)) return null;
  if ((await update()) < 1) return null;
  return reload();
}
