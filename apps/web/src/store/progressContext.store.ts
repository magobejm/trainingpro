import { create } from 'zustand';

type ProgressContextState = {
  clientId: null | string;
  clientDisplayName: null | string;
  /** Read clientId for return navigation and clear context (used when navigating back to Clients). */
  consumeReturnClientId: () => null | string;
  openForClient: (clientId: string, clientDisplayName: string) => void;
  clear: () => void;
};

export const useProgressContextStore = create<ProgressContextState>((set, get) => ({
  clientId: null,
  clientDisplayName: null,
  consumeReturnClientId: () => {
    const id = get().clientId;
    if (id) set({ clientId: null, clientDisplayName: null });
    return id;
  },
  openForClient: (clientId, clientDisplayName) => set({ clientId, clientDisplayName }),
  clear: () => set({ clientId: null, clientDisplayName: null }),
}));
