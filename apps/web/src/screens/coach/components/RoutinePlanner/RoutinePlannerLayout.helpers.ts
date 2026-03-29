import type React from 'react';
import type { DraftState } from '../../RoutinePlanner.types';
import type { WarmupTemplateView } from '../../../../data/hooks/useWarmupTemplates';

type DraftSetter = React.Dispatch<React.SetStateAction<DraftState>>;

export function addWarmupTemplateToDay(setDraft: DraftSetter, dayIdx: number, template: WarmupTemplateView) {
  setDraft((state) => {
    const day = state.days[dayIdx];
    if (!day) return state;
    // Deduplicate — skip if already assigned
    if ((day.warmupTemplates ?? []).some((t) => t.id === template.id)) return state;
    const days = state.days.map((item, index) =>
      index === dayIdx
        ? { ...item, warmupTemplates: [...(item.warmupTemplates ?? []), { id: template.id, name: template.name }] }
        : item,
    );
    return { ...state, days };
  });
}

export function removeWarmupTemplateFromDay(setDraft: DraftSetter, dayIdx: number, templateId: string) {
  setDraft((state) => {
    const day = state.days[dayIdx];
    if (!day) return state;
    const days = state.days.map((item, index) =>
      index === dayIdx
        ? { ...item, warmupTemplates: (item.warmupTemplates ?? []).filter((t) => t.id !== templateId) }
        : item,
    );
    return { ...state, days };
  });
}

export function createWarmupTemplateSelector(
  setDraft: DraftSetter,
  setShowWarmupTemplatePicker: (value: boolean) => void,
  pendingDayIdxRef: React.MutableRefObject<number>,
) {
  return (template: WarmupTemplateView) => {
    addWarmupTemplateToDay(setDraft, pendingDayIdxRef.current, template);
    setShowWarmupTemplatePicker(false);
  };
}
