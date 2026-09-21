import { create } from 'zustand';

type NutritionContextState = {
  clientDisplayName: null | string;
  clientId: null | string;
  clear: () => void;
  consumeReturnClientId: () => null | string;
  openForClient: (clientId: string, clientDisplayName: string) => void;
};

export const useNutritionContextStore = create<NutritionContextState>((set, get) => ({
  clientDisplayName: null,
  clientId: null,
  clear: () => set({ clientId: null, clientDisplayName: null }),
  consumeReturnClientId: () => {
    const id = get().clientId;
    if (id) set({ clientId: null, clientDisplayName: null });
    return id;
  },
  openForClient: (clientId, clientDisplayName) => set({ clientId, clientDisplayName }),
}));
