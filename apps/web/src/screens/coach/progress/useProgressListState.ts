import { useEffect, useRef, useState } from 'react';
import { useClientsQuery } from '../../../data/hooks/useClientsQuery';
import type { SessionProgressCategory } from '../../../data/types/session-progress';
import {
  contextForClient,
  LIST_KEYS,
  readListContext,
  readRouteClientId,
  writeListContext,
} from '../../../layout/list-context';
import { useRouteClient } from '../../../layout/useListContext';
import { useProgressContextStore } from '../../../store/progressContext.store';
import type { AnalysisMode, SelectedExercise } from './progress-screen.types';

type ProgressSelection = {
  clientId: string;
  mode: AnalysisMode;
  selectedCategory: SessionProgressCategory | null;
  selectedDayIndex: number | null;
  selectedExercise: SelectedExercise | null;
  selectedTemplateId: string | null;
  weeksPreset: 4 | 8 | 12;
};

export function useProgressRouteClient(): { clientDisplayName: string | null; clientId: string | null } {
  const storeId = useProgressContextStore((state) => state.clientId);
  const storeName = useProgressContextStore((state) => state.clientDisplayName);
  const openForClient = useProgressContextStore((state) => state.openForClient);
  const clients = useClientsQuery().data;
  const urlClient = readRouteClientId();
  const clientId = storeId ?? urlClient;
  useEffect(() => {
    if (!clientId) return;
    if (storeId === clientId && storeName) return;
    const match = clients?.find((item) => item.id === clientId);
    const name = match ? `${match.firstName} ${match.lastName}`.trim() : (storeName ?? '');
    openForClient(clientId, name);
  }, [clientId, clients, openForClient, storeId, storeName]);
  useRouteClient(clientId ?? '');
  return { clientDisplayName: storeName, clientId };
}

export function useProgressSelection(clientId: string | null) {
  const resolvedId = clientId ?? readRouteClientId() ?? '';
  const [selection, setSelection] = useState<ProgressSelection>(() => readSelection(resolvedId));
  const previousId = useRef(selection.clientId);
  useEffect(() => {
    if (!resolvedId || previousId.current === resolvedId) return;
    previousId.current = resolvedId;
    setSelection(readSelection(resolvedId));
  }, [resolvedId]);
  useEffect(() => {
    if (!selection.clientId) return;
    writeListContext(LIST_KEYS.progress, selection);
  }, [selection]);
  return {
    mode: selection.mode,
    selectedCategory: selection.selectedCategory,
    selectedDayIndex: selection.selectedDayIndex,
    selectedExercise: selection.selectedExercise,
    selectedTemplateId: selection.selectedTemplateId,
    setMode: (mode: AnalysisMode) => setSelection((prev) => ({ ...prev, mode })),
    setSelectedCategory: (selectedCategory: SessionProgressCategory | null) =>
      setSelection((prev) => ({ ...prev, selectedCategory })),
    setSelectedDayIndex: (selectedDayIndex: number | null) => setSelection((prev) => ({ ...prev, selectedDayIndex })),
    setSelectedExercise: (selectedExercise: SelectedExercise | null) =>
      setSelection((prev) => ({ ...prev, selectedExercise })),
    setSelectedTemplateId: (selectedTemplateId: string | null) => setSelection((prev) => ({ ...prev, selectedTemplateId })),
    setWeeksPreset: (weeksPreset: 4 | 8 | 12) => setSelection((prev) => ({ ...prev, weeksPreset })),
    weeksPreset: selection.weeksPreset,
  };
}

function readSelection(clientId: string): ProgressSelection {
  const stored = contextForClient(readListContext<ProgressSelection>(LIST_KEYS.progress), clientId);
  return (
    stored ?? {
      clientId,
      mode: 'exercise',
      selectedCategory: null,
      selectedDayIndex: null,
      selectedExercise: null,
      selectedTemplateId: null,
      weeksPreset: 8,
    }
  );
}
