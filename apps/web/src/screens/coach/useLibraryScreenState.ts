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
  useDeletePlioExerciseMutation,
  useDeleteWarmupExerciseMutation,
  useDeleteSportMutation,
} from '../../data/hooks/useLibrarySpecializedMutations';
import { CATEGORIES, CategoryKey } from './UnifiedExerciseLibraryScreen.components';

// eslint-disable-next-line max-lines-per-function
export function useLibraryScreenState() {
  const { t } = useTranslation();
  const { data: catalogs } = useAllCatalogsQuery();
  const deleteExercise = useDeleteExerciseMutation();
  const deleteCardio = useDeleteCardioMethodMutation();
  const deletePlio = useDeletePlioExerciseMutation();
  const deleteWarmup = useDeleteWarmupExerciseMutation();
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
        void queryClient.invalidateQueries({ queryKey: ['library'] });
        void queryClient.invalidateQueries({ queryKey: ['catalogs'] });
      } catch (e) {
        console.error('Failed to fix', e);
      }
    };
    fixMemberships();
  }, [auth, queryClient]);

  const [expandedCategory, setExpandedCategory] = useState<CategoryKey | null>('muscleGroups');
  const [selectedCategoryFilters, setSelectedCategoryFilters] = useState<Record<string, Set<string>>>({});
  const [selectedEquipment, setSelectedEquipment] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; kind: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const { data: exercises, isLoading } = useUnifiedExercisesQuery(filter);
  const hasActiveFilters = Object.values(selectedCategoryFilters).some((s) => s.size > 0) || selectedEquipment.size > 0;
  const defaultCategory =
    expandedCategory === 'muscleGroups'
      ? ('strength' as const)
      : expandedCategory === 'cardioMethodTypes'
        ? ('cardio' as const)
        : expandedCategory === 'plioTypes'
          ? ('plio' as const)
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

  const confirmDelete = useCallback(() => {
    if (!pendingDelete) return;
    setDeletingId(pendingDelete.id);
    const { id, kind } = pendingDelete;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mutationItem: any;

    if (kind === 'exercise') mutationItem = deleteExercise;
    else if (kind === 'cardio') mutationItem = deleteCardio;
    else if (kind === 'plio') mutationItem = deletePlio;
    else if (kind === 'warmup') mutationItem = deleteWarmup;
    else if (kind === 'sport') mutationItem = deleteSport;

    if (mutationItem) {
      mutationItem.mutate(id, {
        onSettled: () => {
          setPendingDelete(null);
          setDeletingId(null);
        },
      });
    }
  }, [pendingDelete, deleteExercise, deleteCardio, deletePlio, deleteWarmup, deleteSport]);

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
    pendingDelete,
    setPendingDelete,
    deletingId,
    isModalVisible,
    setIsModalVisible,
    itemToEdit,
    setItemToEdit,
    detailVisible,
    setDetailVisible,
    itemForDetail,
    setItemForDetail,
    exercises,
    isLoading,
    hasActiveFilters,
    clearAllFilters,
    toggleCategoryItem,
    toggleEquipment,
    confirmDelete,
    defaultCategory,
  };
}
export type LibraryScreenState = ReturnType<typeof useLibraryScreenState>;
