import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import type { MorningCheckinScores } from '../screens/client/daily-checkin.utils';

type DailyCheckinState = {
  lastPromptDate: null | string;
  scores: MorningCheckinScores | null;
  dismissToday: (dateKey: string) => void;
  reset: () => void;
  saveToday: (dateKey: string, scores: MorningCheckinScores) => void;
};

const STORAGE_KEY = 'trainerpro.mobile.daily-checkin';
const memoryStorage = new Map<string, string>();

export const useDailyCheckinStore = create<DailyCheckinState>()(
  persist(
    (set) => ({
      lastPromptDate: null,
      scores: null,
      dismissToday: (dateKey) => set({ lastPromptDate: dateKey, scores: null }),
      reset: () => set({ lastPromptDate: null, scores: null }),
      saveToday: (dateKey, scores) => set({ lastPromptDate: dateKey, scores }),
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({ lastPromptDate: state.lastPromptDate, scores: state.scores }),
      storage: createJSONStorage(createStateStorage),
    },
  ),
);

function createStateStorage(): StateStorage {
  const scope = globalThis as { localStorage?: StateStorage };
  if (scope.localStorage) {
    return scope.localStorage;
  }
  return {
    getItem: (name) => memoryStorage.get(name) ?? null,
    removeItem: (name) => {
      memoryStorage.delete(name);
    },
    setItem: (name, value) => {
      memoryStorage.set(name, value);
    },
  };
}
