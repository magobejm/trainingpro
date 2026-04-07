import React from 'react';
import { useTranslation } from 'react-i18next';
import { pickNormalizedPlanTemplateId } from '../../data/normalize-plan-template-id';
import { useAssignRoutineMutation, useUpdateClientMutation } from '../../data/hooks/useClientMutations';
import { createEmptyDraft, mapTemplateToDraft } from './RoutinePlanner.helpers';
import {
  useRoutineObjectivesQuery,
  useRoutineTemplatesQuery,
  type RoutineTemplateView,
} from '../../data/hooks/useRoutineTemplates';
import { useRoutinePlannerContextStore } from '../../store/routinePlannerContext.store';
import type { ShellRoute } from '../../layout/usePersistentShellRoute';
import { useRoutinePlannerDraft } from './useRoutinePlannerDraft';
import { useRoutinePlannerMutations } from './useRoutinePlannerMutations';
import { RoutinePlannerLayout } from './components/RoutinePlanner/RoutinePlannerLayout';
import { useRoutinePlannerUIState } from './useRoutinePlannerUIState';

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

function useRoutinePlannerModelData(onRouteChange: undefined | ((route: ShellRoute) => void), t: (key: string) => string) {
  const templates = useRoutineTemplatesQuery().data ?? [];
  const objectiveOptions = useRoutineObjectivesQuery().data ?? [];
  const plannerContext = usePlannerContextState();
  const draftState = useRoutinePlannerDraft(t);
  const uiState = useRoutinePlannerUIState();
  hydratePlannerDraft(plannerContext, draftState, templates, uiState, t);
  const saveModel = usePlannerSaveModel(
    plannerContext.clearInitialTemplate,
    plannerContext.clientId,
    plannerContext.viewMode,
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
  t: (key: string) => string,
) {
  useHydrateDraftFromContext(
    plannerContext.clearInitialTemplate,
    draftState,
    plannerContext.initialTemplateId,
    plannerContext.resetCounter,
    templates,
    uiState,
    t,
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
) {
  const updateClientMutation = useUpdateClientMutation(clientId ?? '');
  const assignMutation = useAssignRoutineMutation();
  const { deleteMutation, onSave, onSaveCore } = useRoutineSaveHandler(
    clearInitialTemplate,
    clientId,
    draftState,
    onRouteChange,
    t,
    uiState,
    updateClientMutation,
  );
  const onSaveAndAssign = buildSaveAndAssign(onSaveCore, assignMutation, draftState, uiState, t, onRouteChange);
  const onAssignOnly = buildAssignOnly(assignMutation, uiState, draftState, onRouteChange);
  return { deleteMutation, onSave, onSaveAndAssign, onAssignOnly, updateClientMutation, viewMode };
}

function buildAssignOnly(
  assignMutation: ReturnType<typeof useAssignRoutineMutation>,
  uiState: ReturnType<typeof useRoutinePlannerUIState>,
  draftState: ReturnType<typeof useRoutinePlannerDraft>,
  onRouteChange: undefined | ((route: ShellRoute) => void),
) {
  return async (clientId: string) => {
    const templateId = pickNormalizedPlanTemplateId(uiState.editingId, draftState.draft.sourcePlanTemplateId);
    if (!templateId) return;
    await assignMutation.mutateAsync({ clientId, templateId });
    uiState.setSaveSuccess(true);
    setTimeout(() => uiState.setSaveSuccess(false), 3000);
    onRouteChange?.('coach.library.routines');
  };
}

function buildSaveAndAssign(
  onSaveCore: (name: string) => Promise<string>,
  assignMutation: ReturnType<typeof useAssignRoutineMutation>,
  draftState: ReturnType<typeof useRoutinePlannerDraft>,
  uiState: ReturnType<typeof useRoutinePlannerUIState>,
  t: (k: string) => string,
  onRouteChange: undefined | ((route: ShellRoute) => void),
) {
  return async (name: string, assignClientId: string) => {
    const templateId = await onSaveCore(name);
    await assignMutation.mutateAsync({ clientId: assignClientId, templateId });
    uiState.setSaveSuccess(true);
    setTimeout(() => uiState.setSaveSuccess(false), 3000);
    draftState.setDraft(createEmptyDraft(t));
    uiState.setEditingId(null);
    draftState.setActiveDayIdx(0);
    onRouteChange?.('coach.library.routines');
  };
}

function buildLayoutModel(params: {
  deleteMutation: ReturnType<typeof useRoutineSaveHandler>['deleteMutation'];
  draftState: ReturnType<typeof useRoutinePlannerDraft>;
  onRouteChange: undefined | ((route: ShellRoute) => void);
  objectiveOptions: Array<{ id: string; label: string }>;
  onSave: ReturnType<typeof useRoutineSaveHandler>['onSave'];
  onSaveAndAssign: (name: string, clientId: string) => Promise<void>;
  onAssignOnly: (clientId: string) => Promise<void>;
  plannerContext: ReturnType<typeof usePlannerContextState>;
  t: (key: string) => string;
  templates: RoutineTemplateView[];
  uiState: ReturnType<typeof useRoutinePlannerUIState>;
  updateClientMutation: ReturnType<typeof useUpdateClientMutation>;
  viewMode: 'edit' | 'view' | null;
}) {
  return {
    clientContextName: params.plannerContext.clientDisplayName,
    clientContextId: params.plannerContext.clientId,
    deleteMutation: params.deleteMutation,
    draftState: params.draftState,
    objectiveOptions: params.objectiveOptions,
    onAssignTemplate: buildAssignTemplateHandler(params),
    onAssignOnly: params.onAssignOnly,
    onBack: params.plannerContext.clientId ? () => params.onRouteChange?.('coach.clients') : undefined,
    onSave: params.onSave,
    onSaveAndAssign: params.onSaveAndAssign,
    t: params.t,
    templates: params.templates,
    uiState: params.uiState,
    viewOnlyMode: params.viewMode === 'view',
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
    resetCounter: useRoutinePlannerContextStore((state) => state.resetCounter),
    viewMode: useRoutinePlannerContextStore((state) => state.viewMode),
  };
}

function useHydrateDraftFromContext(
  clearInitialTemplate: () => void,
  draftState: ReturnType<typeof useRoutinePlannerDraft>,
  initialTemplateId: null | string,
  resetCounter: number,
  templates: Array<{ id: string } & Record<string, unknown>>,
  uiState: ReturnType<typeof useRoutinePlannerUIState>,
  t: (key: string) => string,
) {
  React.useEffect(() => {
    if (!initialTemplateId || templates.length === 0) return;
    const wanted = initialTemplateId.trim().toLowerCase();
    const initialTemplate = templates.find((tpl) => (tpl.id ?? '').trim().toLowerCase() === wanted);
    if (!initialTemplate) return clearInitialTemplate();
    uiState.setEditingId(initialTemplate.id);
    draftState.setDraft(mapTemplateToDraft(initialTemplate));
    draftState.setActiveDayIdx(0);
    clearInitialTemplate();
  }, [clearInitialTemplate, draftState, initialTemplateId, templates, uiState]);

  React.useEffect(() => {
    if (resetCounter > 0) {
      uiState.setEditingId(null);
      draftState.setDraft(createEmptyDraft(t));
      draftState.setActiveDayIdx(0);
    }
  }, [resetCounter]);
}

function buildAfterSaveHandler(
  clearInitialTemplate: () => void,
  clientId: null | string,
  onRouteChange: undefined | ((route: ShellRoute) => void),
  updateClientMutation: ReturnType<typeof useUpdateClientMutation>,
) {
  return async (templateId: string) => {
    if (clientId) {
      await updateClientMutation.mutateAsync({ trainingPlanId: templateId });
      clearInitialTemplate();
      onRouteChange?.('coach.clients');
    } else {
      // Always go back to the routine library after saving (new or edit)
      onRouteChange?.('coach.library.routines');
    }
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
