import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { createApiClient } from '../api-client';
import { useAuthStore } from '../../store/auth.store';

/* ── Types ─────────────────────────────────────────────── */

export type CatalogItem = {
  id: string;
  code: string;
  label: string;
  sortOrder: number;
  isDefault: boolean;
};

export type AllCatalogs = {
  muscleGroups: CatalogItem[];
  cardioMethodTypes: CatalogItem[];
  plioTypes: CatalogItem[];
  mobilityTypes: CatalogItem[];
  isometricTypes: CatalogItem[];
  sportTypes: CatalogItem[];
  equipmentTypes: CatalogItem[];
  movementPatterns: CatalogItem[];
  anatomicalPlanes: CatalogItem[];
};

export type UnifiedExerciseItem = {
  id: string;
  kind: 'exercise' | 'cardio' | 'plio' | 'warmup' | 'sport';
  name: string;
  mediaUrl: string | null;
  youtubeUrl?: string | null;
  instructions?: string | null;
  coachInstructions?: string | null;
  equipmentId?: string | null;
  tags: string[];
  scope?: string;

  // Type specific
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  muscleGroups?: any[];
  movementPatternId?: string | null;
  anatomicalPlaneId?: string | null;
  methodTypeId?: string | null;
  plioTypeId?: string | null;
  mobilityTypeId?: string | null;
  sportTypeId?: string | null;

  // Relation objects
  equipmentRef?: { label: string };
  movementPatternRef?: { label: string };
  anatomicalPlaneRef?: { label: string };
  methodTypeRef?: { label: string };
  plioTypeRef?: { label: string };
  mobilityTypeRef?: { label: string };
  sportTypeRef?: { label: string };
};

/* ── Hooks ──────────────────────────────────────────────── */

export function useAllCatalogsQuery(): UseQueryResult<AllCatalogs, Error> {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth),
    queryFn: async () => {
      if (!auth) throw new Error('Missing auth');
      const client = createApiClient(auth);
      return client.get<AllCatalogs>('/library/catalogs');
    },
    queryKey: ['library', 'catalogs', 'all', auth?.accessToken],
    staleTime: 5 * 60 * 1000,
  });
}

export type UnifiedExercisesFilter = {
  baseCategory?: string;
  muscleGroupIds?: string[];
  cardioTypeIds?: string[];
  isometricTypeIds?: string[];
  plioTypeIds?: string[];
  mobilityTypeIds?: string[];
  sportTypeIds?: string[];
  equipmentIds?: string[];
  search?: string;
};

export function useUnifiedExercisesQuery(filter: UnifiedExercisesFilter): UseQueryResult<UnifiedExerciseItem[], Error> {
  const auth = useAuth();
  return useQuery({
    enabled: Boolean(auth),
    queryFn: async () => {
      if (!auth) throw new Error('Missing auth');
      const params = new URLSearchParams();
      if (filter.baseCategory) params.append('baseCategory', filter.baseCategory);
      if (filter.muscleGroupIds?.length) params.append('muscleGroupIds', filter.muscleGroupIds.join(','));
      if (filter.cardioTypeIds?.length) params.append('cardioTypeIds', filter.cardioTypeIds.join(','));
      if (filter.isometricTypeIds?.length) params.append('isometricTypeIds', filter.isometricTypeIds.join(','));
      if (filter.plioTypeIds?.length) params.append('plioTypeIds', filter.plioTypeIds.join(','));
      if (filter.mobilityTypeIds?.length) params.append('mobilityTypeIds', filter.mobilityTypeIds.join(','));
      if (filter.sportTypeIds?.length) params.append('sportTypeIds', filter.sportTypeIds.join(','));
      if (filter.equipmentIds?.length) params.append('equipmentIds', filter.equipmentIds.join(','));
      if (filter.search?.trim()) params.append('search', filter.search.trim());
      const qs = params.toString();
      const path = qs ? `/library/exercises/all?${qs}` : '/library/exercises/all';
      const res = await createApiClient(auth).get<{ items: UnifiedExerciseItem[] }>(path);
      return res.items;
    },
    queryKey: ['library', 'exercises', 'unified', filter, auth?.accessToken],
  });
}

/* ── Private ───────────────────────────────────────────── */

function useAuth() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeRole = useAuthStore((state) => state.activeRole);
  if (!accessToken || !activeRole) return null;
  return { accessToken, activeRole };
}
