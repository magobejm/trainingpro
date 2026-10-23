import type { AuthContext } from '../../../common/auth-context/auth-context';
import type { EditWindowPolicy } from '../domain/policies/edit-window.policy';
import type { SessionWriteOptions, SessionsRepositoryPort } from '../domain/sessions-repository.port';

export function keepQueuedSessionOpen(occurredAt: Date | null): SessionWriteOptions {
  return { closeStale: occurredAt == null };
}

export async function guardSessionWrite(
  repository: Pick<SessionsRepositoryPort, 'getSessionById'>,
  policy: EditWindowPolicy,
  context: AuthContext,
  sessionId: string,
  timezoneOffsetMinutes: number,
  occurredAt: Date | null,
): Promise<void> {
  const session = await repository.getSessionById(context, sessionId, keepQueuedSessionOpen(occurredAt));
  if (!session) return;
  policy.resolveWriteInstant(session.sessionDate, new Date(), timezoneOffsetMinutes, occurredAt);
}

export async function guardAnySessionWrite(
  repository: Pick<SessionsRepositoryPort, 'getCardioSessionById' | 'getSessionById'>,
  policy: EditWindowPolicy,
  context: AuthContext,
  sessionId: string,
  timezoneOffsetMinutes: number,
  occurredAt: Date | null,
): Promise<void> {
  const options = keepQueuedSessionOpen(occurredAt);
  const session =
    (await repository.getCardioSessionById(context, sessionId, options)) ??
    (await repository.getSessionById(context, sessionId, options));
  if (!session) return;
  policy.resolveWriteInstant(session.sessionDate, new Date(), timezoneOffsetMinutes, occurredAt);
}
