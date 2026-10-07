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
import { useCalendarContextStore } from '../../store/calendarContext.store';
import { useRoutinePlannerContextStore } from '../../store/routinePlannerContext.store';
import type { ShellRoute } from '../../layout/usePersistentShellRoute';
import { useRoutinePlannerDraft } from './useRoutinePlannerDraft';
import { useRoutinePlannerMutations } from './useRoutinePlannerMutations';
import { RoutinePlannerLayout } from './components/RoutinePlanner/RoutinePlannerLayout';
import { UnsavedStatus, UnsavedWorkDialogs } from '../../layout/UnsavedWorkDialogs';
import { useUnsavedWork } from '../../layout/useUnsavedWork';
import { useRoutinePlannerUIState } from './useRoutinePlannerUIState';

type Props = { onRouteChange?: (route: ShellRoute) => void };

export function RoutinePlannerScreen(props: Props): React.JSX.Element {
  const vm = useRoutinePlannerScreenModel(props.onRouteChange);
  return (
    <>
      <UnsavedWorkDialogs
        onOverwrite={() => void vm.retrySave()}
        onReload={() => {
          vm.work.release();
          window.location.reload();
        }}
        t={vm.t}
        work={vm.work}
      />
      <RoutinePlannerLayout {...vm} />
    </>
  );
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
  const { deleteMutation, isSaving, onSave, onSaveCore, retrySave } = useRoutineSaveHandler(
    clearInitialTemplate,
    clientId,
    draftState,
    onRouteChange,
    t,
    uiState,
    updateClientMutation,
    work,
  );
  const onSaveAndAssign = buildSaveAndAssign(onSaveCore, assignMutation, draftState, uiState, t, onRouteChange, work);
  const onAssignOnly = buildAssignOnly(assignMutation, uiState, draftState, onRouteChange);
  return { deleteMutation, isSaving, onSave, onSaveAndAssign, onAssignOnly, retrySave, updateClientMutation, viewMode };
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
    goToAssignedClientCalendar(clientId, onRouteChange);
  };
}

function buildSaveAndAssign(
  onSaveCore: (name: string) => Promise<string>,
  assignMutation: ReturnType<typeof useAssignRoutineMutation>,
  draftState: ReturnType<typeof useRoutinePlannerDraft>,
  uiState: ReturnType<typeof useRoutinePlannerUIState>,
  t: (k: string) => string,
  onRouteChange: undefined | ((route: ShellRoute) => void),
  work: ReturnType<typeof useUnsavedWork<ReturnType<typeof useRoutinePlannerDraft>['draft']>>,
) {
  return async (name: string, assignClientId: string) => {
    const templateId = await onSaveCore(name);
    await assignMutation.mutateAsync({ clientId: assignClientId, templateId });
    const empty = createEmptyDraft(t);
    work.release(empty);
    uiState.setSaveSuccess(true);
    setTimeout(() => uiState.setSaveSuccess(false), 3000);
    draftState.setDraft(empty);
    uiState.setEditingId(null);
    draftState.setActiveDayIdx(0);
    goToAssignedClientCalendar(assignClientId, onRouteChange);
  };
}

function buildLayoutModel(params: {
  deleteMutation: ReturnType<typeof useRoutineSaveHandler>['deleteMutation'];
  draftState: ReturnType<typeof useRoutinePlannerDraft>;
  onRouteChange: undefined | ((route: ShellRoute) => void);
  objectiveOptions: Array<{ id: string; label: string }>;
  isSaving: boolean;
  onSave: ReturnType<typeof useRoutineSaveHandler>['onSave'];
  onSaveAndAssign: (name: string, clientId: string) => Promise<void>;
  work: ReturnType<typeof useUnsavedWork<ReturnType<typeof useRoutinePlannerDraft>['draft']>>;
  onAssignOnly: (clientId: string) => Promise<void>;
  plannerContext: ReturnType<typeof usePlannerContextState>;
  t: (key: string) => string;
  templates: RoutineTemplateView[];
  uiState: ReturnType<typeof useRoutinePlannerUIState>;
  retrySave: () => Promise<void>;
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
    onBack: params.plannerContext.clientId
      ? () => params.onRouteChange?.('coach.clients')
      : params.plannerContext.fromLibrary
        ? () => {
            params.plannerContext.clear();
            params.onRouteChange?.('coach.library.routines');
          }
        : undefined,
    backLabelKey: params.plannerContext.clientId
      ? 'coach.routinePlanner.backToClient'
      : params.plannerContext.fromLibrary
        ? 'coach.routinePlanner.backToLibrary'
        : undefined,
    onSave: params.onSave,
    onSaveAndAssign: params.onSaveAndAssign,
    saveDisabled: params.isSaving,
    statusNode: <UnsavedStatus t={params.t} work={params.work} />,
    t: params.t,
    templates: params.templates,
    uiState: params.uiState,
    retrySave: params.retrySave,
    viewOnlyMode: params.viewMode === 'view',
    work: params.work,
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
  work: ReturnType<typeof useUnsavedWork<ReturnType<typeof useRoutinePlannerDraft>['draft']>>,
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
    'coach.routine.dayPrefix',
    work,
  );
}

function usePlannerContextState() {
  return {
    clear: useRoutinePlannerContextStore((state) => state.clear),
    clientDisplayName: useRoutinePlannerContextStore((state) => state.clientDisplayName),
    clearInitialTemplate: useRoutinePlannerContextStore((state) => state.clearInitialTemplate),
    clientId: useRoutinePlannerContextStore((state) => state.clientId),
    fromLibrary: useRoutinePlannerContextStore((state) => state.fromLibrary),
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
  onLoaded: (draft: ReturnType<typeof useRoutinePlannerDraft>['draft'], version: number | null) => void,
) {
  React.useEffect(() => {
    if (!initialTemplateId || templates.length === 0) return;
    const wanted = initialTemplateId.trim().toLowerCase();
    const initialTemplate = templates.find((tpl) => (tpl.id ?? '').trim().toLowerCase() === wanted);
    if (!initialTemplate) return clearInitialTemplate();
    const mapped = mapTemplateToDraft(initialTemplate);
    const version = Number(initialTemplate.templateVersion ?? 1);
    uiState.setEditingId(initialTemplate.id);
    draftState.setDraft(mapped);
    draftState.setActiveDayIdx(0);
    onLoaded(mapped, Number.isFinite(version) ? version : 1);
    clearInitialTemplate();
  }, [clearInitialTemplate, draftState, initialTemplateId, onLoaded, templates, uiState]);

  React.useEffect(() => {
    if (resetCounter > 0) {
      const empty = createEmptyDraft(t);
      uiState.setEditingId(null);
      draftState.setDraft(empty);
      draftState.setActiveDayIdx(0);
      onLoaded(empty, null);
    }
  }, [onLoaded, resetCounter, t]);
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
      goToAssignedClientCalendar(clientId, onRouteChange);
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
    goToAssignedClientCalendar(clientId, onRouteChange);
  };
}

function goToAssignedClientCalendar(clientId: string, onRouteChange: undefined | ((route: ShellRoute) => void)) {
  useCalendarContextStore.getState().openForClient(clientId);
  onRouteChange?.('coach.calendar');
}
