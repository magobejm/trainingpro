import React from 'react';
import { useTranslation } from 'react-i18next';
import { useRoutineTemplatesQuery } from '../../data/hooks/useRoutineTemplates';
import { useRoutinePlannerDraft } from './useRoutinePlannerDraft';
import { useRoutinePlannerMutations } from './useRoutinePlannerMutations';
import { RoutinePlannerLayout } from './components/RoutinePlanner/RoutinePlannerLayout';
import { useRoutinePlannerUIState } from './useRoutinePlannerUIState';

export function RoutinePlannerScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const templates = useRoutineTemplatesQuery().data ?? [];
  const draftState = useRoutinePlannerDraft(t);
  const uiState = useRoutinePlannerUIState();
  const { onSave, deleteMutation } = useRoutinePlannerMutations(
    draftState.draft,
    uiState.editingId,
    draftState.setDraft,
    uiState.setEditingId,
    draftState.setActiveDayIdx,
    uiState.setSaveSuccess,
    t,
  );

  return (
    <RoutinePlannerLayout
      deleteMutation={deleteMutation}
      draftState={draftState}
      onSave={onSave}
      t={t}
      templates={templates}
      uiState={uiState}
    />
  );
}
