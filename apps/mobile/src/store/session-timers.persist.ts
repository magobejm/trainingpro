type TimerPersistApi = {
  hasHydrated: () => boolean;
  onFinishHydration: (fn: () => void) => () => void;
  rehydrate: () => Promise<void> | void;
};

export function timerPersist(store: object): TimerPersistApi {
  return (store as { persist: TimerPersistApi }).persist;
}
