import { create } from 'zustand';
import type { UpsertTemplateInput } from '../data/hooks/usePlanTemplates';

type PlanBuilderState = {
  currentTemplateId: null | string;
  draft: UpsertTemplateInput;
  resetDraft: () => void;
  setDraft: (draft: UpsertTemplateInput) => void;
  setTemplateName: (name: string) => void;
  startEditing: (templateId: string, draft: UpsertTemplateInput) => void;
};

const EMPTY_DRAFT: UpsertTemplateInput = {
  days: [],
  name: '',
};

export const usePlanBuilderStore = create<PlanBuilderState>((set) => ({
  currentTemplateId: null,
  draft: EMPTY_DRAFT,
  resetDraft: () => set({ currentTemplateId: null, draft: EMPTY_DRAFT }),
  setDraft: (draft) => set({ draft }),
  startEditing: (templateId, draft) => set({ currentTemplateId: templateId, draft }),
  setTemplateName: (name) =>
    set((state) => ({
      draft: {
        ...state.draft,
        name,
      },
    })),
}));
