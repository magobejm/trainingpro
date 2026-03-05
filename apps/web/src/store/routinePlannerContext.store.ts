import { create } from 'zustand';

type RoutinePlannerContextState = {
  clientDisplayName: null | string;
  clientId: null | string;
  initialTemplateId: null | string;
  consumeClientId: () => null | string;
  clear: () => void;
  clearInitialTemplate: () => void;
  openForClient: (
    clientId: string,
    clientDisplayName: string,
    initialTemplateId?: null | string,
  ) => void;
};

export const useRoutinePlannerContextStore = create<RoutinePlannerContextState>((set) => ({
  clientDisplayName: null,
  clientId: null,
  initialTemplateId: null,
  consumeClientId: () => {
    let current: null | string = null;
    set((previous) => {
      current = previous.clientId;
      return { ...previous, clientDisplayName: null, clientId: null };
    });
    return current;
  },
  clear: () => set({ clientDisplayName: null, clientId: null, initialTemplateId: null }),
  clearInitialTemplate: () => set((previous) => ({ ...previous, initialTemplateId: null })),
  openForClient: (clientId, clientDisplayName, initialTemplateId) =>
    set({
      clientDisplayName,
      clientId,
      initialTemplateId: initialTemplateId ?? null,
    }),
}));
