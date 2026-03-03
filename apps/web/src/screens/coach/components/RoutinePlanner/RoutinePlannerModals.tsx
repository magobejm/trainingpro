import React from 'react';
import { ExercisePickerModal } from './ExercisePickerModal';
import { WarmupTemplatePickerModal } from './WarmupTemplatePickerModal';
import type { BlockType } from '../../RoutinePlanner.types';
import type { WarmupTemplateView } from '../../../../data/hooks/useWarmupTemplates';

type Props = {
  onPickerSelect: (libraryId: string, displayName: string) => void;
  onSelectWarmupTemplate: (template: WarmupTemplateView) => void;
  t: (k: string, options?: { count: number }) => string;
  uiState: {
    pickerType: BlockType | null;
    setPickerType: (value: BlockType | null) => void;
    setShowWarmupTemplatePicker: (value: boolean) => void;
    showWarmupTemplatePicker: boolean;
  };
  warmupTemplates: WarmupTemplateView[];
};

export function RoutinePlannerModals(props: Props) {
  return (
    <>
      <ExercisePickerModal
        blockType={props.uiState.pickerType}
        onCancel={() => props.uiState.setPickerType(null)}
        onSelect={props.onPickerSelect}
        t={props.t}
      />
      <WarmupTemplatePickerModal
        onCancel={() => props.uiState.setShowWarmupTemplatePicker(false)}
        onSelect={props.onSelectWarmupTemplate}
        t={props.t}
        templates={props.warmupTemplates}
        visible={props.uiState.showWarmupTemplatePicker}
      />
    </>
  );
}
