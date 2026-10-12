import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { createAuthStateStorage } from '../data/auth-storage';

export const SESSION_TIMERS_STORAGE_KEY = 'trainerpro.mobile.session-timers';
export const SESSION_TIMER_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export type StoredRest = {
  endAt: number;
  expanded: boolean;
  lastSeenAt: number;
  seconds: number;
  setKey: string;
};

export type SessionTimerEntry = {
  completedRestKeys: string[];
  groupIds: string[];
  rest: StoredRest | null;
  selectedExerciseId: string | null;
  updatedAt: number;
};

export type SessionTimerPatch = Partial<Omit<SessionTimerEntry, 'updatedAt'>>;

type SessionTimersState = {
  bySession: Record<string, SessionTimerEntry>;
  clearSession: (sessionId: string) => void;
  patchSession: (sessionId: string, patch: SessionTimerPatch) => void;
};

type PersistedSessionTimers = {
  bySession: Record<string, SessionTimerEntry>;
};

export function createSessionTimersStore(storage: StateStorage) {
  return create<SessionTimersState>()(
    persist(
      (set) => ({
        bySession: {},
        clearSession: (sessionId) =>
          set((state) => {
            if (!state.bySession[sessionId]) return state;
            const bySession = { ...state.bySession };
            delete bySession[sessionId];
            return { bySession };
          }),
        patchSession: (sessionId, patch) =>
          set((state) => ({
            bySession: {
              ...state.bySession,
              [sessionId]: applyPatch(state.bySession[sessionId], patch, Date.now()),
            },
          })),
      }),
      {
        merge: (persisted, current) => ({
          ...current,
          bySession: pruneSessionTimers(readPersisted(persisted).bySession, Date.now()),
        }),
        name: SESSION_TIMERS_STORAGE_KEY,
        partialize: (state) => ({ bySession: state.bySession }),
        storage: createJSONStorage(() => storage),
        version: 1,
      },
    ),
  );
}

export const useSessionTimersStore = createSessionTimersStore(createAuthStateStorage());

export function pruneSessionTimers(
  bySession: Record<string, SessionTimerEntry>,
  now: number,
): Record<string, SessionTimerEntry> {
  const cutoff = now - SESSION_TIMER_MAX_AGE_MS;
  return Object.fromEntries(Object.entries(bySession).filter(([, entry]) => entry.updatedAt >= cutoff));
}

function applyPatch(current: SessionTimerEntry | undefined, patch: SessionTimerPatch, now: number): SessionTimerEntry {
  return {
    completedRestKeys: [],
    groupIds: [],
    rest: null,
    selectedExerciseId: null,
    ...current,
    ...patch,
    updatedAt: now,
  };
}

function readPersisted(persisted: unknown): PersistedSessionTimers {
  if (!persisted || typeof persisted !== 'object' || !('bySession' in persisted)) {
    return { bySession: {} };
  }
  const bySession = (persisted as PersistedSessionTimers).bySession;
  return { bySession: bySession ?? {} };
}
