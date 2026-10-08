import React, { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { pickNormalizedPlanTemplateId } from '../../data/normalize-plan-template-id';
import { useAssignRoutineMutation, useUpdateClientMutation } from '../../data/hooks/useClientMutations';
import { useClientsQuery, type ClientView } from '../../data/hooks/useClientsQuery';
import { createEmptyDraft, mapTemplateToDraft } from './RoutinePlanner.helpers';
import {
  useRoutineObjectivesQuery,
  useRoutineTemplatesQuery,
  type RoutineTemplateView,
} from '../../data/hooks/useRoutineTemplates';
import { readRouteClientId, writeRouteClientId } from '../../layout/list-context';
import { useRouteClient } from '../../layout/useListContext';
import { useCalendarContextStore } from '../../store/calendarContext.store';
import { useRoutinePlannerContextStore } from '../../store/routinePlannerContext.store';
import type { ShellRoute } from '../../layout/usePersistentShellRoute';
import { useRoutinePlannerDraft } from './useRoutinePlannerDraft';
import { useRoutinePlannerMutations } from './useRoutinePlannerMutations';
import { RoutinePlannerLayout } from './components/RoutinePlanner/RoutinePlannerLayout';
import { UnsavedStatus, UnsavedWorkDialogs } from '../../layout/UnsavedWorkDialogs';
import { useUnsavedWork } from '../../layout/useUnsavedWork';
import { useRoutinePlannerUIState } from './useRoutinePlannerUIState';
import { useRoutineHandoffPrompt } from './RoutineHandoffDialog';
import {
  archiveFutureWorkouts,
  assignClientRoutine,
  isSameAssignedRoutine,
  loadClientCalendarEvents,
  type HandoffChoice,
  type RoutineAssignOptions,
} from './routine-handoff';

type HandoffPorts = {
  archive: (clientId: string, from: string) => Promise<void>;
  ask: () => Promise<HandoffChoice>;
  clients: ClientView[];
};

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

function buildAssignOnly(
  assignMutation: ReturnType<typeof useAssignRoutineMutation>,
  uiState: ReturnType<typeof useRoutinePlannerUIState>,
  draftState: ReturnType<typeof useRoutinePlannerDraft>,
  onRouteChange: undefined | ((route: ShellRoute) => void),
  archive: HandoffPorts['archive'],
) {
  return async (clientId: string, options?: RoutineAssignOptions) => {
    const templateId = pickNormalizedPlanTemplateId(uiState.editingId, draftState.draft.sourcePlanTemplateId);
    if (!templateId) return;
    await assignMutation.mutateAsync({ clientId, templateId });
    if (options?.clearFutureFrom) await archive(clientId, options.clearFutureFrom);
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
  archive: HandoffPorts['archive'],
) {
  return async (name: string, assignClientId: string, options?: RoutineAssignOptions) => {
    const templateId = await onSaveCore(name);
    await assignMutation.mutateAsync({ clientId: assignClientId, templateId });
    if (options?.clearFutureFrom) await archive(assignClientId, options.clearFutureFrom);
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
  onSaveAndAssign: (name: string, clientId: string, options?: RoutineAssignOptions) => Promise<void>;
  work: ReturnType<typeof useUnsavedWork<ReturnType<typeof useRoutinePlannerDraft>['draft']>>;
  onAssignOnly: (clientId: string, options?: RoutineAssignOptions) => Promise<void>;
  handoffDialog: React.JSX.Element;
  handoffPorts: HandoffPorts;
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
    handoffDialog: params.handoffDialog,
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
  handoffPorts: HandoffPorts;
  onRouteChange: undefined | ((route: ShellRoute) => void);
  plannerContext: ReturnType<typeof usePlannerContextState>;
  updateClientMutation: ReturnType<typeof useUpdateClientMutation>;
}) {
  return resolveAssignHandler(
    params.plannerContext.clearInitialTemplate,
    params.plannerContext.clientId,
    params.onRouteChange,
    params.updateClientMutation,
    params.handoffPorts,
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
  ports: HandoffPorts,
) {
  return useRoutinePlannerMutations(
    draftState.draft,
    uiState.editingId,
    draftState.setDraft,
    uiState.setEditingId,
    draftState.setActiveDayIdx,
    uiState.setSaveSuccess,
    t,
    buildAfterSaveHandler(clearInitialTemplate, clientId, onRouteChange, updateClientMutation, ports),
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
  ports: HandoffPorts,
) {
  return async (templateId: string) => {
    if (!clientId) {
      onRouteChange?.('coach.library.routines');
      return;
    }
    await assignWithHandoff(clientId, templateId, onRouteChange, clearInitialTemplate, ports, () =>
      updateClientMutation.mutateAsync({ trainingPlanId: templateId }),
    );
  };
}

function resolveAssignHandler(
  clearInitialTemplate: () => void,
  clientId: null | string,
  onRouteChange: undefined | ((route: ShellRoute) => void),
  updateClientMutation: ReturnType<typeof useUpdateClientMutation>,
  ports: HandoffPorts,
): undefined | ((templateId: string) => Promise<void>) {
  if (!clientId) return undefined;
  return (templateId: string) =>
    assignWithHandoff(clientId, templateId, onRouteChange, clearInitialTemplate, ports, () =>
      updateClientMutation.mutateAsync({ trainingPlanId: templateId }),
    );
}

function assignWithHandoff(
  clientId: string,
  templateId: string,
  onRouteChange: undefined | ((route: ShellRoute) => void),
  clearInitialTemplate: () => void,
  ports: HandoffPorts,
  assign: () => Promise<unknown>,
): Promise<void> {
  const client = ports.clients.find((item) => item.id === clientId);
  return assignClientRoutine({
    archive: (from) => ports.archive(clientId, from),
    ask: ports.ask,
    assign: () => assign().then(() => undefined),
    hasOtherRoutine: Boolean(client?.trainingPlanId || client?.trainingPlan),
    loadPending: (from, to) => loadClientCalendarEvents(clientId, from, to),
    openCalendar: () => {
      clearInitialTemplate();
      goToAssignedClientCalendar(clientId, onRouteChange);
    },
    sameRoutine: isSameAssignedRoutine(client?.trainingPlanId, client?.trainingPlan?.id, templateId),
  });
}

function goToAssignedClientCalendar(clientId: string, onRouteChange: undefined | ((route: ShellRoute) => void)) {
  useCalendarContextStore.getState().openForClient(clientId);
  writeRouteClientId(clientId);
  onRouteChange?.('coach.calendar');
}
