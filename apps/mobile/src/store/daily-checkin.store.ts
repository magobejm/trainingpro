import { create } from 'zustand';
import { createJSONStorage, persist, type PersistOptions } from 'zustand/middleware';
import { createAuthStateStorage } from '../data/auth-storage';
import {
  migrateDailyCheckin,
  writeTodayCheckin,
  type DailyCheckinEntries,
  type MorningCheckinScores,
} from '../screens/client/daily-checkin.utils';

type DailyCheckinState = {
  dismissToday: (userId: string, date: string) => void;
  entries: DailyCheckinEntries;
  saveToday: (userId: string, date: string, scores: MorningCheckinScores) => void;
};

type PersistedDailyCheckin = {
  entries: DailyCheckinEntries;
};

const STORAGE_KEY = 'trainerpro.mobile.daily-checkin';

const dailyCheckinPersistOptions: PersistOptions<DailyCheckinState, PersistedDailyCheckin> = {
  migrate: (persisted) => migrateDailyCheckin(persisted),
  name: STORAGE_KEY,
  partialize: (state) => ({ entries: state.entries }),
  storage: createJSONStorage(createAuthStateStorage),
  version: 1,
};

export const useDailyCheckinStore = create<DailyCheckinState>()(
  persist(
    (set) => ({
      entries: {},
      dismissToday: (userId, date) => set((state) => ({ entries: writeTodayCheckin(state.entries, userId, date, null) })),
      saveToday: (userId, date, scores) =>
        set((state) => ({ entries: writeTodayCheckin(state.entries, userId, date, scores) })),
    }),
    dailyCheckinPersistOptions,
  ),
);
