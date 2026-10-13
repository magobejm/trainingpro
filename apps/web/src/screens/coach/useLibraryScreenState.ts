import { useMemo, useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { createApiClient } from '../../data/api-client';
import { useAuth } from '../../data/hooks/library-mutations.helpers';
import {
  useAllCatalogsQuery,
  useUnifiedExercisesQuery,
  UnifiedExerciseItem,
  UnifiedExercisesFilter,
} from '../../data/hooks/useUnifiedLibraryQuery';
import { useDeleteExerciseMutation, useDeleteCardioMethodMutation } from '../../data/hooks/useLibraryMutations';
import {
  useDeleteIsometricExerciseMutation,
  useDeletePlioExerciseMutation,
  useDeleteMobilityExerciseMutation,
  useDeleteSportMutation,
} from '../../data/hooks/useLibrarySpecializedMutations';
import { CATEGORIES, CategoryKey } from './UnifiedExerciseLibraryScreen.components';
import { LIST_KEYS, readListContext, writeListContext } from '../../layout/list-context';
import { useDeferredDelete } from '../../layout/useDeferredDelete';
import { formatLibraryDeleteError, runLibraryDelete } from './library-delete';

// eslint-disable-next-line max-lines-per-function
export function useLibraryScreenState() {
  const { t } = useTranslation();
  const { data: catalogs } = useAllCatalogsQuery();
  const deleteExercise = useDeleteExerciseMutation();
  const deleteCardio = useDeleteCardioMethodMutation();
  const deleteIsometric = useDeleteIsometricExerciseMutation();
  const deletePlio = useDeletePlioExerciseMutation();
  const deleteMobility = useDeleteMobilityExerciseMutation();
  const deleteSport = useDeleteSportMutation();
  const auth = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    const fixMemberships = async () => {
      if (!auth) return;
      try {
        const client = createApiClient(auth);
        await client.post('/library/exercises/fix-memberships');
        await client.post('/library/seed-biomechanics');
        await client.post('/library/seed-mobility-library');
        await client.post('/library/seed-sports-library');
        void queryClient.invalidateQueries({ queryKey: ['library'] });
        void queryClient.invalidateQueries({ queryKey: ['catalogs'] });
      } catch (e) {
        console.error('Failed to fix', e);
      }
    };
    fixMemberships();
  }, [auth, queryClient]);

  const storedFilters = useState(readUnifiedFilters)[0];
  const [expandedCategory, setExpandedCategory] = useState<CategoryKey | null>(storedFilters.expandedCategory);
  const [selectedCategoryFilters, setSelectedCategoryFilters] = useState<Record<string, Set<string>>>(
    storedFilters.selectedCategoryFilters,
  );
  const [selectedEquipment, setSelectedEquipment] = useState<Set<string>>(storedFilters.selectedEquipment);
  const [search, setSearch] = useState(storedFilters.search);
  useEffect(() => {
    writeListContext(
      LIST_KEYS.libraryUnified,
      serializeUnifiedFilters({
        expandedCategory,
        search,
        selectedCategoryFilters,
        selectedEquipment,
      }),
    );
  }, [expandedCategory, search, selectedCategoryFilters, selectedEquipment]);

  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const deferred = useDeferredDelete();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<UnifiedExerciseItem | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [itemForDetail, setItemForDetail] = useState<UnifiedExerciseItem | null>(null);

  const filter = useMemo<UnifiedExercisesFilter>(() => {
    const result: UnifiedExercisesFilter = { baseCategory: expandedCategory || undefined };
    for (const cat of CATEGORIES) {
      const ids = selectedCategoryFilters[cat.key];
      if (ids && ids.size > 0) (result as Record<string, string[]>)[cat.filterKey] = [...ids];
    }
    if (selectedEquipment.size > 0) result.equipmentIds = [...selectedEquipment];
    if (search.trim()) result.search = search.trim();
    return result;
  }, [expandedCategory, selectedCategoryFilters, selectedEquipment, search]);

  const exercisesQuery = useUnifiedExercisesQuery(filter);
  const exercises = exercisesQuery.data;
  const isLoading = exercisesQuery.isLoading;
  const hasActiveFilters = Object.values(selectedCategoryFilters).some((s) => s.size > 0) || selectedEquipment.size > 0;
  const defaultCategory =
    expandedCategory === 'muscleGroups'
      ? ('strength' as const)
      : expandedCategory === 'cardioMethodTypes'
        ? ('cardio' as const)
        : expandedCategory === 'plioTypes'
          ? ('plio' as const)
          : expandedCategory === 'isometricTypes'
            ? ('isometric' as const)
            : expandedCategory === 'mobilityTypes'
              ? ('warmup' as const)
              : expandedCategory === 'sportTypes'
                ? ('sport' as const)
                : undefined;

  const clearAllFilters = useCallback(() => {
    if (expandedCategory) {
      setSelectedCategoryFilters((prev) => ({ ...prev, [expandedCategory]: new Set() }));
    }
    setSelectedEquipment(new Set());
  }, [expandedCategory]);

  const toggleCategoryItem = useCallback((catKey: string, itemId: string) => {
    setSelectedCategoryFilters((prev) => {
      const copy = { ...prev };
      const set = new Set(copy[catKey] ?? []);
      if (set.has(itemId)) set.delete(itemId);
      else set.add(itemId);
      copy[catKey] = set;
      return copy;
    });
  }, []);

  const toggleEquipment = useCallback((itemId: string) => {
    setSelectedEquipment((prev) => {
      const copy = new Set(prev);
      if (copy.has(itemId)) copy.delete(itemId);
      else copy.add(itemId);
      return copy;
    });
  }, []);

  const setPendingDelete = useCallback(
    (item: { id: string; kind: string } | null) => {
      if (!item) return;
      const name =
        exercises?.find((row) => row.id === item.id && row.kind === item.kind)?.name ??
        t('coach.library.exercises.actions.deleteInRoutineFallbackName');
      deferred.schedule({
        formatError: (error) => formatLibraryDeleteError(error, name, t),
        id: `${item.kind}:${item.id}`,
        label: t('coach.library.toast.deletedUndo', { name }),
        run: () =>
          runLibraryDelete(item.kind, item.id, {
            cardio: deleteCardio.mutateAsync,
            exercise: deleteExercise.mutateAsync,
            isometric: deleteIsometric.mutateAsync,
            plio: deletePlio.mutateAsync,
            sport: deleteSport.mutateAsync,
            warmup: deleteMobility.mutateAsync,
          }),
      });
    },
    [
      deferred,
      deleteCardio.mutateAsync,
      deleteExercise.mutateAsync,
      deleteIsometric.mutateAsync,
      deleteMobility.mutateAsync,
      deletePlio.mutateAsync,
      deleteSport.mutateAsync,
      exercises,
      t,
    ],
  );
  const visibleExercises = useMemo(
    () => (exercises ?? []).filter((item) => !deferred.pending.has(`${item.kind}:${item.id}`)),
    [deferred.pending, exercises],
  );

  return {
    t,
    catalogs,
    expandedCategory,
    setExpandedCategory,
    selectedCategoryFilters,
    selectedEquipment,
    search,
    setSearch,
    hoveredCard,
    setHoveredCard,
    setPendingDelete,
    isModalVisible,
    setIsModalVisible,
    itemToEdit,
    setItemToEdit,
    detailVisible,
    setDetailVisible,
    itemForDetail,
    setItemForDetail,
    exercises: visibleExercises,
    isListError: exercisesQuery.isError,
    isLoading,
    listError: exercisesQuery.error,
    refetchList: () => void exercisesQuery.refetch(),
    hasActiveFilters,
    clearAllFilters,
    toggleCategoryItem,
    toggleEquipment,
    defaultCategory,
  };
}
export type LibraryScreenState = ReturnType<typeof useLibraryScreenState>;

type UnifiedFilters = {
  expandedCategory: CategoryKey | null;
  search: string;
  selectedCategoryFilters: Record<string, string[]>;
  selectedEquipment: string[];
};

function readUnifiedFilters(): {
  expandedCategory: CategoryKey | null;
  search: string;
  selectedCategoryFilters: Record<string, Set<string>>;
  selectedEquipment: Set<string>;
} {
  const stored = readListContext<UnifiedFilters>(LIST_KEYS.libraryUnified);
  const selectedCategoryFilters: Record<string, Set<string>> = {};
  for (const [key, ids] of Object.entries(stored?.selectedCategoryFilters ?? {})) {
    selectedCategoryFilters[key] = new Set(ids);
  }
  return {
    expandedCategory: stored?.expandedCategory ?? 'muscleGroups',
    search: stored?.search ?? '',
    selectedCategoryFilters,
    selectedEquipment: new Set(stored?.selectedEquipment ?? []),
  };
}

function serializeUnifiedFilters(filters: {
  expandedCategory: CategoryKey | null;
  search: string;
  selectedCategoryFilters: Record<string, Set<string>>;
  selectedEquipment: Set<string>;
}): UnifiedFilters {
  const selectedCategoryFilters: Record<string, string[]> = {};
  for (const [key, ids] of Object.entries(filters.selectedCategoryFilters)) {
    selectedCategoryFilters[key] = [...ids];
  }
  return {
    expandedCategory: filters.expandedCategory,
    search: filters.search,
    selectedCategoryFilters,
    selectedEquipment: [...filters.selectedEquipment],
  };
}
