import { useState } from 'react';
import type { BlockType } from './RoutinePlanner.types';

export function useRoutinePlannerUIState() {
  const [editingId, setEditingId] = useState<null | string>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deletingId, setDeletingId] = useState<null | string>(null);
  const [pickerType, setPickerType] = useState<BlockType | null>(null);
  const [showWarmupTemplatePicker, setShowWarmupTemplatePicker] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  return {
    deletingId,
    editingId,
    pickerType,
    showSaveModal,
    showWarmupTemplatePicker,
    saveSuccess,
    setDeletingId,
    setEditingId,
    setPickerType,
    setShowSaveModal,
    setShowWarmupTemplatePicker,
    setSaveSuccess,
  };
}
