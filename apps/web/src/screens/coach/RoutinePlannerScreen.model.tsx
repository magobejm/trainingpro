import React from 'react';

import { pickNormalizedPlanTemplateId } from '../../data/normalize-plan-template-id';
import { useAssignRoutineMutation, useUpdateClientMutation } from '../../data/hooks/useClientMutations';
import { type ClientView } from '../../data/hooks/useClientsQuery';
import { createEmptyDraft, mapTemplateToDraft } from './RoutinePlanner.helpers';
import { type RoutineTemplateView } from '../../data/hooks/useRoutineTemplates';
import { writeRouteClientId } from '../../layout/list-context';

import { useCalendarContextStore } from '../../store/calendarContext.store';
import { useRoutinePlannerContextStore } from '../../store/routinePlannerContext.store';
import type { ShellRoute } from '../../layout/usePersistentShellRoute';
import { useRoutinePlannerDraft } from './useRoutinePlannerDraft';
import { useRoutinePlannerMutations } from './useRoutinePlannerMutations';

import { UnsavedStatus } from '../../layout/UnsavedWorkDialogs';
import { useUnsavedWork } from '../../layout/useUnsavedWork';
import { useRoutinePlannerUIState } from './useRoutinePlannerUIState';

import {
  assignClientRoutine,
  isSameAssignedRoutine,
  type AskRoutineHandoff,
  type RoutineAssignOptions,
} from './routine-handoff';

export type HandoffPorts = {
  ask: AskRoutineHandoff;
  clients: ClientView[];
  routineName: string;
};

export function buildAssignOnly(
  assignMutation: ReturnType<typeof useAssignRoutineMutation>,
  uiState: ReturnType<typeof useRoutinePlannerUIState>,
  draftState: ReturnType<typeof useRoutinePlannerDraft>,
  onRouteChange: undefined | ((route: ShellRoute) => void),
) {
  return async (clientId: string, options?: RoutineAssignOptions) => {
    const templateId = pickNormalizedPlanTemplateId(uiState.editingId, draftState.draft.sourcePlanTemplateId);
    if (!templateId) return;
    await assignMutation.mutateAsync({ clientId, templateId, ...options });
    uiState.setSaveSuccess(true);
    setTimeout(() => uiState.setSaveSuccess(false), 3000);
    goToAssignedClientCalendar(clientId, onRouteChange);
  };
}

export function buildSaveAndAssign(
  onSaveCore: (name: string) => Promise<string>,
  assignMutation: ReturnType<typeof useAssignRoutineMutation>,
  draftState: ReturnType<typeof useRoutinePlannerDraft>,
  uiState: ReturnType<typeof useRoutinePlannerUIState>,
  t: (k: string) => string,
  onRouteChange: undefined | ((route: ShellRoute) => void),
  work: ReturnType<typeof useUnsavedWork<ReturnType<typeof useRoutinePlannerDraft>['draft']>>,
) {
  let preparedTemplateId: string | null = null;
  return async (name: string, assignClientId: string, options?: RoutineAssignOptions) => {
    const templateId = preparedTemplateId ?? (await onSaveCore(name));
    preparedTemplateId = templateId;
    await assignMutation.mutateAsync({ clientId: assignClientId, templateId, ...options });
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

export function buildLayoutModel(params: {
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
    isDraft: !params.uiState.editingId || params.work.isDirty,
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

export function useRoutineSaveHandler(
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

export function usePlannerContextState() {
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

export function useHydrateDraftFromContext(
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
  return async (templateId: string, name?: string) => {
    if (!clientId) {
      onRouteChange?.('coach.library.routines');
      return;
    }
    await assignWithHandoff(
      clientId,
      templateId,
      onRouteChange,
      clearInitialTemplate,
      { ...ports, routineName: name ?? ports.routineName },
      (options) => updateClientMutation.mutateAsync({ trainingPlanId: templateId, ...options }),
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
    assignWithHandoff(clientId, templateId, onRouteChange, clearInitialTemplate, ports, (options) =>
      updateClientMutation.mutateAsync({ trainingPlanId: templateId, ...options }),
    );
}

function assignWithHandoff(
  clientId: string,
  templateId: string,
  onRouteChange: undefined | ((route: ShellRoute) => void),
  clearInitialTemplate: () => void,
  ports: HandoffPorts,
  assign: (options: RoutineAssignOptions) => Promise<unknown>,
): Promise<void> {
  const client = ports.clients.find((item) => item.id === clientId);
  return assignClientRoutine({
    ask: ports.ask,
    assign: (options) => assign(options).then(() => undefined),
    clientId,
    clientName: client ? `${client.firstName} ${client.lastName}` : '',
    routineName: ports.routineName,
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
