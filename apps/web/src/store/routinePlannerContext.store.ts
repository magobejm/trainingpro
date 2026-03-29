import { create } from 'zustand';

type RoutinePlannerContextState = {
  clientDisplayName: null | string;
  clientId: null | string;
  initialTemplateId: null | string;
  resetCounter: number;
  viewMode: 'edit' | 'view' | null;
  consumeClientId: () => null | string;
  clear: () => void;
  clearInitialTemplate: () => void;
  openForClient: (clientId: string, clientDisplayName: string, initialTemplateId?: null | string) => void;
  openForEdit: (templateId: string) => void;
  openForView: (templateId: string, clientId?: string, clientDisplayName?: string) => void;
  prepareClientAssignment: (clientId: string, clientDisplayName: string) => void;
};

export const useRoutinePlannerContextStore = create<RoutinePlannerContextState>((set) => ({
  clientDisplayName: null,
  clientId: null,
  initialTemplateId: null,
  resetCounter: 0,
  viewMode: null,
  consumeClientId: () => {
    let current: null | string = null;
    set((previous) => {
      current = previous.clientId;
      return { ...previous, clientDisplayName: null, clientId: null };
    });
    return current;
  },
  clear: () =>
    set((state) => ({
      clientDisplayName: null,
      clientId: null,
      initialTemplateId: null,
      resetCounter: state.resetCounter + 1,
      viewMode: null,
    })),
  clearInitialTemplate: () => set((previous) => ({ ...previous, initialTemplateId: null })),
  openForClient: (clientId, clientDisplayName, initialTemplateId) =>
    set({
      clientDisplayName,
      clientId,
      initialTemplateId: initialTemplateId ?? null,
      resetCounter: 0,
      viewMode: 'edit',
    }),
  openForEdit: (templateId) =>
    set({ clientDisplayName: null, clientId: null, initialTemplateId: templateId, resetCounter: 0, viewMode: 'edit' }),
  openForView: (templateId, clientId, clientDisplayName) =>
    set({
      clientDisplayName: clientDisplayName ?? null,
      clientId: clientId ?? null,
      initialTemplateId: templateId,
      resetCounter: 0,
      viewMode: 'view',
    }),
  prepareClientAssignment: (clientId, clientDisplayName) =>
    set({
      clientDisplayName,
      clientId,
      initialTemplateId: null,
      resetCounter: 0,
      viewMode: null,
    }),
}));
