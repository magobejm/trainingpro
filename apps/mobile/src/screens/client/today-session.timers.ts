import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import type { SessionItem, SessionView } from '../../data/hooks/useTodaySession';
import { workoutElapsedMs } from '../../features/timers/countdown';
import { formatWorkoutElapsed } from '../../features/timers/workout-elapsed';
import { timerPersist } from '../../store/session-timers.persist';
import {
  useSessionTimersStore,
  type SessionTimerEntry,
  type SessionTimerPatch,
  type StoredRest,
} from '../../store/session-timers.store';

export function useWorkoutElapsed(session: SessionView | null): string | undefined {
  const running = session?.status === 'IN_PROGRESS' && Boolean(session.startedAt);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!running) return;
    const tick = () => setNow(Date.now());
    tick();
    const interval = setInterval(tick, 1000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') tick();
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [running, session?.startedAt]);

  if (!session?.startedAt) return undefined;
  return formatWorkoutElapsed(workoutElapsedMs(session, now) / 1000);
}

export function usePersistedSessionTimers(
  sessionId: string,
  session: SessionView | null,
  serverStatus: SessionView['status'] | undefined,
) {
  const hydrated = useTimersHydrated();
  const entry = useSessionTimersStore((state) => state.bySession[sessionId]);
  useDropMissingExercise(hydrated, sessionId, session, entry?.selectedExerciseId);
  useClearFinishedSession(hydrated, sessionId, serverStatus, entry != null);

  const { clear, patch, readCompletedKeys, readRest } = useQueuedTimerWrites(hydrated, sessionId);

  return {
    clearSessionTimers: clear,
    completedRestKeys: entry?.completedRestKeys ?? [],
    exerciseGroup: findGroup(session, entry?.groupIds ?? []),
    leaveExercise: useCallback(() => {
      patch({ groupIds: [], rest: null, selectedExerciseId: null });
    }, [patch]),
    onAdjustRest: useCallback(
      (endAt: number, lastSeenAt: number) => {
        const rest = readRest();
        if (!rest) return;
        patch({ rest: { ...rest, endAt, lastSeenAt } });
      },
      [patch, readRest],
    ),
    onCollapseRest: useCallback(() => {
      const rest = readRest();
      if (rest) patch({ rest: { ...rest, expanded: false } });
    }, [patch, readRest]),
    onExpandRest: useCallback(() => {
      const rest = readRest();
      if (rest) patch({ rest: { ...rest, expanded: true } });
    }, [patch, readRest]),
    onNavigateExercise: useCallback(
      (item: SessionItem) => {
        patch({ rest: null, selectedExerciseId: item.id });
      },
      [patch],
    ),
    onRestFinish: useCallback(() => {
      const rest = readRest();
      if (!rest) return;
      const keys = readCompletedKeys();
      patch({
        completedRestKeys: keys.includes(rest.setKey) ? keys : [...keys, rest.setKey],
        rest: null,
      });
    }, [patch, readCompletedKeys, readRest]),
    onSelectExercise: useCallback(
      (item: SessionItem, group: SessionItem[]) => {
        patch({ groupIds: group.map((member) => member.id), selectedExerciseId: item.id });
      },
      [patch],
    ),
    onStartRest: useCallback(
      (setKey: string, seconds: number) => {
        const now = Date.now();
        patch({
          rest: { endAt: now + seconds * 1000, expanded: true, lastSeenAt: now, seconds, setKey },
        });
      },
      [patch],
    ),
    restState: toRestState(entry),
    selectedExercise: findItem(session, entry?.selectedExerciseId),
  };
}

function useQueuedTimerWrites(hydrated: boolean, sessionId: string) {
  const pending = useRef<SessionTimerPatch | null>(null);
  const pendingClear = useRef(false);
  const patch = useCallback(
    (partial: SessionTimerPatch) => {
      if (!timerPersist(useSessionTimersStore).hasHydrated()) {
        pendingClear.current = false;
        pending.current = { ...(pending.current ?? {}), ...partial };
        return;
      }
      useSessionTimersStore.getState().patchSession(sessionId, partial);
    },
    [sessionId],
  );
  const clear = useCallback(() => {
    pending.current = null;
    if (!timerPersist(useSessionTimersStore).hasHydrated()) {
      pendingClear.current = true;
      return;
    }
    useSessionTimersStore.getState().clearSession(sessionId);
  }, [sessionId]);
  useEffect(() => {
    if (!hydrated) return;
    if (pendingClear.current) {
      pendingClear.current = false;
      useSessionTimersStore.getState().clearSession(sessionId);
      return;
    }
    const queued = pending.current;
    if (!queued) return;
    pending.current = null;
    useSessionTimersStore.getState().patchSession(sessionId, queued);
  }, [hydrated, sessionId]);
  const readRest = useCallback((): StoredRest | null => {
    if (pending.current && 'rest' in pending.current) return pending.current.rest ?? null;
    return useSessionTimersStore.getState().bySession[sessionId]?.rest ?? null;
  }, [sessionId]);
  const readCompletedKeys = useCallback((): string[] => {
    if (pending.current?.completedRestKeys) return pending.current.completedRestKeys;
    return useSessionTimersStore.getState().bySession[sessionId]?.completedRestKeys ?? [];
  }, [sessionId]);
  return { clear, patch, readCompletedKeys, readRest };
}

function useTimersHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() => timerPersist(useSessionTimersStore).hasHydrated());
  useEffect(() => {
    return timerPersist(useSessionTimersStore).onFinishHydration(() => setHydrated(true));
  }, []);
  return hydrated;
}

function useDropMissingExercise(
  hydrated: boolean,
  sessionId: string,
  session: SessionView | null,
  selectedExerciseId: string | null | undefined,
): void {
  useEffect(() => {
    if (!hydrated || !session || !selectedExerciseId) return;
    const exists = session.items.some((item) => item.id === selectedExerciseId);
    if (exists) return;
    useSessionTimersStore.getState().patchSession(sessionId, {
      groupIds: [],
      rest: null,
      selectedExerciseId: null,
    });
  }, [hydrated, selectedExerciseId, session, sessionId]);
}

function useClearFinishedSession(
  hydrated: boolean,
  sessionId: string,
  status: SessionView['status'] | undefined,
  hasEntry: boolean,
): void {
  useEffect(() => {
    if (!hydrated || status !== 'COMPLETED' || !hasEntry) return;
    const entry = useSessionTimersStore.getState().bySession[sessionId];
    if (!entry?.rest && (entry?.completedRestKeys.length ?? 0) === 0) return;
    useSessionTimersStore.getState().patchSession(sessionId, { completedRestKeys: [], rest: null });
  }, [hasEntry, hydrated, sessionId, status]);
}

function findItem(session: SessionView | null, itemId: string | null | undefined): SessionItem | null {
  if (!session || !itemId) return null;
  return session.items.find((item) => item.id === itemId) ?? null;
}

function findGroup(session: SessionView | null, groupIds: string[]): SessionItem[] {
  if (!session) return [];
  return groupIds
    .map((id) => session.items.find((item) => item.id === id))
    .filter((item): item is SessionItem => item != null);
}

function toRestState(entry: SessionTimerEntry | undefined) {
  return entry?.rest ?? null;
}
