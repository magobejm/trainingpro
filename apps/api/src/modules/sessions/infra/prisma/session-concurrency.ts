import { ConflictException } from '@nestjs/common';
import { SessionStatus } from '@prisma/client';
import type { FinishSessionInput } from '../../domain/session.input';

export type FinishComparable = {
  finishComment: null | string;
  isIncomplete: boolean;
  postFatigue: null | number;
  postMood: null | number;
  postPain: null | number;
  sessionRpe: unknown;
  status: SessionStatus;
};

export function shouldReplacePendingSession(
  existing: { planDayId: null | string; startedAt: Date | null; status: SessionStatus },
  planDayId?: string,
): boolean {
  return Boolean(
    planDayId && existing.planDayId !== planDayId && existing.status === SessionStatus.PENDING && !existing.startedAt,
  );
}

export function sameFinish(current: FinishComparable, input: FinishSessionInput): boolean {
  return (
    current.isIncomplete === input.isIncomplete &&
    normalize(current.finishComment) === normalize(input.comment) &&
    sameNumber(current.postFatigue, input.postFatigue) &&
    sameNumber(current.postMood, input.postMood) &&
    sameNumber(current.postPain, input.postPain) &&
    sameNumber(asNumber(current.sessionRpe), input.sessionRpe)
  );
}

export async function finishIfOpen<T extends FinishComparable>(
  session: T,
  input: FinishSessionInput,
  updateOpen: () => Promise<number>,
  reload: () => Promise<T>,
): Promise<T> {
  if (session.status === SessionStatus.COMPLETED) {
    return acceptRepeat(session, input);
  }
  if ((await updateOpen()) > 0) return reload();
  return acceptRepeat(await reload(), input);
}

function acceptRepeat<T extends FinishComparable>(session: T, input: FinishSessionInput): T {
  if (session.status === SessionStatus.COMPLETED && sameFinish(session, input)) return session;
  throw new ConflictException('Session finish conflict');
}

function normalize(value: null | string | undefined): null | string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function sameNumber(current: null | number, next: null | number | undefined): boolean {
  return (current ?? null) === (next ?? null);
}

function asNumber(value: unknown): null | number {
  if (value == null) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
