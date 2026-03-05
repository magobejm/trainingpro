import React from 'react';
import { useTranslation } from 'react-i18next';
import { useUpdateClientMutation } from '../../data/hooks/useClientMutations';
import { useClientObjectivesQuery } from '../../data/hooks/useClientsQuery';
import {
  useRoutineTemplatesQuery,
  type RoutineTemplateView,
} from '../../data/hooks/useRoutineTemplates';
import { useRoutinePlannerContextStore } from '../../store/routinePlannerContext.store';
import type { ShellRoute } from '../../layout/usePersistentShellRoute';
import { useRoutinePlannerDraft } from './useRoutinePlannerDraft';
import { useRoutinePlannerMutations } from './useRoutinePlannerMutations';
import { RoutinePlannerLayout } from './components/RoutinePlanner/RoutinePlannerLayout';
import { useRoutinePlannerUIState } from './useRoutinePlannerUIState';
import { mapTemplateToDraft } from './RoutinePlanner.helpers';

type Props = { onRouteChange?: (route: ShellRoute) => void };

export function RoutinePlannerScreen(props: Props): React.JSX.Element {
  const vm = useRoutinePlannerScreenModel(props.onRouteChange);
  return <RoutinePlannerLayout {...vm} />;
}

function useRoutinePlannerScreenModel(onRouteChange?: (route: ShellRoute) => void) {
  const { t } = useTranslation();
  const model = useRoutinePlannerModelData(onRouteChange, t);
  return buildLayoutModel({ ...model, t });
}

function useRoutinePlannerModelData(
  onRouteChange: undefined | ((route: ShellRoute) => void),
  t: (key: string) => string,
) {
  const templates = useRoutineTemplatesQuery().data ?? [];
  const objectiveOptions = useClientObjectivesQuery().data ?? [];
  const plannerContext = usePlannerContextState();
  const draftState = useRoutinePlannerDraft(t);
  const uiState = useRoutinePlannerUIState();
  hydratePlannerDraft(plannerContext, draftState, templates, uiState);
  const saveModel = usePlannerSaveModel(
    plannerContext.clearInitialTemplate,
    plannerContext.clientId,
    draftState,
    onRouteChange,
    t,
    uiState,
  );
  return {
    ...saveModel,
    draftState,
    objectiveOptions,
    onRouteChange,
    plannerContext,
    templates,
    uiState,
  };
}

function hydratePlannerDraft(
  plannerContext: ReturnType<typeof usePlannerContextState>,
  draftState: ReturnType<typeof useRoutinePlannerDraft>,
  templates: RoutineTemplateView[],
  uiState: ReturnType<typeof useRoutinePlannerUIState>,
) {
  usePlannerDraftHydration(
    plannerContext.clearInitialTemplate,
    draftState,
    plannerContext.initialTemplateId,
    templates,
    uiState,
  );
}

function usePlannerSaveModel(
  clearInitialTemplate: () => void,
  clientId: null | string,
  draftState: ReturnType<typeof useRoutinePlannerDraft>,
  onRouteChange: undefined | ((route: ShellRoute) => void),
  t: (key: string) => string,
  uiState: ReturnType<typeof useRoutinePlannerUIState>,
) {
  const updateClientMutation = useUpdateClientMutation(clientId ?? '');
  const { deleteMutation, onSave } = useRoutineSaveHandler(
    clearInitialTemplate,
    clientId,
    draftState,
    onRouteChange,
    t,
    uiState,
    updateClientMutation,
  );
  return { deleteMutation, onSave, updateClientMutation };
}

function usePlannerDraftHydration(
  clearInitialTemplate: () => void,
  draftState: ReturnType<typeof useRoutinePlannerDraft>,
  initialTemplateId: null | string,
  templates: Array<{ id: string } & Record<string, unknown>>,
  uiState: ReturnType<typeof useRoutinePlannerUIState>,
) {
  useHydrateDraftFromContext(
    clearInitialTemplate,
    draftState,
    initialTemplateId,
    templates,
    uiState,
  );
}

function buildLayoutModel(params: {
  deleteMutation: ReturnType<typeof useRoutineSaveHandler>['deleteMutation'];
  draftState: ReturnType<typeof useRoutinePlannerDraft>;
  onRouteChange: undefined | ((route: ShellRoute) => void);
  objectiveOptions: Array<{ id: string; label: string }>;
  onSave: ReturnType<typeof useRoutineSaveHandler>['onSave'];
  plannerContext: ReturnType<typeof usePlannerContextState>;
  t: (key: string) => string;
  templates: RoutineTemplateView[];
  uiState: ReturnType<typeof useRoutinePlannerUIState>;
  updateClientMutation: ReturnType<typeof useUpdateClientMutation>;
}) {
  return {
    clientContextName: params.plannerContext.clientDisplayName,
    clientContextId: params.plannerContext.clientId,
    deleteMutation: params.deleteMutation,
    draftState: params.draftState,
    objectiveOptions: params.objectiveOptions,
    onAssignTemplate: buildAssignTemplateHandler(params),
    onSave: params.onSave,
    t: params.t,
    templates: params.templates,
    uiState: params.uiState,
  };
}

function buildAssignTemplateHandler(params: {
  onRouteChange: undefined | ((route: ShellRoute) => void);
  plannerContext: ReturnType<typeof usePlannerContextState>;
  updateClientMutation: ReturnType<typeof useUpdateClientMutation>;
}) {
  return resolveAssignHandler(
    params.plannerContext.clearInitialTemplate,
    params.plannerContext.clientId,
    params.onRouteChange,
    params.updateClientMutation,
  );
}

function useRoutineSaveHandler(
  clearInitialTemplate: () => void,
  clientId: null | string,
  draftState: ReturnType<typeof useRoutinePlannerDraft>,
  onRouteChange: undefined | ((route: ShellRoute) => void),
  t: (key: string) => string,
  uiState: ReturnType<typeof useRoutinePlannerUIState>,
  updateClientMutation: ReturnType<typeof useUpdateClientMutation>,
) {
  return useRoutinePlannerMutations(
    draftState.draft,
    uiState.editingId,
    draftState.setDraft,
    uiState.setEditingId,
    draftState.setActiveDayIdx,
    uiState.setSaveSuccess,
    t,
    buildAfterSaveHandler(clearInitialTemplate, clientId, onRouteChange, updateClientMutation),
  );
}

function usePlannerContextState() {
  return {
    clientDisplayName: useRoutinePlannerContextStore((state) => state.clientDisplayName),
    clearInitialTemplate: useRoutinePlannerContextStore((state) => state.clearInitialTemplate),
    clientId: useRoutinePlannerContextStore((state) => state.clientId),
    initialTemplateId: useRoutinePlannerContextStore((state) => state.initialTemplateId),
  };
}

function useHydrateDraftFromContext(
  clearInitialTemplate: () => void,
  draftState: ReturnType<typeof useRoutinePlannerDraft>,
  initialTemplateId: null | string,
  templates: Array<{ id: string } & Record<string, unknown>>,
  uiState: ReturnType<typeof useRoutinePlannerUIState>,
) {
  React.useEffect(() => {
    if (!initialTemplateId || templates.length === 0) return;
    const initialTemplate = templates.find((tpl) => tpl.id === initialTemplateId);
    if (!initialTemplate) return clearInitialTemplate();
    uiState.setEditingId(initialTemplate.id);
    draftState.setDraft(mapTemplateToDraft(initialTemplate));
    draftState.setActiveDayIdx(0);
    clearInitialTemplate();
  }, [clearInitialTemplate, draftState, initialTemplateId, templates, uiState]);
}

function buildAfterSaveHandler(
  clearInitialTemplate: () => void,
  clientId: null | string,
  onRouteChange: undefined | ((route: ShellRoute) => void),
  updateClientMutation: ReturnType<typeof useUpdateClientMutation>,
) {
  return async (templateId: string) => {
    if (!clientId) return;
    await updateClientMutation.mutateAsync({ trainingPlanId: templateId });
    clearInitialTemplate();
    onRouteChange?.('coach.clients');
  };
}

function resolveAssignHandler(
  clearInitialTemplate: () => void,
  clientId: null | string,
  onRouteChange: undefined | ((route: ShellRoute) => void),
  updateClientMutation: ReturnType<typeof useUpdateClientMutation>,
): undefined | ((templateId: string) => Promise<void>) {
  if (!clientId) {
    return undefined;
  }
  return async (templateId: string) => {
    await updateClientMutation.mutateAsync({ trainingPlanId: templateId });
    clearInitialTemplate();
    onRouteChange?.('coach.clients');
  };
}
