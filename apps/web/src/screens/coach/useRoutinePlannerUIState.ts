import { useState } from 'react';

export function useRoutinePlannerUIState() {
  const [editingId, setEditingId] = useState<null | string>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deletingId, setDeletingId] = useState<null | string>(null);
  const [addIdx, setAddIdx] = useState<null | number>(null);

  return {
    editingId,
    setEditingId,
    saveSuccess,
    setSaveSuccess,
    deletingId,
    setDeletingId,
    addIdx,
    setAddIdx,
  };
}
