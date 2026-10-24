import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createAuthStateStorage } from '../data/auth-storage';

type RestPreferencesState = {
  autoStartRest: boolean;
  setAutoStartRest: (value: boolean) => void;
};

const STORAGE_KEY = 'trainerpro.mobile.rest-preferences';

export const useRestPreferencesStore = create<RestPreferencesState>()(
  persist(
    (set) => ({
      autoStartRest: true,
      setAutoStartRest: (value) => set({ autoStartRest: value }),
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({ autoStartRest: state.autoStartRest }),
      storage: createJSONStorage(createAuthStateStorage),
      version: 1,
    },
  ),
);
