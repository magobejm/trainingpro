import { create } from 'zustand';

type WarmupPlannerContextState = {
  initialTemplateId: null | string;
  setInitialTemplate: (id: string) => void;
  clear: () => void;
};

export const useWarmupPlannerContextStore = create<WarmupPlannerContextState>((set) => ({
  initialTemplateId: null,
  setInitialTemplate: (id) => set({ initialTemplateId: id }),
  clear: () => set({ initialTemplateId: null }),
}));
