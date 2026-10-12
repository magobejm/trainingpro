import {
  SESSION_TIMER_MAX_AGE_MS,
  SESSION_TIMERS_STORAGE_KEY,
  createSessionTimersStore,
  type SessionTimerEntry,
} from '../session-timers.store';

type MemoryStorage = {
  getItem: (name: string) => string | null;
  removeItem: (name: string) => void;
  setItem: (name: string, value: string) => void;
};

function rehydrate(store: object): Promise<void> {
  return (store as { persist: { rehydrate: () => Promise<void> } }).persist.rehydrate();
}

const rest = {
  endAt: 5_000,
  expanded: true,
  lastSeenAt: 1_000,
  seconds: 90,
  setKey: 'item-1:2',
};

function memoryStorage(): MemoryStorage {
  const items = new Map<string, string>();
  return {
    getItem: (name) => items.get(name) ?? null,
    removeItem: (name) => {
      items.delete(name);
    },
    setItem: (name, value) => {
      items.set(name, value);
    },
  };
}

function entry(updatedAt: number, selectedExerciseId: string): SessionTimerEntry {
  return {
    completedRestKeys: ['item-1:1'],
    groupIds: ['item-1', 'item-2'],
    rest,
    selectedExerciseId,
    updatedAt,
  };
}

describe('session timers store', () => {
  it('restores the open exercise and the rest after a fresh store reads the same storage', async () => {
    const storage = memoryStorage();
    const first = createSessionTimersStore(storage);
    await rehydrate(first);
    first.getState().patchSession('session-1', {
      completedRestKeys: ['item-1:1'],
      groupIds: ['item-1', 'item-2'],
      rest,
      selectedExerciseId: 'item-1',
    });

    const second = createSessionTimersStore(storage);
    await rehydrate(second);
    expect(second.getState().bySession['session-1']).toMatchObject({
      completedRestKeys: ['item-1:1'],
      groupIds: ['item-1', 'item-2'],
      rest,
      selectedExerciseId: 'item-1',
    });
  });

  it('drops entries older than 24 hours when hydrating', async () => {
    const storage = memoryStorage();
    const now = Date.now();
    storage.setItem(
      SESSION_TIMERS_STORAGE_KEY,
      JSON.stringify({
        state: {
          bySession: {
            fresh: entry(now - 60 * 60 * 1000, 'keep'),
            stale: entry(now - SESSION_TIMER_MAX_AGE_MS - 60_000, 'drop'),
          },
        },
        version: 1,
      }),
    );
    const store = createSessionTimersStore(storage);
    await rehydrate(store);
    expect(store.getState().bySession['stale']).toBeUndefined();
    expect(store.getState().bySession['fresh']?.selectedExerciseId).toBe('keep');
  });

  it('clears one session without touching the others', async () => {
    const store = createSessionTimersStore(memoryStorage());
    await rehydrate(store);
    store.getState().patchSession('keep', { selectedExerciseId: 'item-a' });
    store.getState().patchSession('drop', { selectedExerciseId: 'item-b' });
    store.getState().clearSession('drop');
    expect(store.getState().bySession['drop']).toBeUndefined();
    expect(store.getState().bySession['keep']?.selectedExerciseId).toBe('item-a');
  });
});
