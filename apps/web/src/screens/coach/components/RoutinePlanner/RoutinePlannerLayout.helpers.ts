import type React from 'react';
import { mapWarmupTemplateItemsToBlocks } from '../../RoutinePlanner.helpers';
import type { DraftState } from '../../RoutinePlanner.types';
import type { WarmupTemplateView } from '../../../../data/hooks/useWarmupTemplates';

type DraftSetter = React.Dispatch<React.SetStateAction<DraftState>>;

export function appendWarmupTemplateBlocks(
  setDraft: DraftSetter,
  dayIdx: number,
  template: WarmupTemplateView,
) {
  const blocks = mapWarmupTemplateItemsToBlocks(template.items);
  setDraft((state) => {
    const day = state.days[dayIdx];
    if (!day) return state;
    const nextSort = day.blocks.length;
    const adjusted = blocks.map((block, index) => ({
      ...block,
      fromWarmupTemplate: true,
      sortOrder: nextSort + index,
      warmupTemplateName: template.name,
    }));
    const days = state.days.map((item, index) =>
      index === dayIdx ? { ...item, blocks: [...item.blocks, ...adjusted] } : item,
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
    appendWarmupTemplateBlocks(setDraft, pendingDayIdxRef.current, template);
    setShowWarmupTemplatePicker(false);
  };
}
