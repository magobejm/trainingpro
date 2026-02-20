import { create } from 'zustand';
import type { UpsertTemplateInput } from '../data/hooks/usePlanTemplates';

type PlanBuilderState = {
  draft: UpsertTemplateInput;
  resetDraft: () => void;
  setDraft: (draft: UpsertTemplateInput) => void;
  setTemplateName: (name: string) => void;
};

const EMPTY_DRAFT: UpsertTemplateInput = {
  days: [],
  name: '',
};

export const usePlanBuilderStore = create<PlanBuilderState>((set) => ({
  draft: EMPTY_DRAFT,
  resetDraft: () => set({ draft: EMPTY_DRAFT }),
  setDraft: (draft) => set({ draft }),
  setTemplateName: (name) =>
    set((state) => ({
      draft: {
        ...state.draft,
        name,
      },
    })),
}));
