import { useQueryClient } from '@tanstack/react-query';
import type { SessionView } from '@trainerpro/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { createApiClient } from '../api-client';
import { applyPendingOps } from '../offline/apply-pending';
import {
  createSessionDraft,
  isDraftIdle,
  readSessionDraft,
  removeSessionDraft,
  type SessionDraft,
  type SessionOp,
  type SessionOpInput,
  upsertOp,
  withoutConflicts,
  writeSessionDraft,
} from '../offline/session-draft';
import { flushQueue } from '../offline/session-queue';
import { useAuthStore } from '../../store/auth.store';

export const SESSION_FLUSH_INTERVAL_MS = 20_000;

export type EnqueueResult = 'conflict' | 'pending' | 'synced';

const flushTails = new Map<string, Promise<void>>();

export function useSessionDraft(sessionId: string, revision = 0) {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  const [draft, setDraft] = useState<SessionDraft | null>(null);
  const draftRef = useRef<SessionDraft | null>(null);

  const reload = useCallback(async () => {
    const next = await readSessionDraft(sessionId);
    draftRef.current = next;
    setDraft(next);
    return next;
  }, [sessionId]);

  const flush = useCallback(
    () =>
      scheduleFlush(sessionId, () => flushStored({ accessToken, activeRole, draftRef, queryClient, sessionId, setDraft })),
    [accessToken, activeRole, queryClient, sessionId],
  );

  const enqueue = useCallback(
    async (session: SessionView, input: SessionOpInput): Promise<EnqueueResult> => {
      let result: EnqueueResult = 'pending';
      await scheduleFlush(sessionId, async () => {
        const current = (await readSessionDraft(sessionId)) ?? createSessionDraft(session);
        const next = upsertOp(withSession(current, session), input);
        await writeSessionDraft(next);
        draftRef.current = next;
        setDraft(next);
        await flushStored({ accessToken, activeRole, draftRef, queryClient, sessionId, setDraft });
        result = readEnqueueResult((await readSessionDraft(sessionId)) ?? draftRef.current, input.dedupeKey);
      });
      return result;
    },
    [accessToken, activeRole, queryClient, sessionId],
  );

  const dismissConflicts = useCallback(async () => {
    const current = await readSessionDraft(sessionId);
    if (!current) return;
    const next = withoutConflicts(current);
    if (isDraftIdle(next)) {
      await removeSessionDraft(sessionId);
      draftRef.current = null;
      setDraft(null);
      return;
    }
    await writeSessionDraft(next);
    draftRef.current = next;
    setDraft(next);
  }, [sessionId]);

  useEffect(() => {
    void reload();
  }, [reload, revision]);

  useEffect(() => {
    void flush();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void flush();
    });
    return () => subscription.remove();
  }, [flush]);

  useEffect(() => {
    if (!draft || draft.ops.length === 0) return;
    const timer = setInterval(() => {
      void flush();
    }, SESSION_FLUSH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [draft, flush]);

  return {
    conflicts: draft?.conflicts ?? [],
    dismissConflicts,
    draft,
    enqueue,
    flush,
    pendingCount: draft?.ops.length ?? 0,
  };
}

function withSession(draft: SessionDraft, session: SessionView): SessionDraft {
  return { ...draft, session, sessionDate: session.sessionDate, templateVersion: session.templateVersion };
}

function scheduleFlush(sessionId: string, work: () => Promise<void>): Promise<void> {
  const previous = flushTails.get(sessionId) ?? Promise.resolve();
  const run = previous.then(work, work);
  flushTails.set(
    sessionId,
    run.then(
      () => undefined,
      () => undefined,
    ),
  );
  return run;
}

type FlushContext = {
  accessToken: string | null;
  activeRole: 'admin' | 'client' | 'coach' | null;
  draftRef: { current: SessionDraft | null };
  queryClient: ReturnType<typeof useQueryClient>;
  sessionId: string;
  setDraft: (draft: SessionDraft | null) => void;
};

async function flushStored(context: FlushContext): Promise<void> {
  const current = await readSessionDraft(context.sessionId);
  if (!current || current.ops.length === 0 || !context.accessToken || !context.activeRole) {
    context.draftRef.current = current;
    context.setDraft(current);
    return;
  }
  const stored = await postDraft(context, current);
  publishSession(context.queryClient, context.sessionId, stored.session);
  if (isDraftIdle(stored)) {
    await removeSessionDraft(context.sessionId);
    context.draftRef.current = null;
    context.setDraft(null);
  } else {
    await writeSessionDraft(stored);
    context.draftRef.current = stored;
    context.setDraft(stored);
  }
  if (removedOps(current, stored).length > 0) {
    await context.queryClient.invalidateQueries({ queryKey: ['session', context.sessionId] });
  }
}

async function postDraft(context: FlushContext, current: SessionDraft): Promise<SessionDraft> {
  const client = createApiClient({ accessToken: context.accessToken ?? '', activeRole: context.activeRole ?? 'client' });
  const flushed = await flushQueue({ post: (path, body, headers) => client.post(path, body, headers) }, current);
  const removed = removedOps(current, flushed);
  const session = flushed.session ? applyPendingOps(flushed.session, removed) : flushed.session;
  return {
    ...flushed,
    session,
    sessionDate: session?.sessionDate ?? flushed.sessionDate,
    templateVersion: session?.templateVersion ?? flushed.templateVersion,
  };
}

function removedOps(before: SessionDraft, after: SessionDraft): SessionOp[] {
  const kept = new Set(after.ops.map((op) => op.id));
  const rejected = new Set(after.conflicts.map((conflict) => conflict.op.id));
  return before.ops.filter((op) => !kept.has(op.id) && !rejected.has(op.id));
}

function publishSession(
  queryClient: ReturnType<typeof useQueryClient>,
  sessionId: string,
  session: SessionView | null,
): void {
  if (!session) return;
  queryClient.setQueriesData<SessionView>({ queryKey: ['session', sessionId] }, () => session);
}

function readEnqueueResult(draft: SessionDraft | null, dedupeKey: string): EnqueueResult {
  if (!draft) return 'synced';
  if (draft.ops.some((op) => op.dedupeKey === dedupeKey)) return 'pending';
  if (draft.conflicts.some((conflict) => conflict.op.dedupeKey === dedupeKey)) return 'conflict';
  return 'synced';
}

export function requestSessionFlush(sessionId: string, queryClient: ReturnType<typeof useQueryClient>): Promise<void> {
  const auth = useAuthStore.getState();
  return scheduleFlush(sessionId, () =>
    flushStored({
      accessToken: auth.accessToken,
      activeRole: auth.activeRole,
      draftRef: { current: null },
      queryClient,
      sessionId,
      setDraft: () => undefined,
    }),
  );
}
