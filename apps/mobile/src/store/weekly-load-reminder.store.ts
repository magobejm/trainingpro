import { create } from 'zustand';
import { createJSONStorage, persist, type PersistOptions } from 'zustand/middleware';
import {
  dismissLoadReminder,
  INITIAL_WEEKLY_LOAD_REMINDER,
  postponeLoadReminder,
  type WeeklyLoadReminderState,
} from '@trainerpro/shared';
import { createAuthStateStorage } from '../data/auth-storage';

type WeeklyLoadReminderStore = {
  dismiss: (userId: string) => void;
  postpone: (userId: string, todayKey: string) => void;
  /** Un estado por usuario del dispositivo: borrar el recordatorio no afecta a otras cuentas. */
  states: Record<string, WeeklyLoadReminderState>;
};

type Persisted = { states: Record<string, WeeklyLoadReminderState> };

const persistOptions: PersistOptions<WeeklyLoadReminderStore, Persisted> = {
  name: 'trainerpro.mobile.weekly-load-reminder',
  partialize: (state) => ({ states: state.states }),
  storage: createJSONStorage(createAuthStateStorage),
  version: 1,
};

export const useWeeklyLoadReminderStore = create<WeeklyLoadReminderStore>()(
  persist(
    (set) => ({
      dismiss: (userId) =>
        set((state) => ({
          states: { ...state.states, [userId]: dismissLoadReminder(readState(state.states, userId)) },
        })),
      postpone: (userId, todayKey) =>
        set((state) => ({
          states: { ...state.states, [userId]: postponeLoadReminder(todayKey, readState(state.states, userId)) },
        })),
      states: {},
    }),
    persistOptions,
  ),
);

export function readState(states: Record<string, WeeklyLoadReminderState>, userId: string | null): WeeklyLoadReminderState {
  return (userId ? states[userId] : undefined) ?? INITIAL_WEEKLY_LOAD_REMINDER;
}
