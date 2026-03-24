import { useState } from 'react';
import type { BlockType } from './RoutinePlanner.types';

export function useRoutinePlannerUIState() {
  const [editingId, setEditingId] = useState<null | string>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deletingId, setDeletingId] = useState<null | string>(null);
  const [addIdx, setAddIdx] = useState<null | number>(null);
  const [pickerType, setPickerType] = useState<BlockType | null>(null);
  const [showWarmupTemplatePicker, setShowWarmupTemplatePicker] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  return {
    addIdx,
    deletingId,
    editingId,
    pickerType,
    showSaveModal,
    showWarmupTemplatePicker,
    saveSuccess,
    setAddIdx,
    setDeletingId,
    setEditingId,
    setPickerType,
    setShowSaveModal,
    setShowWarmupTemplatePicker,
    setSaveSuccess,
  };
}
