import { useMutationFeedback } from '../../data/hooks/useFeedbackMutation';
import React, { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { useAssignRoutineMutation, useUpdateClientMutation } from '../../data/hooks/useClientMutations';
import { useClientsQuery } from '../../data/hooks/useClientsQuery';

import {
  useRoutineObjectivesQuery,
  useRoutineTemplatesQuery,
  type RoutineTemplateView,
} from '../../data/hooks/useRoutineTemplates';
import { readRouteClientId } from '../../layout/list-context';
import { useRouteClient } from '../../layout/useListContext';

import { useRoutinePlannerContextStore } from '../../store/routinePlannerContext.store';
import type { ShellRoute } from '../../layout/usePersistentShellRoute';
import { useRoutinePlannerDraft } from './useRoutinePlannerDraft';

import { RoutinePlannerLayout } from './components/RoutinePlanner/RoutinePlannerLayout';
import { UnsavedWorkDialogs } from '../../layout/UnsavedWorkDialogs';
import { useUnsavedWork } from '../../layout/useUnsavedWork';
import { useRoutinePlannerUIState } from './useRoutinePlannerUIState';
import { useRoutineHandoffPrompt } from './RoutineHandoffDialog';
import { archiveFutureWorkouts } from './routine-handoff';
import {
  buildAssignOnly,
  buildLayoutModel,
  buildSaveAndAssign,
  useHydrateDraftFromContext,
  usePlannerContextState,
  useRoutineSaveHandler,
  type HandoffPorts,
} from './RoutinePlannerScreen.model';

type Props = { onRouteChange?: (route: ShellRoute) => void };

export function RoutinePlannerScreen(props: Props): React.JSX.Element {
  const vm = useRoutinePlannerScreenModel(props.onRouteChange);
  const { handoffDialog, ...layout } = vm;
  return (
    <>
      <UnsavedWorkDialogs
        onOverwrite={() => void layout.retrySave()}
        onReload={() => {
          layout.work.release();
          window.location.reload();
        }}
        t={layout.t}
        work={layout.work}
      />
      <RoutinePlannerLayout {...layout} />
      {handoffDialog}
    </>
  );
}

function useRoutinePlannerScreenModel(onRouteChange?: (route: ShellRoute) => void) {
  const { t } = useTranslation();
  const clientId = useRoutinePlannerContextStore((state) => state.clientId);
  useEffect(() => {
    if (clientId) return;
    const urlClient = readRouteClientId();
    if (urlClient) useRoutinePlannerContextStore.setState({ clientId: urlClient });
  }, [clientId]);
  useRouteClient(clientId ?? '');
  const model = useRoutinePlannerModelData(onRouteChange, t);
  return buildLayoutModel({ ...model, t });
}

function useRoutinePlannerModelData(onRouteChange: undefined | ((route: ShellRoute) => void), t: (key: string) => string) {
  const templates = useRoutineTemplatesQuery().data ?? [];
  const objectiveOptions = useRoutineObjectivesQuery().data ?? [];
  const plannerContext = usePlannerContextState();
  const draftState = useRoutinePlannerDraft(t);
  const uiState = useRoutinePlannerUIState();
  const templateKey = plannerContext.initialTemplateId ?? uiState.editingId ?? 'new';
  const work = useUnsavedWork({
    onRestore: draftState.setDraft,
    storageKey: `trainerpro.draft.routine.${templateKey}`,
    value: draftState.draft,
  });
  hydratePlannerDraft(plannerContext, draftState, templates, uiState, t, work.adopt);
  const saveModel = usePlannerSaveModel(
    plannerContext.clearInitialTemplate,
    plannerContext.clientId,
    plannerContext.viewMode,
    draftState,
    onRouteChange,
    t,
    uiState,
    work,
  );
  return {
    ...saveModel,
    draftState,
    objectiveOptions,
    onRouteChange,
    plannerContext,
    templates,
    uiState,
    work,
  };
}

function hydratePlannerDraft(
  plannerContext: ReturnType<typeof usePlannerContextState>,
  draftState: ReturnType<typeof useRoutinePlannerDraft>,
  templates: RoutineTemplateView[],
  uiState: ReturnType<typeof useRoutinePlannerUIState>,
  t: (key: string) => string,
  onLoaded: (draft: ReturnType<typeof useRoutinePlannerDraft>['draft'], version: number | null) => void,
) {
  const onLoadedRef = React.useRef(onLoaded);
  onLoadedRef.current = onLoaded;
  const stableLoaded = React.useCallback(
    (draft: ReturnType<typeof useRoutinePlannerDraft>['draft'], version: number | null) => {
      onLoadedRef.current(draft, version);
    },
    [],
  );
  useHydrateDraftFromContext(
    plannerContext.clearInitialTemplate,
    draftState,
    plannerContext.initialTemplateId,
    plannerContext.resetCounter,
    templates,
    uiState,
    t,
    stableLoaded,
  );
}

function usePlannerSaveModel(
  clearInitialTemplate: () => void,
  clientId: null | string,
  viewMode: 'edit' | 'view' | null,
  draftState: ReturnType<typeof useRoutinePlannerDraft>,
  onRouteChange: undefined | ((route: ShellRoute) => void),
  t: (key: string) => string,
  uiState: ReturnType<typeof useRoutinePlannerUIState>,
  work: ReturnType<typeof useUnsavedWork<ReturnType<typeof useRoutinePlannerDraft>['draft']>>,
) {
  const updateClientMutation = useUpdateClientMutation(clientId ?? '');
  const assignMutation = useAssignRoutineMutation();
  useMutationFeedback(assignMutation);
  useMutationFeedback(updateClientMutation);
  const queryClient = useQueryClient();
  const clients = useClientsQuery().data ?? [];
  const handoff = useRoutineHandoffPrompt(t);
  const archive = (targetId: string, from: string) => archiveFutureWorkouts(queryClient, targetId, from);
  const ports: HandoffPorts = { archive, ask: handoff.ask, clients };
  const { deleteMutation, isSaving, onSave, onSaveCore, retrySave } = useRoutineSaveHandler(
    clearInitialTemplate,
    clientId,
    draftState,
    onRouteChange,
    t,
    uiState,
    updateClientMutation,
    work,
    ports,
  );
  const onSaveAndAssign = buildSaveAndAssign(
    onSaveCore,
    assignMutation,
    draftState,
    uiState,
    t,
    onRouteChange,
    work,
    archive,
  );
  const onAssignOnly = buildAssignOnly(assignMutation, uiState, draftState, onRouteChange, archive);
  return {
    deleteMutation,
    handoffDialog: handoff.dialog,
    handoffPorts: ports,
    isSaving,
    onSave,
    onSaveAndAssign,
    onAssignOnly,
    retrySave,
    updateClientMutation,
    viewMode,
  };
}
