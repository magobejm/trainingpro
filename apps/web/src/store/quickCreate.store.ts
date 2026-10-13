import { create } from 'zustand';

export type QuickCreateIntent = 'calendar' | 'client' | 'note';

type QuickCreateState = {
  consume: () => QuickCreateIntent | null;
  intent: QuickCreateIntent | null;
  request: (intent: QuickCreateIntent) => void;
};

export const useQuickCreateStore = create<QuickCreateState>((set, get) => ({
  consume: () => {
    const current = get().intent;
    if (current) set({ intent: null });
    return current;
  },
  intent: null,
  request: (intent) => set({ intent }),
}));
