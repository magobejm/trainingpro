import { create } from 'zustand';

type WarmupPlannerContextState = {
  fromLibrary: boolean;
  initialTemplateId: null | string;
  viewOnly: boolean;
  clear: () => void;
  clearInitialTemplate: () => void;
  openBlankFromLibrary: () => void;
  setInitialTemplate: (id: string, viewOnly?: boolean) => void;
};

export const useWarmupPlannerContextStore = create<WarmupPlannerContextState>((set) => ({
  fromLibrary: false,
  initialTemplateId: null,
  viewOnly: false,
  clear: () => set({ fromLibrary: false, initialTemplateId: null, viewOnly: false }),
  clearInitialTemplate: () => set({ initialTemplateId: null, viewOnly: false }),
  openBlankFromLibrary: () => set({ fromLibrary: true, initialTemplateId: null, viewOnly: false }),
  setInitialTemplate: (id, viewOnly = false) => set({ fromLibrary: true, initialTemplateId: id, viewOnly }),
}));
