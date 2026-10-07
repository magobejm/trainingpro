import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAssignRoutineMutation } from '../../data/hooks/useClientMutations';
import {
  useDeleteRoutineTemplateMutation,
  useRoutineTemplatesQuery,
  type RoutineTemplateView,
} from '../../data/hooks/useRoutineTemplates';
import {
  useDeleteWarmupTemplateMutation,
  useWarmupTemplatesQuery,
  type WarmupTemplateView,
} from '../../data/hooks/useWarmupTemplates';
import { useUnifiedExercisesQuery } from '../../data/hooks/useUnifiedLibraryQuery';
import { LIST_KEYS, readRouteClientId, writeRouteClientId } from '../../layout/list-context';
import { useListContext, useRouteClient } from '../../layout/useListContext';
import { useCalendarContextStore } from '../../store/calendarContext.store';
import { useRoutinePlannerContextStore } from '../../store/routinePlannerContext.store';
import { useWarmupPlannerContextStore } from '../../store/warmupPlannerContext.store';
import { matchesSearch } from '../../utils/normalize-search';
import type { ShellRoute } from '../../layout/usePersistentShellRoute';

export type RoutineLibraryTab = 'routines' | 'warmups';
type MediaMap = Record<string, string | null>;

export function useViewModel(defaultTab: RoutineLibraryTab, onRouteChange: (route: ShellRoute) => void) {
  const { t } = useTranslation();
  const { query, setQuery, setTab, tab } = useRoutineLibraryList(defaultTab);
  const [assignTemplate, setAssignTemplate] = useState<RoutineTemplateView | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState('');
  const [deleteKind, setDeleteKind] = useState<RoutineLibraryTab>('routines');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const catalogs = useLibraryCatalogs();
  const routines = catalogs.routinesQuery.data ?? [];
  const warmups = catalogs.warmupsQuery.data ?? [];
  const clientId = useLibraryAssignmentClient();
  const openForEdit = useRoutinePlannerContextStore((s) => s.openForEdit);
  const openForView = useRoutinePlannerContextStore((s) => s.openForView);
  const clearRoutine = useRoutinePlannerContextStore((s) => s.clear);
  const openBlankRoutine = useRoutinePlannerContextStore((s) => s.openBlankFromLibrary);
  const setWarmupInitial = useWarmupPlannerContextStore((s) => s.setInitialTemplate);
  const openBlankWarmup = useWarmupPlannerContextStore((s) => s.openBlankFromLibrary);
  const assignRoutine = useAssignRoutineMutation();
  const deleteRoutine = useDeleteRoutineTemplateMutation();
  const deleteWarmup = useDeleteWarmupTemplateMutation();
  const filteredRoutines = useFiltered(routines, query);
  const filteredWarmups = useFiltered(warmups, query);
  const pendingName = useMemo(() => {
    const all = [...routines, ...warmups] as Array<{ id: string; name: string }>;
    return all.find((item) => item.id === pendingDeleteId)?.name ?? '';
  }, [pendingDeleteId, routines, warmups]);
  const onConfirmDelete = buildConfirmDelete(
    pendingDeleteId,
    deleteKind,
    deleteRoutine,
    deleteWarmup,
    setPendingDeleteId,
    pendingName,
    setDeleteError,
  );
  return {
    assignTemplate,
    clientId,
    deleteError,
    filteredRoutines,
    filteredWarmups,
    mediaMap: catalogs.mediaMap,
    onAssignRoutine: (tpl: RoutineTemplateView) => setAssignTemplate(tpl),
    onCloseAssign: () => setAssignTemplate(null),
    onConfirmAssign: (nextClientId: string) =>
      confirmLibraryAssign(assignRoutine, clearRoutine, nextClientId, assignTemplate?.id ?? '', onRouteChange),
    onConfirmDelete,
    onCreateRoutine: () => {
      openBlankRoutine();
      onRouteChange('coach.routine.planner');
    },
    onCreateWarmup: () => {
      openBlankWarmup();
      onRouteChange('coach.warmup.planner');
    },
    onDeleteRoutine: (id: string) => {
      setDeleteError(null);
      setDeleteKind('routines');
      setPendingDeleteId(id);
    },
    onDeleteWarmup: (id: string) => {
      setDeleteError(null);
      setDeleteKind('warmups');
      setPendingDeleteId(id);
    },
    onEditRoutine: (tpl: RoutineTemplateView) => {
      openForEdit(tpl.id);
      onRouteChange('coach.routine.planner');
    },
    onEditWarmup: (tpl: WarmupTemplateView) => {
      setWarmupInitial(tpl.id);
      onRouteChange('coach.warmup.planner');
    },
    onViewRoutine: (tpl: RoutineTemplateView) => {
      openForView(tpl.id);
      onRouteChange('coach.routine.planner');
    },
    onViewWarmup: (tpl: WarmupTemplateView) => {
      setWarmupInitial(tpl.id, true);
      onRouteChange('coach.warmup.planner');
    },
    pendingDeleteId,
    pendingName,
    query,
    routinesQuery: catalogs.routinesQuery,
    setDeleteError,
    setPendingDeleteId,
    setQuery,
    setTab,
    t,
    tab,
    warmupsQuery: catalogs.warmupsQuery,
  };
}

function useLibraryCatalogs() {
  const routinesQuery = useRoutineTemplatesQuery();
  const warmupsQuery = useWarmupTemplatesQuery();
  const exercisesQuery = useUnifiedExercisesQuery({});
  const mediaMap = useMemo<MediaMap>(
    () => Object.fromEntries((exercisesQuery.data ?? []).map((item) => [item.id, item.mediaUrl])),
    [exercisesQuery.data],
  );
  return { mediaMap, routinesQuery, warmupsQuery };
}

function useRoutineLibraryList(defaultTab: RoutineLibraryTab) {
  const key = defaultTab === 'warmups' ? LIST_KEYS.libraryWarmups : LIST_KEYS.libraryRoutines;
  const [list, setList] = useListContext(key, { query: '', tab: defaultTab });
  return {
    query: list.query,
    setQuery: (query: string) => setList((prev) => ({ ...prev, query })),
    setTab: (tab: RoutineLibraryTab) => setList((prev) => ({ ...prev, tab })),
    tab: list.tab,
  };
}

function useLibraryAssignmentClient(): string | null {
  const clientId = useRoutinePlannerContextStore((state) => state.clientId);
  const prepare = useRoutinePlannerContextStore((state) => state.prepareClientAssignment);
  useEffect(() => {
    if (clientId) return;
    const urlClient = readRouteClientId();
    if (urlClient) prepare(urlClient, '');
  }, [clientId, prepare]);
  useRouteClient(clientId ?? '');
  return clientId;
}

function useFiltered<T extends { name: string }>(items: T[], query: string): T[] {
  return useMemo(() => {
    const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
    return sorted.filter((item) => matchesSearch(item.name, query));
  }, [items, query]);
}

function confirmLibraryAssign(
  assignRoutine: { mutateAsync: (input: { clientId: string; templateId: string }) => Promise<unknown> },
  clearRoutine: () => void,
  clientId: string,
  templateId: string,
  onRouteChange: (route: ShellRoute) => void,
): Promise<void> {
  return assignRoutine.mutateAsync({ clientId, templateId }).then(() => {
    clearRoutine();
    useCalendarContextStore.getState().openForClient(clientId);
    writeRouteClientId(clientId);
    onRouteChange('coach.calendar');
  });
}

type DeleteMutation = {
  mutate: (id: string, opts: { onSuccess: () => void; onError: (err: unknown) => void }) => void;
};

function buildConfirmDelete(
  pendingDeleteId: string,
  deleteKind: RoutineLibraryTab,
  deleteRoutine: DeleteMutation,
  deleteWarmup: DeleteMutation,
  setPendingDeleteId: (id: string) => void,
  pendingName: string,
  setDeleteError: (msg: string | null) => void,
) {
  return () => {
    if (!pendingDeleteId) return;
    const onSuccess = () => setPendingDeleteId('');
    const onError = (err: unknown) => {
      const raw = (err as { message?: string })?.message ?? '';
      const isAssigned = raw.toLowerCase().includes('assigned');
      const name = pendingName ? `"${pendingName}"` : 'esta rutina';
      setDeleteError(
        isAssigned
          ? `No se puede eliminar ${name} porque está asignada a uno o más clientes activos. Desasígnala primero.`
          : `No se pudo eliminar ${name}. ${raw}`,
      );
    };
    if (deleteKind === 'routines') {
      deleteRoutine.mutate(pendingDeleteId, { onSuccess, onError });
    } else {
      deleteWarmup.mutate(pendingDeleteId, { onSuccess, onError });
    }
  };
}
