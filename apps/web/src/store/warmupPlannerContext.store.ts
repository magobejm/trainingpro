import { create } from 'zustand';

type WarmupPlannerContextState = {
  initialTemplateId: null | string;
  viewOnly: boolean;
  setInitialTemplate: (id: string, viewOnly?: boolean) => void;
  clear: () => void;
};

export const useWarmupPlannerContextStore = create<WarmupPlannerContextState>((set) => ({
  initialTemplateId: null,
  viewOnly: false,
  setInitialTemplate: (id, viewOnly = false) => set({ initialTemplateId: id, viewOnly }),
  clear: () => set({ initialTemplateId: null, viewOnly: false }),
}));
