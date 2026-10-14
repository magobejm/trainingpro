import { useCallback } from 'react';
import type { SessionView } from '@trainerpro/shared';
import {
  type LogIntervalMutationInput,
  type LogIsometricSetMutationInput,
  type LogMobilitySetMutationInput,
  type LogPlioSetMutationInput,
  type LogSetMutationInput,
  type LogSportMutationInput,
  sessionWritePath,
} from '../../data/hooks/useTodaySession';
import { useSessionDraft, type EnqueueResult } from '../../data/hooks/useSessionDraft';
import type { SessionOpInput } from '../../data/offline/session-draft';
import { finishSessionWithRpePayload, formatSessionRpeChatNotice, sessionRpeBand } from './session-rpe.utils';

type Translate = (key: string, options?: Record<string, unknown>) => string;
type Enqueue = (session: SessionView, input: SessionOpInput) => Promise<EnqueueResult>;

export function useOfflineSessionActions(sessionId: string, session: SessionView | null, revision: number) {
  const queue = useSessionDraft(sessionId, revision);
  const save = useCallback(
    (input: SessionOpInput) => saveSessionOp(queue.enqueue, session, input),
    [queue.enqueue, session],
  );
  const enqueueFinish = useCallback(
    (sessionRpe: number) => enqueueSessionFinish(queue.enqueue, session, sessionId, sessionRpe),
    [queue.enqueue, session, sessionId],
  );
  return {
    conflicts: queue.conflicts,
    dismissConflicts: queue.dismissConflicts,
    draft: queue.draft,
    enqueue: queue.enqueue,
    enqueueFinish,
    flush: queue.flush,
    handleLogInterval: (input: LogIntervalMutationInput) => save(intervalInput(sessionId, input)),
    handleLogIsometricSet: (input: LogIsometricSetMutationInput) => save(isometricInput(sessionId, input)),
    handleLogMobilitySet: (input: LogMobilitySetMutationInput) => save(mobilityInput(sessionId, input)),
    handleLogPlioSet: (input: LogPlioSetMutationInput) => save(plioInput(sessionId, input)),
    handleLogSet: (input: LogSetMutationInput) => save(strengthInput(sessionId, input)),
    handleLogSport: (input: LogSportMutationInput) => save(sportInput(sessionId, input)),
    pendingCount: queue.pendingCount,
  };
}

export async function notifyFinishedSession(
  notifyCoach: (message: string) => Promise<void>,
  onFinishedDay: () => void,
  sessionRpe: number,
  t: Translate,
): Promise<void> {
  const label = t(`mobile.client.rpe.band.${sessionRpeBand(sessionRpe).key}.label`);
  await notifyCoach(formatSessionRpeChatNotice(sessionRpe, label));
  onFinishedDay();
}

async function saveSessionOp(
  enqueue: Enqueue,
  session: SessionView | null,
  input: SessionOpInput,
): Promise<EnqueueResult | 'missing'> {
  if (!session) return 'missing';
  return enqueue(session, input);
}

function enqueueSessionFinish(
  enqueue: Enqueue,
  session: SessionView | null,
  sessionId: string,
  sessionRpe: number,
): Promise<EnqueueResult | 'missing'> {
  if (!session) return Promise.resolve('missing');
  return enqueue(session, {
    body: finishSessionWithRpePayload(sessionRpe),
    dedupeKey: 'finish',
    kind: 'finish',
    path: sessionWritePath(sessionId, 'finish'),
  });
}

function strengthInput(sessionId: string, input: LogSetMutationInput): SessionOpInput {
  return {
    body: input,
    dedupeKey: `log-set:${input.sessionItemId}:${input.setIndex}`,
    kind: 'log-set',
    path: sessionWritePath(sessionId, 'log-set'),
  };
}

function plioInput(sessionId: string, input: LogPlioSetMutationInput): SessionOpInput {
  return {
    body: input,
    dedupeKey: `log-plio-set:${input.sessionPlioBlockId}:${input.setIndex}`,
    kind: 'log-plio-set',
    path: sessionWritePath(sessionId, 'log-plio-set'),
  };
}

function mobilityInput(sessionId: string, input: LogMobilitySetMutationInput): SessionOpInput {
  return {
    body: input,
    dedupeKey: `log-mobility-set:${input.sessionMobilityBlockId}:${input.setIndex}`,
    kind: 'log-mobility-set',
    path: sessionWritePath(sessionId, 'log-mobility-set'),
  };
}

function isometricInput(sessionId: string, input: LogIsometricSetMutationInput): SessionOpInput {
  return {
    body: input,
    dedupeKey: `log-isometric-set:${input.sessionIsometricBlockId}:${input.setIndex}`,
    kind: 'log-isometric-set',
    path: sessionWritePath(sessionId, 'log-isometric-set'),
  };
}

function intervalInput(sessionId: string, input: LogIntervalMutationInput): SessionOpInput {
  return {
    body: input,
    dedupeKey: `log-interval:${input.sessionCardioBlockId}:${input.intervalIndex}`,
    kind: 'log-interval',
    path: sessionWritePath(sessionId, 'log-interval'),
  };
}

function sportInput(sessionId: string, input: LogSportMutationInput): SessionOpInput {
  const { sessionSportBlockId, ...body } = input;
  return {
    body,
    dedupeKey: `sport-set:${sessionSportBlockId}:${input.setIndex}`,
    kind: 'sport-set',
    path: sessionWritePath(sessionId, 'sport-set', sessionSportBlockId),
  };
}
